/**
 * Constants for the string values returned by the Rust backend and the GitHub API.
 *
 * Uses `as const` instead of a TypeScript `enum`: an enum generates runtime
 * code, whereas `as const` is plain data and infers a more precise type.
 *
 * Values MUST match the backend's strings exactly — changing them here
 * without changing the Rust side will cause runtime bugs.
 */

/**
 * The kind of change a file underwent in a diff (Git diff).
 * Source: bindings.ts FileChange.change_type, from src-tauri/src/read/diff.rs
 *
 * WARNING: the GitHub API uses different wording for the same concept.
 * PullRequestFileItem.status in bindings.ts:462 uses "removed" instead of "deleted".
 * Do NOT use CHANGE_TYPE to compare against a GitHub status — they do NOT match.
 */
export const CHANGE_TYPE = {
  ADDED: "added",
  MODIFIED: "modified",
  DELETED: "deleted",
  RENAMED: "renamed",
} as const;
export type ChangeType = (typeof CHANGE_TYPE)[keyof typeof CHANGE_TYPE];

/** Pull request state. Source: bindings.ts PullRequestState */
export const PR_STATE = {
  OPEN: "open",
  CLOSED: "closed",
  ALL: "all",
} as const;
export type PullRequestState = (typeof PR_STATE)[keyof typeof PR_STATE];

/** CI check status. Source: bindings.ts CheckStatus */
export const CHECK_STATUS = {
  SUCCESS: "success",
  FAILURE: "failure",
  IN_PROGRESS: "in_progress",
  QUEUED: "queued",
  NEUTRAL: "neutral",
} as const;
export type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];

/** Git config scope. Source: bindings.ts ConfigScope */
export const CONFIG_SCOPE = {
  GLOBAL: "global",
  LOCAL: "local",
} as const;
export type ConfigScope = (typeof CONFIG_SCOPE)[keyof typeof CONFIG_SCOPE];

/** The screen currently shown in a tab. Source: types/tab.ts ScreenType */
export const SCREEN_TYPE = {
  HISTORY: "history",
  CHANGES: "changes",
  CONFLICT: "conflict",
} as const;
export type ScreenType = (typeof SCREEN_TYPE)[keyof typeof SCREEN_TYPE];
