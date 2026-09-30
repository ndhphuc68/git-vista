import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface CheckoutCommitVars {
  commitId: string;
}

export function useCheckoutCommit(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: CheckoutCommitVars) =>
      invokeCommand.checkoutCommit(repoPath, vars.commitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}
