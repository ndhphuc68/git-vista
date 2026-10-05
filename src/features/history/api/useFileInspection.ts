/**
 * Query hooks for reading a file's diff, blame and commit history at a given
 * revision. This module lives in `features/history/api`, the only place in
 * `features/history` allowed to import `ipc/`; components compose these
 * hooks instead of calling `invokeCommand` directly.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Diff of `filePath` as changed by `commitId`, respecting `ignoreWhitespace`. */
export function useCommitFileDiff(
  repoPath: string,
  commitId: string,
  filePath: string,
  ignoreWhitespace: boolean
) {
  return useQuery({
    queryKey: qk.fileDiff(repoPath, commitId, filePath, ignoreWhitespace),
    queryFn: () => invokeCommand.getCommitFileDiff(repoPath, commitId, filePath, ignoreWhitespace),
  });
}

/** Blame for `filePath` at `commitId` (or the working tree when null/undefined). */
export function useFileBlame(
  repoPath: string,
  filePath: string,
  commitId: string | null | undefined
) {
  return useQuery({
    queryKey: qk.fileBlame(repoPath, filePath, commitId ?? ""),
    queryFn: () => invokeCommand.getFileBlame(repoPath, filePath, commitId),
  });
}

/** Commit history touching `filePath`. */
export function useFileHistory(repoPath: string, filePath: string) {
  return useQuery({
    queryKey: qk.fileHistory(repoPath, filePath),
    queryFn: () => invokeCommand.getFileHistory(repoPath, filePath, 0, 100),
  });
}
