use crate::error::AppError;
use git2::{Oid, Repository};
use std::sync::atomic::{AtomicU64, Ordering};
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
    // Second granularity alone collides when the same action repeats quickly
    // (two amends in one second), and `force` would then drop the older
    // backup — the only pointer to the overwritten commit. Retry with a
    // disambiguating suffix instead of overwriting.
    static NEXT: AtomicU64 = AtomicU64::new(0);
    // Include the immutable target object in the token so a consumed receipt
    // name cannot be silently reused for a different recovery operation.
    let base = format!("refs/gitui-backup/{}-{}.{}", action, now, target_oid);
    for attempt in 0..1000 {
        // `.N` keeps the trailing `-<seconds>` intact so pruning can still
        // read the timestamp as the last hyphen-separated segment.
        let ref_name = if attempt == 0 {
            base.clone()
        } else {
            format!("{}.{}", base, NEXT.fetch_add(1, Ordering::Relaxed))
        };
        match repo.reference(&ref_name, target_oid, false, "gitui automatic safety backup") {
            Ok(_) => return Ok(ref_name),
            // An existing ref for the same target is already a valid backup.
            Err(_) if repo.refname_to_id(&ref_name).ok() == Some(target_oid) => {
                return Ok(ref_name)
            }
            Err(e) if e.code() == git2::ErrorCode::Exists => continue,
            Err(e) => return Err(e.into()),
        }
    }
    Err(AppError::InvalidOperation(
        "Could not allocate a unique backup ref".into(),
    ))
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
        if let Ok(name) = r.name() {
            // Trailing segment is `<seconds>` or `<seconds>.<disambiguator>`.
            if let Some(timestamp_str) = name.rsplit('-').next() {
                if let Ok(ts) = timestamp_str
                    .split('.')
                    .next()
                    .unwrap_or(timestamp_str)
                    .parse::<u64>()
                {
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
