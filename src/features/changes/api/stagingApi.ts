/**
 * Thin wrappers over the staging and commit IPC commands. This module lives
 * in `features/changes/api`, the only place in `features/changes` allowed to
 * import `ipc/`; `ChangesScreen` and `CommitBox` compose these functions
 * instead of calling `invokeCommand` directly.
 */
import { invokeCommand } from "../../../ipc/client";
import type { CommitDetails } from "../../../ipc/bindings.generated";

/** Stages `filePath` in `repoPath`'s working tree. */
export function stageFile(repoPath: string, filePath: string): Promise<void> {
  return invokeCommand.stageFile(repoPath, filePath);
}

/** Unstages `filePath` in `repoPath`'s working tree. */
export function unstageFile(repoPath: string, filePath: string): Promise<void> {
  return invokeCommand.unstageFile(repoPath, filePath);
}

/** Stages every changed file in `repoPath`. */
export function stageAll(repoPath: string): Promise<void> {
  return invokeCommand.stageAll(repoPath);
}

/** Unstages every changed file in `repoPath`. */
export function unstageAll(repoPath: string): Promise<void> {
  return invokeCommand.unstageAll(repoPath);
}

/** Discards working-tree changes to `filePath`, returning a token that can restore them. */
export function discardFileChanges(repoPath: string, filePath: string): Promise<string> {
  return invokeCommand.discardFileChanges(repoPath, filePath);
}

/** Restores changes previously discarded with the `token` from `discardFileChanges`. */
export function restoreDiscard(repoPath: string, token: string): Promise<void> {
  return invokeCommand.restoreDiscard(repoPath, token);
}

/** Stages or unstages a single hunk (`isStaged` selects the direction) of `filePath`. */
export function stageHunk(
  repoPath: string,
  filePath: string,
  hunkIndex: number,
  isStaged: boolean
): Promise<void> {
  return invokeCommand.stageHunk(repoPath, filePath, hunkIndex, isStaged);
}

/** Stages or unstages specific lines within a hunk (`isStaged` selects the direction). */
export function stageLines(
  repoPath: string,
  filePath: string,
  hunkIndex: number,
  lineIndices: number[],
  isStaged: boolean
): Promise<void> {
  return invokeCommand.stageLines(repoPath, filePath, hunkIndex, lineIndices, isStaged);
}

/** Creates a commit from the currently staged changes (or amends HEAD when `amend` is true). */
export function createCommit(
  repoPath: string,
  summary: string,
  description?: string,
  amend?: boolean
): Promise<CommitDetails> {
  return invokeCommand.createCommit(repoPath, summary, description, amend);
}
