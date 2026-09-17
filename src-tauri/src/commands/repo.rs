use crate::error::AppError;
use crate::repo::{RecentRepoEntry, RepoManager, RepoSummary};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

static REPO_MANAGER: Mutex<Option<RepoManager>> = Mutex::new(None);

/// How long a safety backup ref stays recoverable. Far longer than any undo
/// toast lives, so pruning can never strip a ref the UI still offers.
const BACKUP_RETENTION_DAYS: u64 = 30;

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
    with_manager(|m| {
        let summary = m.open(path)?;
        prune_backups(&summary.path);
        Ok(summary)
    })
}

/// Safety refs accumulate on every risky operation; reclaim the expired ones
/// when a repository is opened rather than letting them grow without bound.
/// Best-effort: opening must not fail because pruning did.
fn prune_backups(repo_path: &str) {
    if let Ok(repo) = git2::Repository::open(repo_path) {
        let _ = crate::write::backup::prune_expired_backups(&repo, BACKUP_RETENTION_DAYS);
    }
}

#[tauri::command]
#[specta::specta]
pub fn open_repository(app: tauri::AppHandle, path: String) -> Result<RepoSummary, AppError> {
    with_manager(|m| {
        let summary = m.open(&path)?;
        prune_backups(&summary.path);
        let app_clone = app.clone();
        let repo_path = summary.path.clone();
        let _ = m.start_watcher_for(&summary.path, move |reason| {
            emit_repo_changed(&app_clone, repo_path.clone(), reason);
        });
        Ok(summary)
    })
}

#[tauri::command]
#[specta::specta]
pub fn close_repository(path: String) -> Result<(), AppError> {
    with_manager(|m| m.close_repository(&path))
}

#[tauri::command]
#[specta::specta]
pub fn get_open_repositories() -> Result<Vec<RepoSummary>, AppError> {
    Ok(with_manager(|m| m.get_open_repositories()))
}

#[tauri::command]
#[specta::specta]
pub fn get_recent_repos() -> Result<Vec<RecentRepoEntry>, AppError> {
    Ok(with_manager(|m| m.list_recent()))
}

#[tauri::command]
#[specta::specta]
pub fn clear_recent_repos() -> Result<(), AppError> {
    with_manager(|m| m.clear_recent());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn remove_recent_repo(path: String) -> Result<(), AppError> {
    with_manager(|m| m.remove_recent(&path));
    Ok(())
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
) -> Result<String, AppError> {
    let token = crate::write::discard::discard_with_backup(&repo_path, &file_path)?;
    emit_repo_changed(&app, repo_path, "discard_file_changes".to_string());
    Ok(token)
}

#[tauri::command]
#[specta::specta]
pub fn restore_discard(
    app: tauri::AppHandle,
    repo_path: String,
    token: String,
) -> Result<(), AppError> {
    crate::write::discard::restore_discard(&repo_path, &token)?;
    emit_repo_changed(&app, repo_path, "restore_discard".to_string());
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

#[tauri::command]
#[specta::specta]
pub fn create_branch(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
    target_commit: Option<String>,
    checkout: Option<bool>,
) -> Result<(), AppError> {
    crate::write::branch::create_branch(
        &repo_path,
        &name,
        target_commit.as_deref(),
        checkout.unwrap_or(false),
    )?;
    emit_repo_changed(&app, repo_path, "create_branch".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn checkout_branch(
    app: tauri::AppHandle,
    repo_path: String,
    branch_name: String,
) -> Result<(), AppError> {
    crate::write::branch::checkout_branch(&repo_path, &branch_name)?;
    emit_repo_changed(&app, repo_path, "checkout_branch".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn rename_branch(
    app: tauri::AppHandle,
    repo_path: String,
    old_name: String,
    new_name: String,
) -> Result<(), AppError> {
    crate::write::branch::rename_branch(&repo_path, &old_name, &new_name)?;
    emit_repo_changed(&app, repo_path, "rename_branch".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn delete_branch(
    app: tauri::AppHandle,
    repo_path: String,
    branch_name: String,
    force: Option<bool>,
) -> Result<String, AppError> {
    let backup_ref = crate::write::branch::delete_branch(
        &repo_path,
        &branch_name,
        force.unwrap_or(false),
    )?;
    emit_repo_changed(&app, repo_path, "delete_branch".to_string());
    Ok(backup_ref)
}



