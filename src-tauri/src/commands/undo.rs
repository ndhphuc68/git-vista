use tauri::Emitter;

#[tauri::command]
#[specta::specta]
pub async fn undo_commit(
    app: tauri::AppHandle,
    repo_path: String,
    undo_token: String,
) -> Result<(), String> {
    crate::write::undo::undo_recorded_commit(&repo_path, &undo_token).map_err(|e| e.to_string())?;
    let _ = app.emit(
        "repo-changed",
        crate::events::RepoChangedPayload {
            repo_path,
            reason: "undo_commit".into(),
            timestamp_ms: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as f64,
        },
    );
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn undo_delete_branch(
    app: tauri::AppHandle,
    repo_path: String,
    branch_name: String,
    backup_ref: String,
) -> Result<(), String> {
    crate::write::undo::undo_delete_branch(&repo_path, &branch_name, &backup_ref)
        .map_err(|e| e.to_string())?;
    let _ = app.emit("repo-changed", serde_json::json!({ "path": repo_path }));
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn undo_drop_stash(
    app: tauri::AppHandle,
    repo_path: String,
    receipt: String,
) -> Result<(), String> {
    crate::write::undo::undo_drop_stash(&repo_path, &receipt).map_err(|e| e.to_string())?;
    let _ = app.emit("repo-changed", serde_json::json!({ "path": repo_path }));
    Ok(())
}
