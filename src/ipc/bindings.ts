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
  ahead: number;
  behind: number;
  upstream: string | null;
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

export interface RepoSummary {
  path: string;
  name: string;
  is_bare: boolean;
  head_branch: string | null;
  head_commit_id: string | null;
}

export interface RecentRepoEntry {
  path: string;
  name: string;
  last_opened_at_ms: number;
}

export interface BranchItem {
  name: string;
  is_head: boolean;
  target_commit_id: string;
  upstream: string | null;
  ahead: number;
  behind: number;
}

export interface BranchListResult {
  current_branch: string | null;
  is_detached: boolean;
  local: BranchItem[];
  remote: BranchItem[];
  tags: string[];
}

export interface GraphEdge {
  from_col: number;
  to_col: number;
  edge_type: string;
  color_index: number;
}

export interface RefBadge {
  name: string;
  ref_type: string;
}

export interface GraphCommitNode {
  id: string;
  short_id: string;
  summary: string;
  author_name: string;
  author_email: string;
  timestamp_sec: number;
  parent_ids: string[];
  col: number;
  color_index: number;
  lines: GraphEdge[];
  refs: RefBadge[];
}

export interface CommitGraphPage {
  commits: GraphCommitNode[];
  has_more: boolean;
  total_count: number;
}

export interface CommitChangedFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
}

export interface CommitDetails {
  id: string;
  full_message: string;
  author_name: string;
  author_email: string;
  author_timestamp_sec: number;
  parent_ids: string[];
  files: CommitChangedFile[];
  total_additions: number;
  total_deletions: number;
}

export interface DiffLine {
  line_type: string;
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface FileDiffResult {
  file_path: string;
  status: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export type FileStatus = "Modified" | "New" | "Deleted" | "Renamed" | "Typechange";

export interface StatusFileItem {
  path: string;
  status: FileStatus;
  is_staged: boolean;
  old_path: string | null;
}

export interface RepoStatusResult {
  staged: StatusFileItem[];
  unstaged: StatusFileItem[];
  untracked: StatusFileItem[];
}

export interface StashItem {
  index: number;
  message: string;
  commit_id: string;
  created_at: number;
}

export interface RepoStateInfo {
  state: string;
  is_in_progress: boolean;
  head_name: string;
  target_name: string | null;
  conflict_count: number;
}

export interface MergeResult {
  success: boolean;
  status: string;
  output: string;
}

export interface RebaseResult {
  success: boolean;
  status: string;
  output: string;
}


