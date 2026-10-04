import type { GitHubPullRequest } from "../../../ipc/githubApi";

export type PullRequestStatus = "merged" | "closed" | "draft" | "open";

export function getPullRequestStatus(
  pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">
): PullRequestStatus {
  if (pr.merged_at) return "merged";
  if (pr.state === "closed") return "closed";
  if (pr.draft) return "draft";
  return "open";
}
