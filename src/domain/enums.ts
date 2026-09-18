/**
 * Hằng số cho các chuỗi mà backend Rust và GitHub API trả về.
 *
 * Dùng `as const` thay vì `enum` của TypeScript: enum sinh runtime code,
 * còn as const chỉ là dữ liệu thuần và suy ra type chính xác hơn.
 *
 * Giá trị PHẢI khớp đúng chuỗi backend trả về — đổi ở đây mà không đổi
 * phía Rust sẽ gây lỗi lúc chạy.
 */

/**
 * Loại thay đổi của một file trong diff (Git diff).
 * Nguồn: bindings.ts FileChange.change_type từ src-tauri/src/read/diff.rs
 *
 * CẢNH BÁO: GitHub API dùng từ vựng khác cho cùng khái niệm.
 * PullRequestFileItem.status ở bindings.ts:462 dùng "removed" thay vì "deleted".
 * KHÔNG dùng CHANGE_TYPE để so sánh với GitHub status — chúng KHÔNG khớp.
 */
export const CHANGE_TYPE = {
  ADDED: "added",
  MODIFIED: "modified",
  DELETED: "deleted",
  RENAMED: "renamed",
} as const;
export type ChangeType = (typeof CHANGE_TYPE)[keyof typeof CHANGE_TYPE];

/** Trạng thái pull request. Nguồn: bindings.ts PullRequestState */
export const PR_STATE = {
  OPEN: "open",
  CLOSED: "closed",
  ALL: "all",
} as const;
export type PullRequestState = (typeof PR_STATE)[keyof typeof PR_STATE];

/** Trạng thái CI check. Nguồn: bindings.ts CheckStatus */
export const CHECK_STATUS = {
  SUCCESS: "success",
  FAILURE: "failure",
  IN_PROGRESS: "in_progress",
  QUEUED: "queued",
  NEUTRAL: "neutral",
} as const;
export type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];

/** Phạm vi cấu hình Git. Nguồn: bindings.ts ConfigScope */
export const CONFIG_SCOPE = {
  GLOBAL: "global",
  LOCAL: "local",
} as const;
export type ConfigScope = (typeof CONFIG_SCOPE)[keyof typeof CONFIG_SCOPE];

/** Màn hình đang hiển thị trong một tab. Nguồn: types/tab.ts ScreenType */
export const SCREEN_TYPE = {
  HISTORY: "history",
  CHANGES: "changes",
  CONFLICT: "conflict",
} as const;
export type ScreenType = (typeof SCREEN_TYPE)[keyof typeof SCREEN_TYPE];
