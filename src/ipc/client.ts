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
  StashItem,
  RepoStateInfo,
  MergeResult,
  RebaseResult,
  CommitActionResult,
  ConflictHunk,
  ConflictFileData,
  ConfigScope,
  GitConfigDto,
  TagItem,
  FileBlameResult,
  FileHistoryResult,
} from "./bindings";

let mockTags: TagItem[] = [
  {
    name: "v1.0.0",
    target_commit_id: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    short_commit_id: "c1a2b3c",
    commit_summary: "Initial release",
    is_annotated: true,
    message: "First official release",
    tagger_name: "GitVista User",
    tagger_email: "user@gitvista.dev",
    timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
  {
    name: "v0.9.0",
    target_commit_id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    short_commit_id: "a1b2c3d",
    commit_summary: "Beta testing release",
    is_annotated: false,
    message: null,
    tagger_name: null,
    tagger_email: null,
    timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 15,
  },
];

export function resetMockTags() {
  mockTags = [
    {
      name: "v1.0.0",
      target_commit_id: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
      short_commit_id: "c1a2b3c",
      commit_summary: "Initial release",
      is_annotated: true,
      message: "First official release",
      tagger_name: "GitVista User",
      tagger_email: "user@gitvista.dev",
      timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 5,
    },
    {
      name: "v0.9.0",
      target_commit_id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      short_commit_id: "a1b2c3d",
      commit_summary: "Beta testing release",
      is_annotated: false,
      message: null,
      tagger_name: null,
      tagger_email: null,
      timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 15,
    },
  ];
}

let mockStashes: StashItem[] = [
  {
    index: 0,
    message: "WIP on main: initial work",
    commit_id: "stash1234567890",
    created_at: Math.floor(Date.now() / 1000) - 3600,
  },
];

let mockGlobalConfig: GitConfigDto = {
  userName: "GitVista User",
  userNameSource: "global",
  userEmail: "user@gitvista.dev",
  userEmailSource: "global",
  defaultBranch: "main",
  pullRebase: false,
  gpgSign: false,
  gpgKey: "",
  fetchPrune: false,
  rebaseAutostash: false,
};

let mockLocalConfigs: Record<string, Partial<GitConfigDto>> = {};

export function resetMockGitConfig() {
  mockGlobalConfig = {
    userName: "GitVista User",
    userNameSource: "global",
    userEmail: "user@gitvista.dev",
    userEmailSource: "global",
    defaultBranch: "main",
    pullRebase: false,
    gpgSign: false,
    gpgKey: "",
    fetchPrune: false,
    rebaseAutostash: false,
  };
  mockLocalConfigs = {};
}

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
        ahead: 0,
        behind: 0,
        upstream: "origin/main",
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

  closeRepository: async (path: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("close_repository", { path });
  },

  getOpenRepositories: async (): Promise<RepoSummary[]> => {
    if (!isTauri()) {
      return [];
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoSummary[]>("get_open_repositories");
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
        local: [{ name: "main", is_head: true, target_commit_id: "c1", upstream: "origin/main", ahead: 0, behind: 0 }],
        remote: [{ name: "origin/main", is_head: false, target_commit_id: "c1", upstream: null, ahead: 0, behind: 0 }],
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

  getCommitFileDiff: async (
    repoPath: string,
    commitId: string,
    filePath: string,
    ignoreWhitespace?: boolean
  ): Promise<FileDiffResult> => {
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
    return await invoke<FileDiffResult>("get_commit_file_diff", {
      repoPath,
      commitId,
      filePath,
      ignoreWhitespace: ignoreWhitespace ?? false,
    });
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
        conflicted: [],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoStatusResult>("get_repo_status", { repoPath });
  },

  getWorkingFileDiff: async (
    repoPath: string,
    filePath: string,
    isStaged: boolean,
    ignoreWhitespace?: boolean
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
    return await invoke<FileDiffResult>("get_working_file_diff", {
      repoPath,
      filePath,
      isStaged,
      ignoreWhitespace: ignoreWhitespace ?? false,
    });
  },

  getFileBlame: async (
    repoPath: string,
    filePath: string,
    commitId?: string | null
  ): Promise<FileBlameResult> => {
    if (!isTauri()) {
      return {
        file_path: filePath,
        commit_id: commitId ?? null,
        total_lines: 4,
        lines: [
          {
            line_no: 1,
            content: "import React from 'react';",
            commit_id: "c1a2b3c4d5e6f7890123456789abcdef01234567",
            short_id: "c1a2b3c",
            summary: "✨ initial commit with react components",
            author_name: "GitVista Team",
            author_email: "team@gitvista.dev",
            timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 5,
            is_hunk_start: true,
          },
          {
            line_no: 2,
            content: "import { invokeCommand } from '../ipc/client';",
            commit_id: "c1a2b3c4d5e6f7890123456789abcdef01234567",
            short_id: "c1a2b3c",
            summary: "✨ initial commit with react components",
            author_name: "GitVista Team",
            author_email: "team@gitvista.dev",
            timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 5,
            is_hunk_start: false,
          },
          {
            line_no: 3,
            content: "",
            commit_id: "d4e5f6a1b2c37890123456789abcdef012345678",
            short_id: "d4e5f6a",
            summary: "♻️ refactor exports and formatting",
            author_name: "PhucNDH",
            author_email: "phuc@example.com",
            timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 2,
            is_hunk_start: true,
          },
          {
            line_no: 4,
            content: "export const isReady = true;",
            commit_id: "d4e5f6a1b2c37890123456789abcdef012345678",
            short_id: "d4e5f6a",
            summary: "♻️ refactor exports and formatting",
            author_name: "PhucNDH",
            author_email: "phuc@example.com",
            timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 2,
            is_hunk_start: false,
          },
        ],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<FileBlameResult>("get_file_blame", {
      repoPath,
      filePath,
      commitId: commitId ?? null,
    });
  },

  getFileHistory: async (
    repoPath: string,
    filePath: string,
    offset?: number | null,
    limit?: number | null
  ): Promise<FileHistoryResult> => {
    if (!isTauri()) {
      return {
        file_path: filePath,
        total_count: 2,
        has_more: false,
        commits: [
          {
            commit_id: "d4e5f6a1b2c37890123456789abcdef012345678",
            short_id: "d4e5f6a",
            summary: "♻️ refactor exports and formatting",
            author_name: "PhucNDH",
            author_email: "phuc@example.com",
            timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 2,
            change_type: "modified",
          },
          {
            commit_id: "c1a2b3c4d5e6f7890123456789abcdef01234567",
            short_id: "c1a2b3c",
            summary: "✨ initial commit with react components",
            author_name: "GitVista Team",
            author_email: "team@gitvista.dev",
            timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 5,
            change_type: "added",
          },
        ],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<FileHistoryResult>("get_file_history", {
      repoPath,
      filePath,
      offset: offset ?? null,
      limit: limit ?? null,
    });
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

  discardFileChanges: async (repoPath: string, filePath: string): Promise<string> => {
    if (!isTauri()) return "browser-discard-receipt";
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("discard_file_changes", { repoPath, filePath });
  },

  restoreDiscard: async (repoPath: string, token: string): Promise<void> => {
    if (!isTauri()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("restore_discard", { repoPath, token });
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
        undo_token: "browser-commit-receipt",
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

  getTags: async (repoPath: string): Promise<TagItem[]> => {
    if (!isTauri()) {
      return [...mockTags];
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<TagItem[]>("get_tags", { repoPath });
  },

  createTag: async (
    repoPath: string,
    name: string,
    targetCommit: string,
    message?: string
  ): Promise<void> => {
    if (!isTauri()) {
      const isAnnotated = Boolean(message && message.trim().length > 0);
      const newTag: TagItem = {
        name,
        target_commit_id: targetCommit,
        short_commit_id: targetCommit.slice(0, 7),
        commit_summary: message || "Tag created",
        is_annotated: isAnnotated,
        message: message ?? null,
        tagger_name: isAnnotated ? "GitVista User" : null,
        tagger_email: isAnnotated ? "user@gitvista.dev" : null,
        timestamp_sec: Math.floor(Date.now() / 1000),
      };
      mockTags = [newTag, ...mockTags.filter((t) => t.name !== name)];
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: `Tag ${name} created`,
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("create_tag", {
      repoPath,
      name,
      targetCommit,
      message: message ?? null,
    });
  },

  deleteTag: async (
    repoPath: string,
    name: string,
    deleteRemote?: boolean
  ): Promise<void> => {
    if (!isTauri()) {
      mockTags = mockTags.filter((t) => t.name !== name);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: `Tag ${name} deleted`,
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("delete_tag", {
      repoPath,
      name,
      deleteRemote: deleteRemote ?? null,
    });
  },

  checkoutTag: async (repoPath: string, name: string): Promise<void> => {
    if (!isTauri()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: `Checked out tag ${name}`,
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("checkout_tag", { repoPath, name });
  },

  pushTag: async (
    repoPath: string,
    name: string,
    remoteName?: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("push_tag", {
      repoPath,
      name,
      remoteName: remoteName ?? null,
    });
  },

  fetchRepo: async (
    repoPath: string,
    remote?: string,
    prune?: boolean,
    taskId?: string
  ): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Fetch hoàn tất";
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("fetch_repo", {
      repoPath,
      remote,
      prune,
      taskId,
    });
  },

  pullRepo: async (
    repoPath: string,
    remote?: string,
    branch?: string,
    rebase?: boolean,
    taskId?: string
  ): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Pull hoàn tất";
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("pull_repo", {
      repoPath,
      remote,
      branch,
      rebase,
      taskId,
    });
  },

  pushRepo: async (
    repoPath: string,
    remote?: string,
    branch?: string,
    setUpstream?: boolean,
    force?: boolean,
    taskId?: string
  ): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Push hoàn tất";
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("push_repo", {
      repoPath,
      remote,
      branch,
      setUpstream,
      force,
      taskId,
    });
  },

  cloneRepo: async (
    url: string,
    targetDir: string,
    taskId?: string
  ): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Clone hoàn tất";
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("clone_repo", {
      url,
      targetDir,
      taskId,
    });
  },

  cancelRemoteTask: async (taskId: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("cancel_remote_task", { taskId });
  },

  setRepoPullRebase: async (repoPath: string, rebase: boolean): Promise<void> => {
    if (!isTauri()) {
      if (!mockLocalConfigs[repoPath]) mockLocalConfigs[repoPath] = {};
      mockLocalConfigs[repoPath].pullRebase = rebase;
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("set_repo_pull_rebase", { repoPath, rebase });
  },

  getStashes: async (repoPath: string): Promise<StashItem[]> => {
    if (!isTauri()) {
      return [...mockStashes];
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<StashItem[]>("get_stashes", { repoPath });
  },

  saveStash: async (
    repoPath: string,
    message?: string | null,
    includeUntracked?: boolean
  ): Promise<string> => {
    if (!isTauri()) {
      const commitId = `mockstash${Date.now()}`;
      const newStash: StashItem = {
        index: 0,
        message: message || "WIP on current branch",
        commit_id: commitId,
        created_at: Math.floor(Date.now() / 1000),
      };
      mockStashes = [newStash, ...mockStashes.map((s, idx) => ({ ...s, index: idx + 1 }))];
      return commitId;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("save_stash", { repoPath, message, includeUntracked });
  },

  applyStash: async (repoPath: string, index: number): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("apply_stash", { repoPath, index });
  },

  popStash: async (repoPath: string, index: number): Promise<void> => {
    if (!isTauri()) {
      mockStashes = mockStashes.filter((s) => s.index !== index).map((s, idx) => ({ ...s, index: idx }));
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("pop_stash", { repoPath, index });
  },

  dropStash: async (repoPath: string, index: number): Promise<string> => {
    if (!isTauri()) {
      mockStashes = mockStashes.filter((s) => s.index !== index).map((s, idx) => ({ ...s, index: idx }));
      return `refs/gitui-backup/stash-drop-undo-${Date.now()}`;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("drop_stash", { repoPath, index });
  },

  getRepoState: async (repoPath: string): Promise<RepoStateInfo> => {
    if (!isTauri()) {
      return {
        state: "clean",
        is_in_progress: false,
        head_name: "main",
        target_name: null,
        conflict_count: 0,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoStateInfo>("get_repo_state", { repoPath });
  },

  mergeBranch: async (
    repoPath: string,
    targetBranch: string,
    noFf?: boolean
  ): Promise<MergeResult> => {
    if (!isTauri()) {
      return {
        success: true,
        status: "Merged",
        output: `Merged branch ${targetBranch} into HEAD`,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<MergeResult>("merge_branch", { repoPath, targetBranch, noFf });
  },

  rebaseBranch: async (
    repoPath: string,
    upstreamBranch: string
  ): Promise<RebaseResult> => {
    if (!isTauri()) {
      return {
        success: true,
        status: "Success",
        output: `Successfully rebased and updated refs/heads/main`,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RebaseResult>("rebase_branch", { repoPath, upstreamBranch });
  },

  cherryPickCommit: async (
    repoPath: string,
    commitId: string,
    autoCommit: boolean = true
  ): Promise<CommitActionResult> => {
    if (!isTauri()) {
      return {
        success: true,
        status: autoCommit ? "Committed" : "Staged",
        new_commit_id: autoCommit ? "mock_cherry_pick_" + commitId.slice(0, 7) : null,
        undo_token: autoCommit ? "refs/gitui-backup/commit-undo-mock" : null,
        output: "Mock cherry-pick output",
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<CommitActionResult>("cherry_pick_commit", {
      repoPath,
      commitId,
      autoCommit,
    });
  },

  revertCommit: async (
    repoPath: string,
    commitId: string,
    autoCommit: boolean = true
  ): Promise<CommitActionResult> => {
    if (!isTauri()) {
      return {
        success: true,
        status: autoCommit ? "Committed" : "Staged",
        new_commit_id: autoCommit ? "mock_revert_" + commitId.slice(0, 7) : null,
        undo_token: autoCommit ? "refs/gitui-backup/commit-undo-mock" : null,
        output: "Mock revert output",
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<CommitActionResult>("revert_commit", {
      repoPath,
      commitId,
      autoCommit,
    });
  },

  abortInProgress: async (
    repoPath: string,
    operation: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("abort_in_progress", { repoPath, operation });
  },

  continueInProgress: async (
    repoPath: string,
    operation: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("continue_in_progress", { repoPath, operation });
  },

  getConflictFileData: async (
    repoPath: string,
    filePath: string
  ): Promise<ConflictFileData> => {
    if (!isTauri()) {
      return {
        file_path: filePath,
        total_conflicts: 1,
        hunks: [
          {
            id: "hunk_0",
            is_conflict: false,
            content: "// Header code\n",
            ours: null,
            theirs: null,
            base: null,
            ours_label: null,
            theirs_label: null,
          },
          {
            id: "hunk_1",
            is_conflict: true,
            content: null,
            ours: "console.log('ours');\n",
            theirs: "console.log('theirs');\n",
            base: null,
            ours_label: "HEAD",
            theirs_label: "feature",
          },
        ],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<ConflictFileData>("get_conflict_file_data", { repoPath, filePath });
  },

  resolveConflictFile: async (
    repoPath: string,
    filePath: string,
    resolvedContent: string,
    autoStage?: boolean
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("resolve_conflict_file", {
      repoPath,
      filePath,
      resolvedContent,
      autoStage,
    });
  },

  undoCommit: async (repoPath: string, undoToken: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("undo_commit", { repoPath, undoToken });
  },

  undoDeleteBranch: async (
    repoPath: string,
    branchName: string,
    backupRef: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("undo_delete_branch", { repoPath, branchName, backupRef });
  },

  undoDropStash: async (
    repoPath: string,
    receipt: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("undo_drop_stash", { repoPath, receipt });
  },

  getGitConfig: async (repoPath?: string | null): Promise<GitConfigDto> => {
    if (!isTauri()) {
      if (repoPath && mockLocalConfigs[repoPath]) {
        const local = mockLocalConfigs[repoPath];
        return {
          userName: local.userName ?? mockGlobalConfig.userName,
          userNameSource: local.userName ? "local" : "global",
          userEmail: local.userEmail ?? mockGlobalConfig.userEmail,
          userEmailSource: local.userEmail ? "local" : "global",
          defaultBranch: local.defaultBranch ?? mockGlobalConfig.defaultBranch,
          pullRebase: local.pullRebase ?? mockGlobalConfig.pullRebase,
          gpgSign: local.gpgSign ?? mockGlobalConfig.gpgSign,
          gpgKey: local.gpgKey ?? mockGlobalConfig.gpgKey,
          fetchPrune: local.fetchPrune ?? mockGlobalConfig.fetchPrune,
          rebaseAutostash: local.rebaseAutostash ?? mockGlobalConfig.rebaseAutostash,
        };
      }
      return { ...mockGlobalConfig };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<GitConfigDto>("get_git_config", { repoPath: repoPath ?? null });
  },

  setGitConfig: async (
    repoPath: string | null | undefined,
    scope: ConfigScope,
    key: string,
    value: string
  ): Promise<void> => {
    if (!isTauri()) {
      if (scope === "global") {
        if (key === "user.name") mockGlobalConfig.userName = value;
        if (key === "user.email") mockGlobalConfig.userEmail = value;
        if (key === "init.defaultBranch") mockGlobalConfig.defaultBranch = value;
        if (key === "pull.rebase") mockGlobalConfig.pullRebase = value === "true";
        if (key === "commit.gpgsign") mockGlobalConfig.gpgSign = value === "true";
        if (key === "user.signingkey") mockGlobalConfig.gpgKey = value;
        if (key === "fetch.prune") mockGlobalConfig.fetchPrune = value === "true";
        if (key === "rebase.autoStash") mockGlobalConfig.rebaseAutostash = value === "true";
      } else if (scope === "local" && repoPath) {
        if (!mockLocalConfigs[repoPath]) mockLocalConfigs[repoPath] = {};
        if (value.trim() === "") {
          if (key === "user.name") delete mockLocalConfigs[repoPath].userName;
          if (key === "user.email") delete mockLocalConfigs[repoPath].userEmail;
          if (key === "pull.rebase") delete mockLocalConfigs[repoPath].pullRebase;
          if (key === "commit.gpgsign") delete mockLocalConfigs[repoPath].gpgSign;
          if (key === "user.signingkey") delete mockLocalConfigs[repoPath].gpgKey;
          if (key === "fetch.prune") delete mockLocalConfigs[repoPath].fetchPrune;
          if (key === "rebase.autoStash") delete mockLocalConfigs[repoPath].rebaseAutostash;
        } else {
          if (key === "user.name") mockLocalConfigs[repoPath].userName = value;
          if (key === "user.email") mockLocalConfigs[repoPath].userEmail = value;
          if (key === "pull.rebase") mockLocalConfigs[repoPath].pullRebase = value === "true";
          if (key === "commit.gpgsign") mockLocalConfigs[repoPath].gpgSign = value === "true";
          if (key === "user.signingkey") mockLocalConfigs[repoPath].gpgKey = value;
          if (key === "fetch.prune") mockLocalConfigs[repoPath].fetchPrune = value === "true";
          if (key === "rebase.autoStash") mockLocalConfigs[repoPath].rebaseAutostash = value === "true";
        }
      }
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("set_git_config", {
      repoPath: repoPath ?? null,
      scope,
      key,
      value,
    });
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

export async function listenToTaskProgress(
  handler: (payload: TaskProgressPayload) => void
): Promise<() => void> {
  if (!isTauri()) {
    const mockListener = (e: Event) => {
      const customEvent = e as CustomEvent<TaskProgressPayload>;
      handler(customEvent.detail);
    };
    window.addEventListener("mock-task-progress", mockListener);
    return () => window.removeEventListener("mock-task-progress", mockListener);
  }

  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<TaskProgressPayload>("task-progress", (event) => {
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
  StashItem,
  RepoStateInfo,
  MergeResult,
  RebaseResult,
  CommitActionResult,
  ConflictHunk,
  ConflictFileData,
  ConfigScope,
  GitConfigDto,
  TagItem,
};

