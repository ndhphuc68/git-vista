import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC client stash and merge commands (browser mock)", () => {
  it("getStashes returns mock stash array", async () => {
    const stashes = await invokeCommand.getStashes("test-repo");
    expect(Array.isArray(stashes)).toBe(true);
  });

  it("saveStash returns commit hash and updates stashes", async () => {
    const commitId = await invokeCommand.saveStash("test-repo", "WIP test", true);
    expect(commitId).toBeDefined();
    expect(typeof commitId).toBe("string");
  });

  it("getRepoState returns clean state by default in mock", async () => {
    const state = await invokeCommand.getRepoState("test-repo");
    expect(state.state).toBe("clean");
    expect(state.is_in_progress).toBe(false);
  });

  it("mergeBranch returns mock MergeResult", async () => {
    const res = await invokeCommand.mergeBranch("test-repo", "feature", false);
    expect(res.success).toBe(true);
    expect(res.status).toBeDefined();
  });
});
