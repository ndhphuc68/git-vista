/**
 * branch IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type CommitDetails } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const branchCommands = {
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
};
