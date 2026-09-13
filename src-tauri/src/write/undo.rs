use crate::error::AppError;
use git2::{Oid, Repository, ResetType};
use std::fs;
use std::path::Path;

pub fn undo_commit<P: AsRef<Path>>(repo_path: P) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let head = repo.head()?;
    let commit = head.peel_to_commit()?;

    if commit.parent_count() == 0 {
        return Err(AppError::InvalidOperation(
            "Không thể hoàn tác initial commit".into(),
        ));
    }

    let parent = commit.parent(0)?;
    repo.reset(parent.as_object(), ResetType::Soft, None)?;
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

pub fn undo_discard_file<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    backup_content: &str,
) -> Result<(), AppError> {
    let full_path = repo_path.as_ref().join(file_path);
    fs::write(&full_path, backup_content)?;
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
