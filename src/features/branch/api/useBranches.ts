import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/**
 * Local and remote branches of a repository.
 *
 * `options` lets a call site override `enabled`/`staleTime` (for example
 * `CreatePullRequestModal`, which only wants this query while its modal is
 * open); every other call site keeps today's behavior via the defaults below.
 */
export function useBranches(
  repoPath: string,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: qk.branches(repoPath),
    queryFn: () => invokeCommand.getBranches(repoPath),
    enabled: options?.enabled ?? Boolean(repoPath),
    staleTime: options?.staleTime,
  });
}
