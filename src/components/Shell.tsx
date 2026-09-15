import React from "react";
import clsx from "clsx";
import { BranchSidebar } from "./sidebar/BranchSidebar";
import { CommitGraph } from "./graph/CommitGraph";
import { CommitDetailPanel } from "./diff/CommitDetailPanel";
import { useLayoutStore } from "../store/useLayoutStore";
import { useRepoStore } from "../store/useRepoStore";
import { useWindowDimensions } from "../hooks/useWindowDimensions";

export const Shell: React.FC = () => {
  const { sidebarOpen, detailPanelOpen, toggleSidebar, setDetailPanelOpen } = useLayoutStore();
  const { setSelectedCommit } = useRepoStore();
  const { isMobile } = useWindowDimensions();

  const handleCloseDetail = () => {
    setDetailPanelOpen(false);
    setSelectedCommit(null);
  };

  return (
    <main
      data-testid="shell-main"
      className="flex flex-row flex-1 min-h-0 h-full w-full bg-window overflow-hidden relative"
    >
      {/* Branch Sidebar */}
      {sidebarOpen && (
        <>
          {isMobile && (
            <div
              data-testid="sidebar-backdrop"
              onClick={toggleSidebar}
              className="absolute inset-0 bg-black/40 z-20"
            />
          )}
          <div
            data-testid="shell-sidebar-container"
            className={clsx(
              isMobile ? "absolute inset-y-0 left-0 z-30 shadow-lg" : "relative z-1",
              "w-60 h-full shrink-0"
            )}
          >
            <BranchSidebar />
          </div>
        </>
      )}

      {/* Center: Commit Graph */}
      <div
        data-testid="shell-graph-container"
        className="flex-1 min-w-0 h-full overflow-hidden flex flex-col"
      >
        <CommitGraph />
      </div>

      {/* Right: Commit Detail 3/4 Slide-in Drawer with Backdrop */}
      {detailPanelOpen && (
        <>
          <div
            data-testid="detail-backdrop"
            onClick={handleCloseDetail}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-30 transition-opacity duration-300"
          />
          <div
            data-testid="shell-detail-container"
            className={clsx(
              "absolute top-0 right-0 bottom-0 z-40 bg-surface border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-out flex flex-col overflow-hidden",
              isMobile ? "w-full max-w-full" : "w-3/4 max-w-[85vw]"
            )}
          >
            <CommitDetailPanel onClose={handleCloseDetail} />
          </div>
        </>
      )}
    </main>
  );
};
