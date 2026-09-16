use crate::error::AppError;
use git2::{Oid, Repository};
use std::path::Path;

/// Restore the exact pre-operation HEAD, never a caller-supplied arbitrary commit.
/// Index and working tree are deliberately preserved (soft undo).
pub fn undo_recorded_commit<P: AsRef<Path>>(repo_path: P, token: &str) -> Result<(), AppError> {
    use crate::write::commit::{head_ref_name, CommitRecovery};
    let repo = Repository::open(repo_path)?;
    if !token.starts_with("refs/gitui-backup/commit-undo-")
        || !git2::Reference::is_valid_name(token)
    {
        return Err(AppError::InvalidOperation(
            "Invalid commit recovery token".into(),
        ));
    }
    let receipt = repo.find_reference(token)?.peel_to_commit()?;
    let recovery: CommitRecovery = serde_json::from_str(receipt.message().unwrap_or(""))
        .map_err(|_| AppError::InvalidOperation("Invalid commit recovery record".into()))?;
    let mut transaction = repo.transaction()?;
    transaction.lock_ref("HEAD")?;
    if head_ref_name(&repo)? != recovery.head_ref || repo.state() != git2::RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "Repository changed since this commit; undo cancelled".into(),
        ));
    }
    if recovery.head_ref != "HEAD" {
        transaction.lock_ref(&recovery.head_ref)?;
    }
    let current = repo.head()?.peel_to_commit()?.id();
    if current.to_string() != recovery.after {
        return Err(AppError::InvalidOperation(
            "HEAD changed since this commit; undo cancelled".into(),
        ));
    }
    match recovery.before {
        Some(before) => transaction.set_target(
            &recovery.head_ref,
            Oid::from_str(&before)?,
            None,
            "gitui undo commit",
        )?,
        None => transaction.remove(&recovery.head_ref)?,
    }
    transaction.commit()?;
    // Keep the safety ref for recovery; HEAD validation makes stale callbacks harmless.
    Ok(())
}

pub fn undo_delete_branch<P: AsRef<Path>>(
    repo_path: P,
    branch_name: &str,
    backup_ref: &str,
) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let branch_name = branch_name.trim();
    crate::write::branch::validate_branch_name(branch_name)?;
    if !backup_ref.starts_with("refs/gitui-backup/delete-branch-")
        || !git2::Reference::is_valid_name(backup_ref)
    {
        return Err(AppError::InvalidOperation(
            "Invalid branch deletion recovery token".into(),
        ));
    }
    if repo
        .find_branch(branch_name, git2::BranchType::Local)
        .is_ok()
    {
        return Err(AppError::InvalidOperation(
            "Branch already exists; undo cancelled".into(),
        ));
    }
    let receipt = repo.find_reference(backup_ref)?.peel_to_commit()?;
    let recovery: crate::write::branch::BranchDeletionRecovery =
        serde_json::from_str(receipt.message().unwrap_or(""))
            .map_err(|_| AppError::InvalidOperation("Invalid branch recovery record".into()))?;
    if recovery.version != 1 || recovery.branch_name != branch_name || receipt.parent_count() != 1 {
        return Err(AppError::InvalidOperation(
            "Branch recovery token does not match this branch".into(),
        ));
    }
    let target = receipt.parent_id(0)?;
    if recovery.target != target.to_string() {
        return Err(AppError::InvalidOperation(
            "Invalid branch recovery target".into(),
        ));
    }
    repo.find_commit(target)?;
    let signature = receipt.author();

    let branch_ref = format!("refs/heads/{branch_name}");
    let mut transaction = repo.transaction()?;
    transaction.lock_ref(&branch_ref)?;
    transaction.lock_ref(backup_ref)?;
    if repo.find_reference(&branch_ref).is_ok() {
        return Err(AppError::InvalidOperation(
            "Branch already exists; undo cancelled".into(),
        ));
    }
    transaction.set_target(
        &branch_ref,
        target,
        Some(&signature),
        "gitui undo branch deletion",
    )?;
    transaction.remove(backup_ref)?;
    transaction.commit()?;
    Ok(())
}

pub fn undo_drop_stash<P: AsRef<Path>>(repo_path: P, receipt: &str) -> Result<(), AppError> {
    crate::write::stash::restore_dropped_stash(repo_path, receipt)
}
