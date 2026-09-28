import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface UndoDropStashVars {
  receipt: string;
}

/** Restores a dropped stash and refreshes the affected stash list after success. */
export function useUndoDropStash(repoPath: string) {
  const queryClient = useQueryClient();
  const restore = async ({ receipt }: UndoDropStashVars) => {
    await invokeCommand.undoDropStash(repoPath, receipt);
    queryClient.invalidateQueries({ queryKey: qk.stashes(repoPath) });
  };
  const mutation = useMutation<void, unknown, UndoDropStashVars>({
    mutationFn: restore,
  });

  return {
    ...mutation,
    // Toasts outlive repository selection; retain this render's owner instead
    // of mutateAsync, whose observer reads the latest repository options.
    createUndoAction: (receipt: string) => () => restore({ receipt }),
  };
}

/** Restores a branch deleted with `backupRef` as its safety-net ref. */
export function undoDeleteBranch(
  repoPath: string,
  branchName: string,
  backupRef: string
): Promise<void> {
  return invokeCommand.undoDeleteBranch(repoPath, branchName, backupRef);
}

/** Reverts a commit undo, restoring the repository to its pre-commit state. */
export function undoCommit(repoPath: string, undoToken: string): Promise<void> {
  return invokeCommand.undoCommit(repoPath, undoToken);
}
