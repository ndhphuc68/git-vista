//! Module `read`: Thực hiện các thao tác chỉ đọc qua libgit2 (status, diff, log, graph).
//! Quy tắc bất biến: Module này KHÔNG BAO GIỜ ghi hay thay đổi trạng thái repo.
//! Có thể gọi song song từ nhiều thread mà không cần khoá.

pub mod blame;
pub mod branches;
pub mod compare;
pub mod config;
pub mod conflict;
pub mod diff;
pub mod file_history;
pub mod graph;
pub mod rebase;
pub mod remote;
pub mod state;
pub mod status;
pub mod tags;

pub use blame::*;
pub use branches::*;
pub use compare::*;
pub use config::*;
pub use conflict::*;
pub use diff::*;
pub use file_history::*;
pub use graph::*;
pub use rebase::*;
pub use remote::*;
pub use state::*;
pub use status::*;
pub use tags::*;

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RepoHeadInfo {
    pub branch_name: Option<String>,
    pub head_commit_id: Option<String>,
    pub is_detached: bool,
    pub ahead: u32,
    pub behind: u32,
    pub upstream: Option<String>,
}

/// Lấy thông tin HEAD hiện tại của repository
pub fn get_head_info<P: AsRef<Path>>(repo_path: P) -> Result<RepoHeadInfo, AppError> {
    let repo = git2::Repository::open(repo_path.as_ref())?;

    if repo.is_empty()? {
        return Ok(RepoHeadInfo {
            branch_name: None,
            head_commit_id: None,
            is_detached: false,
            ahead: 0,
            behind: 0,
            upstream: None,
        });
    }

    let head = repo.head()?;
    let is_detached = repo.head_detached()?;
    let mut branch_name = None;
    let mut ahead = 0u32;
    let mut behind = 0u32;
    let mut upstream = None;

    if !is_detached {
        if let Ok(shorthand) = head.shorthand() {
            branch_name = Some(shorthand.to_string());
            if let Ok(local_branch) = repo.find_branch(shorthand, git2::BranchType::Local) {
                if let Ok(upstream_branch) = local_branch.upstream() {
                    upstream = upstream_branch.name().ok().flatten().map(|s| s.to_string());
                    if let (Some(local_oid), Some(upstream_oid)) = (
                        local_branch.get().target(),
                        upstream_branch.get().target(),
                    ) {
                        if let Ok((a, b)) = repo.graph_ahead_behind(local_oid, upstream_oid) {
                            ahead = a as u32;
                            behind = b as u32;
                        }
                    }
                }
            }
        }
    }

    let head_commit_id = head.target().map(|oid| oid.to_string());

    Ok(RepoHeadInfo {
        branch_name,
        head_commit_id,
        is_detached,
        ahead,
        behind,
        upstream,
    })
}

