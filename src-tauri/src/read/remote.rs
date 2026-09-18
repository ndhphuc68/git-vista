use crate::error::AppError;
use git2::{BranchType, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemoteItem {
    pub name: String,
    pub fetch_url: Option<String>,
    pub push_url: Option<String>,
    pub branch_count: u32,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PruneResult {
    pub remote: String,
    pub pruned_branches: Vec<String>,
    pub message: String,
}

pub fn get_remotes<P: AsRef<Path>>(repo_path: P) -> Result<Vec<RemoteItem>, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let remotes = repo.remotes()?;
    let mut items = Vec::new();

    let mut remote_branches = Vec::new();
    if let Ok(branches) = repo.branches(Some(BranchType::Remote)) {
        for (branch, _) in branches.flatten() {
            if let Ok(Some(name)) = branch.name() {
                remote_branches.push(name.to_string());
            }
        }
    }

    let remotes_len = remotes.len();
    for name_opt in remotes.iter() {
        if let Ok(Some(name)) = name_opt {
            if let Ok(remote) = repo.find_remote(name) {
                let fetch_url = remote.url().ok().map(|s| s.to_string());
                let push_url = remote.pushurl().ok().flatten().map(|s| s.to_string());
                let prefix = format!("{}/", name);
                let branch_count = remote_branches
                    .iter()
                    .filter(|b| b.starts_with(&prefix) && !b.ends_with("/HEAD"))
                    .count() as u32;

                let is_default = name == "origin" || remotes_len == 1;

                items.push(RemoteItem {
                    name: name.to_string(),
                    fetch_url,
                    push_url,
                    branch_count,
                    is_default,
                });
            }
        }
    }

    Ok(items)
}
