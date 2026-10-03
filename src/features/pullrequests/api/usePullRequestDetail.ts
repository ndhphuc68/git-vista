import { useQuery } from "@tanstack/react-query";
import { qk } from "../../../domain/queryKeys";
import { useGitHubRepoInfo, useGitHubToken } from "../../github";
import { fetchPullRequestDetail } from "../../../services/githubService";
import { type PullRequestDetail } from "../../../ipc/githubApi";

export function usePullRequestDetail(repoPath: string, prNumber: number | null) {
  const { data: repoInfo } = useGitHubRepoInfo(repoPath);
  const { data: token } = useGitHubToken();

  return useQuery<PullRequestDetail | null>({
    queryKey: qk.github.pullRequestDetail(repoPath, prNumber ?? 0),
    queryFn: () => {
      if (!repoInfo?.owner || !repoInfo?.repo || !prNumber) return null;
      return fetchPullRequestDetail(repoInfo.owner, repoInfo.repo, prNumber, token);
    },
    enabled: Boolean(repoInfo?.is_github && repoInfo?.owner && repoInfo?.repo && prNumber),
    staleTime: 1000 * 60 * 2,
  });
}
