import React, { type MouseEvent } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { type GitHubPullRequest } from "../../ipc/githubApi";
import { PullRequestRow } from "./PullRequestRow";

interface PullRequestsListProps {
  isLoading: boolean;
  isError: boolean;
  prList: GitHubPullRequest[];
  activeMenuPr: number | null;
  onOpenDrawer: (pr: GitHubPullRequest) => void;
  onToggleMenu: (prNumber: number, e: MouseEvent) => void;
  onCheckout: (pr: GitHubPullRequest, e?: MouseEvent) => void;
  onOpenBrowser: (pr: GitHubPullRequest, e?: MouseEvent) => void;
  onCopyLink: (pr: GitHubPullRequest, e?: MouseEvent) => void;
  onContextMenu: (prNumber: number, e: MouseEvent) => void;
  t: Translations;
}

/** Loading / error / empty / populated states for the pull requests list. */
export const PullRequestsList: React.FC<PullRequestsListProps> = ({
  isLoading,
  isError,
  prList,
  activeMenuPr,
  onOpenDrawer,
  onToggleMenu,
  onCheckout,
  onOpenBrowser,
  onCopyLink,
  onContextMenu,
  t,
}) => {
  if (isLoading) {
    return (
      <div className="px-2 py-2 text-xs text-secondary flex items-center gap-1.5">
        <RefreshCw size={12} className="animate-spin" />
        <span>Đang tải Pull Requests...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-2 py-1.5 text-xs text-red-500 flex items-center gap-1.5">
        <AlertCircle size={13} className="shrink-0" />
        <span>{t.pullRequests.offline}</span>
      </div>
    );
  }

  if (prList.length === 0) {
    return <div className="px-2 py-1.5 text-xs text-tertiary italic">{t.pullRequests.noPrs}</div>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {prList.map((pr) => (
        <PullRequestRow
          key={pr.number}
          pr={pr}
          isMenuOpen={activeMenuPr === pr.number}
          onOpenDrawer={() => onOpenDrawer(pr)}
          onToggleMenu={(e) => onToggleMenu(pr.number, e)}
          onCheckout={onCheckout}
          onOpenBrowser={onOpenBrowser}
          onCopyLink={onCopyLink}
          onContextMenu={(e) => onContextMenu(pr.number, e)}
          t={t}
        />
      ))}
    </div>
  );
};
