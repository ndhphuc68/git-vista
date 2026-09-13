import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC undo commands (browser mock)", () => {
  it("undoCommit completes successfully", async () => {
    await expect(invokeCommand.undoCommit("test-repo")).resolves.not.toThrow();
  });

  it("undoDeleteBranch completes successfully", async () => {
    await expect(invokeCommand.undoDeleteBranch("test-repo", "feature", "oid123")).resolves.not.toThrow();
  });

  it("undoDiscardFile completes successfully", async () => {
    await expect(invokeCommand.undoDiscardFile("test-repo", "file.txt", "content")).resolves.not.toThrow();
  });

  it("undoDropStash completes successfully", async () => {
    await expect(invokeCommand.undoDropStash("test-repo", "oid123", "msg")).resolves.not.toThrow();
  });
});
