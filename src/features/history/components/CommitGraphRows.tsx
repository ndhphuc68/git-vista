import clsx from "clsx";
import { GitBranch, Tag } from "lucide-react";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import { GraphSvgLane } from "../../../components/graph/GraphSvgLane";
import { useTranslation } from "../../../i18n";
import { getBranchPillStyle } from "../model/graphPresentation";
import type { GraphContextMenu } from "../model/graphDialog";

export const GRAPH_ROW_HEIGHT = 32;

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
  onCompare,
  onContextMenu,
}: CommitGraphRowsProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* ROW 0: // WIP Row (Working directory changes) */}
      {hasUncommittedChanges && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onShowChanges()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onShowChanges();
            }
          }}
          aria-label={t.graph.wipChanges}
          className="flex items-center px-3 h-8 bg-amber-50/50 dark:bg-amber-950/25 hover:bg-amber-100/60 dark:hover:bg-amber-950/45 border-b border-border-subtle cursor-pointer transition-colors group shrink-0"
        >
          <div className="w-80 shrink-0 pr-2 flex items-center justify-end">
            <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-1.5 py-0.5 rounded">
              // WIP
            </span>
            <span className="w-2.5 h-[1.5px] bg-sky-400 ml-1 shrink-0" />
          </div>

          <div className="w-32 shrink-0 flex items-center">
            <svg width="128" height="32" className="overflow-visible">
              <line
                x1="16"
                y1="16"
                x2="16"
                y2="32"
                stroke="#0284C7"
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              <circle
                cx="16"
                cy="16"
                r="6"
                className="fill-surface stroke-[#0284C7]"
                strokeWidth="2"
                strokeDasharray="2.5,2.5"
              />
              <circle cx="16" cy="16" r="2.5" fill="#0284C7" />
            </svg>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 pl-2">
            <span className="font-semibold text-primary truncate text-xs group-hover:text-accent transition-colors">
              {t.graph.wipChanges}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
              {modifiedCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  ✏️ {t.graph.modifiedCount.replace("{n}", String(modifiedCount))}
                </span>
              )}
              {untrackedCount > 0 && (
                <span className="text-diff-add-text font-semibold">
                  + {t.graph.untrackedCount.replace("{n}", String(untrackedCount))}
                </span>
              )}
            </div>
          </div>

          <div className="w-36 text-right pr-2 shrink-0 text-secondary font-mono text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-window text-secondary font-medium">
              {t.graph.justNow}
            </span>
          </div>
          <div className="w-24 shrink-0"></div>
        </div>
      )}

      {/* Virtualized Commits */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
        className="w-full relative"
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const commit = commits[virtualRow.index];
          if (!commit) return null;
          const isSelected = selectedCommitId === commit.id;
          const isHead = commit.refs.some((r) => r.ref_type === "head");
          const isMerge = commit.lines.some((l) => l.edge_type === "merge");
          const displayedRefs = commit.refs.slice(0, 2);
          const remainingCount = commit.refs.length - displayedRefs.length;

          return (
            <div
              key={commit.id}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
              aria-label={`Commit ${commit.short_id}: ${commit.summary}`}
              onClick={(e) => {
                if (
                  (e.ctrlKey || e.metaKey) &&
                  selectedCommitId &&
                  selectedCommitId !== commit.id
                ) {
                  onCompare(selectedCommitId, commit.id);
                } else {
                  onSelectCommit(commit.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectCommit(commit.id);
                onContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  commit,
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCommit(commit.id);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const nextCommit = commits[virtualRow.index + 1];
                  if (nextCommit) {
                    onSelectCommit(nextCommit.id);
                  }
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prevCommit = commits[virtualRow.index - 1];
                  if (prevCommit) {
                    onSelectCommit(prevCommit.id);
                  }
                }
              }}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={clsx(
                "absolute top-0 left-0 w-full flex items-center px-3 border-b border-border-subtle cursor-pointer text-xs outline-none transition-colors group",
                isSelected
                  ? "bg-accent-subtle"
                  : "bg-transparent hover:bg-surface-hover focus:bg-surface-hover"
              )}
            >
              {/* Col 1: Branch / Tag Pills */}
              <div className="w-80 shrink-0 pr-2 flex items-center justify-end overflow-visible gap-1.5 min-w-0">
                {displayedRefs.map((r, i) => {
                  const isHeadRef = r.ref_type === "head";
                  const isTagRef = r.ref_type === "tag";
                  const style = getBranchPillStyle(r.name, isHeadRef, isTagRef);

                  return (
                    <div key={i} className="relative group/pill min-w-0 shrink max-w-[190px]">
                      <div
                        title={r.name}
                        className={clsx(
                          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono border shadow-2xs cursor-pointer transition-all hover:brightness-95 hover:shadow-xs min-w-0",
                          style.container
                        )}
                      >
                        {isHeadRef ? (
                          <GitBranch size={10.5} className="shrink-0 text-white" />
                        ) : isTagRef ? (
                          <Tag
                            size={10.5}
                            className="shrink-0 text-amber-700 dark:text-amber-300"
                          />
                        ) : (
                          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                        )}
                        <span className="truncate min-w-0">{r.name}</span>
                        {isHeadRef && (
                          <span className="text-[8.5px] px-1 bg-white/25 rounded font-bold ml-0.5 shrink-0">
                            {t.graph.headBadge}
                          </span>
                        )}
                      </div>

                      {/* Hover floating tooltip displaying full branch name */}
                      <div
                        className={clsx(
                          "absolute left-0 hidden group-hover/pill:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-mono rounded-md shadow-xl z-50 pointer-events-none whitespace-nowrap border border-slate-700/60 animate-fade-in",
                          virtualRow.index === 0 ? "top-full mt-1.5" : "bottom-full mb-1.5"
                        )}
                      >
                        <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                        <span>{r.name}</span>
                      </div>
                    </div>
                  );
                })}
                {remainingCount > 0 && (
                  <div
                    title={commit.refs
                      .slice(2)
                      .map((r) => r.name)
                      .join(", ")}
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border-strong text-secondary shrink-0 cursor-help"
                  >
                    +{remainingCount}
                  </div>
                )}
                {commit.refs.length > 0 && (
                  <span className="w-2.5 h-[1.5px] bg-border-strong ml-0.5 shrink-0" />
                )}
              </div>

              {/* Col 2: Multi-lane SVG Tracks */}
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

              {/* Col 3: Commit Message */}
              <div className="flex-1 min-w-0 flex items-center gap-2 pl-2">
                <span
                  className={clsx(
                    "whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-xs",
                    isSelected
                      ? "font-semibold text-accent"
                      : "font-normal text-primary group-hover:text-accent transition-colors"
                  )}
                >
                  {commit.summary}
                </span>
              </div>

              {/* Col 4: Author (Bolder and clearer) */}
              <span
                title={commit.author_name}
                className="w-36 text-right pr-2 text-primary font-semibold text-xs whitespace-nowrap truncate shrink-0"
              >
                {commit.author_name}
              </span>

              {/* Col 5: Short SHA (Bolder, clearer font & styled badge) */}
              <div className="w-24 text-right pr-3 shrink-0">
                <span
                  title={`${t.graph.columns.sha}: ${commit.id}`}
                  className="font-mono font-bold text-accent dark:text-accent text-xs px-1.5 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border-subtle shadow-2xs inline-block"
                >
                  {commit.short_id}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
