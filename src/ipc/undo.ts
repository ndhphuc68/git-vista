/**
 * undo IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands } from "./bindings.generated";
import { isTauri } from "./core";

export const undoCommands = {
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
};
