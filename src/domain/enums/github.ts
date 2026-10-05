/** Values produced by the GitHub REST API (see src/ipc/githubApi.ts). */

/** Pull request state, as sent to and returned by the GitHub API. */
export const PR_STATE = {
  OPEN: "open",
  CLOSED: "closed",
  ALL: "all",
} as const;
export type PullRequestState = (typeof PR_STATE)[keyof typeof PR_STATE];

/** CI check status after mapping a GitHub check run (see mapCheckRunStatus). */
export const CHECK_STATUS = {
  SUCCESS: "success",
  FAILURE: "failure",
  IN_PROGRESS: "in_progress",
  QUEUED: "queued",
  NEUTRAL: "neutral",
} as const;
export type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];

/** Raw `status` of a GitHub check run, before mapCheckRunStatus maps it. */
export const CHECK_RUN_STATE = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
  QUEUED: "queued",
} as const;

/** Raw `conclusion` of a completed GitHub check run that the app reads. */
export const CHECK_RUN_CONCLUSION = {
  SUCCESS: "success",
} as const;

/** Badge status of a pull request, derived from merged_at, state and draft. */
export const PR_STATUS = {
  MERGED: "merged",
  CLOSED: "closed",
  DRAFT: "draft",
  OPEN: "open",
} as const;
export type PullRequestStatus = (typeof PR_STATUS)[keyof typeof PR_STATUS];

/** `status` of a file in a GitHub pull request. GitHub says "removed", git says "deleted". */
export const PR_FILE_STATUS = {
  ADDED: "added",
  MODIFIED: "modified",
  REMOVED: "removed",
  RENAMED: "renamed",
} as const;
export type PullRequestFileStatus = (typeof PR_FILE_STATUS)[keyof typeof PR_FILE_STATUS];
