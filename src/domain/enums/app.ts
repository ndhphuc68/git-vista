/** Frontend-only values compared in more than one module. */

/** The screen currently shown in a repo tab. */
export const SCREEN_TYPE = {
  HISTORY: "history",
  CHANGES: "changes",
  CONFLICT: "conflict",
  PULL_REQUESTS: "pull-requests",
} as const;
export type ScreenType = (typeof SCREEN_TYPE)[keyof typeof SCREEN_TYPE];
