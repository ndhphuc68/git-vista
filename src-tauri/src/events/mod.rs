use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Emitter};
use tauri_specta::Event;

/// Channel the frontend subscribes to (`listenToRepoChanged` in `src/ipc/client.ts`).
pub const REPO_CHANGED_EVENT: &str = "repo-changed";

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct RepoChangedPayload {
    pub repo_path: String,
    pub reason: String,
    pub timestamp_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct TaskProgressPayload {
    pub task_id: String,
    pub progress_percent: u32,
    pub status_text: String,
}

/// Builds the payload for a `repo-changed` event, stamped with the current time.
pub fn repo_changed_payload(repo_path: &str, reason: &str) -> RepoChangedPayload {
    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    RepoChangedPayload {
        repo_path: repo_path.to_string(),
        reason: reason.to_string(),
        timestamp_ms,
    }
}

/// Tells the frontend that `repo_path` changed so it can refetch that repo's queries.
///
/// Every command that mutates a repository goes through this one function, so the
/// payload shape cannot drift per command. Before it existed, nine private copies
/// had grown two signatures and two payload shapes, and the frontend's
/// `payload.repo_path` lookup silently missed the ones that did not match.
///
/// Emit failures are ignored: the mutation already succeeded, and a missed refresh
/// is recovered by the file watcher or the next manual refresh.
pub fn emit_repo_changed(app: &AppHandle, repo_path: &str, reason: &str) {
    let _ = app.emit(REPO_CHANGED_EVENT, repo_changed_payload(repo_path, reason));
}
