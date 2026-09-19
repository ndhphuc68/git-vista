import {
  commands,
  type SystemInfo,
  type RepoHeadInfo,
  type RepoChangedPayload,
  type TaskProgressPayload,
  type RepoSummary,
  type RecentRepoEntry,
  type BranchListResult,
  type CommitGraphPage,
  type CommitDetails,
  type FileDiffResult,
  type FileStatus,
  type StatusFileItem,
  type RepoStatusResult,
  type StashItem,
  type RepoStateInfo,
  type MergeResult,
  type RebaseResult,
  type CommitActionResult,
  type ConflictHunk,
  type ConflictFileData,
  type ConfigScope,
  type GitConfigDto,
  type TagItem,
  type FileBlameResult,
  type FileHistoryResult,
  type RemoteItem,
  type PruneResult,
  type RebaseCommitItem,
  type RebaseActionKind,
  type RebasePlanStep,
  type InteractiveRebaseResult,
  type CompareMode,
  type CompareCommitItem,
  type CompareFileItem,
  type CompareSummary,
  type GitHubRepoInfo,
  type CheckoutPrResult,
} from "./bindings.generated";

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

let mockRemotes: RemoteItem[] = [
  {
    name: "origin",
    fetch_url: "https://github.com/gitvista/git-vista.git",
    push_url: "https://github.com/gitvista/git-vista.git",
    branch_count: 5,
    is_default: true,
  },
];

export function resetMockRemotes() {
  mockRemotes = [
    {
      name: "origin",
      fetch_url: "https://github.com/gitvista/git-vista.git",
      push_url: "https://github.com/gitvista/git-vista.git",
      branch_count: 5,
      is_default: true,
    },
  ];
}

let mockRebaseCommits: RebaseCommitItem[] = [
  {
    id: "a1b2c3d4e5f67890123456789012345678901234",
    short_id: "a1b2c3d",
    summary: "feat: add user authentication",
    message: "feat: add user authentication\n\nImplements JWT login",
    author_name: "Developer",
    author_email: "dev@example.com",
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    parent_ids: ["0000000000000000000000000000000000000000"],
  },
  {
    id: "b2c3d4e5f6789012345678901234567890123456",
    short_id: "b2c3d4e",
    summary: "fix: resolve token expiry bug",
    message: "fix: resolve token expiry bug",
    author_name: "Developer",
    author_email: "dev@example.com",
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    parent_ids: ["a1b2c3d4e5f67890123456789012345678901234"],
  },
  {
    id: "c3d4e5f678901234567890123456789012345678",
    short_id: "c3d4e5f",
    summary: "docs: update API readme",
    message: "docs: update API readme",
    author_name: "Developer",
    author_email: "dev@example.com",
    timestamp: Math.floor(Date.now() / 1000) - 600,
    parent_ids: ["b2c3d4e5f6789012345678901234567890123456"],
  },
];

