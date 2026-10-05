import { type GitHubPullRequest } from "../../ipc/githubApi";

export type StatusKey = "merged" | "closed" | "draft" | "open";

export const STATUS_BADGE_STYLES: Record<StatusKey, string> = {
  merged: "bg-purple-500/15 text-purple-600 border border-purple-500/20",
  closed: "bg-red-500/15 text-red-500 border border-red-500/20",
  draft: "bg-zinc-500/15 text-zinc-500 border border-zinc-500/20",
  open: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20",
};

export const STATUS_BADGE_LABELS: Record<StatusKey, string> = {
  merged: "Merged",
  closed: "Closed",
  draft: "Draft",
  open: "Open",
};

/** Which badge status a pull request is in, in priority order. */
export function getStatusKey(
  pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">
): StatusKey {
  if (pr.merged_at) return "merged";
  if (pr.state === "closed") return "closed";
  if (pr.draft) return "draft";
  return "open";
}
