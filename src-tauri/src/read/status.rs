use crate::error::AppError;
use crate::read::diff::{parse_diff_to_file_diff_result, FileDiffResult};
use git2::{DiffOptions, Repository, StatusOptions};
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
    Conflicted,
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
    pub conflicted: Vec<StatusFileItem>,
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
    let mut conflicted = Vec::new();

    for entry in statuses.iter() {
        let s = entry.status();
        let path = match entry.path() {
            Ok(p) => p.to_string(),
            Err(_) => continue,
        };

        if s.contains(git2::Status::CONFLICTED) {
            conflicted.push(StatusFileItem {
                path: path.clone(),
                status: FileStatus::Conflicted,
                is_staged: false,
                old_path: None,
            });
            continue;
        }

        // 1. Phân loại Staged (INDEX_*)
        if s.intersects(
            git2::Status::INDEX_NEW
                | git2::Status::INDEX_MODIFIED
                | git2::Status::INDEX_DELETED
                | git2::Status::INDEX_RENAMED
                | git2::Status::INDEX_TYPECHANGE,
        ) {
            let (status, current_path, old_path) = if s.contains(git2::Status::INDEX_RENAMED) {
                let delta = entry.head_to_index();
                let old = delta
                    .as_ref()
                    .and_then(|d| d.old_file().path())
                    .map(|p| p.to_string_lossy().to_string());
                let new = delta
                    .as_ref()
                    .and_then(|d| d.new_file().path())
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|| path.clone());
                (FileStatus::Renamed, new, old)
            } else if s.contains(git2::Status::INDEX_NEW) {
                (FileStatus::New, path.clone(), None)
            } else if s.contains(git2::Status::INDEX_DELETED) {
                (FileStatus::Deleted, path.clone(), None)
            } else if s.contains(git2::Status::INDEX_TYPECHANGE) {
                (FileStatus::Typechange, path.clone(), None)
            } else {
                (FileStatus::Modified, path.clone(), None)
            };

            staged.push(StatusFileItem {
                path: current_path,
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
            let (status, current_path, old_path) = if s.contains(git2::Status::WT_RENAMED) {
                let delta = entry.index_to_workdir();
                let old = delta
                    .as_ref()
                    .and_then(|d| d.old_file().path())
                    .map(|p| p.to_string_lossy().to_string());
                let new = delta
                    .as_ref()
                    .and_then(|d| d.new_file().path())
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|| path.clone());
                (FileStatus::Renamed, new, old)
            } else if s.contains(git2::Status::WT_DELETED) {
                (FileStatus::Deleted, path.clone(), None)
            } else if s.contains(git2::Status::WT_TYPECHANGE) {
                (FileStatus::Typechange, path.clone(), None)
            } else {
                (FileStatus::Modified, path.clone(), None)
            };

            unstaged.push(StatusFileItem {
                path: current_path,
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
        conflicted,
    })
}

/// Lấy diff của một file trong working tree (staged hoặc unstaged)
pub fn get_working_file_diff<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    is_staged: bool,
) -> Result<FileDiffResult, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let index = repo.index()?;

    let normalized_path = file_path.replace('\\', "/");
    let mut diff_opts = DiffOptions::new();
    diff_opts.pathspec(&normalized_path);

    let diff = if is_staged {
        let head_tree = match repo.head() {
            Ok(head_ref) => head_ref.peel_to_tree().ok(),
            Err(_) => None,
        };
        repo.diff_tree_to_index(head_tree.as_ref(), Some(&index), Some(&mut diff_opts))?
    } else {
        diff_opts.include_untracked(true);
        diff_opts.recurse_untracked_dirs(true);
        diff_opts.show_untracked_content(true);
        repo.diff_index_to_workdir(Some(&index), Some(&mut diff_opts))?
    };

    parse_diff_to_file_diff_result(&diff, file_path)
}

