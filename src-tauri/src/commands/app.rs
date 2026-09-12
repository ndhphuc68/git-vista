use crate::error::AppError;
use crate::events::RepoChangedPayload;
use crate::exec::get_git_cli_version;
use crate::read::{get_head_info, RepoHeadInfo};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub git_version: String,
    pub app_version: String,
}

#[tauri::command]
#[specta::specta]
pub fn ping(msg: String) -> String {
    format!("Pong từ Rust backend: '{}' lúc {:?}", msg, std::time::SystemTime::now())
}

#[tauri::command]
#[specta::specta]
pub fn get_system_info() -> Result<SystemInfo, AppError> {
    let git_ver = get_git_cli_version().unwrap_or_else(|_| "Git CLI không khả dụng".to_string());
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        git_version: git_ver,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[tauri::command]
#[specta::specta]
pub fn get_repo_head_info(repo_path: String) -> Result<RepoHeadInfo, AppError> {
    get_head_info(repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn simulate_repo_change(app: tauri::AppHandle, repo_path: String) -> Result<(), AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;

    let payload = RepoChangedPayload {
        repo_path,
        reason: "Simulated trigger for M0 verification".to_string(),
        timestamp_ms: now,
    };

    app.emit("repo-changed", payload)
        .map_err(|e| AppError::InvalidOperation(e.to_string()))?;

    Ok(())
}

