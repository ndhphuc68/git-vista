import type { GitHubPullRequest } from "../../../ipc/githubApi";
import { PR_STATE, PR_STATUS, type PullRequestStatus } from "../../../domain/enums";

export type { PullRequestStatus };

export function getPullRequestStatus(
  pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">
): PullRequestStatus {
  if (pr.merged_at) return PR_STATUS.MERGED;
  if (pr.state === PR_STATE.CLOSED) return PR_STATUS.CLOSED;
  if (pr.draft) return PR_STATUS.DRAFT;
  return PR_STATUS.OPEN;
}
