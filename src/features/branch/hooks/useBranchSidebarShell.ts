import { useState } from "react";
import { type StashItem } from "../../../ipc/bindings.generated";
import { NO_DIALOG, type SidebarDialog } from "../model/sidebarDialog";
import { useCheckoutBranch } from "../api";
import { useSidebarData } from "./useSidebarData";
import { useSidebarActions } from "./useSidebarActions";
import { useActiveSidebarMenu } from "./useActiveSidebarMenu";

export interface BranchSidebarShellOptions {
  repoPath: string;
  selectedBranch: string | null;
  setSelectedBranch: (name: string) => void;
}

/**
 * All of the sidebar's own UI state (search, section open/closed, the
 * dialog slot, the context-menu slot and its outside-click/Escape handling,
 * and expanded folders) plus the checkout handler that opens the checkout-
 * conflict dialog on failure. The sidebar component itself keeps only the
 * JSX and the early-return for "no repo open".
 */
export function useBranchSidebarShell({
  repoPath,
  selectedBranch,
  setSelectedBranch,
}: BranchSidebarShellOptions) {
  const checkoutBranch = useCheckoutBranch(repoPath);

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
  const { activeMenu, setActiveMenu, activeMenuRef } = useActiveSidebarMenu();

  const data = useSidebarData(repoPath);
  const { branchData, stashes, tagItems, hasUncommittedChanges } = data;
  const actions = useSidebarActions({
    repoPath,
    stashes,
    closeStashPanel: () => setSelectedStash(null),
    closeMenu: () => setActiveMenu(null),
  });
  const currentBranchName =
    branchData?.current_branch ||
    branchData?.local.find((branch) => branch.is_head)?.name ||
    selectedBranch ||
    "main";
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const handleCheckout = async (branchName: string) => {
    setActiveMenu(null);
    try {
      // invalidateRepo is gone from here: useCheckoutBranch owns invalidation.
      await checkoutBranch.mutateAsync({ name: branchName });
      setSelectedBranch(branchName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("CHECKOUT_CONFLICT") || msg.toLowerCase().includes("conflict")) {
        setDialog({ kind: "checkoutConflict", targetBranch: branchName, errorMessage: msg });
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

  return {
    search,
    setSearch,
    openSections,
    toggleSection: (section: "local" | "remote" | "tags" | "stash") =>
      setOpenSections((previous) => ({ ...previous, [section]: !previous[section] })),
    selectedStash,
    setSelectedStash,
    dialog,
    setDialog,
    closeDialog,
    activeMenu,
    setActiveMenu,
    activeMenuRef,
    expandedFolders,
    toggleFolder,
    handleCheckout,
    currentBranchName,
    tagItems,
    hasUncommittedChanges,
    data,
    actions,
  };
}
