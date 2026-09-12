use crate::error::AppError;
use crate::repo::{RecentRepoEntry, RepoManager, RepoSummary};
use std::sync::Mutex;

static REPO_MANAGER: Mutex<Option<RepoManager>> = Mutex::new(None);

fn with_manager<F, R>(f: F) -> R
where
    F: FnOnce(&mut RepoManager) -> R,
{
    let mut lock = REPO_MANAGER.lock().unwrap();
    if lock.is_none() {
        *lock = Some(RepoManager::new());
    }
    f(lock.as_mut().unwrap())
}

#[tauri::command]
#[specta::specta]
pub fn open_repository(path: String) -> Result<RepoSummary, AppError> {
    with_manager(|m| m.open(path))
}

#[tauri::command]
#[specta::specta]
pub fn get_recent_repos() -> Result<Vec<RecentRepoEntry>, AppError> {
    Ok(with_manager(|m| m.list_recent()))
}

#[tauri::command]
#[specta::specta]
pub fn select_repo_folder() -> Result<Option<String>, AppError> {
    let picked = rfd::FileDialog::new()
        .set_title("Chọn thư mục Git Repository")
        .pick_folder();
    Ok(picked.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
#[specta::specta]
pub fn get_branches(repo_path: String) -> Result<crate::read::BranchListResult, AppError> {
    crate::read::list_repo_branches(repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn get_commit_graph(
    repo_path: String,
    offset: u32,
    limit: u32,
) -> Result<crate::read::CommitGraphPage, AppError> {
    crate::read::get_repo_commit_graph(repo_path, offset, limit)
}

#[tauri::command]
#[specta::specta]
pub fn get_commit_details(
    repo_path: String,
    commit_id: String,
) -> Result<crate::read::CommitDetails, AppError> {
    crate::read::get_commit_info(repo_path, &commit_id)
}

#[tauri::command]
#[specta::specta]
pub fn get_commit_file_diff(
    repo_path: String,
    commit_id: String,
    file_path: String,
) -> Result<crate::read::FileDiffResult, AppError> {
    crate::read::get_file_diff(repo_path, &commit_id, &file_path)
}

