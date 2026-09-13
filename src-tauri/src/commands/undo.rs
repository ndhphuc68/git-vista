use tauri::Emitter;

#[tauri::command]
#[specta::specta]
pub async fn undo_commit(app: tauri::AppHandle, repo_path: String) -> Result<(), String> {
    crate::write::undo::undo_commit(&repo_path).map_err(|e| e.to_string())?;
    let _ = app.emit("repo-changed", serde_json::json!({ "path": repo_path }));
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn undo_delete_branch(
    app: tauri::AppHandle,
    repo_path: String,
    branch_name: String,
    commit_id: String,
) -> Result<(), String> {
    crate::write::undo::undo_delete_branch(&repo_path, &branch_name, &commit_id)
        .map_err(|e| e.to_string())?;
    let _ = app.emit("repo-changed", serde_json::json!({ "path": repo_path }));
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn undo_discard_file(
    app: tauri::AppHandle,
    repo_path: String,
    file_path: String,
    backup_content: String,
) -> Result<(), String> {
    crate::write::undo::undo_discard_file(&repo_path, &file_path, &backup_content)
        .map_err(|e| e.to_string())?;
    let _ = app.emit("repo-changed", serde_json::json!({ "path": repo_path }));
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn undo_drop_stash(
    app: tauri::AppHandle,
    repo_path: String,
    stash_commit_id: String,
    message: String,
) -> Result<(), String> {
    crate::write::undo::undo_drop_stash(&repo_path, &stash_commit_id, &message)
        .map_err(|e| e.to_string())?;
    let _ = app.emit("repo-changed", serde_json::json!({ "path": repo_path }));
    Ok(())
}
