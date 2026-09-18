use crate::error::AppError;
use crate::read::github::{get_github_repo_info as read_github_repo_info, GitHubRepoInfo};
use crate::write::github_config::{
    get_github_token as read_github_token, remove_github_token as do_remove_github_token,
    save_github_token as do_save_github_token,
};

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
