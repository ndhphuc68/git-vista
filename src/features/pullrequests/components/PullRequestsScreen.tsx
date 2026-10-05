import React from "react";
import clsx from "clsx";
import { usePullRequestsScreen } from "../hooks/usePullRequestsScreen";
import { PullRequestsMasterPane } from "./PullRequestsMasterPane";
import { PullRequestsDetailPane } from "./PullRequestsDetailPane";

export interface PullRequestsScreenProps {
  repoPath: string;
  className?: string;
}

export const PullRequestsScreen: React.FC<PullRequestsScreenProps> = ({ repoPath, className }) => {
  const {
    filterState,
    setFilterState,
    searchQuery,
    setSearchQuery,
    activeSubTab,
    setActiveSubTab,
    selectedPr,
    setSelectedPr,
    pullRequests,
    isLoadingPrs,
    prDetail,
    isLoadingDetail,
    isCheckingOut,
    handleCheckout,
    handleCopyLink,
    handleOpenBrowser,
    handleNewPr,
    handleRefresh,
  } = usePullRequestsScreen(repoPath);

  return (
    <div className={clsx("flex h-full w-full bg-window overflow-hidden", className)}>
      <PullRequestsMasterPane
        prs={pullRequests}
        isLoading={isLoadingPrs}
        filterState={filterState}
        onFilterChange={setFilterState}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPr={selectedPr}
        onSelectPr={setSelectedPr}
        onRefresh={handleRefresh}
        onNewPr={handleNewPr}
      />
      <PullRequestsDetailPane
        selectedPr={selectedPr}
        detail={prDetail}
        isLoadingDetail={isLoadingDetail}
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        onCheckout={handleCheckout}
        onCopyLink={handleCopyLink}
        onOpenBrowser={handleOpenBrowser}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );
};
