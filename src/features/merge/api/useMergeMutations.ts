import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface MergeBranchVars {
  targetBranch: string;
  noFf?: boolean;
}

export interface RebaseBranchVars {
  upstreamBranch: string;
}

/** Preserves the sidebar refresh scope for merge and rebase operations. */
function invalidateSidebarScope(queryClient: QueryClient, repoPath: string) {
  queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
  queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
  queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
  queryClient.invalidateQueries({ queryKey: qk.repo.head(repoPath) });
}

/** Merges a branch and returns the backend merge result. */
export function useMergeBranch(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: MergeBranchVars) =>
      invokeCommand.mergeBranch(repoPath, vars.targetBranch, vars.noFf),
    onSuccess: () => invalidateSidebarScope(queryClient, repoPath),
  });
}

/** Rebases onto a branch and returns the backend rebase result. */
export function useRebaseBranch(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: RebaseBranchVars) =>
      invokeCommand.rebaseBranch(repoPath, vars.upstreamBranch),
    onSuccess: () => invalidateSidebarScope(queryClient, repoPath),
  });
}
