import { describe, it, expect } from "vitest";
import { mapGitError } from "../utils/errorMapping";

describe("mapGitError utility", () => {
  it("maps structured backend authentication errors and preserves command details", () => {
    const res = mapGitError({
      type: "CommandFailed",
      message: { code: 128, stderr: "fatal: Authentication failed" },
    });
    expect(res.actionHint).toBeDefined();
    expect(res.rawError).toContain("Authentication failed");
    expect(res.rawError).toContain("128");
  });

  it("extracts structured string messages instead of showing object Object", () => {
    const res = mapGitError({
      type: "InvalidOperation",
      message: "Repository state changed. Review the current commit before undoing.",
    });
    expect(res.message).toBe("Repository state changed. Review the current commit before undoing.");
  });

  it("preserves unknown structured error details", () => {
    expect(mapGitError({ unexpected: "backend detail" }).rawError).toContain("backend detail");
  });
  it("maps authentication failure", () => {
    const res = mapGitError("fatal: Authentication failed for 'https://github.com/...'");
    expect(res.title).toContain("Lỗi xác thực");
    expect(res.actionHint).toBeDefined();
    expect(res.rawError).toContain("Authentication failed");
  });

  it("maps non-fast-forward rejected push", () => {
    const res = mapGitError("error: failed to push some refs ... [rejected] (fetch first)");
    expect(res.title).toContain("commit mới");
    expect(res.actionHint).toContain("Lấy về");
  });

  it("maps checkout conflict / dirty tree", () => {
    const res = mapGitError("CHECKOUT_CONFLICT: local changes would be overwritten");
    expect(res.title).toContain("Xung đột khi chuyển nhánh");
    expect(res.actionHint).toContain("Stash");
  });

  it("tags known errors with their kind so callers can offer a fix", () => {
    expect(mapGitError("CHECKOUT_CONFLICT: dirty").kind).toBe("checkoutConflict");
    expect(mapGitError("something unexpected").kind).toBeUndefined();
  });

  it("maps a conflicting stash pop and says the stash was kept", () => {
    const res = mapGitError("STASH_CONFLICT: conflict with current branch");
    expect(res.kind).toBe("stashConflict");
    expect(res.title).toContain("Xung đột khi áp dụng Stash");
    expect(res.actionHint).toContain("Stash vẫn được giữ lại");
  });

  it("maps operation in progress error", () => {
    const res = mapGitError("OPERATION_IN_PROGRESS: Cannot switch branch");
    expect(res.title).toContain("Tiến trình Git đang dở dang");
    expect(res.actionHint).toBeDefined();
  });

  it("maps a branch held by another worktree", () => {
    const res = mapGitError(
      "BRANCH_IN_WORKTREE: Nhánh 'dev' đang được checkout ở một worktree khác"
    );
    expect(res.title).toBe("Nhánh đang được dùng ở worktree khác");
    expect(res.actionHint).toContain("worktree");
  });

  it.each([
    "failed to create locked file '/repo/.git/index.lock': File exists",
    "the index is locked; this might be due to a concurrent or crashed process",
    "failed to lock file '/repo/.git/refs/heads/dev.lock' for writing",
  ])("maps a lock left by another Git process: %s", (raw) => {
    const res = mapGitError(raw);
    expect(res.title).toBe("Kho lưu trữ đang bị khoá");
    expect(res.actionHint).toContain("index.lock");
  });

  it("maps network connection failure", () => {
    const res = mapGitError("fatal: unable to access: Could not resolve host");
    expect(res.title).toContain("kết nối");
  });

  it("falls back to generic error message for unknown error", () => {
    const res = mapGitError("Some random internal error");
    expect(res.title).toBe("Thao tác không thành công");
    expect(res.message).toBe("Some random internal error");
    expect(res.rawError).toBe("Some random internal error");
  });
});
