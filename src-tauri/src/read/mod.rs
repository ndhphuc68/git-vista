//! Module `read`: Thực hiện các thao tác chỉ đọc qua libgit2 (status, diff, log, graph).
//! Quy tắc bất biến: Module này KHÔNG BAO GIỜ ghi hay thay đổi trạng thái repo.
//! Có thể gọi song song từ nhiều thread mà không cần khoá.

pub mod branches;
pub mod diff;
pub mod graph;

pub use branches::*;
pub use diff::*;
pub use graph::*;

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RepoHeadInfo {
    pub branch_name: Option<String>,
    pub head_commit_id: Option<String>,
    pub is_detached: bool,
}

/// Lấy thông tin HEAD hiện tại của repository
pub fn get_head_info<P: AsRef<Path>>(repo_path: P) -> Result<RepoHeadInfo, AppError> {
    let repo = git2::Repository::open(repo_path.as_ref())?;
    
    if repo.is_empty()? {
        return Ok(RepoHeadInfo {
            branch_name: None,
            head_commit_id: None,
            is_detached: false,
        });
    }

    let head = repo.head()?;
    let is_detached = repo.head_detached()?;
    let branch_name = if is_detached {
        None
    } else {
        head.shorthand().map(|s| s.to_string())
    };

    let head_commit_id = head.target().map(|oid| oid.to_string());

    Ok(RepoHeadInfo {
        branch_name,
        head_commit_id,
        is_detached,
    })
}

