use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct RecentRepoEntry {
    pub path: String,
    pub name: String,
    pub last_opened_at_ms: f64,
}

pub struct RecentRepoStore {
    storage_file: PathBuf,
}

impl RecentRepoStore {
    pub fn new() -> Self {
        let dir = dirs_fallback();
        let _ = fs::create_dir_all(&dir);
        Self {
            storage_file: dir.join("recent_repos.json"),
        }
    }

    pub fn list(&self) -> Vec<RecentRepoEntry> {
        if !self.storage_file.exists() {
            return Vec::new();
        }
        fs::read_to_string(&self.storage_file)
            .ok()
            .and_then(|s| serde_json::from_str::<Vec<RecentRepoEntry>>(&s).ok())
            .unwrap_or_default()
    }

    pub fn record_open(&self, path: &Path, name: &str) -> Result<(), AppError> {
        let mut list = self.list();
        let path_str = path.to_string_lossy().to_string();
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as f64;

        list.retain(|item| item.path != path_str);
        list.insert(
            0,
            RecentRepoEntry {
                path: path_str,
                name: name.to_string(),
                last_opened_at_ms: now,
            },
        );
        if list.len() > 20 {
            list.truncate(20);
        }

        let json = serde_json::to_string_pretty(&list)
            .map_err(|e| AppError::Io(e.to_string()))?;
        fs::write(&self.storage_file, json).map_err(AppError::from)?;
        Ok(())
    }
}

fn dirs_fallback() -> PathBuf {
    std::env::temp_dir().join("visual_git_client_data")
}

