import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC undo commands (browser mock)", () => {
  it("undoCommit completes successfully", async () => {
    await expect(invokeCommand.undoCommit("test-repo", "receipt")).resolves.not.toThrow();
  });

  it("undoDeleteBranch completes successfully", async () => {
    await expect(
      invokeCommand.undoDeleteBranch(
        "test-repo",
        "feature",
        "refs/gitui-backup/delete-branch-feature-123"
      )
    ).resolves.not.toThrow();
  });

  it("restoreDiscard completes successfully", async () => {
    await expect(invokeCommand.restoreDiscard("test-repo", "receipt")).resolves.not.toThrow();
  });

  it("undoDropStash completes successfully", async () => {
    await expect(invokeCommand.undoDropStash("test-repo", "receipt")).resolves.not.toThrow();
  });
});
