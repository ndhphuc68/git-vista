import { useQuery } from "@tanstack/react-query";
import { qk } from "../../../domain/queryKeys";
import { useGitHubRepoInfo, useGitHubToken } from "../../github";
import { fetchPullRequests } from "../../../services/githubService";
import { type GitHubPullRequest } from "../../../ipc/githubApi";

export function usePullRequests(repoPath: string, state: "open" | "closed" | "all" = "open") {
  const { data: repoInfo } = useGitHubRepoInfo(repoPath);
  const { data: token } = useGitHubToken();

  return useQuery<GitHubPullRequest[]>({
    queryKey: qk.github.pullRequests(repoPath, state),
    queryFn: () => {
      if (!repoInfo?.owner || !repoInfo?.repo) return [];
      return fetchPullRequests(repoInfo.owner, repoInfo.repo, token, state);
    },
    enabled: Boolean(repoInfo?.is_github && repoInfo?.owner && repoInfo?.repo),
    staleTime: 1000 * 60 * 2,
  });
}
