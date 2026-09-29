import React, { type MouseEvent } from "react";
import { MoreVertical, Download, ExternalLink, Copy } from "lucide-react";
import clsx from "clsx";
import { type Translations } from "../../i18n/vi";
import { type GitHubPullRequest } from "../../ipc/githubApi";

interface PullRequestRowProps {
  pr: GitHubPullRequest;
  isMenuOpen: boolean;
  onOpenDrawer: () => void;
  onToggleMenu: (e: MouseEvent) => void;
  onCheckout: (pr: GitHubPullRequest, e?: MouseEvent) => void;
  onOpenBrowser: (pr: GitHubPullRequest, e?: MouseEvent) => void;
  onCopyLink: (pr: GitHubPullRequest, e?: MouseEvent) => void;
  onContextMenu: (e: MouseEvent) => void;
  t: Translations;
}

/** A single pull request row in the sidebar list, with its context menu. */
export const PullRequestRow: React.FC<PullRequestRowProps> = ({
  pr,
  isMenuOpen,
  onOpenDrawer,
  onToggleMenu,
  onCheckout,
  onOpenBrowser,
  onCopyLink,
  onContextMenu,
  t,
}) => (
  <div
    className="group relative flex items-center justify-between rounded-sm hover:bg-surface-hover transition-colors"
    onContextMenu={onContextMenu}
  >
    <button
      type="button"
      onClick={onOpenDrawer}
      className="flex-1 flex items-center gap-1.5 px-2 py-1 text-left border-0 bg-transparent cursor-pointer min-h-[26px] overflow-hidden text-secondary group-hover:text-primary"
    >
      <span className="font-mono text-xs text-accent shrink-0">#{pr.number}</span>
      <span className="text-xs truncate" title={pr.title}>
        {pr.title}
      </span>

      {pr.draft && (
        <span className="text-[10px] px-1 rounded bg-surface-header text-tertiary font-mono shrink-0">
          Draft
        </span>
      )}
    </button>

    {/* Three dots menu */}
    <div className="relative shrink-0 flex items-center pr-1">
      <button
        type="button"
        onClick={onToggleMenu}
        className={clsx(
          "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
          isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
        )}
      >
        <MoreVertical size={13} />
      </button>

      {/* Context Menu Dropdown */}
      {isMenuOpen && (
        <div
          className="absolute right-0 top-full mt-1 min-w-48 w-max bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 z-50 text-xs flex flex-col animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => onCheckout(pr, e)}
            className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
          >
            <Download size={13} className="text-accent shrink-0" />
            <span>{t.pullRequests.checkout}</span>
          </button>
          <button
            type="button"
            onClick={(e) => onOpenBrowser(pr, e)}
            className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
          >
            <ExternalLink size={13} className="text-secondary shrink-0" />
            <span>{t.pullRequests.openInBrowser}</span>
          </button>
          <button
            type="button"
            onClick={(e) => onCopyLink(pr, e)}
            className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
          >
            <Copy size={13} className="text-secondary shrink-0" />
            <span>{t.pullRequests.copyLink}</span>
          </button>
        </div>
      )}
    </div>
  </div>
);
