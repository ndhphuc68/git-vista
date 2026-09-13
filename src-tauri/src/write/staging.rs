use crate::error::AppError;
use git2::build::CheckoutBuilder;
use git2::{IndexAddOption, Repository};
use std::path::Path;

/// Stage a specific file (new, modified, or deleted).
pub fn stage_file<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let workdir = repo
        .workdir()
        .ok_or_else(|| AppError::InvalidOperation("Bare repository not supported".to_string()))?;

    let normalized_path = file_path.replace('\\', "/");
    let full_path = workdir.join(&normalized_path);

    let mut index = repo.index()?;
    let path = Path::new(&normalized_path);

    if std::fs::symlink_metadata(&full_path).is_ok() {
        index.add_path(path)?;
    } else {
        index.remove_path(path)?;
    }

    index.write()?;
    Ok(())
}

/// Unstage a specific file.
pub fn unstage_file<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let normalized_path = file_path.replace('\\', "/");

    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());

    if let Some(commit) = head_commit {
        repo.reset_default(Some(commit.as_object()), &[&normalized_path])?;
    } else {
        let mut index = repo.index()?;
        index.remove_path(Path::new(&normalized_path))?;
        index.write()?;
    }

    Ok(())
}

/// Stage all changes (new, modified, deleted).
pub fn stage_all<P: AsRef<Path>>(repo_path: P) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let workdir = repo
        .workdir()
        .ok_or_else(|| AppError::InvalidOperation("Bare repository not supported".to_string()))?;

    let mut index = repo.index()?;

    // Remove any tracked entries that have been deleted from disk
    let mut to_remove = Vec::new();
    for entry in index.iter() {
        if let Ok(path_str) = std::str::from_utf8(&entry.path) {
            let full_path = workdir.join(path_str);
            if std::fs::symlink_metadata(&full_path).is_err() {
                to_remove.push(path_str.to_string());
            }
        }
    }
    for path in to_remove {
        index.remove_path(Path::new(&path))?;
    }

    // Add new/untracked files and modified files
    index.add_all(["*"], IndexAddOption::DEFAULT, None)?;
    index.write()?;

    Ok(())
}

/// Unstage all staged changes.
pub fn unstage_all<P: AsRef<Path>>(repo_path: P) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());

    if let Some(commit) = head_commit {
        repo.reset_default(Some(commit.as_object()), &["*"])?;
    } else {
        let mut index = repo.index()?;
        index.clear()?;
        index.write()?;
    }

    Ok(())
}

/// Discard working tree changes for a specific file, restoring from HEAD.
pub fn discard_file_changes<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let normalized_path = file_path.replace('\\', "/");

    let mut checkout = CheckoutBuilder::new();
    checkout.path(&normalized_path);
    checkout.force();

    repo.checkout_head(Some(&mut checkout))?;
    Ok(())
}
