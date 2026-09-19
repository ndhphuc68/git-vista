/**
 * staging IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const stagingCommands = {
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
};
