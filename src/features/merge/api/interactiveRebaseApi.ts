/**
 * Query hook and wrapper for interactive rebase: fetching the commits between
 * a base commit and HEAD, and executing the edited rebase plan. This module
 * lives in `features/merge/api`, the only place in `features/merge` allowed
 * to import `ipc/`; `InteractiveRebaseModal` composes these instead of
 * calling `invokeCommand` directly.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";
import type { InteractiveRebaseResult, RebasePlanStep } from "../../../ipc/bindings.generated";

/**
 * Commits between `baseCommitId` and HEAD, used to seed the rebase plan.
 * `isOpen` gates `enabled` because `InteractiveRebaseModal` stays mounted
 * while closed; without it the query would keep firing in the background.
 */
export function useRebaseCommits(repoPath: string, baseCommitId: string, isOpen: boolean) {
  return useQuery({
    queryKey: qk.rebaseCommits(repoPath, baseCommitId),
    queryFn: () => invokeCommand.getRebaseCommits(repoPath, baseCommitId),
    enabled: isOpen && Boolean(repoPath) && Boolean(baseCommitId),
  });
}

/** Executes the interactive rebase plan; `autoStash=false` disables auto-stashing. */
export function executeInteractiveRebase(
  repoPath: string,
  baseCommitId: string,
  steps: RebasePlanStep[],
  autoStash?: boolean
): Promise<InteractiveRebaseResult> {
  return invokeCommand.executeInteractiveRebase(repoPath, baseCommitId, steps, autoStash);
}
