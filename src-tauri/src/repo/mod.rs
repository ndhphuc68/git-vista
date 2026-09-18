//! Module `repo`: Quản lý mở repository, cache phiên, và filesystem watcher.
//! Tuân thủ nguyên tắc Deep Module: ẩn chi tiết cấu trúc .git/ và bộ theo dõi đĩa.

pub mod path;
pub mod recent;
pub mod watcher;

use crate::error::AppError;
pub use recent::{RecentRepoEntry, RecentRepoStore};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
pub use watcher::RepoWatcher;

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
    active_repos: HashMap<PathBuf, RepoSummary>,
    watchers: HashMap<PathBuf, RepoWatcher>,
    recent_store: RecentRepoStore,
}

impl RepoManager {
    pub fn new() -> Self {
        Self {
            current_path: None,
            active_repos: HashMap::new(),
            watchers: HashMap::new(),
            recent_store: RecentRepoStore::new(),
        }
    }

    pub fn open<P: AsRef<Path>>(&mut self, path: P) -> Result<RepoSummary, AppError> {
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
        let summary = RepoSummary {
            path: canonical.to_string_lossy().to_string(),
            name,
            is_bare: repo.is_bare(),
            head_branch,
            head_commit_id,
        };
        self.active_repos.insert(canonical.clone(), summary.clone());
        self.current_path = Some(canonical);

        Ok(summary)
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
        self.start_watcher_for(&current, on_changed)
    }

    pub fn start_watcher_for<P: AsRef<Path>, F>(
        &mut self,
        path: P,
        on_changed: F,
    ) -> Result<(), AppError>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        let canonical = path.as_ref().canonicalize().map_err(AppError::from)?;
        if let Some(mut old) = self.watchers.remove(&canonical) {
            old.stop();
        }
        let watcher = RepoWatcher::start(&canonical, on_changed)?;
        self.watchers.insert(canonical, watcher);
        Ok(())
    }

    pub fn stop_watcher(&mut self) {
        if let Some(current) = self.current_path.clone() {
            self.stop_watcher_for(&current);
        }
    }

    pub fn stop_watcher_for<P: AsRef<Path>>(&mut self, path: P) {
        if let Ok(canonical) = path.as_ref().canonicalize() {
            if let Some(mut watcher) = self.watchers.remove(&canonical) {
                watcher.stop();
            }
        }
    }

    pub fn stop_all_watchers(&mut self) {
        for (_, mut watcher) in self.watchers.drain() {
            watcher.stop();
        }
    }

    pub fn close_repository<P: AsRef<Path>>(&mut self, path: P) -> Result<(), AppError> {
        let canonical = path
            .as_ref()
            .canonicalize()
            .unwrap_or_else(|_| path.as_ref().to_path_buf());
        if let Some(mut watcher) = self.watchers.remove(&canonical) {
            watcher.stop();
        }
        self.active_repos.remove(&canonical);
        if self.current_path.as_ref() == Some(&canonical) {
            self.current_path = self.active_repos.keys().next().cloned();
        }
        Ok(())
    }

    pub fn is_open<P: AsRef<Path>>(&self, path: P) -> bool {
        let canonical = path
            .as_ref()
            .canonicalize()
            .unwrap_or_else(|_| path.as_ref().to_path_buf());
        self.active_repos.contains_key(&canonical)
    }

    pub fn get_open_repositories(&self) -> Vec<RepoSummary> {
        self.active_repos.values().cloned().collect()
    }

    pub fn has_watcher(&self) -> bool {
        if let Some(ref p) = self.current_path {
            self.watchers.contains_key(p)
        } else {
            !self.watchers.is_empty()
        }
    }

    pub fn has_watcher_for<P: AsRef<Path>>(&self, path: P) -> bool {
        if let Ok(canonical) = path.as_ref().canonicalize() {
            self.watchers.contains_key(&canonical)
        } else {
            false
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_multi_repo_open_and_close() {
        let temp1 = TempDir::new().unwrap();
        let temp2 = TempDir::new().unwrap();
        let _r1 = git2::Repository::init(temp1.path()).unwrap();
        let _r2 = git2::Repository::init(temp2.path()).unwrap();

        let mut manager = RepoManager::new();
        let _s1 = manager.open(temp1.path()).unwrap();
        let _s2 = manager.open(temp2.path()).unwrap();

        assert_eq!(manager.get_open_repositories().len(), 2);
        assert!(manager.is_open(temp1.path()));
        assert!(manager.is_open(temp2.path()));

        manager.close_repository(temp1.path()).unwrap();
        assert_eq!(manager.get_open_repositories().len(), 1);
        assert!(!manager.is_open(temp1.path()));
        assert!(manager.is_open(temp2.path()));
    }
}
