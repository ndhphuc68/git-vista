use crate::error::AppError;
use crate::read::compare::{
    get_compare_file_diff as read_compare_file_diff,
    get_compare_summary as read_compare_summary, CompareMode, CompareSummary,
};
use crate::read::diff::FileDiffResult;

#[tauri::command]
#[specta::specta]
pub fn compare_commits(
    repo_path: String,
    base_rev: String,
    target_rev: String,
    mode: CompareMode,
) -> Result<CompareSummary, AppError> {
    read_compare_summary(&repo_path, &base_rev, &target_rev, mode)
}

#[tauri::command]
#[specta::specta]
pub fn get_compare_file_diff(
    repo_path: String,
    base_rev: String,
    target_rev: String,
    file_path: String,
    mode: CompareMode,
    ignore_ws: Option<bool>,
) -> Result<FileDiffResult, AppError> {
    read_compare_file_diff(
        &repo_path,
        &base_rev,
        &target_rev,
        &file_path,
        mode,
        ignore_ws.unwrap_or(false),
    )
}
