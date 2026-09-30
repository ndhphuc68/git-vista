import { useState } from "react";
import { type BranchListResult, type StashItem } from "../../../ipc/bindings.generated";
import { NO_DIALOG, type SidebarDialog } from "../model/sidebarDialog";
import { checkedOutBranchName } from "../model/checkoutTarget";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { mapGitError } from "../../../utils/errorMapping";
import { useCheckoutBranch } from "../api";
import { useSidebarData } from "./useSidebarData";
import { useSidebarActions } from "./useSidebarActions";
import { useActiveSidebarMenu } from "./useActiveSidebarMenu";

export interface BranchSidebarShellOptions {
  repoPath: string;
  selectedBranch: string | null;
  setSelectedBranch: (name: string) => void;
}

interface PerformCheckoutOptions {
  branchName: string;
  isInProgress: boolean | undefined;
  branchData: BranchListResult | undefined;
  checkoutBranch: (variables: { name: string }) => Promise<unknown>;
  setSelectedBranch: (name: string) => void;
  setDialog: (dialog: SidebarDialog) => void;
  setActiveMenu: (menu: null) => void;
  t: ReturnType<typeof useTranslation>["t"];
}

async function performCheckout({
  branchName,
  isInProgress,
  branchData,
  checkoutBranch,
  setSelectedBranch,
  setDialog,
  setActiveMenu,
  t,
}: PerformCheckoutOptions) {
  setActiveMenu(null);
  if (isInProgress) {
    useToastStore
      .getState()
      .showError(mapGitError("OPERATION_IN_PROGRESS: Operation is already in progress", t));
    return;
  }
  try {
    // invalidateRepo is gone from here: useCheckoutBranch owns invalidation.
    await checkoutBranch({ name: branchName });
    const checkedOut = checkedOutBranchName(branchName, branchData);
    setSelectedBranch(checkedOut);
    useToastStore
      .getState()
      .showSuccess(t.sidebar.switchBranchSuccess.replace("{name}", checkedOut));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Only the backend's own code: other errors can mention a "conflict" too.
    if (msg.includes("CHECKOUT_CONFLICT")) {
      setDialog({ kind: "checkoutConflict", targetBranch: branchName, errorMessage: msg });
    } else {
      useToastStore.getState().showError(mapGitError(err, t));
    }
  }
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
  const { t } = useTranslation();
  const currentBranchName =
    branchData?.current_branch ||
    branchData?.local.find((branch) => branch.is_head)?.name ||
    selectedBranch ||
    "main";
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const handleCheckout = (branchName: string) =>
    performCheckout({
      branchName,
      isInProgress: data.repoState?.is_in_progress,
      branchData,
      checkoutBranch: checkoutBranch.mutateAsync,
      setSelectedBranch,
      setDialog,
      setActiveMenu,
      t,
    });

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
