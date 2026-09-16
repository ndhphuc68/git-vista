use crate::error::AppError;
use crate::write::create_backup_ref;
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub(crate) struct StashRecoveryEntry {
    pub commit_id: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct StashDropRecovery {
    pub version: u8,
    pub before: Vec<StashRecoveryEntry>,
    pub after: Vec<StashRecoveryEntry>,
}

fn recovery_entries(stashes: &[StashItem]) -> Vec<StashRecoveryEntry> {
    stashes
        .iter()
        .map(|stash| StashRecoveryEntry {
            commit_id: stash.commit_id.clone(),
            message: stash.message.clone(),
        })
        .collect()
}

fn repository_signature(repo: &Repository) -> Result<git2::Signature<'static>, AppError> {
    match repo.signature() {
        Ok(signature) => Ok(signature.to_owned()),
        Err(_) => {
            git2::Signature::now("Visual Git Client", "app@visualgit.local").map_err(AppError::from)
        }
    }
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
    let msg = message
        .filter(|m| !m.trim().is_empty())
        .unwrap_or(default_msg);

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

pub fn drop_stash<P: AsRef<Path>>(repo_path: P, index: usize) -> Result<String, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let mut transaction = repo.transaction()?;
    transaction.lock_ref("refs/stash")?;
    let before_items = get_stashes(repo_path.as_ref())?;
    let dropped = before_items
        .get(index)
        .ok_or_else(|| AppError::InvalidOperation("Stash index out of range".into()))?;
    let before = recovery_entries(&before_items);
    let mut after = before.clone();
    after.remove(index);
    let dropped_commit = repo.find_commit(
        git2::Oid::from_str(&dropped.commit_id)
            .map_err(|error| AppError::InvalidOperation(error.to_string()))?,
    )?;
    let tree = dropped_commit.tree()?;
    let signature = repository_signature(&repo)?;
    let recovery = StashDropRecovery {
        version: 1,
        before,
        after,
    };
    let recovery_message =
        serde_json::to_string(&recovery).map_err(|error| AppError::Io(error.to_string()))?;
    let receipt_commit = repo.commit(
        None,
        &signature,
        &signature,
        &recovery_message,
        &tree,
        &[&dropped_commit],
    )?;
    let receipt = create_backup_ref(&repo, "stash-drop-undo", receipt_commit)?;
    drop(tree);
    drop(dropped_commit);
    let reflog = build_stash_reflog(&repo, &recovery.after)?;
    if let Some(newest) = recovery.after.first() {
        let signature = repository_signature(&repo)?;
        transaction.set_target(
            "refs/stash",
            git2::Oid::from_str(&newest.commit_id)?,
            Some(&signature),
            "gitui drop stash",
        )?;
    } else {
        transaction.remove("refs/stash")?;
    }
    transaction.set_reflog("refs/stash", reflog)?;
    transaction.commit()?;
    Ok(receipt)
}

fn build_stash_reflog(
    repo: &Repository,
    entries: &[StashRecoveryEntry],
) -> Result<git2::Reflog, AppError> {
    let signature = repository_signature(repo)?;
    let mut reflog = repo.reflog("refs/stash")?;
    while !reflog.is_empty() {
        reflog.remove(0, false)?;
    }
    for entry in entries.iter().rev() {
        let oid = git2::Oid::from_str(&entry.commit_id)?;
        repo.find_commit(oid)?;
        if entry.message.contains('\0') {
            return Err(AppError::InvalidOperation(
                "Invalid stash recovery message".into(),
            ));
        }
        reflog.append(oid, &signature, Some(&entry.message))?;
    }
    Ok(reflog)
}

fn validate_recovery(
    receipt_commit: &git2::Commit<'_>,
    recovery: &StashDropRecovery,
) -> Result<(), AppError> {
    if recovery.version != 1
        || recovery.before.len() != recovery.after.len() + 1
        || receipt_commit.parent_count() != 1
    {
        return Err(AppError::InvalidOperation(
            "Invalid stash recovery record".into(),
        ));
    }
    let dropped_id = receipt_commit.parent_id(0)?.to_string();
    let matches_drop = (0..recovery.before.len()).any(|index| {
        recovery.before[index].commit_id == dropped_id
            && recovery
                .before
                .iter()
                .enumerate()
                .filter(|(position, _)| *position != index)
                .map(|(_, entry)| entry)
                .eq(recovery.after.iter())
    });
    if !matches_drop {
        return Err(AppError::InvalidOperation(
            "Invalid stash recovery record".into(),
        ));
    }
    Ok(())
}

pub fn restore_dropped_stash<P: AsRef<Path>>(repo_path: P, receipt: &str) -> Result<(), AppError> {
    if !receipt.starts_with("refs/gitui-backup/stash-drop-undo-")
        || !git2::Reference::is_valid_name(receipt)
    {
        return Err(AppError::InvalidOperation(
            "Invalid stash recovery token".into(),
        ));
    }
    let repo = Repository::open(repo_path.as_ref())?;
    let mut transaction = repo.transaction()?;
    transaction.lock_ref(receipt)?;
    transaction.lock_ref("refs/stash")?;
    let receipt_commit = repo.find_reference(receipt)?.peel_to_commit()?;
    let recovery: StashDropRecovery = serde_json::from_str(receipt_commit.message().unwrap_or(""))
        .map_err(|_| AppError::InvalidOperation("Invalid stash recovery record".into()))?;
    validate_recovery(&receipt_commit, &recovery)?;
    let current = recovery_entries(&get_stashes(repo_path.as_ref())?);
    if current != recovery.after {
        return Err(AppError::InvalidOperation(
            "Stash list changed since deletion; undo cancelled".into(),
        ));
    }
    let reflog = build_stash_reflog(&repo, &recovery.before)?;
    let newest = git2::Oid::from_str(&recovery.before[0].commit_id)?;
    let signature = receipt_commit.author();
    transaction.set_target(
        "refs/stash",
        newest,
        Some(&signature),
        "gitui restore dropped stash",
    )?;
    transaction.set_reflog("refs/stash", reflog)?;
    transaction.remove(receipt)?;
    transaction.commit()?;
    Ok(())
}
