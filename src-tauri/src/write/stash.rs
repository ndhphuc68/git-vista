use crate::error::AppError;
use git2::{Repository, StashFlags};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct StashItem {
    pub index: usize,
    pub message: String,
    pub commit_id: String,
    pub created_at: i64,
}

pub fn get_stashes<P: AsRef<Path>>(repo_path: P) -> Result<Vec<StashItem>, AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let mut raw_stashes = Vec::new();

    repo.stash_foreach(|index, name, oid| {
        raw_stashes.push((index, name.to_string(), *oid));
        true
    })?;

    let mut stashes = Vec::with_capacity(raw_stashes.len());
    for (index, message, oid) in raw_stashes {
        let commit = repo.find_commit(oid).ok();
        let created_at = commit.as_ref().map(|c| c.time().seconds()).unwrap_or(0);
        stashes.push(StashItem {
            index,
            message,
            commit_id: oid.to_string(),
            created_at,
        });
    }

    Ok(stashes)
}

pub fn save_stash<P: AsRef<Path>>(
    repo_path: P,
    message: Option<&str>,
    include_untracked: bool,
) -> Result<String, AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let signature = repo.signature().unwrap_or_else(|_| {
        git2::Signature::now("Visual Git Client", "app@visualgit.local")
            .unwrap_or_else(|_| git2::Signature::now("Unknown", "unknown@local").unwrap())
    });

    let mut flags = StashFlags::DEFAULT;
    if include_untracked {
        flags |= StashFlags::INCLUDE_UNTRACKED;
    }

    let default_msg = "WIP on current branch";
    let msg = message.filter(|m| !m.trim().is_empty()).unwrap_or(default_msg);

    let oid = repo.stash_save2(&signature, Some(msg), Some(flags))?;
    Ok(oid.to_string())
}

pub fn apply_stash<P: AsRef<Path>>(repo_path: P, index: usize) -> Result<(), AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let mut options = git2::StashApplyOptions::new();
    repo.stash_apply(index, Some(&mut options))
        .map_err(|e| AppError::InvalidOperation(format!("Không thể áp dụng Stash: {}", e)))?;
    Ok(())
}

pub fn pop_stash<P: AsRef<Path>>(repo_path: P, index: usize) -> Result<(), AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let mut options = git2::StashApplyOptions::new();
    repo.stash_pop(index, Some(&mut options))
        .map_err(|e| AppError::InvalidOperation(format!("Không thể Pop Stash: {}", e)))?;
    Ok(())
}

pub fn drop_stash<P: AsRef<Path>>(repo_path: P, index: usize) -> Result<(), AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    repo.stash_drop(index)
        .map_err(|e| AppError::InvalidOperation(format!("Không thể xoá Stash: {}", e)))?;
    Ok(())
}
