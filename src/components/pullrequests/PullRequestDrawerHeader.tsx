import React from "react";
import { X, ExternalLink, GitPullRequest, Copy } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { type GitHubPullRequest } from "../../ipc/githubApi";
import { PullRequestStatusBadge } from "./pullRequestStatusBadge";

interface PullRequestDrawerHeaderProps {
  pr: GitHubPullRequest;
  onCopyLink: () => void;
  onClose: () => void;
  t: Translations;
}

/** Top bar of the drawer: PR number, status badge, and copy/open/close actions. */
export const PullRequestDrawerHeader: React.FC<PullRequestDrawerHeaderProps> = ({
  pr,
  onCopyLink,
  onClose,
  t,
}) => (
  <div className="flex items-center justify-between px-5 py-3.5 bg-surface-header/50 border-b border-border-subtle gap-3 shrink-0 select-none">
    <div className="flex items-center gap-2 min-w-0">
      <GitPullRequest size={16} className="text-accent shrink-0" />
      {pr.html_url ? (
        <a
          href={pr.html_url}
          target="_blank"
          rel="noreferrer"
          title={t.pullRequests.openInBrowser}
          className="font-mono text-sm font-bold text-accent hover:underline cursor-pointer shrink-0"
        >
          #{pr.number}
        </a>
      ) : (
        <span className="font-mono text-sm font-bold text-accent shrink-0">#{pr.number}</span>
      )}
      <PullRequestStatusBadge pr={pr} />
    </div>

    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onCopyLink}
        title={t.pullRequests.copyLink}
        className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
      >
        <Copy size={14} />
      </button>
      <a
        href={pr.html_url}
        target="_blank"
        rel="noreferrer"
        title={t.pullRequests.openInBrowser}
        className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer"
      >
        <ExternalLink size={14} />
      </a>
      <button
        type="button"
        onClick={onClose}
        title="Đóng (Esc)"
        className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);
