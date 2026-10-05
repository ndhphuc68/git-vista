/** Frontend-only values compared in more than one module. */

/** The screen currently shown in a repo tab. */
export const SCREEN_TYPE = {
  HISTORY: "history",
  CHANGES: "changes",
  CONFLICT: "conflict",
  PULL_REQUESTS: "pull-requests",
} as const;
export type ScreenType = (typeof SCREEN_TYPE)[keyof typeof SCREEN_TYPE];

/** Kind of window tab: the home screen or an open repository. */
export const TAB_TYPE = {
  HOME: "home",
  REPO: "repo",
} as const;
export type TabType = (typeof TAB_TYPE)[keyof typeof TAB_TYPE];
