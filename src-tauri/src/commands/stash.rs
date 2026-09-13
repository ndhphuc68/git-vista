use crate::error::AppError;
use crate::write::stash::{self, StashItem};
use tauri::Emitter;

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: &str, reason: &str) {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let _ = app.emit("repo-changed", crate::events::RepoChangedPayload {
        repo_path: repo_path.to_string(),
        reason: reason.to_string(),
        timestamp_ms: now,
    });
}

#[tauri::command]
#[specta::specta]
pub fn get_stashes(repo_path: String) -> Result<Vec<StashItem>, AppError> {
    stash::get_stashes(&repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn save_stash(
    app: tauri::AppHandle,
    repo_path: String,
    message: Option<String>,
    include_untracked: Option<bool>,
) -> Result<String, AppError> {
    let commit_id = stash::save_stash(&repo_path, message.as_deref(), include_untracked.unwrap_or(false))?;
    emit_repo_changed(&app, &repo_path, "save_stash");
    Ok(commit_id)
}

#[tauri::command]
#[specta::specta]
pub fn apply_stash(app: tauri::AppHandle, repo_path: String, index: usize) -> Result<(), AppError> {
    stash::apply_stash(&repo_path, index)?;
    emit_repo_changed(&app, &repo_path, "apply_stash");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn pop_stash(app: tauri::AppHandle, repo_path: String, index: usize) -> Result<(), AppError> {
    stash::pop_stash(&repo_path, index)?;
    emit_repo_changed(&app, &repo_path, "pop_stash");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn drop_stash(app: tauri::AppHandle, repo_path: String, index: usize) -> Result<(), AppError> {
    stash::drop_stash(&repo_path, index)?;
    emit_repo_changed(&app, &repo_path, "drop_stash");
    Ok(())
}
