import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface CreateTagVars {
  name: string;
  targetCommitId: string;
  /** Present only for annotated tags. */
  message?: string;
}

/**
 * Creates a tag and refreshes the repository.
 *
 * The hook owns invalidation so no call site has to remember it. Every query
 * key is prefixed with ["repo", repoPath], so qk.repo.all covers the tag list,
 * the commit graph and anything else that shows tags.
 */
export function useCreateTag(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: CreateTagVars) =>
      invokeCommand.createTag(repoPath, vars.name, vars.targetCommitId, vars.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}
