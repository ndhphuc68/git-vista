import clsx from "clsx";
import type { CSSProperties } from "react";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import { GraphSvgLane } from "../../../components/graph/GraphSvgLane";
import type { GraphContextMenu } from "../model/graphDialog";
import { GRAPH_ROW_HEIGHT } from "../model/graphPresentation";
import { CommitGraphCommitRowSummary } from "./CommitGraphCommitRowSummary";

interface CommitGraphCommitRowProps {
  commit: GraphCommitNode;
  style: CSSProperties;
  isSelected: boolean;
  isFirstRow: boolean;
  maxCols: number;
  selectedCommitId: string | null;
  nextCommitId: string | null;
  prevCommitId: string | null;
  onSelectCommit: (commitId: string) => void;
  onCheckoutBranch?: (branchName: string) => void;
  onCompare: (baseRev: string, targetRev: string) => void;
  onContextMenu: (menu: GraphContextMenu) => void;
}

/** One virtualized commit row: graph lane, message with branch pills, author, date and SHA. */
export function CommitGraphCommitRow({
  commit,
  style,
  isSelected,
  isFirstRow,
  maxCols,
  selectedCommitId,
  nextCommitId,
  prevCommitId,
  onSelectCommit,
  onCheckoutBranch,
  onCompare,
  onContextMenu,
}: CommitGraphCommitRowProps) {
  const isHead = commit.refs.some((r) => r.ref_type === "head");
  const isMerge = commit.lines.some((l) => l.edge_type === "merge");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Commit ${commit.short_id}: ${commit.summary}`}
      onClick={(e) => {
        if ((e.ctrlKey || e.metaKey) && selectedCommitId && selectedCommitId !== commit.id) {
          onCompare(selectedCommitId, commit.id);
        } else {
          onSelectCommit(commit.id);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectCommit(commit.id);
        onContextMenu({ x: e.clientX, y: e.clientY, commit });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectCommit(commit.id);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (nextCommitId) onSelectCommit(nextCommitId);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (prevCommitId) onSelectCommit(prevCommitId);
        }
      }}
      style={style}
      className={clsx(
        "absolute top-0 left-0 w-full flex items-center px-3 border-b border-border-subtle cursor-pointer text-xs outline-none transition-colors group hover:z-20",
        isSelected
          ? "bg-accent-subtle"
          : "bg-transparent hover:bg-surface-hover focus:bg-surface-hover"
      )}
    >
      {/* Col 1: Multi-lane SVG Tracks */}
      <div className="w-32 shrink-0 flex items-center">
        <GraphSvgLane
          col={commit.col}
          colorIndex={commit.color_index}
          lines={commit.lines}
          maxCols={maxCols}
          isHead={isHead}
          isMerge={isMerge}
          rowHeight={GRAPH_ROW_HEIGHT}
          colWidth={16}
        />
      </div>

      <CommitGraphCommitRowSummary
        commit={commit}
        isSelected={isSelected}
        isFirstRow={isFirstRow}
        onCheckoutBranch={onCheckoutBranch}
      />
    </div>
  );
}
