/**
 * Typesafe IPC bindings cho Visual Git Client
 * Tự động đồng bộ với Rust backend qua specta / tauri-specta.
 */

export interface SystemInfo {
  os: string;
  arch: string;
  git_version: string;
  app_version: string;
}

export interface RepoHeadInfo {
  branch_name: string | null;
  head_commit_id: string | null;
  is_detached: boolean;
}

export interface RepoChangedPayload {
  repo_path: string;
  reason: string;
  timestamp_ms: number;
}

export interface TaskProgressPayload {
  task_id: string;
  progress_percent: number;
  status_text: string;
}

export type AppError =
  | { type: "Git"; message: string }
  | { type: "Io"; message: string }
  | { type: "NotFound"; message: string }
  | { type: "CommandFailed"; message: { code: number; stderr: string } }
  | { type: "InvalidOperation"; message: string };

