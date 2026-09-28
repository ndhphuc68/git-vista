use crate::error::AppError;
use crate::events::emit_repo_changed;

#[tauri::command]
#[specta::specta]
pub async fn undo_commit(
    app: tauri::AppHandle,
    repo_path: String,
    undo_token: String,
) -> Result<(), AppError> {
    crate::write::undo::undo_recorded_commit(&repo_path, &undo_token)?;
    emit_repo_changed(&app, &repo_path, "undo_commit");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn undo_delete_branch(
    app: tauri::AppHandle,
    repo_path: String,
    branch_name: String,
    backup_ref: String,
) -> Result<(), AppError> {
    crate::write::undo::undo_delete_branch(&repo_path, &branch_name, &backup_ref)?;
    emit_repo_changed(&app, &repo_path, "undo_delete_branch");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn undo_drop_stash(
    app: tauri::AppHandle,
    repo_path: String,
    receipt: String,
) -> Result<(), AppError> {
    crate::write::undo::undo_drop_stash(&repo_path, &receipt)?;
    emit_repo_changed(&app, &repo_path, "undo_drop_stash");
    Ok(())
}
