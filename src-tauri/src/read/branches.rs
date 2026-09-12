use crate::error::AppError;
use git2::{BranchType, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BranchItem {
    pub name: String,
    pub is_head: bool,
    pub target_commit_id: String,
    pub upstream: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BranchListResult {
    pub current_branch: Option<String>,
    pub is_detached: bool,
    pub local: Vec<BranchItem>,
    pub remote: Vec<BranchItem>,
    pub tags: Vec<String>,
}

pub fn list_repo_branches<P: AsRef<Path>>(repo_path: P) -> Result<BranchListResult, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    let is_detached = repo.head_detached().unwrap_or(false);
    let current_branch = if is_detached {
        None
    } else {
        repo.head().ok().and_then(|h| h.shorthand().map(|s| s.to_string()))
    };

    let mut local = Vec::new();
    if let Ok(branches) = repo.branches(Some(BranchType::Local)) {
        for branch_res in branches {
            if let Ok((branch, _)) = branch_res {
                if let Ok(Some(name)) = branch.name() {
                    let is_head = branch.is_head();
                    let target = branch.get().target().map(|o| o.to_string()).unwrap_or_default();
                    let upstream = branch
                        .upstream()
                        .ok()
                        .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));

                    local.push(BranchItem {
                        name: name.to_string(),
                        is_head,
                        target_commit_id: target,
                        upstream,
                    });
                }
            }
        }
    }

    let mut remote = Vec::new();
    if let Ok(branches) = repo.branches(Some(BranchType::Remote)) {
        for branch_res in branches {
            if let Ok((branch, _)) = branch_res {
                if let Ok(Some(name)) = branch.name() {
                    let target = branch.get().target().map(|o| o.to_string()).unwrap_or_default();
                    remote.push(BranchItem {
                        name: name.to_string(),
                        is_head: false,
                        target_commit_id: target,
                        upstream: None,
                    });
                }
            }
        }
    }

    let mut tags = Vec::new();
    if let Ok(tag_names) = repo.tag_names(None) {
        for t in tag_names.iter().flatten() {
            tags.push(t.to_string());
        }
    }

    Ok(BranchListResult {
        current_branch,
        is_detached,
        local,
        remote,
        tags,
    })
}
