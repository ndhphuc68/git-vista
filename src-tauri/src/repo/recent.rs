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
        let dir = app_data_dir();
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

fn app_data_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA").or_else(|| std::env::var_os("APPDATA")) {
            return PathBuf::from(local_app_data).join("visual_git_client");
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home)
                .join("Library")
                .join("Application Support")
                .join("visual_git_client");
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(xdg) = std::env::var_os("XDG_DATA_HOME") {
            return PathBuf::from(xdg).join("visual_git_client");
        } else if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home)
                .join(".local")
                .join("share")
                .join("visual_git_client");
        }
    }

    std::env::temp_dir().join("visual_git_client_data")
}

