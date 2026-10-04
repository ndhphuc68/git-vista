import { useState, type MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../i18n";
import { useGitHubRepoInfo, useGitHubToken } from "../../features/github";
import { fetchPullRequests } from "../../services/githubService";
import { usePullRequestStore } from "../../store/usePullRequestStore";
import { useViewStore } from "../../store/useViewStore";
import { useToastStore } from "../../store/useToastStore";
import { qk } from "../../domain/queryKeys";
import { type GitHubPullRequest } from "../../ipc/githubApi";
import { createPullRequestMenuActions } from "./usePullRequestsSection.actions";

export type PullRequestsFilterTab = "open" | "mine" | "closed";

/**
 * Holds all state, effects and handlers for the sidebar's PullRequestsSection.
 * Returns exactly what the section's JSX reads.
 */
export function usePullRequestsSection(repoPath: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [filterTab, setFilterTab] = useState<PullRequestsFilterTab>("open");
  const [activeMenuPr, setActiveMenuPr] = useState<number | null>(null);

  const { openDrawer, openCreateModal, setSelectedPr } = usePullRequestStore();
  const { showToast, showSuccess, showError } = useToastStore();

  const { data: repoInfo } = useGitHubRepoInfo(repoPath);

  const { data: token } = useGitHubToken();

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

  const handleRefresh = (e: MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  const handleCreate = (e: MouseEvent) => {
    e.stopPropagation();
    openCreateModal();
  };

  const handleOpenPr = (pr: GitHubPullRequest) => {
    setSelectedPr(pr);
    openDrawer(pr);
    useViewStore.getState().setActiveScreen("pull-requests");
  };

  const { handleCheckoutPr, handleOpenBrowser, handleCopyLink } = createPullRequestMenuActions({
    repoPath,
    t,
    queryClient,
    setActiveMenuPr,
    showToast,
    showSuccess,
    showError,
  });

  const openCount = apiState === "open" ? prList.length : 0;

  return {
    t,
    isOpen,
    setIsOpen,
    filterTab,
    setFilterTab,
    activeMenuPr,
    setActiveMenuPr,
    openDrawer: handleOpenPr,
    repoInfo,
    prList,
    isLoading,
    isError,
    openCount,
    handleRefresh,
    handleCreate,
    handleCheckoutPr,
    handleOpenBrowser,
    handleCopyLink,
  };
}
