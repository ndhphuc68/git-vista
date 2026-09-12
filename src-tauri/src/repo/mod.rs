//! Module `repo`: Quản lý mở repository, cache phiên, và filesystem watcher.
//! Tuân thủ nguyên tắc Deep Module: ẩn chi tiết cấu trúc .git/ và bộ theo dõi đĩa.

use crate::error::AppError;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct RepoManager {
    current_path: Option<PathBuf>,
}

impl RepoManager {
    pub fn new() -> Self {
        Self { current_path: None }
    }

    pub fn open<P: AsRef<Path>>(&mut self, path: P) -> Result<PathBuf, AppError> {
        let path_ref = path.as_ref();
        // Kiểm tra repo hợp lệ qua libgit2
        let _ = git2::Repository::open(path_ref)?;
        let canonical = path_ref.canonicalize().map_err(AppError::from)?;
        self.current_path = Some(canonical.clone());
        Ok(canonical)
    }

    pub fn current_repo(&self) -> Option<&Path> {
        self.current_path.as_deref()
    }
}

impl Default for RepoManager {
    fn default() -> Self {
        Self::new()
    }
}

