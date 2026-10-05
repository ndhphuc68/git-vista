/**
 * Values produced by the Rust backend. They MUST match the backend's strings
 * exactly; changing one here without changing Rust causes runtime bugs.
 */

/**
 * The kind of change a file underwent in a diff (Git diff).
 * Source: bindings.ts FileChange.change_type, from src-tauri/src/read/diff.rs
 *
 * WARNING: the GitHub API uses different wording for the same concept.
 * PullRequestFileItem.status uses "removed" instead of "deleted".
 * Do NOT use CHANGE_TYPE to compare against a GitHub status; use PR_FILE_STATUS.
 */
export const CHANGE_TYPE = {
  ADDED: "added",
  MODIFIED: "modified",
  DELETED: "deleted",
  RENAMED: "renamed",
} as const;
export type ChangeType = (typeof CHANGE_TYPE)[keyof typeof CHANGE_TYPE];

/** Git config scope. Source: bindings.ts ConfigScope */
export const CONFIG_SCOPE = {
  GLOBAL: "global",
  LOCAL: "local",
} as const;
export type ConfigScope = (typeof CONFIG_SCOPE)[keyof typeof CONFIG_SCOPE];
