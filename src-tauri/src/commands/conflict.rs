use crate::error::AppError;
use crate::read::conflict::{self as read_conflict, ConflictFileData};
use crate::write::conflict as write_conflict;
use tauri::Emitter;

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: &str, reason: &str) {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let _ = app.emit(
        "repo-changed",
        crate::events::RepoChangedPayload {
            repo_path: repo_path.to_string(),
            reason: reason.to_string(),
            timestamp_ms: now,
        },
    );
}

#[tauri::command]
#[specta::specta]
pub fn get_conflict_file_data(
    repo_path: String,
    file_path: String,
) -> Result<ConflictFileData, AppError> {
    read_conflict::get_conflict_file_data(&repo_path, &file_path)
}

#[tauri::command]
#[specta::specta]
pub fn resolve_conflict_file(
    app: tauri::AppHandle,
    repo_path: String,
    file_path: String,
    resolved_content: String,
    auto_stage: Option<bool>,
) -> Result<(), AppError> {
    write_conflict::resolve_conflict_file(
        &repo_path,
        &file_path,
        &resolved_content,
        auto_stage.unwrap_or(true),
    )?;
    emit_repo_changed(&app, &repo_path, "resolve_conflict");
    Ok(())
}
