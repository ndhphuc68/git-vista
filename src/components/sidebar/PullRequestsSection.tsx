import React, { type MouseEvent } from "react";
import { usePullRequestsSection } from "./usePullRequestsSection";
import { PullRequestsSectionHeader } from "./PullRequestsSectionHeader";
import { PullRequestFilterTabs } from "./PullRequestFilterTabs";
import { PullRequestsList } from "./PullRequestsList";

interface PullRequestsSectionProps {
  repoPath: string;
}

export const PullRequestsSection: React.FC<PullRequestsSectionProps> = ({ repoPath }) => {
  const m = usePullRequestsSection(repoPath);

  const handleToggleMenu = (prNumber: number, e: MouseEvent) => {
    e.stopPropagation();
    m.setActiveMenuPr(m.activeMenuPr === prNumber ? null : prNumber);
  };

  const handleContextMenu = (prNumber: number, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    m.setActiveMenuPr(prNumber);
  };

  return (
    <div className="mt-2">
      <PullRequestsSectionHeader
        isOpen={m.isOpen}
        onToggleOpen={() => m.setIsOpen(!m.isOpen)}
        openCount={m.openCount}
        isLoading={m.isLoading}
        onCreate={m.handleCreate}
        onRefresh={m.handleRefresh}
        t={m.t}
      />

      {m.isOpen && (
        <div className="mt-1">
          {/* Non-github repo */}
          {m.repoInfo && !m.repoInfo.is_github && (
            <div className="px-2 py-1.5 text-xs text-tertiary italic">
              {m.t.pullRequests.notGitHub}
            </div>
          )}

          {m.repoInfo?.is_github && (
            <>
              <PullRequestFilterTabs
                filterTab={m.filterTab}
                onFilterTabChange={m.setFilterTab}
                t={m.t}
              />

              <PullRequestsList
                isLoading={m.isLoading}
                isError={m.isError}
                prList={m.prList}
                activeMenuPr={m.activeMenuPr}
                onOpenDrawer={m.openDrawer}
                onToggleMenu={handleToggleMenu}
                onCheckout={m.handleCheckoutPr}
                onOpenBrowser={m.handleOpenBrowser}
                onCopyLink={m.handleCopyLink}
                onContextMenu={handleContextMenu}
                t={m.t}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
