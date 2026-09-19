import React, { useState } from "react";
import {
  GitPullRequest,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  MoreVertical,
  Download,
  ExternalLink,
  Copy,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../i18n";
import { invokeCommand } from "../../ipc/client";
import { fetchPullRequests } from "../../services/githubService";
import { usePullRequestStore } from "../../store/usePullRequestStore";
import { useToastStore } from "../../store/useToastStore";
import { type GitHubPullRequest } from "../../ipc/githubApi";
import { qk } from "../../domain/queryKeys";

interface PullRequestsSectionProps {
  repoPath: string;
}

type FilterTab = "open" | "mine" | "closed";

export const PullRequestsSection: React.FC<PullRequestsSectionProps> = ({ repoPath }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("open");
  const [activeMenuPr, setActiveMenuPr] = useState<number | null>(null);

  const { openDrawer, openCreateModal } = usePullRequestStore();
  const { showToast, showSuccess, showError } = useToastStore();

  const { data: repoInfo } = useQuery({
    queryKey: qk.github.repoInfo(repoPath),
    queryFn: () => invokeCommand.getGitHubRepoInfo(repoPath),
    enabled: Boolean(repoPath),
  });

  const { data: token } = useQuery({
    queryKey: qk.githubToken(),
    queryFn: () => invokeCommand.getGitHubToken(),
  });

  const apiState = filterTab === "closed" ? "closed" : "open";

  const {
    data: prList = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: qk.github.pullRequests(repoPath, apiState),
    queryFn: () => {
      if (!repoInfo?.owner || !repoInfo?.repo) return [];
      return fetchPullRequests(repoInfo.owner, repoInfo.repo, token, apiState);
    },
    enabled: Boolean(repoInfo?.is_github && repoInfo?.owner && repoInfo?.repo),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  const handleCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreateModal();
  };

  const handleCheckoutPr = async (pr: GitHubPullRequest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuPr(null);
    try {
      showToast({ message: t.pullRequests.checkingOut, type: "info" });
      const res = await invokeCommand.checkoutPullRequest(repoPath, pr.number);
      showSuccess(t.pullRequests.checkoutSuccess.replace("{branch}", res.branch_name));
      queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
    } catch (err: any) {
      showError(err.message || "Lỗi khi checkout nhánh PR");
    }
  };

  const handleOpenBrowser = (pr: GitHubPullRequest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuPr(null);
    if (pr.html_url) {
      window.open(pr.html_url, "_blank");
    }
  };

  const handleCopyLink = async (pr: GitHubPullRequest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuPr(null);
    if (pr.html_url && navigator.clipboard) {
      await navigator.clipboard.writeText(pr.html_url);
      showSuccess(t.pullRequests.linkCopied);
    }
  };

  const openCount = apiState === "open" ? prList.length : 0;

  return (
    <div className="mt-2">
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors select-none group"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <GitPullRequest size={13} className="text-accent" />
          <span className="truncate">{t.pullRequests.title}</span>
          {openCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-accent/15 text-accent">
              {openCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title={t.pullRequests.newPr}
            aria-label={t.pullRequests.newPr}
            onClick={handleCreate}
            className="p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            title={t.pullRequests.refresh}
            aria-label={t.pullRequests.refresh}
            onClick={handleRefresh}
            className="p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-1">
          {/* Non-github repo */}
          {repoInfo && !repoInfo.is_github && (
            <div className="px-2 py-1.5 text-xs text-tertiary italic">
              {t.pullRequests.notGitHub}
            </div>
          )}

          {repoInfo?.is_github && (
            <>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-1 mb-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterTab("open")}
                  className={clsx(
                    "px-2 py-0.5 rounded transition-colors cursor-pointer",
                    filterTab === "open"
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-secondary hover:text-primary hover:bg-surface-hover"
                  )}
                >
                  {t.pullRequests.open}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("closed")}
                  className={clsx(
                    "px-2 py-0.5 rounded transition-colors cursor-pointer",
                    filterTab === "closed"
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-secondary hover:text-primary hover:bg-surface-hover"
                  )}
                >
                  {t.pullRequests.closed}
                </button>
              </div>

              {/* Content / List */}
              {isLoading && (
                <div className="px-2 py-2 text-xs text-secondary flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Đang tải Pull Requests...</span>
                </div>
              )}

              {isError && (
                <div className="px-2 py-1.5 text-xs text-red-500 flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{t.pullRequests.offline}</span>
                </div>
              )}

              {!isLoading && !isError && prList.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-tertiary italic">
                  {t.pullRequests.noPrs}
                </div>
              )}

              {!isLoading && !isError && prList.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {prList.map((pr) => {
                    const isMenuOpen = activeMenuPr === pr.number;
                    return (
                      <div
                        key={pr.number}
                        className="group relative flex items-center justify-between rounded-sm hover:bg-surface-hover transition-colors"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenuPr(pr.number);
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openDrawer(pr)}
                          className="flex-1 flex items-center gap-1.5 px-2 py-1 text-left border-0 bg-transparent cursor-pointer min-h-[26px] overflow-hidden text-secondary group-hover:text-primary"
                        >
                          <span className="font-mono text-xs text-accent shrink-0">
                            #{pr.number}
                          </span>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPr(isMenuOpen ? null : pr.number);
                            }}
                            className={clsx(
                              "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
                              isMenuOpen
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100 focus:opacity-100"
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
                                onClick={(e) => handleCheckoutPr(pr, e)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
                              >
                                <Download size={13} className="text-accent shrink-0" />
                                <span>{t.pullRequests.checkout}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleOpenBrowser(pr, e)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
                              >
                                <ExternalLink size={13} className="text-secondary shrink-0" />
                                <span>{t.pullRequests.openInBrowser}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleCopyLink(pr, e)}
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
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
