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

/**
 * Scope selected in the settings modal. The UI says "repo"; the matching git
 * config scope is CONFIG_SCOPE.LOCAL.
 */
export const SETTINGS_SCOPE = {
  GLOBAL: "global",
  REPO: "repo",
} as const;
export type SettingsScope = (typeof SETTINGS_SCOPE)[keyof typeof SETTINGS_SCOPE];

/** Pull strategy for a repo; "inherit" follows the global pull.rebase setting. */
export const PULL_STRATEGY = {
  INHERIT: "inherit",
  MERGE: "merge",
  REBASE: "rebase",
} as const;
export type PullStrategy = (typeof PULL_STRATEGY)[keyof typeof PULL_STRATEGY];
