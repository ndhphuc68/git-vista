import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export function useCheckoutBranch(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) => invokeCommand.checkoutBranch(repoPath, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}
