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
  undo_token?: string | null;
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

export type FileStatus = "Modified" | "New" | "Deleted" | "Renamed" | "Typechange" | "Conflicted";

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
  conflicted: StatusFileItem[];
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

export interface CommitActionResult {
  success: boolean;
  status: "Committed" | "Staged" | "Conflict" | "Error" | string;
  new_commit_id?: string | null;
  undo_token?: string | null;
  output: string;
}


export interface ConflictHunk {
  id: string;
  is_conflict: boolean;
  content: string | null;
  ours: string | null;
  theirs: string | null;
  base: string | null;
  ours_label: string | null;
  theirs_label: string | null;
}

export interface ConflictFileData {
  file_path: string;
  total_conflicts: number;
  hunks: ConflictHunk[];
}

export type ConfigScope = "global" | "local";

export interface GitConfigDto {
  userName: string | null;
  userNameSource: ConfigScope | null;
  userEmail: string | null;
  userEmailSource: ConfigScope | null;
  defaultBranch: string | null;
  pullRebase: boolean | null;
  gpgSign?: boolean | null;
  gpgKey?: string | null;
  fetchPrune?: boolean | null;
  rebaseAutostash?: boolean | null;
}

export interface TagItem {
  name: string;
  target_commit_id: string;
  short_commit_id: string;
  commit_summary: string;
  is_annotated: boolean;
  message?: string | null;
  tagger_name?: string | null;
  tagger_email?: string | null;
  timestamp_sec?: number | null;
}

export interface BlameLine {
  line_no: number;
  content: string;
  commit_id: string;
  short_id: string;
  summary: string;
  author_name: string;
  author_email: string;
  timestamp_sec: number;
  is_hunk_start: boolean;
}

export interface FileBlameResult {
  file_path: string;
  commit_id: string | null;
  lines: BlameLine[];
  total_lines: number;
}

export interface FileHistoryItem {
  commit_id: string;
  short_id: string;
  summary: string;
  author_name: string;
  author_email: string;
  timestamp_sec: number;
  change_type: string; // "added" | "modified" | "deleted"
}

export interface FileHistoryResult {
  file_path: string;
  commits: FileHistoryItem[];
  has_more: boolean;
  total_count: number;
}

export interface RemoteItem {
  name: string;
  fetch_url: string | null;
  push_url: string | null;
  branch_count: number;
  is_default: boolean;
}

export interface PruneResult {
  remote: string;
  pruned_branches: string[];
  message: string;
}

export interface Commands {
  get_commit_file_diff: (
    repoPath: string,
    commitId: string,
    filePath: string,
    ignoreWhitespace?: boolean | null
  ) => Promise<FileDiffResult>;
  get_working_file_diff: (
    repoPath: string,
    filePath: string,
    isStaged: boolean,
    ignoreWhitespace?: boolean | null
  ) => Promise<FileDiffResult>;
  get_file_blame: (
    repoPath: string,
    filePath: string,
    commitId?: string | null
  ) => Promise<FileBlameResult>;
  get_file_history: (
    repoPath: string,
    filePath: string,
    offset?: number | null,
    limit?: number | null
  ) => Promise<FileHistoryResult>;
}
