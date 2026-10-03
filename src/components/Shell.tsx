import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckoutConflictModal, CreateBranchModal, useBranches } from "../features/branch";
import { CreateTagModal } from "../features/tag";
import { CommitGraph } from "../features/history";
import { useLayoutStore } from "../store/useLayoutStore";
import { useRepoStore } from "../store/useRepoStore";
import { useWindowDimensions } from "../hooks/useWindowDimensions";
import { qk } from "../domain/queryKeys";
import { ShellSidebar } from "./ShellSidebar";
import { ShellDetailDrawer } from "./ShellDetailDrawer";

export const Shell: React.FC = () => {
  const { sidebarOpen, sidebarWidth, detailPanelOpen, toggleSidebar, setDetailPanelOpen } =
    useLayoutStore();
  // Shell is not a feature, so it may read the repo store directly — the same
  // way BranchSidebar does. This avoids drilling repoPath down from App.
  const { setSelectedCommit, currentRepo } = useRepoStore();
  const { isMobile } = useWindowDimensions();
  const queryClient = useQueryClient();
  const repoPath = currentRepo?.path ?? "";

  // Only needed to tell DeleteTagModal whether a remote exists, exactly as the
  // sidebar did before these dialogs moved up here.
  const { data: branchData } = useBranches(repoPath);

  const invalidateRepo = () => {
    queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.repo.head(repoPath) });
  };

  /** Remote edits change the remote list and the remote-tracking branches. */
  const invalidateRemotes = () => {
    queryClient.invalidateQueries({ queryKey: qk.remotes(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
  };

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
      <ShellSidebar
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        toggleSidebar={toggleSidebar}
        sidebarWidth={sidebarWidth}
        repoPath={repoPath}
        branchData={branchData}
        invalidateRepo={invalidateRepo}
        invalidateRemotes={invalidateRemotes}
      />

      {/* Center: Commit Graph */}
      <div
        data-testid="shell-graph-container"
        className="flex-1 min-w-0 h-full overflow-hidden flex flex-col"
      >
        <CommitGraph
          CreateTagModal={CreateTagModal}
          CreateBranchModal={CreateBranchModal}
          CheckoutConflictModal={CheckoutConflictModal}
        />
      </div>

      {/* Right: Commit Detail 3/4 Slide-in Drawer with Backdrop */}
      <ShellDetailDrawer
        detailPanelOpen={detailPanelOpen}
        isMobile={isMobile}
        onClose={handleCloseDetail}
      />
    </main>
  );
};
