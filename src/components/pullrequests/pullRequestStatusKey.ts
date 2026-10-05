import { PR_STATE, PR_STATUS, type PullRequestStatus } from "../../domain/enums";
import { type GitHubPullRequest } from "../../ipc/githubApi";

export const STATUS_BADGE_STYLES: Record<PullRequestStatus, string> = {
  merged: "bg-purple-500/15 text-purple-600 border border-purple-500/20",
  closed: "bg-red-500/15 text-red-500 border border-red-500/20",
  draft: "bg-zinc-500/15 text-zinc-500 border border-zinc-500/20",
  open: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20",
};

export const STATUS_BADGE_LABELS: Record<PullRequestStatus, string> = {
  merged: "Merged",
  closed: "Closed",
  draft: "Draft",
  open: "Open",
};

/** Which badge status a pull request is in, in priority order. */
export function getStatusKey(
  pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">
): PullRequestStatus {
  if (pr.merged_at) return PR_STATUS.MERGED;
  if (pr.state === PR_STATE.CLOSED) return PR_STATUS.CLOSED;
  if (pr.draft) return PR_STATUS.DRAFT;
  return PR_STATUS.OPEN;
}
