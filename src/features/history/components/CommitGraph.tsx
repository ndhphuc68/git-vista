import { useCommitGraphState } from "../hooks/useCommitGraphState";
import { CommitGraphHeader } from "./CommitGraphHeader";
import { CommitGraphRows } from "./CommitGraphRows";
import { CommitGraphContextMenu } from "./CommitGraphContextMenu";
import { CommitGraphDialogs, type GraphDialogComponents } from "./CommitGraphDialogs";

export function CommitGraph(dialogComponents: GraphDialogComponents) {
  const {
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
    setActiveScreen,
  } = useCommitGraphState();

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
