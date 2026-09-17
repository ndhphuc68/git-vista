use crate::error::AppError;
use crate::exec::commit_actions::{self, CommitActionResult};
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
pub fn cherry_pick_commit(
    app: tauri::AppHandle,
    repo_path: String,
    commit_id: String,
    auto_commit: Option<bool>,
) -> Result<CommitActionResult, AppError> {
    let res = commit_actions::git_cherry_pick(&repo_path, &commit_id, auto_commit.unwrap_or(true))?;
    emit_repo_changed(&app, &repo_path, "cherry_pick_commit");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn revert_commit(
    app: tauri::AppHandle,
    repo_path: String,
    commit_id: String,
    auto_commit: Option<bool>,
) -> Result<CommitActionResult, AppError> {
    let res = commit_actions::git_revert(&repo_path, &commit_id, auto_commit.unwrap_or(true))?;
    emit_repo_changed(&app, &repo_path, "revert_commit");
    Ok(res)
}
