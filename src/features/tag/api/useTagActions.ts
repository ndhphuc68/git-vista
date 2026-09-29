import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface CheckoutTagVars {
  name: string;
}

export interface PushTagVars {
  name: string;
  remoteName?: string;
}

/** Checks out a tag and refreshes every repository query after success. */
export function useCheckoutTag(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: CheckoutTagVars) => invokeCommand.checkoutTag(repoPath, vars.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}

/** Pushes a tag and refreshes every repository query after success. */
export function usePushTag(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: PushTagVars) => invokeCommand.pushTag(repoPath, vars.name, vars.remoteName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}
