import React from "react";
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
      style={{
        display: "flex",
        flexDirection: "row",
        flex: 1,
        minHeight: 0,
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-window)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Branch Sidebar */}
      {sidebarOpen && (
        <>
          {isMobile && (
            <div
              data-testid="sidebar-backdrop"
              onClick={toggleSidebar}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                zIndex: 25,
              }}
            />
          )}
          <div
            data-testid="shell-sidebar-container"
            style={{
              position: isMobile ? "absolute" : "relative",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: isMobile ? 30 : 1,
              width: "240px",
              height: "100%",
              flexShrink: 0,
              boxShadow: isMobile ? "var(--shadow-lg)" : "none",
            }}
          >
            <BranchSidebar />
          </div>
        </>
      )}

      {/* Center: Commit Graph */}
      <div
        data-testid="shell-graph-container"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CommitGraph />
      </div>

      {/* Right: Commit Detail Panel */}
      {detailPanelOpen && (
        <div
          data-testid="shell-detail-container"
          style={{
            width: isMobile ? "100%" : "380px",
            minWidth: isMobile ? "100%" : "280px",
            maxWidth: isMobile ? "100%" : "420px",
            height: "100%",
            flexShrink: 0,
            borderLeft: isMobile ? "none" : "1px solid var(--border-subtle)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CommitDetailPanel />
        </div>
      )}
    </main>
  );
};
