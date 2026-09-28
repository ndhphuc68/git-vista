use crate::error::AppError;
use crate::events::emit_repo_changed;
use crate::exec::commit_actions::{self, CommitActionResult};

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
