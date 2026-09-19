/**
 * commitAction IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type CommitActionResult } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const commitActionCommands = {
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
};
