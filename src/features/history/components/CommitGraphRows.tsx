import type { Virtualizer } from "@tanstack/react-virtual";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import type { GraphContextMenu } from "../model/graphDialog";
import { GRAPH_ROW_HEIGHT } from "../model/graphPresentation";
import { CommitGraphWipRow } from "./CommitGraphWipRow";
import { CommitGraphCommitRow } from "./CommitGraphCommitRow";

export { GRAPH_ROW_HEIGHT };

interface CommitGraphRowsProps {
  commits: GraphCommitNode[];
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  selectedCommitId: string | null;
  maxCols: number;
  hasUncommittedChanges: boolean;
  modifiedCount: number;
  untrackedCount: number;
  onShowChanges: () => void;
  onSelectCommit: (commitId: string) => void;
  onCheckoutBranch?: (branchName: string) => void;
  onCompare: (baseRev: string, targetRev: string) => void;
  onContextMenu: (menu: GraphContextMenu) => void;
}

export function CommitGraphRows({
  commits,
  rowVirtualizer,
  selectedCommitId,
  maxCols,
  hasUncommittedChanges,
  modifiedCount,
  untrackedCount,
  onShowChanges,
  onSelectCommit,
  onCheckoutBranch,
  onCompare,
  onContextMenu,
}: CommitGraphRowsProps) {
  return (
    <>
      {hasUncommittedChanges && (
        <CommitGraphWipRow
          modifiedCount={modifiedCount}
          untrackedCount={untrackedCount}
          onShowChanges={onShowChanges}
        />
      )}

      {/* Virtualized Commits */}
      <div
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        className="w-full relative"
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const commit = commits[virtualRow.index];
          if (!commit) return null;

          return (
            <CommitGraphCommitRow
              key={commit.id}
              commit={commit}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              isSelected={selectedCommitId === commit.id}
              isFirstRow={virtualRow.index === 0}
              maxCols={maxCols}
              selectedCommitId={selectedCommitId}
              nextCommitId={commits[virtualRow.index + 1]?.id ?? null}
              prevCommitId={commits[virtualRow.index - 1]?.id ?? null}
              onSelectCommit={onSelectCommit}
              onCheckoutBranch={onCheckoutBranch}
              onCompare={onCompare}
              onContextMenu={onContextMenu}
            />
          );
        })}
      </div>
    </>
  );
}
