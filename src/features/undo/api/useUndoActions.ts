import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface UndoDropStashVars {
  receipt: string;
}

/** Restores a dropped stash and refreshes the affected stash list after success. */
export function useUndoDropStash(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, UndoDropStashVars>({
    mutationFn: (vars) => invokeCommand.undoDropStash(repoPath, vars.receipt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stashes(repoPath) });
    },
  });
}
