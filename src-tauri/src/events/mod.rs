use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

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
