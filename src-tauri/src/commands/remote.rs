use crate::error::AppError;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: &str, reason: &str) {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let payload = crate::events::RepoChangedPayload {
        repo_path: repo_path.to_string(),
        reason: reason.to_string(),
        timestamp_ms: now,
    };
    let _ = app.emit("repo-changed", payload);
}

fn emit_task_progress(app: &tauri::AppHandle, task_id: &str, progress_percent: u32, status_text: &str) {
    let payload = crate::events::TaskProgressPayload {
        task_id: task_id.to_string(),
        progress_percent,
        status_text: status_text.to_string(),
    };
    let _ = app.emit("task-progress", payload);
}

fn gen_task_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("task-{}", nanos)
}

#[tauri::command]
#[specta::specta]
pub fn fetch_repo(
    app: tauri::AppHandle,
    repo_path: String,
    remote: Option<String>,
    prune: Option<bool>,
    task_id: Option<String>,
) -> Result<String, AppError> {
    let tid = task_id.unwrap_or_else(gen_task_id);
    let app_clone = app.clone();
    let tid_clone = tid.clone();

    emit_task_progress(&app, &tid, 0, "Đang kết nối để Fetch...");
    let res = crate::exec::remote::git_fetch(
        &repo_path,
        remote.as_deref(),
        prune.unwrap_or(false),
        &tid,
        move |progress_percent, status_text| {
            emit_task_progress(&app_clone, &tid_clone, progress_percent, &status_text);
        },
    )?;

    emit_task_progress(&app, &tid, 100, "Fetch hoàn tất");
    emit_repo_changed(&app, &repo_path, "fetch");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn pull_repo(
    app: tauri::AppHandle,
    repo_path: String,
    remote: Option<String>,
    branch: Option<String>,
    rebase: Option<bool>,
    task_id: Option<String>,
) -> Result<String, AppError> {
    let tid = task_id.unwrap_or_else(gen_task_id);
    let app_clone = app.clone();
    let tid_clone = tid.clone();

    emit_task_progress(&app, &tid, 0, "Đang kéo dữ liệu (Pull)...");
    let res = crate::exec::remote::git_pull(
        &repo_path,
        remote.as_deref(),
        branch.as_deref(),
        rebase,
        &tid,
        move |progress_percent, status_text| {
            emit_task_progress(&app_clone, &tid_clone, progress_percent, &status_text);
        },
    )?;

    emit_task_progress(&app, &tid, 100, "Pull hoàn tất");
    emit_repo_changed(&app, &repo_path, "pull");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn push_repo(
    app: tauri::AppHandle,
    repo_path: String,
    remote: Option<String>,
    branch: Option<String>,
    set_upstream: Option<bool>,
    force: Option<bool>,
    task_id: Option<String>,
) -> Result<String, AppError> {
    let tid = task_id.unwrap_or_else(gen_task_id);
    let app_clone = app.clone();
    let tid_clone = tid.clone();

    emit_task_progress(&app, &tid, 0, "Đang đẩy dữ liệu (Push)...");
    let res = crate::exec::remote::git_push(
        &repo_path,
        remote.as_deref(),
        branch.as_deref(),
        set_upstream.unwrap_or(false),
        force.unwrap_or(false),
        &tid,
        move |progress_percent, status_text| {
            emit_task_progress(&app_clone, &tid_clone, progress_percent, &status_text);
        },
    )?;

    emit_task_progress(&app, &tid, 100, "Push hoàn tất");
    emit_repo_changed(&app, &repo_path, "push");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn clone_repo(
    app: tauri::AppHandle,
    url: String,
    target_dir: String,
    task_id: Option<String>,
) -> Result<String, AppError> {
    let tid = task_id.unwrap_or_else(gen_task_id);
    let app_clone = app.clone();
    let tid_clone = tid.clone();

    emit_task_progress(&app, &tid, 0, "Đang sao chép kho chứa (Clone)...");
    let res = crate::exec::remote::git_clone(
        &url,
        &target_dir,
        &tid,
        move |progress_percent, status_text| {
            emit_task_progress(&app_clone, &tid_clone, progress_percent, &status_text);
        },
    )?;

    emit_task_progress(&app, &tid, 100, "Clone hoàn tất");
    emit_repo_changed(&app, &target_dir, "clone");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn cancel_remote_task(task_id: String) -> Result<(), AppError> {
    crate::exec::cancel_task(&task_id);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn set_repo_pull_rebase(repo_path: String, rebase: bool) -> Result<(), AppError> {
    crate::exec::remote::set_repo_pull_rebase(&repo_path, rebase)
}
