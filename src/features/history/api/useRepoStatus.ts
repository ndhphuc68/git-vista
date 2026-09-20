import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Working tree status shared by repository views. */
export function useRepoStatus(repoPath: string) {
  return useQuery({
    queryKey: qk.repo.status(repoPath),
    queryFn: () => invokeCommand.getRepoStatus(repoPath),
    enabled: Boolean(repoPath),
  });
}
