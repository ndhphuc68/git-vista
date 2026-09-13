import {
  SystemInfo,
  RepoHeadInfo,
  RepoChangedPayload,
  TaskProgressPayload,
  RepoSummary,
  RecentRepoEntry,
  BranchListResult,
  CommitGraphPage,
  CommitDetails,
  FileDiffResult,
  FileStatus,
  StatusFileItem,
  RepoStatusResult,
} from "./bindings";

// Helper kiểm tra môi trường chạy có phải trong Tauri runtime không
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
};

export const invokeCommand = {
  ping: async (msg: string): Promise<string> => {
    if (!isTauri()) {
      return `[Browser mock] Pong: ${msg} (at ${new Date().toLocaleTimeString()})`;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("ping", { msg });
  },

  getSystemInfo: async (): Promise<SystemInfo> => {
    if (!isTauri()) {
      return {
        os: "browser-dev",
        arch: "x86_64",
        git_version: "git version mock-2.50",
        app_version: "0.1.0",
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<SystemInfo>("get_system_info");
  },

  getRepoHeadInfo: async (repoPath: string): Promise<RepoHeadInfo> => {
    if (!isTauri()) {
      return {
        branch_name: "main",
        head_commit_id: "abc1234567890",
        is_detached: false,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoHeadInfo>("get_repo_head_info", { repoPath });
  },

  simulateRepoChange: async (repoPath: string): Promise<void> => {
    if (!isTauri()) {
      window.dispatchEvent(
        new CustomEvent("mock-repo-changed", {
          detail: {
            repo_path: repoPath,
            reason: "Simulated trigger in browser",
            timestamp_ms: Date.now(),
          },
        })
      );
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("simulate_repo_change", { repoPath });
  },

  openRepository: async (path: string): Promise<RepoSummary> => {
    if (!isTauri()) {
      return {
        path,
        name: path.split("/").pop() || "mock-repo",
        is_bare: false,
        head_branch: "main",
        head_commit_id: "a1b2c3d",
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoSummary>("open_repository", { path });
  },

  getRecentRepos: async (): Promise<RecentRepoEntry[]> => {
    if (!isTauri()) {
      return [
        { path: "d:/project-v3", name: "project-v3", last_opened_at_ms: Date.now() - 3600000 },
      ];
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RecentRepoEntry[]>("get_recent_repos");
  },

  clearRecentRepos: async (): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("clear_recent_repos");
  },

  removeRecentRepo: async (path: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("remove_recent_repo", { path });
  },

  selectRepoFolder: async (): Promise<string | null> => {
    if (!isTauri()) return "d:/project-v3";
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string | null>("select_repo_folder");
  },

  getBranches: async (repoPath: string): Promise<BranchListResult> => {
    if (!isTauri()) {
      return {
        current_branch: "main",
        is_detached: false,
        local: [{ name: "main", is_head: true, target_commit_id: "c1", upstream: "origin/main" }],
        remote: [{ name: "origin/main", is_head: false, target_commit_id: "c1", upstream: null }],
        tags: ["v0.1.0"],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<BranchListResult>("get_branches", { repoPath });
  },

  getCommitGraph: async (repoPath: string, offset: number, limit: number): Promise<CommitGraphPage> => {
    if (!isTauri()) {
      return {
        commits: [
          {
            id: "1111111111111111111111111111111111111111",
            short_id: "1111111",
            summary: "feat(m1): visual git viewer",
            author_name: "Visual Git Team",
            author_email: "team@visualgit.dev",
            timestamp_sec: Math.floor(Date.now() / 1000),
            parent_ids: [],
            col: 0,
            color_index: 0,
            lines: [],
            refs: [{ name: "main", ref_type: "head" }],
          },
        ],
        has_more: false,
        total_count: 1,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<CommitGraphPage>("get_commit_graph", { repoPath, offset, limit });
  },

  getCommitDetails: async (repoPath: string, commitId: string): Promise<CommitDetails> => {
    if (!isTauri()) {
      return {
        id: commitId,
        full_message: "feat(m1): visual git viewer\n\nFull details preview",
        author_name: "Tester",
        author_email: "tester@dev.com",
        author_timestamp_sec: Math.floor(Date.now() / 1000),
        parent_ids: [],
        files: [{ path: "README.md", status: "modified", additions: 10, deletions: 2 }],
        total_additions: 10,
        total_deletions: 2,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<CommitDetails>("get_commit_details", { repoPath, commitId });
  },

  getCommitFileDiff: async (repoPath: string, commitId: string, filePath: string): Promise<FileDiffResult> => {
    if (!isTauri()) {
      return {
        file_path: filePath,
        status: "modified",
        additions: 1,
        deletions: 1,
        hunks: [
          {
            header: "@@ -1,2 +1,2 @@",
            old_start: 1,
            old_lines: 2,
            new_start: 1,
            new_lines: 2,
            lines: [
              { line_type: "delete", content: "- legacy mock line\n", old_lineno: 1, new_lineno: null },
              { line_type: "add", content: "+ new live line\n", old_lineno: null, new_lineno: 1 },
            ],
          },
        ],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<FileDiffResult>("get_commit_file_diff", { repoPath, commitId, filePath });
  },

  getRepoStatus: async (repoPath: string): Promise<RepoStatusResult> => {
    if (!isTauri()) {
      return {
        staged: [
          { path: "src/staged.ts", status: "Modified", is_staged: true, old_path: null },
        ],
        unstaged: [
          { path: "src/unstaged.ts", status: "Modified", is_staged: false, old_path: null },
        ],
        untracked: [
          { path: "src/untracked.ts", status: "New", is_staged: false, old_path: null },
        ],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoStatusResult>("get_repo_status", { repoPath });
  },

  getWorkingFileDiff: async (
    repoPath: string,
    filePath: string,
    isStaged: boolean
  ): Promise<FileDiffResult> => {
    if (!isTauri()) {
      return {
        file_path: filePath,
        status: "Modified",
        additions: 2,
        deletions: 1,
        hunks: [
          {
            header: "@@ -1,3 +1,4 @@",
            old_start: 1,
            old_lines: 3,
            new_start: 1,
            new_lines: 4,
            lines: [
              { line_type: "context", content: "const a = 1;\n", old_lineno: 1, new_lineno: 1 },
              { line_type: "delete", content: "const b = 2;\n", old_lineno: 2, new_lineno: null },
              { line_type: "add", content: "const b = 20;\n", old_lineno: null, new_lineno: 2 },
              { line_type: "add", content: "const c = 30;\n", old_lineno: null, new_lineno: 3 },
            ],
          },
        ],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<FileDiffResult>("get_working_file_diff", { repoPath, filePath, isStaged });
  },

  stageFile: async (repoPath: string, filePath: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("stage_file", { repoPath, filePath });
  },

  unstageFile: async (repoPath: string, filePath: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("unstage_file", { repoPath, filePath });
  },

  stageAll: async (repoPath: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("stage_all", { repoPath });
  },

  unstageAll: async (repoPath: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("unstage_all", { repoPath });
  },

  discardFileChanges: async (repoPath: string, filePath: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("discard_file_changes", { repoPath, filePath });
  },

  stageHunk: async (
    repoPath: string,
    filePath: string,
    hunkIndex: number,
    isStaged: boolean
  ): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("stage_hunk", { repoPath, filePath, hunkIndex, isStaged });
  },

  stageLines: async (
    repoPath: string,
    filePath: string,
    hunkIndex: number,
    lineIndices: number[],
    isStaged: boolean
  ): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("stage_lines", { repoPath, filePath, hunkIndex, lineIndices, isStaged });
  },

  createCommit: async (
    repoPath: string,
    summary: string,
    description?: string,
    amend?: boolean
  ): Promise<CommitDetails> => {
    if (!isTauri()) {
      return {
        id: "mockcommit1234567890abcdef",
        full_message: description ? `${summary}\n\n${description}` : summary,
        author_name: "Mock Author",
        author_email: "mock@example.com",
        author_timestamp_sec: Math.floor(Date.now() / 1000),
        parent_ids: [],
        files: [],
        total_additions: 0,
        total_deletions: 0,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<CommitDetails>("create_commit", { repoPath, summary, description, amend });
  },

  createBranch: async (
    repoPath: string,
    name: string,
    targetCommit?: string | null,
    checkout?: boolean
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("create_branch", { repoPath, name, targetCommit, checkout });
  },

  checkoutBranch: async (
    repoPath: string,
    branchName: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("checkout_branch", { repoPath, branchName });
  },

  renameBranch: async (
    repoPath: string,
    oldName: string,
    newName: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("rename_branch", { repoPath, oldName, newName });
  },

  deleteBranch: async (
    repoPath: string,
    branchName: string,
    force?: boolean
  ): Promise<string> => {
    if (!isTauri()) {
      return `refs/gitui-backup/delete-branch-${branchName}-${Date.now()}`;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("delete_branch", { repoPath, branchName, force });
  },
};

export async function listenToRepoChanged(
  handler: (payload: RepoChangedPayload) => void
): Promise<() => void> {
  if (!isTauri()) {
    const mockListener = (e: Event) => {
      const customEvent = e as CustomEvent<RepoChangedPayload>;
      handler(customEvent.detail);
    };
    window.addEventListener("mock-repo-changed", mockListener);
    return () => window.removeEventListener("mock-repo-changed", mockListener);
  }

  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<RepoChangedPayload>("repo-changed", (event) => {
    handler(event.payload);
  });
  return unlisten;
}

export type {
  SystemInfo,
  RepoHeadInfo,
  RepoChangedPayload,
  TaskProgressPayload,
  FileStatus,
  StatusFileItem,
  RepoStatusResult,
};

