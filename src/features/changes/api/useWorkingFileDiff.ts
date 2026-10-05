/**
 * Query hook for the working-tree diff of a single file. This module lives
 * in `features/changes/api`, the only place in `features/changes` allowed to
 * import `ipc/`; `InteractiveDiffViewer` composes this hook instead of
 * calling `invokeCommand` directly.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Diff of `filePath` in the working tree, staged or not, honoring `ignoreWhitespace`. */
export function useWorkingFileDiff(
  repoPath: string,
  filePath: string,
  isStaged: boolean,
  ignoreWhitespace: boolean
) {
  return useQuery({
    queryKey: qk.workingFileDiff(repoPath, filePath, isStaged, ignoreWhitespace),
    queryFn: () => invokeCommand.getWorkingFileDiff(repoPath, filePath, isStaged, ignoreWhitespace),
    enabled: Boolean(repoPath && filePath),
  });
}
