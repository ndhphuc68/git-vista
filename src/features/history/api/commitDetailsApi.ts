/**
 * Imperative commit-details read, for callers that load details outside a
 * React Query hook. Prefer `useCommitDetails` when rendering. This module
 * lives in `features/history/api`, the only place in `features/history`
 * allowed to import `ipc/`; components compose this function (or the hooks
 * alongside it) instead of calling `invokeCommand` directly.
 */
import { invokeCommand } from "../../../ipc/client";
import type { CommitDetails } from "./useCommitDetails";

/** Full details (metadata and changed files) of one commit. */
export function getCommitDetails(repoPath: string, commitId: string): Promise<CommitDetails> {
  return invokeCommand.getCommitDetails(repoPath, commitId);
}
