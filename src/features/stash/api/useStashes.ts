import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Stash entries of a repository, newest first. */
export function useStashes(repoPath: string) {
  return useQuery({
    queryKey: qk.stashes(repoPath),
    queryFn: () => invokeCommand.getStashes(repoPath),
    enabled: Boolean(repoPath),
  });
}
