/**
 * compare IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import {
  commands,
  type CompareMode,
  type CompareSummary,
  type FileDiffResult,
} from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";

export const compareCommands = {
  compareCommits: async (
    repoPath: string,
    baseRev: string,
    targetRev: string,
    mode: CompareMode
  ): Promise<CompareSummary> => {
    if (!isTauri()) {
      return {
        ...mockState.compareSummary,
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
};
