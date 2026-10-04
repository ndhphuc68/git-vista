import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { usePullRequestStore } from "../../../store/usePullRequestStore";
import { usePullRequests, usePullRequestDetail } from "../api";
import { filterPullRequests } from "../model/pullRequestFilter";
import { createPullRequestsScreenActions } from "./usePullRequestsScreen.actions";

export type PullRequestFilterState = "open" | "closed" | "all";
export type PullRequestSubTab = "conversation" | "filesChanged";

export function usePullRequestsScreen(repoPath: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast, showSuccess, showError } = useToastStore();

  const [filterState, setFilterState] = useState<PullRequestFilterState>("open");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<PullRequestSubTab>("conversation");
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  const selectedPr = usePullRequestStore((state) => state.selectedPr);
  const setSelectedPr = usePullRequestStore((state) => state.setSelectedPr);

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
