use crate::error::AppError;
use crate::events::emit_repo_changed;
use crate::read::TagItem;

#[tauri::command]
#[specta::specta]
pub fn get_tags(repo_path: String) -> Result<Vec<TagItem>, AppError> {
    crate::read::tags::list_repo_tags(repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn create_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
    target_commit: String,
    message: Option<String>,
) -> Result<(), AppError> {
    crate::write::tags::create_tag(&repo_path, &name, &target_commit, message.as_deref())?;
    emit_repo_changed(&app, &repo_path, "create_tag");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn delete_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
    delete_remote: Option<bool>,
) -> Result<(), AppError> {
    crate::write::tags::delete_tag(&repo_path, &name, delete_remote.unwrap_or(false))?;
    emit_repo_changed(&app, &repo_path, "delete_tag");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn checkout_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
) -> Result<(), AppError> {
    crate::write::tags::checkout_tag(&repo_path, &name)?;
    emit_repo_changed(&app, &repo_path, "checkout_tag");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn push_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
    remote_name: Option<String>,
) -> Result<(), AppError> {
    crate::write::tags::push_tag(&repo_path, &name, remote_name.as_deref())?;
    emit_repo_changed(&app, &repo_path, "push_tag");
    Ok(())
}
