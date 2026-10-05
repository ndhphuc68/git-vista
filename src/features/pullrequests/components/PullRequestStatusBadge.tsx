import React from "react";
import clsx from "clsx";
import { GitPullRequest, GitMerge, AlertCircle, FileEdit } from "lucide-react";
import type { GitHubPullRequest } from "../../../ipc/githubApi";

import { getPullRequestStatus, type PullRequestStatus } from "../model/pullRequestStatus";

export type { PullRequestStatus };

export interface PullRequestStatusBadgeProps {
  pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_CONFIG: Record<
  PullRequestStatus,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    className: string;
  }
> = {
  merged: {
    label: "Merged",
    icon: GitMerge,
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25",
  },
  closed: {
    label: "Closed",
    icon: AlertCircle,
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25",
  },
  draft: {
    label: "Draft",
    icon: FileEdit,
    className: "bg-surface-header text-secondary border border-border-subtle",
  },
  open: {
    label: "Open",
    icon: GitPullRequest,
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25",
  },
};

export const PullRequestStatusBadge: React.FC<PullRequestStatusBadgeProps> = ({
  pr,
  size = "sm",
  className,
}) => {
  const status = getPullRequestStatus(pr);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isMedium = size === "md";

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full select-none shrink-0",
        isMedium ? "px-2.5 py-1 text-sm gap-1.5" : "px-2 py-0.5 text-xs gap-1",
        config.className,
        className
      )}
    >
      <Icon size={isMedium ? 14 : 12} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
