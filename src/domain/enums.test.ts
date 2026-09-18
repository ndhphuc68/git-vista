import { describe, it, expect } from "vitest";
import { CHANGE_TYPE, PR_STATE, CHECK_STATUS, CONFIG_SCOPE, SCREEN_TYPE } from "./enums";

describe("enums", () => {
  it("CHANGE_TYPE khớp đúng chuỗi mà backend Rust trả về", () => {
    expect(CHANGE_TYPE.ADDED).toBe("added");
    expect(CHANGE_TYPE.MODIFIED).toBe("modified");
    expect(CHANGE_TYPE.DELETED).toBe("deleted");
    expect(CHANGE_TYPE.RENAMED).toBe("renamed");
  });

  it("PR_STATE khớp đúng chuỗi của GitHub API", () => {
    expect(PR_STATE.OPEN).toBe("open");
    expect(PR_STATE.CLOSED).toBe("closed");
    expect(PR_STATE.ALL).toBe("all");
  });

  it("CHECK_STATUS phủ đủ 5 trạng thái mà bindings khai báo", () => {
    expect(Object.values(CHECK_STATUS).sort()).toEqual(
      ["failure", "in_progress", "neutral", "queued", "success"].sort()
    );
  });

  it("CONFIG_SCOPE khớp ConfigScope trong bindings", () => {
    expect(Object.values(CONFIG_SCOPE).sort()).toEqual(["global", "local"].sort());
  });

  it("SCREEN_TYPE khớp ScreenType trong types/tab.ts", () => {
    expect(Object.values(SCREEN_TYPE).sort()).toEqual(["changes", "conflict", "history"].sort());
  });
});
