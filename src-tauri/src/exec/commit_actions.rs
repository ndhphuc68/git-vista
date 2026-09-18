use crate::error::AppError;
use crate::write::create_backup_ref;
use git2::{Oid, Repository, RepositoryState};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct CommitActionResult {
    pub success: bool,
    pub status: String, // "Committed" | "Staged" | "Conflict" | "Error"
    pub new_commit_id: Option<String>,
    pub undo_token: Option<String>,
    pub output: String,
}

#[derive(Serialize, Deserialize)]
struct CommitRecovery {
    head_ref: String,
    before: Option<String>,
    after: String,
}

fn head_ref_name(repo: &Repository) -> Result<String, AppError> {
    let head = repo.find_reference("HEAD")?;
    Ok(head.symbolic_target()?.unwrap_or("HEAD").to_string())
}

fn create_undo_token(
    repo: &Repository,
    head_ref: &str,
    before_oid: Option<Oid>,
    after_oid: Oid,
) -> Result<String, AppError> {
    let sig = repo.signature().map_err(|_| {
        AppError::InvalidOperation("Git user.name or user.email not configured".to_string())
    })?;
    let recovery = CommitRecovery {
        head_ref: head_ref.to_string(),
        before: before_oid.map(|o| o.to_string()),
        after: after_oid.to_string(),
    };
    let message = serde_json::to_string(&recovery).map_err(|e| AppError::Io(e.to_string()))?;
    let after_commit = repo.find_commit(after_oid)?;
    let tree = after_commit.tree()?;
    let mut parents = vec![&after_commit];
    let before_commit_holder;
    if let Some(b) = before_oid {
        if let Ok(bc) = repo.find_commit(b) {
            before_commit_holder = bc;
            parents.push(&before_commit_holder);
        }
    }
    let receipt = repo.commit(None, &sig, &sig, &message, &tree, &parents)?;
    static NEXT: AtomicU64 = AtomicU64::new(0);
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let action = format!(
        "commit-undo-{}-{}-{}",
        std::process::id(),
        unique,
        NEXT.fetch_add(1, Ordering::Relaxed)
    );
    create_backup_ref(repo, &action, receipt)
}

pub fn git_cherry_pick<P: AsRef<Path>>(
    repo_path: P,
    commit_id: &str,
    auto_commit: bool,
) -> Result<CommitActionResult, AppError> {
    crate::exec::validate_git_operand(commit_id, "commit_id")?;
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.state() != RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "Repository has unfinished operations. Please resolve or abort them first.".into(),
        ));
    }

    let target_oid = Oid::from_str(commit_id.trim())?;
    let _ = repo.find_commit(target_oid)?;

    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let before_oid = head_commit.as_ref().map(|c| c.id());
    let head_ref = head_ref_name(&repo)?;

    create_backup_ref(&repo, "cherry-pick", target_oid)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref()).arg("cherry-pick");

    if !auto_commit {
        cmd.arg("--no-commit");
    }
    cmd.arg(commit_id.trim());

    let output = cmd.output().map_err(|e| AppError::Io(e.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    if output.status.success() {
        if auto_commit {
            let fresh_repo = Repository::open(repo_path.as_ref())?;
            let new_head = fresh_repo.head()?.peel_to_commit()?.id();
            let undo_token = create_undo_token(&fresh_repo, &head_ref, before_oid, new_head).ok();
            Ok(CommitActionResult {
                success: true,
                status: "Committed".into(),
                new_commit_id: Some(new_head.to_string()),
                undo_token,
                output: combined,
            })
        } else {
            Ok(CommitActionResult {
                success: true,
                status: "Staged".into(),
                new_commit_id: None,
                undo_token: None,
                output: combined,
            })
        }
    } else {
        let is_conflict = combined.contains("CONFLICT")
            || combined.contains("could not apply")
            || combined.contains("Automatic cherry-pick failed");
        let status = if is_conflict { "Conflict" } else { "Error" };
        Ok(CommitActionResult {
            success: false,
            status: status.into(),
            new_commit_id: None,
            undo_token: None,
            output: combined,
        })
    }
}

pub fn git_revert<P: AsRef<Path>>(
    repo_path: P,
    commit_id: &str,
    auto_commit: bool,
) -> Result<CommitActionResult, AppError> {
    crate::exec::validate_git_operand(commit_id, "commit_id")?;
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.state() != RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "Repository has unfinished operations. Please resolve or abort them first.".into(),
        ));
    }

    let target_oid = Oid::from_str(commit_id.trim())?;
    let _ = repo.find_commit(target_oid)?;

    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let before_oid = head_commit.as_ref().map(|c| c.id());
    let head_ref = head_ref_name(&repo)?;

    create_backup_ref(&repo, "revert", target_oid)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref()).arg("revert");

    if !auto_commit {
        cmd.arg("--no-commit");
    } else {
        cmd.arg("--no-edit");
    }
    cmd.arg(commit_id.trim());

    let output = cmd.output().map_err(|e| AppError::Io(e.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    if output.status.success() {
        if auto_commit {
            let fresh_repo = Repository::open(repo_path.as_ref())?;
            let new_head = fresh_repo.head()?.peel_to_commit()?.id();
            let undo_token = create_undo_token(&fresh_repo, &head_ref, before_oid, new_head).ok();
            Ok(CommitActionResult {
                success: true,
                status: "Committed".into(),
                new_commit_id: Some(new_head.to_string()),
                undo_token,
                output: combined,
            })
        } else {
            Ok(CommitActionResult {
                success: true,
                status: "Staged".into(),
                new_commit_id: None,
                undo_token: None,
                output: combined,
            })
        }
    } else {
        let is_conflict = combined.contains("CONFLICT")
            || combined.contains("could not revert")
            || combined.contains("Automatic revert failed");
        let status = if is_conflict { "Conflict" } else { "Error" };
        Ok(CommitActionResult {
            success: false,
            status: status.into(),
            new_commit_id: None,
            undo_token: None,
            output: combined,
        })
    }
}
