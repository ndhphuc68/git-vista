import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC conflict commands (browser mock)", () => {
  it("getConflictFileData returns mock conflict data", async () => {
    const data = await invokeCommand.getConflictFileData("test-repo", "src/App.tsx");
    expect(data.file_path).toBe("src/App.tsx");
    expect(Array.isArray(data.hunks)).toBe(true);
  });

  it("resolveConflictFile completes successfully", async () => {
    await expect(
      invokeCommand.resolveConflictFile("test-repo", "src/App.tsx", "resolved content", true)
    ).resolves.not.toThrow();
  });
});
