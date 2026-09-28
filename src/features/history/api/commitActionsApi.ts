/**
 * Thin wrappers over the cherry-pick and revert commit-action IPC commands.
 * This module lives in `features/history/api`, the only place in
 * `features/history` allowed to import `ipc/`; components compose these
 * functions instead of calling `invokeCommand` directly.
 */
import { invokeCommand } from "../../../ipc/client";
import type { CommitActionResult } from "../../../ipc/bindings.generated";

/** Cherry-picks `commitId` onto HEAD; `autoCommit=false` only stages the result. */
export function cherryPickCommit(
  repoPath: string,
  commitId: string,
  autoCommit?: boolean
): Promise<CommitActionResult> {
  return invokeCommand.cherryPickCommit(repoPath, commitId, autoCommit);
}

/** Reverts `commitId` on HEAD; `autoCommit=false` only stages the result. */
export function revertCommit(
  repoPath: string,
  commitId: string,
  autoCommit?: boolean
): Promise<CommitActionResult> {
  return invokeCommand.revertCommit(repoPath, commitId, autoCommit);
}
