/**
 * Imperative commit-details read, for callers that load details outside a
 * React Query hook. Prefer `useCommitDetails` when rendering.
 */
import { invokeCommand } from "../../../ipc/client";
import type { CommitDetails } from "./useCommitDetails";

/** Full details (metadata and changed files) of one commit. */
export function getCommitDetails(repoPath: string, commitId: string): Promise<CommitDetails> {
  return invokeCommand.getCommitDetails(repoPath, commitId);
}
