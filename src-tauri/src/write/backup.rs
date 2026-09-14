use crate::error::AppError;
use git2::{Oid, Repository};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn create_backup_ref(
    repo: &Repository,
    action: &str,
    target_oid: Oid,
) -> Result<String, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let ref_name = format!("refs/gitui-backup/{}-{}", action, now);
    repo.reference(&ref_name, target_oid, true, "gitui automatic safety backup")?;
    Ok(ref_name)
}

pub fn prune_expired_backups(repo: &Repository, max_age_days: u64) -> Result<usize, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let max_age_secs = max_age_days * 86400;
    let mut pruned = 0;

    let refs = repo.references_glob("refs/gitui-backup/*")?;
    for mut r in refs.flatten() {
        if let Some(name) = r.name() {
            if let Some(timestamp_str) = name.rsplit('-').next() {
                if let Ok(ts) = timestamp_str.parse::<u64>() {
                    if now.saturating_sub(ts) >= max_age_secs {
                        let _ = r.delete();
                        pruned += 1;
                    }
                }
            }
        }
    }
    Ok(pruned)
}
