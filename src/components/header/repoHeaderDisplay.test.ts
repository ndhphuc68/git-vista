import { describe, it, expect } from "vitest";
import { getShortcutLabels, countTotalChanges, countAheadBehind } from "./repoHeaderDisplay";
import { type RepoStatusResult, type RepoHeadInfo } from "../../ipc/bindings.generated";

describe("getShortcutLabels", () => {
  it("uses Cmd-prefixed labels on macOS", () => {
    expect(getShortcutLabels(true)).toEqual({
      shortcutLabel1: "Cmd+1",
      shortcutLabel2: "Cmd+2",
      shortcutSidebar: "Cmd+B",
    });
  });

  it("uses Ctrl-prefixed labels elsewhere", () => {
    expect(getShortcutLabels(false)).toEqual({
      shortcutLabel1: "Ctrl+1",
      shortcutLabel2: "Ctrl+2",
      shortcutSidebar: "Ctrl+B",
    });
  });
});

describe("countTotalChanges", () => {
  it("returns 0 when repoStatus is undefined", () => {
    expect(countTotalChanges(undefined)).toBe(0);
  });

  it("sums staged, unstaged and untracked file counts", () => {
    const repoStatus: RepoStatusResult = {
      staged: [{ path: "a.txt", status: "Modified", is_staged: true, old_path: null }],
      unstaged: [
        { path: "b.txt", status: "Modified", is_staged: false, old_path: null },
        { path: "c.txt", status: "Modified", is_staged: false, old_path: null },
      ],
      untracked: [{ path: "d.txt", status: "New", is_staged: false, old_path: null }],
      conflicted: [],
    };
    expect(countTotalChanges(repoStatus)).toBe(4);
  });
});

describe("countAheadBehind", () => {
  it("returns 0/0 when headInfo is undefined", () => {
    expect(countAheadBehind(undefined)).toEqual({ aheadCount: 0, behindCount: 0 });
  });

  it("reads ahead and behind from headInfo", () => {
    const headInfo: RepoHeadInfo = {
      branch_name: "main",
      head_commit_id: "abc1234",
      is_detached: false,
      ahead: 3,
      behind: 2,
      upstream: "origin/main",
    };
    expect(countAheadBehind(headInfo)).toEqual({ aheadCount: 3, behindCount: 2 });
  });
});
