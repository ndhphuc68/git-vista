use crate::error::AppError;
use git2::{Oid, Repository};
use std::path::Path;

/// Restore the exact pre-operation HEAD, never a caller-supplied arbitrary commit.
/// Index and working tree are deliberately preserved (soft undo).
pub fn undo_recorded_commit<P: AsRef<Path>>(repo_path: P, token: &str) -> Result<(), AppError> {
    use crate::write::commit::{head_ref_name, CommitRecovery};
    let repo = Repository::open(repo_path)?;
    if !token.starts_with("refs/gitui-backup/commit-undo-") || !git2::Reference::is_valid_name(token) {
        return Err(AppError::InvalidOperation("Invalid commit recovery token".into()));
    }
    let receipt = repo.find_reference(token)?.peel_to_commit()?;
    let recovery: CommitRecovery = serde_json::from_str(receipt.message().unwrap_or(""))
        .map_err(|_| AppError::InvalidOperation("Invalid commit recovery record".into()))?;
    let mut transaction = repo.transaction()?;
    transaction.lock_ref("HEAD")?;
    if head_ref_name(&repo)? != recovery.head_ref || repo.state() != git2::RepositoryState::Clean {
        return Err(AppError::InvalidOperation("Repository changed since this commit; undo cancelled".into()));
    }
    if recovery.head_ref != "HEAD" { transaction.lock_ref(&recovery.head_ref)?; }
    let current = repo.head()?.peel_to_commit()?.id();
    if current.to_string() != recovery.after {
        return Err(AppError::InvalidOperation("HEAD changed since this commit; undo cancelled".into()));
    }
    match recovery.before {
        Some(before) => transaction.set_target(&recovery.head_ref, Oid::from_str(&before)?, None, "gitui undo commit")?,
        None => transaction.remove(&recovery.head_ref)?,
    }
    transaction.commit()?;
    // Keep the safety ref for recovery; HEAD validation makes stale callbacks harmless.
    Ok(())
}

pub fn undo_delete_branch<P: AsRef<Path>>(
    repo_path: P,
    branch_name: &str,
    commit_id: &str,
) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let oid = Oid::from_str(commit_id).map_err(|e| AppError::Git(e.to_string()))?;
    let commit = repo.find_commit(oid)?;
    repo.branch(branch_name, &commit, false)?;
    Ok(())
}

pub fn undo_drop_stash<P: AsRef<Path>>(
    repo_path: P,
    stash_commit_id: &str,
    _message: &str,
) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let oid = Oid::from_str(stash_commit_id).map_err(|e| AppError::Git(e.to_string()))?;
    // Tạo hoặc cập nhật reference refs/stash
    repo.reference("refs/stash", oid, true, "gitui undo drop stash")?;
    Ok(())
}