export function resetMockRebaseCommits() {
  mockRebaseCommits = [
    {
      id: "a1b2c3d4e5f67890123456789012345678901234",
      short_id: "a1b2c3d",
      summary: "feat: add user authentication",
      message: "feat: add user authentication\n\nImplements JWT login",
      author_name: "Developer",
      author_email: "dev@example.com",
      timestamp: Math.floor(Date.now() / 1000) - 3600,
      parent_ids: ["0000000000000000000000000000000000000000"],
    },
    {
      id: "b2c3d4e5f6789012345678901234567890123456",
      short_id: "b2c3d4e",
      summary: "fix: resolve token expiry bug",
      message: "fix: resolve token expiry bug",
      author_name: "Developer",
      author_email: "dev@example.com",
      timestamp: Math.floor(Date.now() / 1000) - 1800,
      parent_ids: ["a1b2c3d4e5f67890123456789012345678901234"],
    },
    {
      id: "c3d4e5f678901234567890123456789012345678",
      short_id: "c3d4e5f",
      summary: "docs: update API readme",
      message: "docs: update API readme",
      author_name: "Developer",
      author_email: "dev@example.com",
      timestamp: Math.floor(Date.now() / 1000) - 600,
      parent_ids: ["b2c3d4e5f6789012345678901234567890123456"],
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

let mockCompareSummary: CompareSummary = {
  base_rev: "main",
  target_rev: "feature/auth",
  resolved_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  resolved_target_oid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  effective_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  merge_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  mode: "MergeBase",
  ahead_count: 2,
  behind_count: 0,
  commits: [
    {
      id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      short_id: "a1b2c3d",
      summary: "feat: implement user authentication flow",
      author_name: "GitVista User",
      author_email: "user@gitvista.dev",
      timestamp: Math.floor(Date.now() / 1000) - 3600,
      parent_ids: ["b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"],
    },
    {
      id: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
      short_id: "b2c3d4e",
      summary: "chore: setup oauth config",
      author_name: "GitVista User",
      author_email: "user@gitvista.dev",
      timestamp: Math.floor(Date.now() / 1000) - 7200,
      parent_ids: ["c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"],
    },
  ],
  files: [
    {
      path: "src/auth.ts",
      old_path: null,
      status: "Modified",
      additions: 45,
      deletions: 12,
      is_binary: false,
    },
    {
      path: "src/config.ts",
      old_path: null,
      status: "Added",
      additions: 20,
      deletions: 0,
      is_binary: false,
    },
  ],
  total_additions: 65,
  total_deletions: 12,
};

export function resetMockCompareData() {
  mockCompareSummary = {
    base_rev: "main",
    target_rev: "feature/auth",
    resolved_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    resolved_target_oid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    effective_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    merge_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    mode: "MergeBase",
    ahead_count: 2,
    behind_count: 0,
    commits: [
      {
        id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
        short_id: "a1b2c3d",
        summary: "feat: implement user authentication flow",
        author_name: "GitVista User",
        author_email: "user@gitvista.dev",
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        parent_ids: ["b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"],
      },
      {
        id: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
        short_id: "b2c3d4e",
        summary: "chore: setup oauth config",
        author_name: "GitVista User",
        author_email: "user@gitvista.dev",
        timestamp: Math.floor(Date.now() / 1000) - 7200,
        parent_ids: ["c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"],
      },
    ],
    files: [
      {
        path: "src/auth.ts",
        old_path: null,
        status: "Modified",
        additions: 45,
        deletions: 12,
        is_binary: false,
      },
      {
        path: "src/config.ts",
        old_path: null,
        status: "Added",
        additions: 20,
        deletions: 0,
        is_binary: false,
      },
    ],
    total_additions: 65,
    total_deletions: 12,
  };
}

// Checks whether we are running inside the Tauri runtime
export const isTauri = (): boolean => {
  return (
    typeof window !== "undefined" &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
};

/**
 * Unwraps a generated command result into the shape the app expects.
 *
 * The generated bindings return `{ status: "ok" | "error" }` so callers can
 * branch on failure, but every call site here predates that and expects a
 * promise that resolves to the value or rejects. The error is rethrown exactly
 * as it arrived — a serialized `AppError` is `{ type, message }`, and
 * `toErrorMessage` reads that `message`. Wrapping it in an `Error` would lose
 * the variant and change what the UI displays.
 */
function unwrap<T, E>(result: { status: "ok"; data: T } | { status: "error"; error: E }): T {
  if (result.status === "error") {
    throw result.error;
  }
  return result.data;
}

export const invokeCommand = {
  ping: async (msg: string): Promise<string> => {
    if (!isTauri()) {
      return `[Browser mock] Pong: ${msg} (at ${new Date().toLocaleTimeString()})`;
    }
    // `ping` is the only command that does not return a Result, so it has no
    // status envelope to unwrap.
    return await commands.ping(msg);
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
    return unwrap(await commands.getSystemInfo());
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
    return unwrap(await commands.getRepoHeadInfo(repoPath));
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
    unwrap(await commands.simulateRepoChange(repoPath));
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
    return unwrap(await commands.openRepository(path));
  },

  closeRepository: async (path: string): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.closeRepository(path));
  },

  getOpenRepositories: async (): Promise<RepoSummary[]> => {
    if (!isTauri()) {
      return [];
    }
    return unwrap(await commands.getOpenRepositories());
  },

  getRecentRepos: async (): Promise<RecentRepoEntry[]> => {
    if (!isTauri()) {
      return [
        { path: "d:/project-v3", name: "project-v3", last_opened_at_ms: Date.now() - 3600000 },
      ];
    }
    return unwrap(await commands.getRecentRepos());
  },

  clearRecentRepos: async (): Promise<void> => {
    if (!isTauri()) return;
    await commands.clearRecentRepos();
  },

  removeRecentRepo: async (path: string): Promise<void> => {
    if (!isTauri()) return;
    await commands.removeRecentRepo(path);
  },

  selectRepoFolder: async (): Promise<string | null> => {
    if (!isTauri()) return "d:/project-v3";
    return unwrap(await commands.selectRepoFolder());
  },

  getBranches: async (repoPath: string): Promise<BranchListResult> => {
    if (!isTauri()) {
      return {
        current_branch: "main",
        is_detached: false,
        local: [
          {
            name: "main",
            is_head: true,
            target_commit_id: "c1",
            upstream: "origin/main",
            ahead: 0,
            behind: 0,
          },
        ],
        remote: [
          {
            name: "origin/main",
            is_head: false,
            target_commit_id: "c1",
            upstream: null,
            ahead: 0,
            behind: 0,
          },
        ],
        tags: ["v0.1.0"],
      };
    }
    return unwrap(await commands.getBranches(repoPath));
  },

  getCommitGraph: async (
    repoPath: string,
    offset: number,
    limit: number
  ): Promise<CommitGraphPage> => {
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
    return unwrap(await commands.getCommitGraph(repoPath, offset, limit));
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
    return unwrap(await commands.getCommitDetails(repoPath, commitId));
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
              {
                line_type: "delete",
                content: "- legacy mock line\n",
                old_lineno: 1,
                new_lineno: null,
              },
              { line_type: "add", content: "+ new live line\n", old_lineno: null, new_lineno: 1 },
            ],
          },
        ],
      };
    }
    return unwrap(
      await commands.getCommitFileDiff(repoPath, commitId, filePath, ignoreWhitespace ?? false)
    );
  },

  getRepoStatus: async (repoPath: string): Promise<RepoStatusResult> => {
    if (!isTauri()) {
      return {
        staged: [{ path: "src/staged.ts", status: "Modified", is_staged: true, old_path: null }],
        unstaged: [
          { path: "src/unstaged.ts", status: "Modified", is_staged: false, old_path: null },
        ],
        untracked: [{ path: "src/untracked.ts", status: "New", is_staged: false, old_path: null }],
        conflicted: [],
      };
    }
    return unwrap(await commands.getRepoStatus(repoPath));
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
    return unwrap(
      await commands.getWorkingFileDiff(repoPath, filePath, isStaged, ignoreWhitespace ?? false)
    );
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
    return unwrap(await commands.getFileBlame(repoPath, filePath, commitId ?? null));
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
    return unwrap(await commands.getFileHistory(repoPath, filePath, offset ?? null, limit ?? null));
  },

  stageFile: async (repoPath: string, filePath: string): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.stageFile(repoPath, filePath));
  },

  unstageFile: async (repoPath: string, filePath: string): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.unstageFile(repoPath, filePath));
  },

  stageAll: async (repoPath: string): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.stageAll(repoPath));
  },

  unstageAll: async (repoPath: string): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.unstageAll(repoPath));
  },

  discardFileChanges: async (repoPath: string, filePath: string): Promise<string> => {
    if (!isTauri()) return "browser-discard-receipt";
    return unwrap(await commands.discardFileChanges(repoPath, filePath));
  },

  restoreDiscard: async (repoPath: string, token: string): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.restoreDiscard(repoPath, token));
  },

  stageHunk: async (
    repoPath: string,
    filePath: string,
    hunkIndex: number,
    isStaged: boolean
  ): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.stageHunk(repoPath, filePath, hunkIndex, isStaged));
  },

  stageLines: async (
    repoPath: string,
    filePath: string,
    hunkIndex: number,
    lineIndices: number[],
    isStaged: boolean
  ): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.stageLines(repoPath, filePath, hunkIndex, lineIndices, isStaged));
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
    return unwrap(
      await commands.createCommit(repoPath, summary, description ?? null, amend ?? null)
    );
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
    await commands.createBranch(repoPath, name, targetCommit ?? null, checkout ?? null);
  },

  checkoutBranch: async (repoPath: string, branchName: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.checkoutBranch(repoPath, branchName);
  },

  renameBranch: async (repoPath: string, oldName: string, newName: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.renameBranch(repoPath, oldName, newName);
  },

  deleteBranch: async (repoPath: string, branchName: string, force?: boolean): Promise<string> => {
    if (!isTauri()) {
      return `refs/gitui-backup/delete-branch-${branchName}-${Date.now()}`;
    }
    return unwrap(await commands.deleteBranch(repoPath, branchName, force ?? null));
  },

  getTags: async (repoPath: string): Promise<TagItem[]> => {
    if (!isTauri()) {
      return [...mockTags];
    }
    return unwrap(await commands.getTags(repoPath));
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
    await commands.createTag(repoPath, name, targetCommit, message ?? null);
  },

  deleteTag: async (repoPath: string, name: string, deleteRemote?: boolean): Promise<void> => {
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
    await commands.deleteTag(repoPath, name, deleteRemote ?? null);
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
    await commands.checkoutTag(repoPath, name);
  },

  pushTag: async (repoPath: string, name: string, remoteName?: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.pushTag(repoPath, name, remoteName ?? null);
  },

  getRemotes: async (repoPath: string): Promise<RemoteItem[]> => {
    if (!isTauri()) {
      return [...mockRemotes];
    }
    return unwrap(await commands.getRemotes(repoPath));
  },

  addRemote: async (repoPath: string, name: string, url: string): Promise<RemoteItem> => {
    if (!isTauri()) {
      const newRemote: RemoteItem = {
        name,
        fetch_url: url,
        push_url: url,
        branch_count: 0,
        is_default: mockRemotes.length === 0,
      };
      mockRemotes.push(newRemote);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return newRemote;
    }
    return unwrap(await commands.addRemote(repoPath, name, url));
  },

  renameRemote: async (repoPath: string, oldName: string, newName: string): Promise<void> => {
    if (!isTauri()) {
      const r = mockRemotes.find((x) => x.name === oldName);
      if (r) r.name = newName;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.renameRemote(repoPath, oldName, newName);
  },

  removeRemote: async (repoPath: string, name: string): Promise<void> => {
    if (!isTauri()) {
      mockRemotes = mockRemotes.filter((x) => x.name !== name);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.removeRemote(repoPath, name);
  },

  setRemoteUrl: async (
    repoPath: string,
    name: string,
    fetchUrl: string,
    pushUrl?: string | null
  ): Promise<void> => {
    if (!isTauri()) {
      const r = mockRemotes.find((x) => x.name === name);
      if (r) {
        r.fetch_url = fetchUrl;
        r.push_url = pushUrl !== undefined && pushUrl !== null ? pushUrl : fetchUrl;
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.setRemoteUrl(repoPath, name, fetchUrl, pushUrl ?? null);
  },

  pruneRemote: async (repoPath: string, remote: string, taskId?: string): Promise<PruneResult> => {
    if (!isTauri()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "prune",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return {
        remote,
        pruned_branches: [`${remote}/stale-mock-branch`],
        message: "Đã dọn dẹp 1 nhánh remote.",
      };
    }
    return unwrap(await commands.pruneRemote(repoPath, remote, taskId ?? null));
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
    return unwrap(
      await commands.fetchRepo(repoPath, remote ?? null, prune ?? null, taskId ?? null)
    );
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
    return unwrap(
      await commands.pullRepo(
        repoPath,
        remote ?? null,
        branch ?? null,
        rebase ?? null,
        taskId ?? null
      )
    );
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
    return unwrap(
      await commands.pushRepo(
        repoPath,
        remote ?? null,
        branch ?? null,
        setUpstream ?? null,
        force ?? null,
        taskId ?? null
      )
    );
  },

  cloneRepo: async (url: string, targetDir: string, taskId?: string): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Clone hoàn tất";
    }
    return unwrap(await commands.cloneRepo(url, targetDir, taskId ?? null));
  },

  cancelRemoteTask: async (taskId: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.cancelRemoteTask(taskId);
  },

  setRepoPullRebase: async (repoPath: string, rebase: boolean): Promise<void> => {
    if (!isTauri()) {
      if (!mockLocalConfigs[repoPath]) mockLocalConfigs[repoPath] = {};
      mockLocalConfigs[repoPath].pullRebase = rebase;
      return;
    }
    await commands.setRepoPullRebase(repoPath, rebase);
  },

  getStashes: async (repoPath: string): Promise<StashItem[]> => {
    if (!isTauri()) {
      return [...mockStashes];
    }
    return unwrap(await commands.getStashes(repoPath));
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
    return unwrap(await commands.saveStash(repoPath, message ?? null, includeUntracked ?? null));
  },

  applyStash: async (repoPath: string, index: number): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.applyStash(repoPath, index);
  },

  popStash: async (repoPath: string, index: number): Promise<void> => {
    if (!isTauri()) {
      mockStashes = mockStashes
        .filter((s) => s.index !== index)
        .map((s, idx) => ({ ...s, index: idx }));
      return;
    }
    await commands.popStash(repoPath, index);
  },

  dropStash: async (repoPath: string, index: number): Promise<string> => {
    if (!isTauri()) {
      mockStashes = mockStashes
        .filter((s) => s.index !== index)
        .map((s, idx) => ({ ...s, index: idx }));
      return `refs/gitui-backup/stash-drop-undo-${Date.now()}`;
    }
    return unwrap(await commands.dropStash(repoPath, index));
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
    return unwrap(await commands.getRepoState(repoPath));
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
    return unwrap(await commands.mergeBranch(repoPath, targetBranch, noFf ?? null));
  },

  rebaseBranch: async (repoPath: string, upstreamBranch: string): Promise<RebaseResult> => {
    if (!isTauri()) {
      return {
        success: true,
        status: "Success",
        output: `Successfully rebased and updated refs/heads/main`,
      };
    }
    return unwrap(await commands.rebaseBranch(repoPath, upstreamBranch));
  },

  getRebaseCommits: async (repoPath: string, baseCommitId: string): Promise<RebaseCommitItem[]> => {
    if (!isTauri()) {
      return [...mockRebaseCommits];
    }
    return unwrap(await commands.getRebaseCommits(repoPath, baseCommitId));
  },

  executeInteractiveRebase: async (
    repoPath: string,
    baseCommitId: string,
    steps: RebasePlanStep[],
    autoStash?: boolean
  ): Promise<InteractiveRebaseResult> => {
    if (!isTauri()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "execute_interactive_rebase",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return {
        success: true,
        status: "Success",
        head_commit_id: "mock-new-head-oid",
        undo_token: "refs/gitui-backup/commit-undo-mock-123",
        output: "Successfully rebased and updated refs/heads/main.",
      };
    }
    return unwrap(
      await commands.executeInteractiveRebase(repoPath, baseCommitId, steps, autoStash ?? false)
    );
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
    return unwrap(await commands.cherryPickCommit(repoPath, commitId, autoCommit));
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
    return unwrap(await commands.revertCommit(repoPath, commitId, autoCommit));
  },

  abortInProgress: async (repoPath: string, operation: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.abortInProgress(repoPath, operation);
  },

  continueInProgress: async (repoPath: string, operation: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.continueInProgress(repoPath, operation);
  },

  getConflictFileData: async (repoPath: string, filePath: string): Promise<ConflictFileData> => {
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
    return unwrap(await commands.getConflictFileData(repoPath, filePath));
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
    await commands.resolveConflictFile(repoPath, filePath, resolvedContent, autoStage ?? null);
  },

  undoCommit: async (repoPath: string, undoToken: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.undoCommit(repoPath, undoToken);
  },

  undoDeleteBranch: async (
    repoPath: string,
    branchName: string,
    backupRef: string
  ): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.undoDeleteBranch(repoPath, branchName, backupRef);
  },

  undoDropStash: async (repoPath: string, receipt: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.undoDropStash(repoPath, receipt);
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
    return unwrap(await commands.getGitConfig(repoPath ?? null));
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
          if (key === "rebase.autoStash")
            mockLocalConfigs[repoPath].rebaseAutostash = value === "true";
        }
      }
      return;
    }
    await commands.setGitConfig(repoPath ?? null, scope, key, value);
  },

  compareCommits: async (
    repoPath: string,
    baseRev: string,
    targetRev: string,
    mode: CompareMode
  ): Promise<CompareSummary> => {
    if (!isTauri()) {
      return {
        ...mockCompareSummary,
        base_rev: baseRev,
        target_rev: targetRev,
        mode,
      };
    }
    return unwrap(await commands.compareCommits(repoPath, baseRev, targetRev, mode));
  },

  getCompareFileDiff: async (
    repoPath: string,
    baseRev: string,
    targetRev: string,
    filePath: string,
    mode: CompareMode,
    ignoreWhitespace?: boolean
  ): Promise<FileDiffResult> => {
    if (!isTauri()) {
      return {
        file_path: filePath,
        status: "modified",
        additions: 3,
        deletions: 1,
        hunks: [
          {
            header: "@@ -1,4 +1,6 @@",
            old_start: 1,
            old_lines: 4,
            new_start: 1,
            new_lines: 6,
            lines: [
              {
                line_type: "context",
                content: " import { useState } from 'react';\n",
                old_lineno: 1,
                new_lineno: 1,
              },
              {
                line_type: "delete",
                content: "- const isAuth = false;\n",
                old_lineno: 2,
                new_lineno: null,
              },
              {
                line_type: "add",
                content: "+ const isAuth = true;\n",
                old_lineno: null,
                new_lineno: 2,
              },
              {
                line_type: "add",
                content: "+ export const token = 'jwt-token';\n",
                old_lineno: null,
                new_lineno: 3,
              },
              {
                line_type: "context",
                content: " export default function Auth() {}\n",
                old_lineno: 3,
                new_lineno: 4,
              },
            ],
          },
        ],
      };
    }
    return unwrap(
      await commands.getCompareFileDiff(
        repoPath,
        baseRev,
        targetRev,
        filePath,
        mode,
        ignoreWhitespace ?? false
      )
    );
  },

  getGitHubRepoInfo: async (repoPath: string): Promise<GitHubRepoInfo> => {
    if (!isTauri()) {
      return {
        is_github: true,
        owner: "antigravity-ai",
        repo: "git-vista",
        default_branch: "main",
      };
    }
    return unwrap(await commands.getGithubRepoInfo(repoPath));
  },

  getGitHubToken: async (): Promise<string | null> => {
    if (!isTauri()) {
      return localStorage.getItem("gitvista_github_token");
    }
    return unwrap(await commands.getGithubToken());
  },

  saveGitHubToken: async (token: string): Promise<void> => {
    if (!isTauri()) {
      localStorage.setItem("gitvista_github_token", token);
      return;
    }
    await commands.saveGithubToken(token);
  },

  removeGitHubToken: async (): Promise<void> => {
    if (!isTauri()) {
      localStorage.removeItem("gitvista_github_token");
      return;
    }
    await commands.removeGithubToken();
  },

  checkoutPullRequest: async (repoPath: string, prNumber: number): Promise<CheckoutPrResult> => {
    if (!isTauri()) {
      return {
        branch_name: `pr/${prNumber}`,
        message: `Đã chuyển sang nhánh pr/${prNumber} thành công.`,
      };
    }
    return unwrap(await commands.checkoutPullRequest(repoPath, prNumber));
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
  RemoteItem,
  PruneResult,
  RebaseCommitItem,
  RebaseActionKind,
  RebasePlanStep,
  InteractiveRebaseResult,
  CompareMode,
  CompareCommitItem,
  CompareFileItem,
  CompareSummary,
};
