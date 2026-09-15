use crate::error::AppError;
use crate::read::diff::{get_commit_info, CommitDetails};
use crate::write::create_backup_ref;
use git2::{Repository, RepositoryState};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize)]
pub(crate) struct CommitRecovery {
    pub head_ref: String,
    pub before: Option<String>,
    pub after: String,
}

pub(crate) fn head_ref_name(repo: &Repository) -> Result<String, AppError> {
    let head = repo.find_reference("HEAD")?;
    Ok(head.symbolic_target()?.unwrap_or("HEAD").to_string())
}

/// Tạo commit mới hoặc amend commit gần nhất qua in-process libgit2.
/// Khi amend == true, luôn tự động tạo backup ref `refs/gitui-backup/amend-<timestamp>` trước khi ghi đè.
pub fn create_commit<P: AsRef<Path>>(
    repo_path: P,
    summary: &str,
    description: Option<&str>,
    amend: bool,
) -> Result<CommitDetails, AppError> {
    let summary_trimmed = summary.trim();
    if summary_trimmed.is_empty() {
        return Err(AppError::InvalidOperation(
            "Commit summary cannot be empty".to_string(),
        ));
    }

    let message = match description.map(str::trim).filter(|d| !d.is_empty()) {
        Some(desc) => format!("{}\n\n{}", summary_trimmed, desc),
        None => summary_trimmed.to_string(),
    };

    let repo = Repository::open(repo_path.as_ref())?;
    if repo.state() != RepositoryState::Clean {
        return Err(AppError::InvalidOperation("Finish the current Git operation before committing".into()));
    }
    // Keep HEAD and its branch stable while creating the commit and recovery record.
    let mut transaction = repo.transaction()?;
    transaction.lock_ref("HEAD")?;
    let head_ref = head_ref_name(&repo)?;
    if head_ref != "HEAD" {
        transaction.lock_ref(&head_ref)?;
    }
    let previous = match repo.head() {
        Ok(head) => Some(head.peel_to_commit()?),
        Err(error) if error.code() == git2::ErrorCode::UnbornBranch => None,
        Err(error) => return Err(error.into()),
    };
    let sig = repo.signature().map_err(|_| {
        AppError::InvalidOperation("Git user.name or user.email not configured".to_string())
    })?;

    let mut index = repo.index()?;
    let tree_oid = index.write_tree()?;
    let tree = repo.find_tree(tree_oid)?;

    let new_commit_id = if amend {
        let head_commit = previous.as_ref().ok_or_else(|| AppError::InvalidOperation("No commit to amend".into()))?;
        create_backup_ref(&repo, "amend", head_commit.id())?;
        head_commit.amend(
            None,
            Some(&sig),
            Some(&sig),
            None,
            Some(&message),
            Some(&tree),
        )?
    } else {
        match previous {
            Some(ref parent) => {
                repo.commit(None, &sig, &sig, &message, &tree, &[parent])?
            }
            None => repo.commit(None, &sig, &sig, &message, &tree, &[])?,
        }
    };

    let recovery = CommitRecovery {
        head_ref: head_ref.clone(),
        before: previous.as_ref().map(|c| c.id().to_string()),
        after: new_commit_id.to_string(),
    };
    let message = serde_json::to_string(&recovery).map_err(|e| AppError::Io(e.to_string()))?;
    let new_commit = repo.find_commit(new_commit_id)?;
    let mut parents = vec![&new_commit];
    if let Some(ref old_commit) = previous { parents.push(old_commit); }
    // Both pre- and post-operation commits remain reachable through this safety ref.
    let receipt = repo.commit(None, &sig, &sig, &message, &tree, &parents)?;
    static NEXT: AtomicU64 = AtomicU64::new(0);
    let unique = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
    let action = format!("commit-undo-{}-{}-{}", std::process::id(), unique, NEXT.fetch_add(1, Ordering::Relaxed));
    let token = create_backup_ref(&repo, &action, receipt)?;
    let mut details = get_commit_info(repo_path.as_ref(), &new_commit_id.to_string())?;
    details.undo_token = Some(token);
    transaction.set_target(&head_ref, new_commit_id, Some(&sig), &format!("commit: {}", summary_trimmed))?;
    transaction.commit()?;
    Ok(details)
}
