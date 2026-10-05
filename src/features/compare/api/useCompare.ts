/**
 * Query hooks for comparing two revisions (branches/commits) and reading the
 * diff of a single file within that comparison. This module lives in
 * `features/compare/api`, the only place in `features/compare` allowed to
 * import `ipc/`; `CompareModal` and `CompareDiffViewer` compose these hooks
 * instead of calling `invokeCommand` directly.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";
import type { CompareMode } from "../../../ipc/bindings.generated";

/**
 * Summary (commits + files) of comparing `baseRev` against `targetRev`.
 * `isOpen` gates `enabled` because `CompareModal` stays mounted while
 * closed; without it the query would keep firing in the background.
 */
export function useCompareSummary(
  repoPath: string,
  baseRev: string,
  targetRev: string,
  mode: CompareMode,
  isOpen: boolean
) {
  return useQuery({
    queryKey: qk.compareSummary(repoPath, baseRev, targetRev, mode),
    queryFn: () => invokeCommand.compareCommits(repoPath, baseRev, targetRev, mode),
    enabled: isOpen && Boolean(repoPath) && Boolean(baseRev) && Boolean(targetRev),
  });
}

/** Diff of a single file within a `baseRev`..`targetRev` comparison. */
export function useCompareFileDiff(
  repoPath: string,
  options: {
    baseRev: string;
    targetRev: string;
    filePath: string;
    mode: CompareMode;
    ignoreWhitespace: boolean;
  }
) {
  const { baseRev, targetRev, filePath, mode, ignoreWhitespace } = options;
  return useQuery({
    queryKey: qk.compareFileDiff(repoPath, options),
    queryFn: () =>
      invokeCommand.getCompareFileDiff(
        repoPath,
        baseRev,
        targetRev,
        filePath,
        mode,
        ignoreWhitespace
      ),
    enabled: Boolean(repoPath && baseRev && targetRev && filePath),
  });
}
