import React from "react";
import { type GitHubPullRequest } from "../../ipc/githubApi";
import { getStatusKey, STATUS_BADGE_STYLES, STATUS_BADGE_LABELS } from "./pullRequestStatusKey";

interface PullRequestStatusBadgeProps {
  pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">;
}

/** Status pill (Merged / Closed / Draft / Open) for a pull request. */
export const PullRequestStatusBadge: React.FC<PullRequestStatusBadgeProps> = ({ pr }) => {
  const status = getStatusKey(pr);
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE_STYLES[status]}`}
    >
      {STATUS_BADGE_LABELS[status]}
    </span>
  );
};
