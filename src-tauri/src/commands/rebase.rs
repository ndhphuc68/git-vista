use crate::error::AppError;
use crate::read::rebase::{get_rebase_commits as read_rebase_commits, InteractiveRebaseResult, RebaseCommitItem, RebasePlanStep};
use tauri::{AppHandle, Emitter};

fn emit_repo_changed(app: &AppHandle, repo_path: String, reason: String) {
    let payload = serde_json::json!({
        "repo_path": repo_path,
        "reason": reason,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    });
    let _ = app.emit("repo-changed", payload);
}

#[tauri::command]
#[specta::specta]
pub fn get_rebase_commits(
    repo_path: String,
    base_commit_id: String,
) -> Result<Vec<RebaseCommitItem>, AppError> {
    read_rebase_commits(&repo_path, &base_commit_id)
}

#[tauri::command]
#[specta::specta]
pub fn execute_interactive_rebase(
    app: AppHandle,
    repo_path: String,
    base_commit_id: String,
    steps: Vec<RebasePlanStep>,
    auto_stash: Option<bool>,
) -> Result<InteractiveRebaseResult, AppError> {
    let res = crate::exec::rebase::execute_interactive_rebase(
        &repo_path,
        &base_commit_id,
        steps,
        auto_stash.unwrap_or(false),
    )?;

    emit_repo_changed(&app, repo_path, "execute_interactive_rebase".to_string());
    Ok(res)
}
