import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/**
 * Saving, applying and popping a stash all move changes in or out of the
 * working tree, so the repo status and graph have to be refetched too.
 * qk.repo.all covers them because every key starts with ["repo", repoPath].
 */
function invalidateRepoScope(queryClient: QueryClient, repoPath: string) {
  queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
}

export interface SaveStashVars {
  message?: string | null;
  includeUntracked?: boolean;
}

/** Creates a stash and resolves with the commit id the backend returns. */
export function useSaveStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<string, unknown, SaveStashVars>({
    mutationFn: (vars) => invokeCommand.saveStash(repoPath, vars.message, vars.includeUntracked),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

export interface StashIndexVars {
  index: number;
}

export function useApplyStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: StashIndexVars) => invokeCommand.applyStash(repoPath, vars.index),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

export function usePopStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: StashIndexVars) => invokeCommand.popStash(repoPath, vars.index),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

/**
 * Drops a stash entry and resolves with the receipt the undo toast needs.
 *
 * Unlike the three above, this only refreshes the stash list: removing an
 * entry leaves the working tree untouched, so widening the scope would
 * refetch the status, graph and branches for nothing.
 */
export function useDropStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<string, unknown, StashIndexVars>({
    mutationFn: (vars) => invokeCommand.dropStash(repoPath, vars.index),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stashes(repoPath) });
    },
  });
}
