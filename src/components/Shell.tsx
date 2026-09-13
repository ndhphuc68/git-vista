import React from "react";
import clsx from "clsx";
import { BranchSidebar } from "./sidebar/BranchSidebar";
import { CommitGraph } from "./graph/CommitGraph";
import { CommitDetailPanel } from "./diff/CommitDetailPanel";
import { useLayoutStore } from "../store/useLayoutStore";
import { useWindowDimensions } from "../hooks/useWindowDimensions";

export const Shell: React.FC = () => {
  const { sidebarOpen, detailPanelOpen, toggleSidebar } = useLayoutStore();
  const { isMobile } = useWindowDimensions();

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

      {/* Right: Commit Detail Panel */}
      {detailPanelOpen && (
        <div
          data-testid="shell-detail-container"
          className={clsx(
            isMobile
              ? "w-full min-w-full max-w-full border-l-0"
              : "w-95 min-w-70 max-w-105 border-l border-border-subtle",
            "h-full shrink-0 overflow-hidden flex flex-col bg-surface"
          )}
        >
          <CommitDetailPanel />
        </div>
      )}
    </main>
  );
};
