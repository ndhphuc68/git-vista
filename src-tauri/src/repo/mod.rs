//! Module `repo`: Quản lý mở repository, cache phiên, và filesystem watcher.
//! Tuân thủ nguyên tắc Deep Module: ẩn chi tiết cấu trúc .git/ và bộ theo dõi đĩa.

pub mod recent;
pub mod watcher;

use crate::error::AppError;
pub use recent::{RecentRepoEntry, RecentRepoStore};
pub use watcher::RepoWatcher;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RepoSummary {
    pub path: String,
    pub name: String,
    pub is_bare: bool,
    pub head_branch: Option<String>,
    pub head_commit_id: Option<String>,
}

pub struct RepoManager {
    current_path: Option<PathBuf>,
    recent_store: RecentRepoStore,
    watcher: Option<RepoWatcher>,
}

impl RepoManager {
    pub fn new() -> Self {
        Self {
            current_path: None,
            recent_store: RecentRepoStore::new(),
            watcher: None,
        }
    }

    pub fn open<P: AsRef<Path>>(&mut self, path: P) -> Result<RepoSummary, AppError> {
        self.stop_watcher();
        let path_ref = path.as_ref();
        let repo = git2::Repository::open(path_ref)?;
        let canonical = path_ref.canonicalize().map_err(AppError::from)?;
        let name = canonical
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "repository".to_string());

        let mut head_branch = None;
        let mut head_commit_id = None;

        if let Ok(head) = repo.head() {
            if head.is_branch() {
                head_branch = head.shorthand().ok().map(|s| s.to_string());
            }
            head_commit_id = head.target().map(|oid| oid.to_string());
        }

        self.recent_store.record_open(&canonical, &name)?;
        self.current_path = Some(canonical.clone());

        Ok(RepoSummary {
            path: canonical.to_string_lossy().to_string(),
            name,
            is_bare: repo.is_bare(),
            head_branch,
            head_commit_id,
        })
    }

    pub fn start_watcher<F>(&mut self, on_changed: F) -> Result<(), AppError>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        let current = self
            .current_path
            .as_ref()
            .ok_or_else(|| AppError::InvalidOperation("No repository currently open".to_string()))?
            .clone();
        self.stop_watcher();
        let watcher = RepoWatcher::start(&current, on_changed)?;
        self.watcher = Some(watcher);
        Ok(())
    }

    pub fn stop_watcher(&mut self) {
        if let Some(mut watcher) = self.watcher.take() {
            watcher.stop();
        }
    }

    pub fn has_watcher(&self) -> bool {
        self.watcher.is_some()
    }

    pub fn current_repo(&self) -> Option<&Path> {
        self.current_path.as_deref()
    }

    pub fn list_recent(&self) -> Vec<RecentRepoEntry> {
        self.recent_store.list()
    }

    pub fn clear_recent(&self) {
        let _ = self.recent_store.clear();
    }

    pub fn remove_recent(&self, path: &str) {
        let _ = self.recent_store.remove(path);
    }
}

impl Default for RepoManager {
    fn default() -> Self {
        Self::new()
    }
}
