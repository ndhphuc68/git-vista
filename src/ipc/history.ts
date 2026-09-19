/**
 * history IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import {
  commands,
  type BranchListResult,
  type CommitDetails,
  type CommitGraphPage,
  type FileBlameResult,
  type FileDiffResult,
  type FileHistoryResult,
  type RepoStatusResult,
} from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const historyCommands = {
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
};
