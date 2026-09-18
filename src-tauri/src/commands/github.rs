use crate::error::AppError;
use crate::exec::github_checkout::{
    checkout_pull_request as do_checkout_pull_request, CheckoutPrResult,
};
use crate::read::github::{get_github_repo_info as read_github_repo_info, GitHubRepoInfo};
use crate::write::github_config::{
    get_github_token as read_github_token, remove_github_token as do_remove_github_token,
    save_github_token as do_save_github_token,
};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: &str, reason: &str) {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let payload = crate::events::RepoChangedPayload {
        repo_path: repo_path.to_string(),
        reason: reason.to_string(),
        timestamp_ms: now,
    };
    let _ = app.emit("repo-changed", payload);
}

#[tauri::command]
#[specta::specta]
pub fn get_github_repo_info(repo_path: String) -> Result<GitHubRepoInfo, AppError> {
    read_github_repo_info(&repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn get_github_token() -> Result<Option<String>, AppError> {
    read_github_token()
}

#[tauri::command]
#[specta::specta]
pub fn save_github_token(token: String) -> Result<(), AppError> {
    do_save_github_token(&token)
}

#[tauri::command]
#[specta::specta]
pub fn remove_github_token() -> Result<(), AppError> {
    do_remove_github_token()
}

#[tauri::command]
#[specta::specta]
pub fn checkout_pull_request(
    app: tauri::AppHandle,
    repo_path: String,
    pr_number: u64,
) -> Result<CheckoutPrResult, AppError> {
    let result = do_checkout_pull_request(&repo_path, pr_number)?;
    emit_repo_changed(&app, &repo_path, "checkout_pull_request");
    Ok(result)
}
