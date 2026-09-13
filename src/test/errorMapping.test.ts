import { describe, it, expect } from "vitest";
import { mapGitError } from "../utils/errorMapping";

describe("mapGitError utility", () => {
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