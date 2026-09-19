/**
 * conflict IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type ConflictFileData } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const conflictCommands = {
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
};
