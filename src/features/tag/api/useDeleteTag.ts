import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface DeleteTagVars {
  name: string;
  deleteRemote: boolean;
}

/** Deletes a tag locally, and on the remote when deleteRemote is set. */
export function useDeleteTag(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: DeleteTagVars) =>
      invokeCommand.deleteTag(repoPath, vars.name, vars.deleteRemote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}
