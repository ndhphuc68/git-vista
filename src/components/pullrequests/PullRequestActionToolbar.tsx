import React from "react";
import { ArrowRight, RefreshCw, Download } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { type GitHubPullRequest } from "../../ipc/githubApi";
import { Button } from "../../shared/ui";

interface PullRequestActionToolbarProps {
  pr: GitHubPullRequest;
  isCheckingOut: boolean;
  onCheckout: () => void;
  t: Translations;
}

/** Head -> base branch summary and the checkout-branch button. */
export const PullRequestActionToolbar: React.FC<PullRequestActionToolbarProps> = ({
  pr,
  isCheckingOut,
  onCheckout,
  t,
}) => (
  <div className="px-5 py-3 border-b border-border-subtle bg-surface flex items-center justify-between gap-3 shrink-0">
    <div className="flex items-center gap-2 text-xs font-mono text-secondary truncate">
      <span className="text-primary font-semibold truncate">{pr.head?.ref || "head"}</span>
      <ArrowRight size={12} className="shrink-0 text-tertiary" />
      <span className="text-secondary truncate">{pr.base?.ref || "base"}</span>
    </div>

    <Button onClick={onCheckout} disabled={isCheckingOut} className="shrink-0">
      {isCheckingOut ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
      <span>{isCheckingOut ? t.pullRequests.checkingOut : t.pullRequests.checkout}</span>
    </Button>
  </div>
);
