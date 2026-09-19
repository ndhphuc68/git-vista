/**
 * rebase IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import {
  commands,
  type InteractiveRebaseResult,
  type RebaseCommitItem,
  type RebasePlanStep,
} from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";

export const rebaseCommands = {
  getRebaseCommits: async (repoPath: string, baseCommitId: string): Promise<RebaseCommitItem[]> => {
    if (!isTauri()) {
      return [...mockState.rebaseCommits];
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
};
