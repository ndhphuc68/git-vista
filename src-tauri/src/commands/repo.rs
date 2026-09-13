use crate::error::AppError;
use crate::repo::{RecentRepoEntry, RepoManager, RepoSummary};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

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

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: String, reason: String) {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let payload = crate::events::RepoChangedPayload {
        repo_path,
        reason,
        timestamp_ms: now,
    };
    let _ = app.emit("repo-changed", payload);
}

pub fn open_repository_internal(path: String) -> Result<RepoSummary, AppError> {
    with_manager(|m| m.open(path))
}

#[tauri::command]
#[specta::specta]
pub fn open_repository(app: tauri::AppHandle, path: String) -> Result<RepoSummary, AppError> {
    with_manager(|m| {
        let summary = m.open(&path)?;
        let app_clone = app.clone();
        let repo_path = summary.path.clone();
        let _ = m.start_watcher(move |reason| {
            emit_repo_changed(&app_clone, repo_path.clone(), reason);
        });
        Ok(summary)
    })
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

#[tauri::command]
#[specta::specta]
pub fn get_repo_status(repo_path: String) -> Result<crate::read::status::RepoStatusResult, AppError> {
    crate::read::status::get_repo_status(repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn get_working_file_diff(
    repo_path: String,
    file_path: String,
    is_staged: bool,
) -> Result<crate::read::diff::FileDiffResult, AppError> {
    crate::read::status::get_working_file_diff(repo_path, &file_path, is_staged)
}

#[tauri::command]
#[specta::specta]
pub fn stage_file(
    app: tauri::AppHandle,
    repo_path: String,
    file_path: String,
) -> Result<(), AppError> {
    crate::write::staging::stage_file(&repo_path, &file_path)?;
    emit_repo_changed(&app, repo_path, "stage_file".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn unstage_file(
    app: tauri::AppHandle,
    repo_path: String,
    file_path: String,
) -> Result<(), AppError> {
    crate::write::staging::unstage_file(&repo_path, &file_path)?;
    emit_repo_changed(&app, repo_path, "unstage_file".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn stage_all(app: tauri::AppHandle, repo_path: String) -> Result<(), AppError> {
    crate::write::staging::stage_all(&repo_path)?;
    emit_repo_changed(&app, repo_path, "stage_all".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn unstage_all(app: tauri::AppHandle, repo_path: String) -> Result<(), AppError> {
    crate::write::staging::unstage_all(&repo_path)?;
    emit_repo_changed(&app, repo_path, "unstage_all".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn discard_file_changes(
    app: tauri::AppHandle,
    repo_path: String,
    file_path: String,
) -> Result<(), AppError> {
    crate::write::staging::discard_file_changes(&repo_path, &file_path)?;
    emit_repo_changed(&app, repo_path, "discard_file_changes".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn stage_hunk(
    app: tauri::AppHandle,
    repo_path: String,
    file_path: String,
    hunk_index: u32,
    is_staged: bool,
) -> Result<(), AppError> {
    crate::write::staging::stage_hunk(&repo_path, &file_path, hunk_index, is_staged)?;
    emit_repo_changed(&app, repo_path, "stage_hunk".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn stage_lines(
    app: tauri::AppHandle,
    repo_path: String,
    file_path: String,
    hunk_index: u32,
    line_indices: Vec<u32>,
    is_staged: bool,
) -> Result<(), AppError> {
    crate::write::staging::stage_lines(&repo_path, &file_path, hunk_index, &line_indices, is_staged)?;
    emit_repo_changed(&app, repo_path, "stage_lines".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn create_commit(
    app: tauri::AppHandle,
    repo_path: String,
    summary: String,
    description: Option<String>,
    amend: Option<bool>,
) -> Result<crate::read::diff::CommitDetails, AppError> {
    let details = crate::write::commit::create_commit(
        &repo_path,
        &summary,
        description.as_deref(),
        amend.unwrap_or(false),
    )?;
    emit_repo_changed(&app, repo_path, "create_commit".to_string());
    Ok(details)
}


