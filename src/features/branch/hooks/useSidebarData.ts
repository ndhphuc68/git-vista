import { useBranches } from "../api";
import { useRemotes } from "../../remote/api";
import { useStashes } from "../../stash/api";
import { useTags } from "../../tag/api";
import { useRepoStatus } from "../../history";

/** Composes owner queries without taking ownership of their cache policy. */
export function useSidebarData(repoPath: string) {
  const { data: branchData } = useBranches(repoPath);
  const { data: remotesList = [] } = useRemotes(repoPath);
  const { data: repoStatus } = useRepoStatus(repoPath);
  const { data: stashes = [] } = useStashes(repoPath);
  const { data: tagItems = [] } = useTags(repoPath);
  const hasUncommittedChanges = Boolean(
    repoStatus &&
    (repoStatus.staged.length || repoStatus.unstaged.length || repoStatus.untracked.length)
  );
  return { branchData, remotesList, repoStatus, stashes, tagItems, hasUncommittedChanges };
}
