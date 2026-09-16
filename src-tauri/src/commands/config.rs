use crate::error::AppError;
pub use crate::read::config::{ConfigScope, GitConfigDto};

#[tauri::command]
#[specta::specta]
pub fn get_git_config(repo_path: Option<String>) -> Result<GitConfigDto, AppError> {
    crate::read::config::read_git_config(repo_path.as_deref())
}

#[tauri::command]
#[specta::specta]
pub fn set_git_config(
    repo_path: Option<String>,
    scope: ConfigScope,
    key: String,
    value: String,
) -> Result<(), AppError> {
    crate::write::config::write_git_config(repo_path.as_deref(), scope, &key, &value)
}
