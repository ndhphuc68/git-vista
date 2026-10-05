import { describe, it, expect, expectTypeOf } from "vitest";
import {
  CHANGE_TYPE,
  PR_STATE,
  CHECK_STATUS,
  CONFIG_SCOPE,
  SCREEN_TYPE,
  REBASE_ACTION,
  type ConfigScope,
  type RebaseActionKind,
} from ".";
import type {
  ConfigScope as BindingConfigScope,
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
});
