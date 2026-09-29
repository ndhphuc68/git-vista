import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "../../../domain/queryKeys";
import { invokeCommand } from "../../../ipc/client";

const PAGE_SIZE = 50;

/** Keep toast undo actions bound to the repository that created them. */
export function useUndoGraphCommit(repoPath: string) {
  const queryClient = useQueryClient();
  return async (undoToken: string) => {
    await invokeCommand.undoCommit(repoPath, undoToken);
    queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
  };
}

export function useCommitGraph(repoPath: string) {
  return useInfiniteQuery({
    queryKey: qk.commitGraph(repoPath),
    queryFn: ({ pageParam = 0 }) => invokeCommand.getCommitGraph(repoPath, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length * PAGE_SIZE : undefined,
    enabled: Boolean(repoPath),
  });
}
