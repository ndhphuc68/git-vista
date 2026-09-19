import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { invokeCommand } from "../ipc/client";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("IPC Diff Client with ignoreWhitespace", () => {
  it("passes ignoreWhitespace flag to getCommitFileDiff in browser mock mode", async () => {
    const diffWithWs = await invokeCommand.getCommitFileDiff("/mock/repo", "c1", "file.ts", false);
    expect(diffWithWs).toBeDefined();
    expect(diffWithWs.hunks.length).toBeGreaterThan(0);

    const diffNoWs = await invokeCommand.getCommitFileDiff("/mock/repo", "c1", "file.ts", true);
    expect(diffNoWs).toBeDefined();
  });

  it("passes ignoreWhitespace flag to getWorkingFileDiff in browser mock mode", async () => {
    const diff = await invokeCommand.getWorkingFileDiff("/mock/repo", "src/App.tsx", false, true);
    expect(diff).toBeDefined();
    expect(diff.file_path).toBe("src/App.tsx");
  });

  describe("Tauri IPC invoke calls", () => {
    beforeEach(() => {
      (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    });

    afterEach(() => {
      delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
      vi.clearAllMocks();
    });

    it("passes ignoreWhitespace to get_commit_file_diff invoke", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValueOnce({
        file_path: "test.ts",
        status: "modified",
        additions: 0,
        deletions: 0,
        hunks: [],
      });

      await invokeCommand.getCommitFileDiff("/repo", "commit-1", "test.ts", true);
      expect(invoke).toHaveBeenCalledWith("get_commit_file_diff", {
        repoPath: "/repo",
        commitId: "commit-1",
        filePath: "test.ts",
        ignoreWhitespace: true,
      });
    });

    it("defaults ignoreWhitespace to false when omitted in getCommitFileDiff invoke", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValueOnce({
        file_path: "test.ts",
        status: "modified",
        additions: 0,
        deletions: 0,
        hunks: [],
      });

      await invokeCommand.getCommitFileDiff("/repo", "commit-1", "test.ts");
      expect(invoke).toHaveBeenCalledWith("get_commit_file_diff", {
        repoPath: "/repo",
        commitId: "commit-1",
        filePath: "test.ts",
        ignoreWhitespace: false,
      });
    });

    it("passes ignoreWhitespace to get_working_file_diff invoke", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValueOnce({
        file_path: "test.ts",
        status: "modified",
        additions: 0,
        deletions: 0,
        hunks: [],
      });

      await invokeCommand.getWorkingFileDiff("/repo", "test.ts", true, true);
      expect(invoke).toHaveBeenCalledWith("get_working_file_diff", {
        repoPath: "/repo",
        filePath: "test.ts",
        isStaged: true,
        ignoreWhitespace: true,
      });
    });

    it("defaults ignoreWhitespace to false when omitted in getWorkingFileDiff invoke", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValueOnce({
        file_path: "test.ts",
        status: "modified",
        additions: 0,
        deletions: 0,
        hunks: [],
      });

      await invokeCommand.getWorkingFileDiff("/repo", "test.ts", true);
      expect(invoke).toHaveBeenCalledWith("get_working_file_diff", {
        repoPath: "/repo",
        filePath: "test.ts",
        isStaged: true,
        ignoreWhitespace: false,
      });
    });

    it("passes ignoreWhitespace to get_compare_file_diff invoke as ignoreWs", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValueOnce({
        file_path: "test.ts",
        status: "modified",
        additions: 0,
        deletions: 0,
        hunks: [],
      });

      await invokeCommand.getCompareFileDiff(
        "/repo",
        "main",
        "feature",
        "test.ts",
        "MergeBase",
        true
      );

      // The Rust parameter is `ignore_ws`, so Tauri expects `ignoreWs`. Sending
      // `ignoreWhitespace` drops the argument silently and the backend falls back
      // to `unwrap_or(false)`, which left the Compare view's toggle doing nothing.
      expect(invoke).toHaveBeenCalledWith("get_compare_file_diff", {
        repoPath: "/repo",
        baseRev: "main",
        targetRev: "feature",
        filePath: "test.ts",
        mode: "MergeBase",
        ignoreWs: true,
      });
    });
  });
});
