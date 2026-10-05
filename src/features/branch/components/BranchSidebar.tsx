import { SCREEN_TYPE } from "../../../domain/enums";
import React from "react";
import { useRepoStore } from "../../../store/useRepoStore";
import { useViewStore } from "../../../store/useViewStore";
import { type StashItem } from "../../../ipc/bindings.generated";
// Sibling modules directly, not through ../index — the barrel re-exports this
// file, so going through it would create an import cycle.
import { type SidebarDialog } from "../model/sidebarDialog";
import { useBranchSidebarShell } from "../hooks/useBranchSidebarShell";
import { BranchSidebarSections } from "./BranchSidebarSections";
import { BranchSidebarDialogs } from "./BranchSidebarDialogs";

export interface BranchSidebarProps {
  /**
   * Dialogs owned by other features. The sidebar decides *when* they open —
   * it holds the dialog slot — but must not import another feature's components.
   * Shell supplies them.
   */
  renderForeignDialog?: (dialog: SidebarDialog, close: () => void) => React.ReactNode;
  /**
   * Panel shown beside the sidebar for the selected stash.
   *
   * The sidebar's action hook owns confirmation, undo and selection changes.
   * Shell only places the panel and connects these handlers.
   */
  renderStashPanel?: (
    stash: StashItem,
    handlers: {
      onApply: (index: number) => void;
      onPop: (index: number) => void;
      onDrop: (index: number) => void;
    },
    close: () => void
  ) => React.ReactNode;
}

export const BranchSidebar: React.FC<BranchSidebarProps> = ({
  renderForeignDialog,
  renderStashPanel,
}) => {
  const { currentRepo, selectedBranch, setSelectedBranch } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const shell = useBranchSidebarShell({
    repoPath: currentRepo?.path ?? "",
    selectedBranch,
    setSelectedBranch,
  });
  const { actions, data } = shell;

  if (!currentRepo) return null;

  return (
    <>
      <BranchSidebarSections
        data={data}
        actions={actions}
        search={shell.search}
        setSearch={shell.setSearch}
        openSections={shell.openSections}
        toggleSection={shell.toggleSection}
        selectedStash={shell.selectedStash}
        setSelectedStash={shell.setSelectedStash}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        currentBranchName={shell.currentBranchName}
        activeMenu={shell.activeMenu}
        setActiveMenu={shell.setActiveMenu}
        activeMenuRef={shell.activeMenuRef}
        expandedFolders={shell.expandedFolders}
        toggleFolder={shell.toggleFolder}
        handleCheckout={shell.handleCheckout}
        setDialog={shell.setDialog}
      />

      {/* Stash diff panel (shown beside sidebar when stash is selected) */}
      {shell.selectedStash &&
        renderStashPanel?.(
          shell.selectedStash,
          { onApply: actions.applyStash, onPop: actions.popStash, onDrop: actions.dropStash },
          () => shell.setSelectedStash(null)
        )}

      <BranchSidebarDialogs
        dialog={shell.dialog}
        closeDialog={shell.closeDialog}
        repoPath={currentRepo.path}
        invalidateRepo={actions.invalidateRepo}
        currentBranchName={shell.currentBranchName}
        hasUncommittedChanges={shell.hasUncommittedChanges}
        localBranches={data.branchData?.local}
        tagItems={shell.tagItems}
        onMerge={actions.mergeBranch}
        onRebase={actions.rebaseBranch}
        onNavigateToChanges={() => setActiveScreen(SCREEN_TYPE.CHANGES)}
        renderForeignDialog={renderForeignDialog}
      />
    </>
  );
};
