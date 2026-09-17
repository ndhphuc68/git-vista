import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC Commit Actions (Mock Client)", () => {
  it("cherryPickCommit returns Committed status with mock data when autoCommit is true", async () => {
    const res = await invokeCommand.cherryPickCommit("test-repo", "abc1234", true);
    expect(res.success).toBe(true);
    expect(res.status).toBe("Committed");
    expect(res.new_commit_id).toBeDefined();
    expect(res.undo_token).toBeDefined();
  });

  it("cherryPickCommit returns Staged status when autoCommit is false", async () => {
    const res = await invokeCommand.cherryPickCommit("test-repo", "abc1234", false);
    expect(res.success).toBe(true);
    expect(res.status).toBe("Staged");
  });

  it("revertCommit returns Committed status with mock data", async () => {
    const res = await invokeCommand.revertCommit("test-repo", "abc1234", true);
    expect(res.success).toBe(true);
    expect(res.status).toBe("Committed");
    expect(res.new_commit_id).toBeDefined();
    expect(res.undo_token).toBeDefined();
  });
});
