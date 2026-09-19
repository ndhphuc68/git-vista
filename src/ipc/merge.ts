/**
 * merge IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import {
  commands,
  type MergeResult,
  type RebaseResult,
  type RepoStateInfo,
} from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const mergeCommands = {
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
};
