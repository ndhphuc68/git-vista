use crate::error::AppError;
use git2::{Repository, RepositoryState, StatusOptions};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RepoStateInfo {
    pub state: String,
    pub is_in_progress: bool,
    pub head_name: String,
    pub target_name: Option<String>,
    pub conflict_count: usize,
}

pub fn get_repo_state<P: AsRef<Path>>(repo_path: P) -> Result<RepoStateInfo, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    let state_str = match repo.state() {
        RepositoryState::Clean => "clean",
        RepositoryState::Merge => "merge",
        RepositoryState::Rebase
        | RepositoryState::RebaseInteractive
        | RepositoryState::RebaseMerge => "rebase",
        RepositoryState::CherryPick | RepositoryState::CherryPickSequence => "cherry_pick",
        RepositoryState::Revert | RepositoryState::RevertSequence => "revert",
        _ => "other",
    };

    let is_in_progress = state_str != "clean";

    let head_name = match repo.head() {
        Ok(head) => head.shorthand().unwrap_or("HEAD").to_string(),
        Err(_) => "HEAD".to_string(),
    };

    let mut target_name = None;
    let git_dir = repo.path();
    if state_str == "merge" {
        if let Ok(msg) = fs::read_to_string(git_dir.join("MERGE_MSG")) {
            if let Some(line) = msg.lines().next() {
                target_name = Some(
                    line.trim_start_matches("Merge branch ")
                        .replace('\'', "")
                        .to_string(),
                );
            }
        }
    } else if state_str == "rebase" {
        if let Ok(onto) = fs::read_to_string(git_dir.join("rebase-merge").join("onto_name")) {
            target_name = Some(onto.trim().to_string());
        } else if let Ok(onto) = fs::read_to_string(git_dir.join("rebase-apply").join("onto")) {
            target_name = Some(onto.trim().to_string());
        }
    }

    let mut status_opts = StatusOptions::new();
    status_opts.include_untracked(false);
    let statuses = repo.statuses(Some(&mut status_opts))?;
    let conflict_count = statuses
        .iter()
        .filter(|s| s.status().is_conflicted())
        .count();

    Ok(RepoStateInfo {
        state: state_str.to_string(),
        is_in_progress,
        head_name,
        target_name,
        conflict_count,
    })
}
