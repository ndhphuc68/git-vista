import React, { useState, useEffect, useRef } from "react";
import { useRepoStore } from "../../../store/useRepoStore";
import { useViewStore } from "../../../store/useViewStore";
import { type StashItem } from "../../../ipc/bindings.generated";
// Sibling modules directly, not through ../index — the barrel re-exports this
// file, so going through it would create an import cycle.
import { CreateBranchModal } from "./CreateBranchModal";
import { RenameBranchModal } from "./RenameBranchModal";
import { DeleteBranchModal } from "./DeleteBranchModal";
import { CheckoutConflictModal } from "./CheckoutConflictModal";
import { MergeBranchModal } from "../../../components/merge/MergeBranchModal";
import { RebaseBranchModal } from "../../../components/merge/RebaseBranchModal";
import { CompareModal } from "../../../components/compare";
import { NO_DIALOG, isDialog, type SidebarDialog } from "../model/sidebarDialog";
import { useCheckoutBranch } from "../api";
import { useSidebarData } from "../hooks/useSidebarData";
import { useSidebarActions } from "../hooks/useSidebarActions";
import { BranchSidebarSections, type ActiveSidebarMenu } from "./BranchSidebarSections";

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
  const checkoutBranch = useCheckoutBranch(currentRepo?.path ?? "");

  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState({
    local: true,
    remote: true,
    tags: false,
    stash: false,
  });
  const [selectedStash, setSelectedStash] = useState<StashItem | null>(null);

  // One slot for every dialog: opening one necessarily closes the other, so
  // the "two dialogs open at once" states the old flags allowed cannot arise.
  const [dialog, setDialog] = useState<SidebarDialog>(NO_DIALOG);
  const closeDialog = () => setDialog(NO_DIALOG);

  // Context / Action menu state (strictly 1 active menu at any time)
  const [activeMenu, setActiveMenu] = useState<ActiveSidebarMenu>(null);
  const activeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (activeMenuRef.current && !activeMenuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
      }
    };
    window.addEventListener("mousedown", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const data = useSidebarData(currentRepo?.path ?? "");
  const { branchData, stashes, tagItems, hasUncommittedChanges } = data;
  const actions = useSidebarActions({
    repoPath: currentRepo?.path ?? "",
    stashes,
    closeStashPanel: () => setSelectedStash(null),
    closeMenu: () => setActiveMenu(null),
  });
  const { invalidateRepo } = actions;
  const currentBranchName =
    branchData?.current_branch ||
    branchData?.local.find((branch) => branch.is_head)?.name ||
    selectedBranch ||
    "main";
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  if (!currentRepo) return null;

  const handleCheckout = async (branchName: string) => {
    setActiveMenu(null);
    try {
      // invalidateRepo is gone from here: useCheckoutBranch owns invalidation.
      await checkoutBranch.mutateAsync({ name: branchName });
      setSelectedBranch(branchName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("CHECKOUT_CONFLICT") || msg.toLowerCase().includes("conflict")) {
        setDialog({
          kind: "checkoutConflict",
          targetBranch: branchName,
          errorMessage: msg,
        });
      } else {
        alert(`Không thể chuyển nhánh: ${msg}`);
      }
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: prev[folderPath] === false ? true : false,
    }));
  };

  return (
    <>
      <BranchSidebarSections
        repoPath={currentRepo.path}
        data={data}
        actions={actions}
        search={search}
        setSearch={setSearch}
        openSections={openSections}
        toggleSection={(section) =>
          setOpenSections((previous) => ({ ...previous, [section]: !previous[section] }))
        }
        selectedStash={selectedStash}
        setSelectedStash={setSelectedStash}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        currentBranchName={currentBranchName}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        activeMenuRef={activeMenuRef}
        expandedFolders={expandedFolders}
        toggleFolder={toggleFolder}
        handleCheckout={handleCheckout}
        setDialog={setDialog}
      />

      {/* Stash diff panel (shown beside sidebar when stash is selected) */}
      {selectedStash &&
        renderStashPanel?.(
          selectedStash,
          { onApply: actions.applyStash, onPop: actions.popStash, onDrop: actions.dropStash },
          () => setSelectedStash(null)
        )}

      {/* MODALS — one slot, so at most one of these renders at a time. */}
      {isDialog(dialog, "createBranch") && (
        <CreateBranchModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          targetCommit={dialog.fromRef}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "renameBranch") && (
        <RenameBranchModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          currentName={dialog.name}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "deleteBranch") && (
        <DeleteBranchModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          branchName={dialog.name}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "checkoutConflict") && (
        <CheckoutConflictModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          targetBranch={dialog.targetBranch}
          errorMessage={dialog.errorMessage}
          onNavigateToChanges={() => setActiveScreen("changes")}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "merge") && (
        <MergeBranchModal
          isOpen={true}
          onClose={closeDialog}
          currentBranch={currentBranchName}
          targetBranch={dialog.targetBranch}
          hasUncommittedChanges={hasUncommittedChanges}
          onMerge={(noFf) => actions.mergeBranch(dialog.targetBranch, noFf)}
        />
      )}

      {isDialog(dialog, "rebase") && (
        <RebaseBranchModal
          isOpen={true}
          onClose={closeDialog}
          currentBranch={currentBranchName}
          upstreamBranch={dialog.upstreamBranch}
          hasUncommittedChanges={hasUncommittedChanges}
          onRebase={() => actions.rebaseBranch(dialog.upstreamBranch)}
        />
      )}

      {isDialog(dialog, "compare") && (
        <CompareModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          initialBaseRev={dialog.baseRev}
          initialTargetRev={dialog.targetRev}
          branches={branchData?.local}
          tags={tagItems}
        />
      )}

      {renderForeignDialog?.(dialog, closeDialog)}
    </>
  );
};
