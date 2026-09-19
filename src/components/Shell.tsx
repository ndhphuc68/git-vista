import React from "react";
import clsx from "clsx";
import { useQueryClient } from "@tanstack/react-query";
import { BranchSidebar, isDialog, useBranches } from "../features/branch";
import { CreateTagModal, DeleteTagModal } from "../features/tag";
import {
  AddEditRemoteModal,
  DeleteRemoteModal,
  ManageRemotesModal,
  PruneConfirmModal,
} from "../features/remote";
import { StashDiffView } from "../features/stash";
import { CommitGraph } from "./graph/CommitGraph";
import { CommitDetailPanel } from "./diff/CommitDetailPanel";
import { useLayoutStore } from "../store/useLayoutStore";
import { useRepoStore } from "../store/useRepoStore";
import { useWindowDimensions } from "../hooks/useWindowDimensions";
import { useTranslation } from "../i18n";
import { qk } from "../domain/queryKeys";

export const Shell: React.FC = () => {
  const { t } = useTranslation();
  const {
    sidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    detailPanelOpen,
    toggleSidebar,
    setDetailPanelOpen,
  } = useLayoutStore();
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

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 180), 520);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
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
            style={!isMobile ? { width: `${sidebarWidth}px` } : undefined}
            className={clsx(
              isMobile ? "absolute inset-y-0 left-0 z-30 shadow-lg w-72" : "relative z-1",
              "h-full shrink-0 flex transition-[width] duration-200 ease-macos"
            )}
          >
            <div className="flex-1 h-full min-w-0 overflow-hidden">
              <BranchSidebar
                renderStashPanel={(stash, handlers) => (
                  <aside className="bg-surface border-r border-border-subtle w-72 shrink-0 h-full flex flex-col overflow-y-auto">
                    <StashDiffView
                      stashItem={stash}
                      repoPath={repoPath}
                      onApply={handlers.onApply}
                      onPop={handlers.onPop}
                      onDrop={handlers.onDrop}
                    />
                  </aside>
                )}
                renderForeignDialog={(dialog, closeDialog) => (
                  <>
                    {isDialog(dialog, "createTag") && (
                      <CreateTagModal
                        isOpen
                        onClose={closeDialog}
                        repoPath={repoPath}
                        targetCommitId={dialog.commitId}
                        targetCommitSummary={dialog.summary}
                        onSuccess={invalidateRepo}
                      />
                    )}

                    {isDialog(dialog, "deleteTag") && (
                      <DeleteTagModal
                        isOpen
                        onClose={closeDialog}
                        repoPath={repoPath}
                        tagName={dialog.tag.name}
                        targetCommitId={dialog.tag.target_commit_id}
                        hasRemote={Boolean(branchData?.remote && branchData.remote.length > 0)}
                        onSuccess={invalidateRepo}
                      />
                    )}

                    {isDialog(dialog, "manageRemotes") && (
                      <ManageRemotesModal isOpen onClose={closeDialog} repoPath={repoPath} />
                    )}

                    {(isDialog(dialog, "addRemote") || isDialog(dialog, "editRemote")) && (
                      <AddEditRemoteModal
                        isOpen
                        onClose={closeDialog}
                        repoPath={repoPath}
                        initialRemote={isDialog(dialog, "editRemote") ? dialog.remote : null}
                        onSuccess={invalidateRemotes}
                      />
                    )}

                    {isDialog(dialog, "pruneRemote") && (
                      <PruneConfirmModal
                        isOpen
                        onClose={closeDialog}
                        repoPath={repoPath}
                        remoteName={dialog.remoteName}
                        onSuccess={invalidateRemotes}
                      />
                    )}

                    {isDialog(dialog, "deleteRemote") && (
                      <DeleteRemoteModal
                        isOpen
                        onClose={closeDialog}
                        repoPath={repoPath}
                        remote={dialog.remote}
                        onSuccess={invalidateRemotes}
                      />
                    )}
                  </>
                )}
              />
            </div>

            {/* Resizer Handle */}
            {!isMobile && (
              <div
                onMouseDown={handleResizeMouseDown}
                onDoubleClick={() => setSidebarWidth(260)}
                className="w-1 hover:w-1.5 -mr-0.5 h-full cursor-col-resize z-20 transition-all group shrink-0 relative select-none hover:bg-accent active:bg-accent border-r border-border-subtle hover:border-accent"
                title={t.shellExt.resizeTooltip}
              >
                <div className="w-full h-full" />
              </div>
            )}
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
            className="absolute inset-0 modal-backdrop z-30 animate-fade-in"
          />
          <div
            data-testid="shell-detail-container"
            className={clsx(
              "absolute top-0 right-0 bottom-0 z-40 bg-surface border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-macos flex flex-col overflow-hidden animate-slide-up",
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
