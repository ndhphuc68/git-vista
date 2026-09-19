import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Tags of a repository. Disabled while no repository is open. */
export function useTags(repoPath: string) {
  return useQuery({
    queryKey: qk.tags(repoPath),
    queryFn: () => invokeCommand.getTags(repoPath),
    enabled: Boolean(repoPath),
  });
}
