import { useQueryClient } from "@tanstack/react-query";
import { abortInProgress, continueInProgress, resolveConflictFile } from "../features/conflict";
import { qk } from "../domain/queryKeys";

/**
 * Abort/continue an in-progress git operation (merge, rebase, cherry-pick…)
 * and resolve-and-stage a conflicted file, each followed by a scoped refresh
 * of the current repo's cache.
 */
export function useInProgressActions(repoPath: string) {
  const queryClient = useQueryClient();

  const handleAbort = async (operation: string) => {
    await abortInProgress(repoPath, operation);
    // Git operation on the current repo: only refresh this repo's cache
    queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
  };

  const handleContinue = async (operation: string) => {
    await continueInProgress(repoPath, operation);
    // Git operation on the current repo: only refresh this repo's cache
    queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
  };

  const handleResolveAndStage = async (
    filePath: string,
    content: string,
    onResolved: () => void
  ) => {
    await resolveConflictFile(repoPath, filePath, content, true);
    onResolved();
    // Git operation on the current repo: only refresh this repo's cache
    queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
  };

  return { handleAbort, handleContinue, handleResolveAndStage };
}
