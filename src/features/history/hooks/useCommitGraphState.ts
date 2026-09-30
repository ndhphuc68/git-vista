import { useState, useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRepoStore } from "../../../store/useRepoStore";
import { useViewStore } from "../../../store/useViewStore";
import { useLayoutStore } from "../../../store/useLayoutStore";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { useCommitGraph } from "../api/useCommitGraph";
import { useRepoStatus } from "../api/useRepoStatus";
import { useCheckoutBranch } from "../api/useCheckoutBranch";
import { useCheckoutCommit } from "../api/useCheckoutCommit";
import { useRepoState, type RepoStateInfo } from "../../conflict";
import { mapGitError } from "../../../utils/errorMapping";
import {
  getMaxGraphColumns,
  getUncommittedSummary,
  GRAPH_ROW_HEIGHT,
} from "../model/graphPresentation";
import type { GraphContextMenu, GraphDialog } from "../model/graphDialog";

function useContextMenuDismiss(
  isOpen: boolean,
  menuRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, menuRef, onClose]);
}

async function copyShaToClipboard(commitId: string, successMessage: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(commitId);
    }
  } catch {
    // ignore clipboard errors
  }
  useToastStore.getState().showSuccess(successMessage);
}

interface UseGraphCheckoutParams {
  repoPath: string;
  repoState: RepoStateInfo | undefined;
  setSelectedBranch: (branch: string | null) => void;
  setContextMenu: (menu: GraphContextMenu | null) => void;
  setDialog: (dialog: GraphDialog) => void;
  t: ReturnType<typeof useTranslation>["t"];
}

function useGraphCheckout({
  repoPath,
  repoState,
  setSelectedBranch,
  setContextMenu,
  setDialog,
  t,
}: UseGraphCheckoutParams) {
  const checkoutBranch = useCheckoutBranch(repoPath);
  const checkoutCommit = useCheckoutCommit(repoPath);

  const handleCheckoutBranch = async (branchName: string) => {
    if (repoState?.is_in_progress) {
      useToastStore
        .getState()
        .showError(mapGitError("OPERATION_IN_PROGRESS: Operation is already in progress", t));
      return;
    }
    try {
      await checkoutBranch.mutateAsync({ name: branchName });
      setSelectedBranch(branchName);
      useToastStore
        .getState()
        .showSuccess(t.sidebar.switchBranchSuccess.replace("{name}", branchName));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // A conflict gets the dialog that offers stash-and-checkout, as in the sidebar.
      if (msg.includes("CHECKOUT_CONFLICT")) {
        setDialog({ type: "checkoutConflict", targetBranch: branchName, errorMessage: msg });
      } else {
        useToastStore.getState().showError(mapGitError(err, t));
      }
    }
  };

  const handleCheckoutCommit = async (commitId: string) => {
    setContextMenu(null);
    if (repoState?.is_in_progress) {
      useToastStore
        .getState()
        .showError(mapGitError("OPERATION_IN_PROGRESS: Operation is already in progress", t));
      return;
    }
    try {
      await checkoutCommit.mutateAsync({ commitId });
      setSelectedBranch(null);
      useToastStore
        .getState()
        .showSuccess(t.graph.checkoutCommitSuccess.replace("{sha}", commitId.slice(0, 7)));
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err, t));
    }
  };

  return { handleCheckoutBranch, handleCheckoutCommit };
}

/** All state, effects and derived values CommitGraph's JSX reads. */
export function useCommitGraphState() {
  const { t } = useTranslation();
  const { currentRepo, selectedCommitId, setSelectedCommit, setSelectedBranch } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const { setDetailPanelOpen } = useLayoutStore();
  const parentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<GraphContextMenu | null>(null);
  const [dialog, setDialog] = useState<GraphDialog>({ type: "closed" });

  useContextMenuDismiss(Boolean(contextMenu), menuRef, () => setContextMenu(null));

  const handleCopySha = async (commitId: string) => {
    await copyShaToClipboard(commitId, t.graph.copyShaSuccess);
    setContextMenu(null);
  };

  const repoPath = currentRepo?.path ?? "";
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommitGraph(repoPath);
  const { data: repoStatus } = useRepoStatus(repoPath);
  const { data: repoState } = useRepoState(repoPath);
  const { hasUncommittedChanges, modifiedCount, untrackedCount } =
    getUncommittedSummary(repoStatus);

  const { handleCheckoutBranch, handleCheckoutCommit } = useGraphCheckout({
    repoPath,
    repoState,
    setSelectedBranch,
    setContextMenu,
    setDialog,
    t,
  });

  const commits = useMemo(() => (data ? data.pages.flatMap((page) => page.commits) : []), [data]);

  const maxCols = useMemo(() => getMaxGraphColumns(commits), [commits]);

  const rowVirtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => GRAPH_ROW_HEIGHT,
    overscan: 10,
  });

  const handleSelectCommit = (commitId: string) => {
    setSelectedCommit(commitId);
    setDetailPanelOpen(true);
  };

  return {
    t,
    selectedCommitId,
    parentRef,
    menuRef,
    contextMenu,
    setContextMenu,
    dialog,
    setDialog,
    handleCopySha,
    commits,
    maxCols,
    rowVirtualizer,
    hasUncommittedChanges,
    modifiedCount,
    untrackedCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleSelectCommit,
    handleCheckoutBranch,
    handleCheckoutCommit,
    setActiveScreen,
  };
}
