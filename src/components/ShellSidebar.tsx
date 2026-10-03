import React from "react";
import clsx from "clsx";
import { BranchSidebar } from "../features/branch";
import { type BranchListResult } from "../ipc/bindings.generated";
import { StashDiffView } from "../features/stash";
import { ShellForeignDialogs } from "./ShellForeignDialogs";

interface ShellSidebarProps {
  sidebarOpen: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
  repoPath: string;
  branchData: BranchListResult | undefined;
  invalidateRepo: () => void;
  invalidateRemotes: () => void;
}

/** The Shell's left branch sidebar and the dialogs it renders. */
export const ShellSidebar: React.FC<ShellSidebarProps> = ({
  sidebarOpen,
  isMobile,
  toggleSidebar,
  sidebarWidth,
  repoPath,
  branchData,
  invalidateRepo,
  invalidateRemotes,
}) => {
  if (!sidebarOpen) return null;

  return (
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
          isMobile ? "absolute inset-y-0 left-0 z-30 shadow-lg w-72" : "relative",
          "h-full shrink-0 flex border-r border-border-subtle"
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
              <ShellForeignDialogs
                dialog={dialog}
                closeDialog={closeDialog}
                repoPath={repoPath}
                branchData={branchData}
                invalidateRepo={invalidateRepo}
                invalidateRemotes={invalidateRemotes}
              />
            )}
          />
        </div>
      </div>
    </>
  );
};
