import React from "react";
import clsx from "clsx";
import {
  GitPullRequest,
  GitBranch,
  Copy,
  ExternalLink,
  MessageSquare,
  FileCode,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";
import { PullRequestStatusBadge } from "./PullRequestStatusBadge";
import { PullRequestConversationView } from "./PullRequestConversationView";
import { PullRequestFilesChangedView } from "./PullRequestFilesChangedView";
import type { GitHubPullRequest, PullRequestDetail } from "../../../ipc/githubApi";
import type { PullRequestSubTab } from "../hooks/usePullRequestsScreen";

export interface PullRequestsDetailPaneProps {
  selectedPr: GitHubPullRequest | null;
  detail: PullRequestDetail | null | undefined;
  isLoadingDetail: boolean;
  activeSubTab: PullRequestSubTab;
  onSubTabChange: (tab: PullRequestSubTab) => void;
  onCheckout: (pr: GitHubPullRequest) => void;
  onCopyLink: (pr: GitHubPullRequest) => void;
  onOpenBrowser: (pr: GitHubPullRequest) => void;
  isCheckingOut?: boolean;
  className?: string;
}

const DetailPaneEmptyState: React.FC<{ message: string; className?: string }> = ({
  message,
  className,
}) => (
  <section
    className={clsx(
      "flex-1 flex flex-col items-center justify-center p-8 text-center text-secondary bg-window",
      className
    )}
  >
    <div className="w-12 h-12 rounded-full bg-surface-header/60 flex items-center justify-center mb-3 text-tertiary">
      <GitPullRequest size={24} />
    </div>
    <p className="text-sm font-medium text-secondary max-w-sm">{message}</p>
  </section>
);

interface DetailPaneHeaderProps {
  pr: GitHubPullRequest;
  isCheckingOut: boolean;
  onCheckout: (pr: GitHubPullRequest) => void;
  onCopyLink: (pr: GitHubPullRequest) => void;
  onOpenBrowser: (pr: GitHubPullRequest) => void;
  checkoutLabel: string;
  checkingOutLabel: string;
  copyLinkLabel: string;
  openInBrowserLabel: string;
}

const DetailPaneHeader: React.FC<DetailPaneHeaderProps> = ({
  pr,
  isCheckingOut,
  onCheckout,
  onCopyLink,
  onOpenBrowser,
  checkoutLabel,
  checkingOutLabel,
  copyLinkLabel,
  openInBrowserLabel,
}) => (
  <div className="p-6 border-b border-border-subtle bg-surface/40 flex flex-col md:flex-row md:items-start md:justify-between gap-4 shrink-0">
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2.5">
        <PullRequestStatusBadge pr={pr} size="md" />
        <a
          href={pr.html_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault();
            onOpenBrowser(pr);
          }}
          title={`${openInBrowserLabel} #${pr.number}`}
          aria-label={`${openInBrowserLabel} #${pr.number}`}
          className="font-mono text-base font-bold text-accent hover:underline cursor-pointer inline-flex items-center gap-1 group"
        >
          <span>#{pr.number}</span>
          <ExternalLink
            size={13}
            className="opacity-60 group-hover:opacity-100 transition-opacity"
            aria-hidden="true"
          />
        </a>
        <h1 className="text-lg font-bold text-primary break-words">{pr.title}</h1>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-mono text-secondary">
        <span className="px-2 py-0.5 rounded-md bg-surface-header border border-border-subtle text-primary font-semibold">
          {pr.base.ref}
        </span>
        <ArrowLeft size={12} className="text-secondary shrink-0" />
        <span className="px-2 py-0.5 rounded-md bg-surface-header border border-border-subtle text-secondary">
          {pr.head.ref}
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onCheckout(pr)}
        disabled={isCheckingOut}
        className="gap-1.5"
      >
        <GitBranch size={13} className="shrink-0" />
        <span>{isCheckingOut ? checkingOutLabel : checkoutLabel}</span>
      </Button>
      <button
        type="button"
        onClick={() => onCopyLink(pr)}
        title={copyLinkLabel}
        aria-label={copyLinkLabel}
        className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover border border-border-subtle transition-colors cursor-pointer"
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        onClick={() => onOpenBrowser(pr)}
        title={openInBrowserLabel}
        aria-label={openInBrowserLabel}
        className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover border border-border-subtle transition-colors cursor-pointer"
      >
        <ExternalLink size={14} />
      </button>
    </div>
  </div>
);

