/**
 * Thin wrapper over the repo-head-info IPC query. This module lives in
 * `features/repo/api`, the only place in `features/repo` allowed to import
 * `ipc/`; `RepoHeader` composes this hook instead of calling `invokeCommand`
 * directly.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** HEAD info (branch, ahead/behind, upstream) for the repo at `repoPath`. */
export function useRepoHeadInfo(repoPath: string | undefined) {
  return useQuery({
    queryKey: qk.repo.head(repoPath ?? ""),
    queryFn: () => invokeCommand.getRepoHeadInfo(repoPath!),
    enabled: Boolean(repoPath),
  });
}
