/**
 * Query hooks and thin wrappers for conflict resolution and in-progress
 * merge/rebase operations. This module lives in `features/conflict/api`,
 * the only place in `features/conflict` allowed to import `ipc/`;
 * `ConflictResolverScreen` and `App.tsx` compose these instead of calling
 * `invokeCommand` directly.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { type ConflictFileData, type RepoStateInfo } from "../../../ipc/bindings.generated";
import { qk } from "../../../domain/queryKeys";

/** Conflict hunks for `filePath` in `repoPath`; only fetched when `enabled` is true. */
export function useConflictFile(repoPath: string, filePath: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.conflictFile(repoPath, filePath),
    queryFn: () => invokeCommand.getConflictFileData(repoPath, filePath),
    enabled: enabled && Boolean(repoPath) && Boolean(filePath),
  });
}

/** Merge/rebase in-progress state of `repoPath`. */
export function useRepoState(repoPath: string) {
  return useQuery({
    queryKey: qk.repo.state(repoPath),
    queryFn: () => invokeCommand.getRepoState(repoPath),
    enabled: Boolean(repoPath),
  });
}

/** Aborts the in-progress `operation` (merge/rebase) on `repoPath`. */
export function abortInProgress(repoPath: string, operation: string): Promise<void> {
  return invokeCommand.abortInProgress(repoPath, operation);
}

/** Continues the in-progress `operation` (merge/rebase) on `repoPath` after conflicts are resolved. */
export function continueInProgress(repoPath: string, operation: string): Promise<void> {
  return invokeCommand.continueInProgress(repoPath, operation);
}

/** Writes the resolved content of `filePath` back to disk, staging it when `autoStage` is true. */
export function resolveConflictFile(
  repoPath: string,
  filePath: string,
  resolvedContent: string,
  autoStage?: boolean
): Promise<void> {
  return invokeCommand.resolveConflictFile(repoPath, filePath, resolvedContent, autoStage);
}

export type { ConflictFileData, RepoStateInfo };
