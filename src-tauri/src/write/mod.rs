//! Module `write`: Thực hiện thay đổi trạng thái repo qua libgit2 (commit, branch, stash).
//! Luôn tạo ref backup trước các thao tác rủi ro theo mục 6.4 trong đặc tả.

pub mod staging;

use crate::error::AppError;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

/// Tạo ref backup an toàn trong `refs/gitui-backup/<action>-<timestamp>`
pub fn create_backup_ref<P: AsRef<Path>>(repo_path: P, action: &str) -> Result<String, AppError> {
    let repo = git2::Repository::open(repo_path.as_ref())?;
    let head = repo.head()?;
    let commit = head.peel_to_commit()?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::InvalidOperation(e.to_string()))?
        .as_secs();

    let backup_ref_name = format!("refs/gitui-backup/{}-{}", action, timestamp);
    repo.reference(&backup_ref_name, commit.id(), false, "Backup before risky operation")?;

    Ok(backup_ref_name)
}

