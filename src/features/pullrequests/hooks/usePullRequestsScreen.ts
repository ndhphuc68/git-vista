import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { usePullRequestStore } from "../../../store/usePullRequestStore";
import { usePullRequests, usePullRequestDetail } from "../api";
import { filterPullRequests } from "../model/pullRequestFilter";
import { createPullRequestsScreenActions } from "./usePullRequestsScreen.actions";
import type { GitHubPullRequest } from "../../../ipc/githubApi";

export type PullRequestFilterState = "open" | "closed" | "all";
export type PullRequestSubTab = "conversation" | "filesChanged";

function useSelectedPullRequest(repoPath: string) {
  const rawSelectedPr = usePullRequestStore((state) => state.selectedPr);
  const selectedRepoPath = usePullRequestStore((state) => state.selectedRepoPath);
  const rawSetSelectedPr = usePullRequestStore((state) => state.setSelectedPr);

  const selectedPr = useMemo(
    () =>
      !rawSelectedPr || (selectedRepoPath && selectedRepoPath !== repoPath)
        ? null
        : rawSelectedPr,
    [rawSelectedPr, selectedRepoPath, repoPath]
  );

  const setSelectedPr = useCallback(
    (pr: GitHubPullRequest | null) => rawSetSelectedPr(pr, repoPath),
    [rawSetSelectedPr, repoPath]
  );

  useEffect(() => {
    if (selectedRepoPath && selectedRepoPath !== repoPath) {
      rawSetSelectedPr(null, repoPath);
    }
  }, [repoPath, selectedRepoPath, rawSetSelectedPr]);

  return { selectedPr, setSelectedPr };
}

export function usePullRequestsScreen(repoPath: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast, showSuccess, showError } = useToastStore();

  const [filterState, setFilterState] = useState<PullRequestFilterState>("open");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<PullRequestSubTab>("conversation");
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  const { selectedPr, setSelectedPr } = useSelectedPullRequest(repoPath);

  useEffect(() => {
    setSearchQuery("");
  }, [repoPath]);

  const {
    data: pullRequests = [],
    isLoading: isLoadingPrs,
  } = usePullRequests(repoPath, filterState);

  const {
    data: prDetail,
    isLoading: isLoadingDetail,
  } = usePullRequestDetail(repoPath, selectedPr?.number ?? null);

  const filteredPrs = useMemo(
    () => filterPullRequests(pullRequests, searchQuery),
    [pullRequests, searchQuery]
  );

  const actions = useMemo(
    () =>
      createPullRequestsScreenActions({
        repoPath,
        t,
        queryClient,
        showToast,
        showSuccess,
        showError,
        setIsCheckingOut,
      }),
    [repoPath, t, queryClient, showToast, showSuccess, showError]
  );

  const handleRefresh = () => actions.handleRefresh(filterState, selectedPr?.number);

  return {
    filterState,
    setFilterState,
    searchQuery,
    setSearchQuery,
    activeSubTab,
    setActiveSubTab,
    selectedPr,
    setSelectedPr,
    pullRequests,
    filteredPrs,
    isLoadingPrs,
    prDetail,
    isLoadingDetail,
    isCheckingOut,
    handleCheckout: actions.handleCheckout,
    handleCopyLink: actions.handleCopyLink,
    handleOpenBrowser: actions.handleOpenBrowser,
    handleNewPr: actions.handleNewPr,
    handleRefresh,
  };
}
