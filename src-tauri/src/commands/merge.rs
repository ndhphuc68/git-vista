use crate::error::AppError;
use crate::events::emit_repo_changed;
use crate::exec::merge::{self, MergeResult, RebaseResult};
use crate::read::state::{self, RepoStateInfo};

#[tauri::command]
#[specta::specta]
pub fn get_repo_state(repo_path: String) -> Result<RepoStateInfo, AppError> {
    state::get_repo_state(&repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn merge_branch(
    app: tauri::AppHandle,
    repo_path: String,
    target_branch: String,
    no_ff: Option<bool>,
) -> Result<MergeResult, AppError> {
    let res = merge::git_merge(&repo_path, &target_branch, no_ff.unwrap_or(false))?;
    emit_repo_changed(&app, &repo_path, "merge_branch");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn rebase_branch(
    app: tauri::AppHandle,
    repo_path: String,
    upstream_branch: String,
) -> Result<RebaseResult, AppError> {
    let res = merge::git_rebase(&repo_path, &upstream_branch)?;
    emit_repo_changed(&app, &repo_path, "rebase_branch");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn abort_in_progress(
    app: tauri::AppHandle,
    repo_path: String,
    operation: String,
) -> Result<(), AppError> {
    merge::git_abort_operation(&repo_path, &operation)?;
    emit_repo_changed(&app, &repo_path, "abort_in_progress");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn continue_in_progress(
    app: tauri::AppHandle,
    repo_path: String,
    operation: String,
) -> Result<(), AppError> {
    merge::git_continue_operation(&repo_path, &operation)?;
    emit_repo_changed(&app, &repo_path, "continue_in_progress");
    Ok(())
}
