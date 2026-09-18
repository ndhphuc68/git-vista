use crate::error::AppError;
use crate::exec::validate_git_operand;
use crate::read::remote::RemoteItem;
use git2::Repository;
use std::path::Path;

pub fn add_remote<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    url: &str,
) -> Result<RemoteItem, AppError> {
    validate_git_operand(name, "remote")?;
    if url.trim().is_empty() {
        return Err(AppError::InvalidOperation("URL không được để trống".into()));
    }

    let repo = Repository::open(repo_path.as_ref())?;
    let remote = repo.remote(name, url)?;

    let fetch_url = remote.url().ok().map(|s| s.to_string());
    let push_url = remote.pushurl().ok().flatten().map(|s| s.to_string());

    Ok(RemoteItem {
        name: name.to_string(),
        fetch_url,
        push_url,
        branch_count: 0,
        is_default: name == "origin",
    })
}

pub fn rename_remote<P: AsRef<Path>>(
    repo_path: P,
    old_name: &str,
    new_name: &str,
) -> Result<(), AppError> {
    validate_git_operand(old_name, "old remote")?;
    validate_git_operand(new_name, "new remote")?;

    let repo = Repository::open(repo_path.as_ref())?;
    repo.remote_rename(old_name, new_name)?;
    Ok(())
}

pub fn remove_remote<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
) -> Result<(), AppError> {
    validate_git_operand(name, "remote")?;

    let repo = Repository::open(repo_path.as_ref())?;
    repo.remote_delete(name)?;
    Ok(())
}

pub fn set_remote_url<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    fetch_url: &str,
    push_url: Option<String>,
) -> Result<(), AppError> {
    validate_git_operand(name, "remote")?;
    if fetch_url.trim().is_empty() {
        return Err(AppError::InvalidOperation("Fetch URL không được để trống".into()));
    }

    let repo = Repository::open(repo_path.as_ref())?;
    repo.remote_set_url(name, fetch_url)?;

    if let Some(push) = push_url {
        let p_trimmed = push.trim();
        if p_trimmed.is_empty() {
            repo.remote_set_pushurl(name, None)?;
        } else {
            repo.remote_set_pushurl(name, Some(p_trimmed))?;
        }
    }

    Ok(())
}
