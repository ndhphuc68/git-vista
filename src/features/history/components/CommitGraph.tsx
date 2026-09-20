import { useState, useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRepoStore } from "../../../store/useRepoStore";
import { useViewStore } from "../../../store/useViewStore";
import { useLayoutStore } from "../../../store/useLayoutStore";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { useCommitGraph } from "../api/useCommitGraph";
import { useRepoStatus } from "../api/useRepoStatus";
import { getMaxGraphColumns } from "../model/graphPresentation";
import type { GraphContextMenu, GraphDialog } from "../model/graphDialog";
import { CommitGraphHeader } from "./CommitGraphHeader";
import { CommitGraphRows, GRAPH_ROW_HEIGHT } from "./CommitGraphRows";
import { CommitGraphContextMenu } from "./CommitGraphContextMenu";
import { CommitGraphDialogs, type GraphDialogComponents } from "./CommitGraphDialogs";

export function CommitGraph(dialogComponents: GraphDialogComponents) {
  const { t } = useTranslation();
  const { currentRepo, selectedCommitId, setSelectedCommit } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const { setDetailPanelOpen } = useLayoutStore();
  const parentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<GraphContextMenu | null>(null);
  const [dialog, setDialog] = useState<GraphDialog>({ type: "closed" });

  useEffect(() => {
    if (!contextMenu) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const handleCopySha = async (commitId: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(commitId);
      }
    } catch {
      // ignore clipboard errors
    }
    useToastStore.getState().showSuccess(t.graph.copyShaSuccess);
    setContextMenu(null);
  };

  const repoPath = currentRepo?.path ?? "";
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommitGraph(repoPath);
  const { data: repoStatus } = useRepoStatus(repoPath);

  const hasUncommittedChanges = Boolean(
    repoStatus &&
    (repoStatus.staged.length > 0 ||
      repoStatus.unstaged.length > 0 ||
      repoStatus.untracked.length > 0)
  );

  const modifiedCount = (repoStatus?.staged.length || 0) + (repoStatus?.unstaged.length || 0);
  const untrackedCount = repoStatus?.untracked.length || 0;

  const commits = data ? data.pages.flatMap((page) => page.commits) : [];

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

  return (
    <div className="h-full w-full flex flex-col bg-surface overflow-hidden select-none">
      <CommitGraphHeader />
      <div
        ref={parentRef}
        className="flex-1 w-full overflow-y-auto bg-surface relative"
        onScroll={(e) => {
          const target = e.currentTarget;
          if (
            target.scrollHeight - target.scrollTop - target.clientHeight < 200 &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            fetchNextPage();
          }
        }}
      >
        <CommitGraphRows
          commits={commits}
          rowVirtualizer={rowVirtualizer}
          selectedCommitId={selectedCommitId}
          maxCols={maxCols}
          hasUncommittedChanges={hasUncommittedChanges}
          modifiedCount={modifiedCount}
          untrackedCount={untrackedCount}
          onShowChanges={() => setActiveScreen("changes")}
          onSelectCommit={handleSelectCommit}
          onCompare={(baseRev, targetRev) => setDialog({ type: "compare", baseRev, targetRev })}
          onContextMenu={setContextMenu}
        />
      </div>
      {contextMenu && (
        <CommitGraphContextMenu
          contextMenu={contextMenu}
          menuRef={menuRef}
          selectedCommitId={selectedCommitId}
          onOpenDialog={setDialog}
          onClose={() => setContextMenu(null)}
          onCopySha={handleCopySha}
        />
      )}
      <CommitGraphDialogs
        {...dialogComponents}
        dialog={dialog}
        onClose={() => setDialog({ type: "closed" })}
      />
    </div>
  );
}