interface DetailPaneSubTabsProps {
  activeSubTab: PullRequestSubTab;
  onSubTabChange: (tab: PullRequestSubTab) => void;
  filesCount: number;
  conversationLabel: string;
  filesChangedLabel: string;
}

const DetailPaneSubTabs: React.FC<DetailPaneSubTabsProps> = ({
  activeSubTab,
  onSubTabChange,
  filesCount,
  conversationLabel,
  filesChangedLabel,
}) => (
  <div
    role="tablist"
    className="flex items-center gap-6 px-6 border-b border-border-subtle bg-surface/30 shrink-0"
  >
    <button
      type="button"
      role="tab"
      aria-selected={activeSubTab === "conversation"}
      onClick={() => onSubTabChange("conversation")}
      className={clsx(
        "flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer",
        activeSubTab === "conversation"
          ? "border-accent text-accent font-semibold"
          : "border-transparent text-secondary hover:text-primary"
      )}
    >
      <MessageSquare size={14} />
      <span>{conversationLabel}</span>
    </button>

    <button
      type="button"
      role="tab"
      aria-selected={activeSubTab === "filesChanged"}
      onClick={() => onSubTabChange("filesChanged")}
      className={clsx(
        "flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer",
        activeSubTab === "filesChanged"
          ? "border-accent text-accent font-semibold"
          : "border-transparent text-secondary hover:text-primary"
      )}
    >
      <FileCode size={14} />
      <span>{filesChangedLabel}</span>
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-surface-header text-secondary border border-border-subtle">
        {filesCount}
      </span>
    </button>
  </div>
);

const DetailPaneContent: React.FC<{
  isLoadingDetail: boolean;
  detail: PullRequestDetail | null | undefined;
  activeSubTab: PullRequestSubTab;
}> = ({ isLoadingDetail, detail, activeSubTab }) => (
  <div className="flex-1 overflow-y-auto p-6">
    {isLoadingDetail ? (
      <div className="flex items-center justify-center p-12 text-secondary">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    ) : detail ? (
      activeSubTab === "conversation" ? (
        <PullRequestConversationView detail={detail} />
      ) : (
        <PullRequestFilesChangedView files={detail.files} />
      )
    ) : null}
  </div>
);

export const PullRequestsDetailPane: React.FC<PullRequestsDetailPaneProps> = ({
  selectedPr,
  detail,
  isLoadingDetail,
  activeSubTab,
  onSubTabChange,
  onCheckout,
  onCopyLink,
  onOpenBrowser,
  isCheckingOut = false,
  className,
}) => {
  const { t } = useTranslation();

  if (!selectedPr) {
    return (
      <DetailPaneEmptyState message={t.pullRequestsScreen.emptySelection} className={className} />
    );
  }

  return (
    <section className={clsx("flex-1 flex flex-col h-full overflow-hidden bg-window", className)}>
      <DetailPaneHeader
        pr={selectedPr}
        isCheckingOut={isCheckingOut}
        onCheckout={onCheckout}
        onCopyLink={onCopyLink}
        onOpenBrowser={onOpenBrowser}
        checkoutLabel={t.pullRequests.checkout}
        checkingOutLabel={t.pullRequests.checkingOut}
        copyLinkLabel={t.pullRequests.copyLink}
        openInBrowserLabel={t.pullRequests.openInBrowser}
      />

      <DetailPaneSubTabs
        activeSubTab={activeSubTab}
        onSubTabChange={onSubTabChange}
        filesCount={detail?.files?.length ?? 0}
        conversationLabel={t.pullRequestsScreen.tabs.conversation}
        filesChangedLabel={t.pullRequestsScreen.tabs.filesChanged}
      />

      <DetailPaneContent
        isLoadingDetail={isLoadingDetail}
        detail={detail}
        activeSubTab={activeSubTab}
      />
    </section>
  );
};
