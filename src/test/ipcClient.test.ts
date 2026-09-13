import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("invokeCommand M2.1 methods in browser environment", () => {
  it("getRepoStatus returns mock status with staged, unstaged, and untracked files", async () => {
    const status = await invokeCommand.getRepoStatus("/mock/repo");
    expect(status).toBeDefined();
    expect(Array.isArray(status.staged)).toBe(true);
    expect(Array.isArray(status.unstaged)).toBe(true);
    expect(Array.isArray(status.untracked)).toBe(true);
  });

  it("getWorkingFileDiff returns mock diff result with hunks and lines", async () => {
    const diff = await invokeCommand.getWorkingFileDiff("/mock/repo", "file.ts", false);
    expect(diff).toBeDefined();
    expect(diff.file_path).toBe("file.ts");
    expect(diff.hunks.length).toBeGreaterThan(0);
    expect(diff.hunks[0]!.lines.length).toBeGreaterThan(0);
  });

  it("stageFile resolves without error in browser mock", async () => {
    await expect(invokeCommand.stageFile("/mock/repo", "file.ts")).resolves.toBeUndefined();
  });

  it("unstageFile resolves without error in browser mock", async () => {
    await expect(invokeCommand.unstageFile("/mock/repo", "file.ts")).resolves.toBeUndefined();
  });

  it("stageAll resolves without error in browser mock", async () => {
    await expect(invokeCommand.stageAll("/mock/repo")).resolves.toBeUndefined();
  });

  it("unstageAll resolves without error in browser mock", async () => {
    await expect(invokeCommand.unstageAll("/mock/repo")).resolves.toBeUndefined();
  });

  it("discardFileChanges resolves without error in browser mock", async () => {
    await expect(invokeCommand.discardFileChanges("/mock/repo", "file.ts")).resolves.toBeUndefined();
  });

  it("stageHunk resolves without error in browser mock", async () => {
    await expect(invokeCommand.stageHunk("/mock/repo", "file.ts", 0, false)).resolves.toBeUndefined();
  });

  it("stageLines resolves without error in browser mock", async () => {
    await expect(invokeCommand.stageLines("/mock/repo", "file.ts", 0, [0, 1], false)).resolves.toBeUndefined();
  });

  it("createCommit returns commit details with summary and description in browser mock", async () => {
    const commit = await invokeCommand.createCommit(
      "/mock/repo",
      "feat: test commit",
      "detailed commit message",
      false
    );
    expect(commit).toBeDefined();
    expect(commit.id).toBeDefined();
    expect(commit.full_message).toContain("feat: test commit");
    expect(commit.full_message).toContain("detailed commit message");
  });
});

describe("invokeCommand M3 remote operations in browser environment", () => {
  it("fetchRepo returns success message in browser mock", async () => {
    const result = await invokeCommand.fetchRepo("/mock/repo");
    expect(result).toContain("Fetch");
  });

  it("pullRepo returns success message in browser mock", async () => {
    const result = await invokeCommand.pullRepo("/mock/repo", "origin", "main", false);
    expect(result).toContain("Pull");
  });

  it("pushRepo returns success message in browser mock", async () => {
    const result = await invokeCommand.pushRepo("/mock/repo", "origin", "main", true, false);
    expect(result).toContain("Push");
  });

  it("cloneRepo returns success message in browser mock", async () => {
    const result = await invokeCommand.cloneRepo("https://github.com/example/repo.git", "/target/dir");
    expect(result).toContain("Clone");
  });

  it("cancelRemoteTask resolves without error", async () => {
    await expect(invokeCommand.cancelRemoteTask("task-123")).resolves.toBeUndefined();
  });

  it("setRepoPullRebase resolves without error", async () => {
    await expect(invokeCommand.setRepoPullRebase("/mock/repo", true)).resolves.toBeUndefined();
  });
});

