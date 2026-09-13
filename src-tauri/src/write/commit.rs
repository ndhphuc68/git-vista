use crate::error::AppError;
use crate::read::diff::{get_commit_info, CommitDetails};
use crate::write::create_backup_ref;
use git2::Repository;
use std::path::Path;

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
    let sig = repo.signature().map_err(|_| {
        AppError::InvalidOperation("Git user.name or user.email not configured".to_string())
    })?;

    let mut index = repo.index()?;
    let tree_oid = index.write_tree()?;
    let tree = repo.find_tree(tree_oid)?;

    let new_commit_id = if amend {
        let head = repo.head()?;
        let head_commit = head.peel_to_commit()?;
        create_backup_ref(&repo, "amend", head_commit.id())?;
        head_commit.amend(
            Some("HEAD"),
            Some(&sig),
            Some(&sig),
            None,
            Some(&message),
            Some(&tree),
        )?
    } else {
        let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
        match head_commit {
            Some(ref parent) => {
                repo.commit(Some("HEAD"), &sig, &sig, &message, &tree, &[parent])?
            }
            None => repo.commit(Some("HEAD"), &sig, &sig, &message, &tree, &[])?,
        }
    };

    get_commit_info(repo_path.as_ref(), &new_commit_id.to_string())
}
