import React, { useMemo } from "react";
import { GitCommit, Trash2, Layers, Edit3, GitBranch } from "lucide-react";
import clsx from "clsx";
import type { RebasePlanStep, RebaseCommitItem } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";

export interface RebaseLivePreviewProps {
  baseCommitId: string;
  baseCommitSummary?: string;
  steps: RebasePlanStep[];
  commitMap: Map<string, RebaseCommitItem>;
}

interface ProjectedCommit {
  id: string;
  short_id: string;
  displayMessage: string;
  author_name: string;
  isReworded: boolean;
  isSquashed: boolean;
  squashedSubCommits: Array<{ short_id: string; summary: string }>;
}

export const RebaseLivePreview: React.FC<RebaseLivePreviewProps> = ({
  baseCommitId,
  baseCommitSummary,
  steps,
  commitMap,
}) => {
  const { t } = useTranslation();

  const { projectedCommits, droppedCommits, squashedCount, rewordedCount } = useMemo(() => {
    const projected: ProjectedCommit[] = [];
    const dropped: Array<{ short_id: string; summary: string }> = [];
    let sqCount = 0;
    let rwCount = 0;

    for (const step of steps) {
      const commit = commitMap.get(step.commit_id);
      const shortId = commit ? commit.short_id : step.commit_id.slice(0, 7);
      const originalSummary = commit ? commit.summary : step.commit_id.slice(0, 7);
      const author = commit ? commit.author_name : "Author";

      if (step.action === "Drop") {
        dropped.push({ short_id: shortId, summary: originalSummary });
        continue;
      }

      if (step.action === "Squash" || step.action === "Fixup") {
        sqCount++;
        if (projected.length > 0) {
          const target = projected[projected.length - 1]!;
          target.isSquashed = true;
          target.squashedSubCommits.push({ short_id: shortId, summary: originalSummary });
          if (step.action === "Squash" && step.new_message) {
            target.displayMessage = step.new_message.split("\n")[0] || target.displayMessage;
          }
        }
        continue;
      }

      const isReword = step.action === "Reword";
      if (isReword) {
        rwCount++;
      }

      const displayMessage =
        isReword && step.new_message
          ? step.new_message.split("\n")[0] || originalSummary
          : originalSummary;

      projected.push({
        id: step.commit_id,
        short_id: shortId,
        displayMessage,
        author_name: author,
        isReworded: isReword,
        isSquashed: false,
        squashedSubCommits: [],
      });
    }

    return {
      projectedCommits: projected,
      droppedCommits: dropped,
      squashedCount: sqCount,
      rewordedCount: rwCount,
    };
  }, [steps, commitMap]);

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5">
          <GitBranch size={13} className="text-accent" />
          {t.modals.interactiveRebase.preview.title}
        </h3>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
          {t.modals.interactiveRebase.preview.resultingCommits.replace(
            "{count}",
            projectedCommits.length.toString()
          )}
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex flex-col p-2 rounded-lg bg-surface border border-border-subtle shadow-2xs">
          <span className="text-[10px] text-secondary font-medium uppercase">
            {t.modals.interactiveRebase.actions.reword}
          </span>
          <span className="text-base font-bold text-sky-600 dark:text-sky-400">
            {rewordedCount}
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-lg bg-surface border border-border-subtle shadow-2xs">
          <span className="text-[10px] text-secondary font-medium uppercase">
            {t.modals.interactiveRebase.actions.squash}
          </span>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">
            {squashedCount}
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-lg bg-surface border border-border-subtle shadow-2xs">
          <span className="text-[10px] text-secondary font-medium uppercase">
            {t.modals.interactiveRebase.actions.drop}
          </span>
          <span className="text-base font-bold text-rose-600 dark:text-rose-400">
            {droppedCommits.length}
          </span>
        </div>
      </div>

      {/* Linear Projected Timeline */}
      <div className="flex-1 flex flex-col gap-0 relative pl-2">
        {/* Base Commit Node */}
        <div className="flex items-start gap-3 relative pb-4">
          {/* Vertical connecting line */}
          <div className="absolute left-[9px] top-4 bottom-0 w-[2px] bg-border-subtle" />

          <div className="w-5 h-5 rounded-full bg-surface-subtle border-2 border-border-strong flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          </div>

          <div className="flex flex-col min-w-0 pr-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-surface-subtle border border-border-subtle text-secondary">
                {baseCommitId.slice(0, 7)}
              </span>
              <span className="text-[10px] uppercase font-bold text-secondary bg-surface-subtle px-1 rounded">
                Base
              </span>
            </div>
            <span className="text-xs text-secondary truncate mt-0.5">
              {baseCommitSummary || "Base commit"}
            </span>
          </div>
        </div>

        {/* Projected Commits Chain (from bottom to top or top to bottom) */}
        {projectedCommits.map((item, idx) => {
          const isLastItem = idx === projectedCommits.length - 1;
          return (
            <div key={item.id + idx} className="flex items-start gap-3 relative pb-4">
              {/* Vertical connecting line */}
              {!isLastItem && (
                <div className="absolute left-[9px] top-4 bottom-0 w-[2px] bg-accent/40" />
              )}

              {/* Dot Icon */}
              <div
                className={clsx(
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs border-2",
                  isLastItem
                    ? "bg-accent border-accent text-white"
                    : "bg-surface border-accent text-accent"
                )}
              >
                <GitCommit size={11} />
              </div>

              {/* Commit Information */}
              <div className="flex flex-col min-w-0 flex-1 p-2 rounded-lg bg-surface border border-border-subtle shadow-2xs">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-semibold text-primary">
                      {item.short_id}
                    </span>
                    {isLastItem && (
                      <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-accent/20 text-accent">
                        HEAD
                      </span>
                    )}
                  </div>
                  {item.isReworded && (
                    <span className="text-[10px] flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-medium">
                      <Edit3 size={10} /> Reworded
                    </span>
                  )}
                </div>

                <span
                  className={clsx(
                    "text-xs font-medium text-primary mt-1 truncate",
                    item.isReworded && "italic text-accent"
                  )}
                  title={item.displayMessage}
                >
                  {item.displayMessage}
                </span>

                {/* Squashed commits info */}
                {item.squashedSubCommits.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-border-subtle flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Layers size={10} />+{item.squashedSubCommits.length} squashed into this
                      commit:
                    </span>
                    {item.squashedSubCommits.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="text-[10px] text-secondary font-mono truncate pl-2 border-l border-amber-500/30"
                      >
                        {sub.short_id} • {sub.summary}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-secondary mt-1">
                  <span>{item.author_name}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state if all commits dropped */}
        {projectedCommits.length === 0 && (
          <div className="p-4 text-center text-xs text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20 my-2">
            {t.modals.interactiveRebase.validation.cannotDropAll}
          </div>
        )}
      </div>

      {/* Dropped Commits Section */}
      {droppedCommits.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border-subtle">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-2">
            <Trash2 size={12} />
            {t.modals.interactiveRebase.preview.droppedCount.replace(
              "{count}",
              droppedCommits.length.toString()
            )}
          </span>
          <div className="flex flex-col gap-1">
            {droppedCommits.map((d, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-[11px] font-mono text-secondary bg-surface-subtle/50 px-2 py-1 rounded line-through opacity-75"
              >
                <span className="font-semibold">{d.short_id}</span>
                <span className="truncate">{d.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
