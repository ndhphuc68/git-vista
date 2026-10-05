import { describe, it, expect, expectTypeOf } from "vitest";
import {
  CHANGE_TYPE,
  PR_STATE,
  CHECK_STATUS,
  CHECK_RUN_STATE,
  CHECK_RUN_CONCLUSION,
  PR_STATUS,
  PR_FILE_STATUS,
  CONFIG_SCOPE,
  SCREEN_TYPE,
  TAB_TYPE,
  REBASE_ACTION,
  OPERATION_STATUS,
  REF_TYPE,
  type ConfigScope,
  type FileStatus,
  type RebaseActionKind,
} from ".";
import type {
  ConfigScope as BindingConfigScope,
  FileStatus as BindingFileStatus,
  RebaseActionKind as BindingRebaseActionKind,
} from "../../ipc/bindings.generated";

describe("enums", () => {
  it("CHANGE_TYPE matches the exact strings returned by the Rust backend", () => {
    expect(CHANGE_TYPE.ADDED).toBe("added");
    expect(CHANGE_TYPE.MODIFIED).toBe("modified");
    expect(CHANGE_TYPE.DELETED).toBe("deleted");
    expect(CHANGE_TYPE.RENAMED).toBe("renamed");
  });

  it("REBASE_ACTION matches the exact strings accepted by the Rust backend", () => {
    expect(Object.values(REBASE_ACTION).sort()).toEqual(
      ["Drop", "Fixup", "Pick", "Reword", "Squash"].sort()
    );
  });

  it("OPERATION_STATUS matches the status strings Rust returns", () => {
    // String in Rust: src-tauri/src/exec/commit_actions.rs, src-tauri/src/exec/merge.rs,
    // src-tauri/src/exec/rebase.rs. Not a generated union, so tsc cannot check it.
    expect(OPERATION_STATUS).toEqual({
      COMMITTED: "Committed",
      STAGED: "Staged",
      CONFLICT: "Conflict",
      ERROR: "Error",
    });
  });

  it("REF_TYPE matches the ref_type strings Rust returns", () => {
    // String in Rust: src-tauri/src/read/graph.rs (GraphRef.ref_type).
    expect(REF_TYPE).toEqual({ HEAD: "head", LOCAL: "local", REMOTE: "remote", TAG: "tag" });
  });

  it("PR_STATE matches the exact strings of the GitHub API", () => {
    expect(PR_STATE.OPEN).toBe("open");
    expect(PR_STATE.CLOSED).toBe("closed");
    expect(PR_STATE.ALL).toBe("all");
  });

  it("CHECK_STATUS covers all 5 states declared in bindings", () => {
    expect(Object.values(CHECK_STATUS).sort()).toEqual(
      ["failure", "in_progress", "neutral", "queued", "success"].sort()
    );
  });

  it("CONFIG_SCOPE matches ConfigScope in bindings", () => {
    expect(Object.values(CONFIG_SCOPE).sort()).toEqual(["global", "local"].sort());
  });

  it("SCREEN_TYPE matches ScreenType in types/tab.ts", () => {
    expect(Object.values(SCREEN_TYPE).sort()).toEqual(
      ["changes", "conflict", "history", "pull-requests"].sort()
    );
  });
  it("TAB_TYPE lists the window tab kinds", () => {
    expect(TAB_TYPE).toEqual({ HOME: "home", REPO: "repo" });
  });

  it("CHECK_RUN_STATE and CHECK_RUN_CONCLUSION match GitHub check-run fields", () => {
    expect(CHECK_RUN_STATE).toEqual({
      COMPLETED: "completed",
      IN_PROGRESS: "in_progress",
      QUEUED: "queued",
    });
    expect(CHECK_RUN_CONCLUSION).toEqual({ SUCCESS: "success" });
  });

  it("PR_STATUS lists the badge statuses", () => {
    expect(Object.values(PR_STATUS).sort()).toEqual(["closed", "draft", "merged", "open"]);
  });

  it("PR_FILE_STATUS matches GitHub's pull request file status", () => {
    expect(Object.values(PR_FILE_STATUS).sort()).toEqual([
      "added",
      "modified",
      "removed",
      "renamed",
    ]);
  });
});

describe("enums stay in sync with generated bindings", () => {
  // These are compile-time checks: `pnpm build` runs tsc over test files, so a
  // variant added or removed in Rust fails the build once bindings regenerate.
  it("CONFIG_SCOPE matches ConfigScope", () => {
    expectTypeOf<ConfigScope>().toEqualTypeOf<BindingConfigScope>();
  });

  it("REBASE_ACTION matches RebaseActionKind", () => {
    expectTypeOf<RebaseActionKind>().toEqualTypeOf<BindingRebaseActionKind>();
  });

  it("FILE_STATUS matches FileStatus", () => {
    expectTypeOf<FileStatus>().toEqualTypeOf<BindingFileStatus>();
  });
});
