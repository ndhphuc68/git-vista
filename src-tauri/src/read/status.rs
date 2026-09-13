use crate::error::AppError;
use git2::{Repository, StatusOptions};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub enum FileStatus {
    Modified,
    New,
    Deleted,
    Renamed,
    Typechange,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct StatusFileItem {
    pub path: String,
    pub status: FileStatus,
    pub is_staged: bool,
    pub old_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RepoStatusResult {
    pub staged: Vec<StatusFileItem>,
    pub unstaged: Vec<StatusFileItem>,
    pub untracked: Vec<StatusFileItem>,
}

/// Lấy danh sách trạng thái làm việc (staged, unstaged, untracked) của repository
pub fn get_repo_status<P: AsRef<Path>>(repo_path: P) -> Result<RepoStatusResult, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    opts.renames_head_to_index(true);
    opts.renames_index_to_workdir(true);
    opts.recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut opts))?;

    let mut staged = Vec::new();
    let mut unstaged = Vec::new();
    let mut untracked = Vec::new();

    for entry in statuses.iter() {
        let s = entry.status();
        let path = match entry.path() {
            Some(p) => p.to_string(),
            None => continue,
        };

        // 1. Phân loại Staged (INDEX_*)
        if s.intersects(
            git2::Status::INDEX_NEW
                | git2::Status::INDEX_MODIFIED
                | git2::Status::INDEX_DELETED
                | git2::Status::INDEX_RENAMED
                | git2::Status::INDEX_TYPECHANGE,
        ) {
            let (status, old_path) = if s.contains(git2::Status::INDEX_NEW) {
                (FileStatus::New, None)
            } else if s.contains(git2::Status::INDEX_DELETED) {
                (FileStatus::Deleted, None)
            } else if s.contains(git2::Status::INDEX_RENAMED) {
                let old = entry
                    .head_to_index()
                    .and_then(|delta| delta.old_file().path())
                    .map(|p| p.to_string_lossy().to_string());
                (FileStatus::Renamed, old)
            } else if s.contains(git2::Status::INDEX_TYPECHANGE) {
                (FileStatus::Typechange, None)
            } else {
                (FileStatus::Modified, None)
            };

            staged.push(StatusFileItem {
                path: path.clone(),
                status,
                is_staged: true,
                old_path,
            });
        }

        // 2. Phân loại Untracked (WT_NEW)
        if s.contains(git2::Status::WT_NEW) {
            untracked.push(StatusFileItem {
                path: path.clone(),
                status: FileStatus::New,
                is_staged: false,
                old_path: None,
            });
        }

        // 3. Phân loại Unstaged (WT_*) - ngoại trừ WT_NEW
        if s.intersects(
            git2::Status::WT_MODIFIED
                | git2::Status::WT_DELETED
                | git2::Status::WT_RENAMED
                | git2::Status::WT_TYPECHANGE,
        ) {
            let (status, old_path) = if s.contains(git2::Status::WT_DELETED) {
                (FileStatus::Deleted, None)
            } else if s.contains(git2::Status::WT_RENAMED) {
                let old = entry
                    .index_to_workdir()
                    .and_then(|delta| delta.old_file().path())
                    .map(|p| p.to_string_lossy().to_string());
                (FileStatus::Renamed, old)
            } else if s.contains(git2::Status::WT_TYPECHANGE) {
                (FileStatus::Typechange, None)
            } else {
                (FileStatus::Modified, None)
            };

            unstaged.push(StatusFileItem {
                path,
                status,
                is_staged: false,
                old_path,
            });
        }
    }

    Ok(RepoStatusResult {
        staged,
        unstaged,
        untracked,
    })
}
