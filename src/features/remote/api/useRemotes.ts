import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Remotes configured for a repository. */
export function useRemotes(repoPath: string) {
  return useQuery({
    queryKey: qk.remotes(repoPath),
    queryFn: () => invokeCommand.getRemotes(repoPath),
    enabled: Boolean(repoPath),
  });
}
