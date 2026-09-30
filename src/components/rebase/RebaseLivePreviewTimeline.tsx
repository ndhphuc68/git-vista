import React from "react";
import { useTranslation } from "../../i18n";
import type { ProjectedCommit } from "./rebaseProjection";
import { RebaseLivePreviewTimelineItem } from "./RebaseLivePreviewTimelineItem";

export interface RebaseLivePreviewTimelineProps {
  baseCommitId: string;
  baseCommitSummary?: string;
  projectedCommits: ProjectedCommit[];
}

export const RebaseLivePreviewTimeline: React.FC<RebaseLivePreviewTimelineProps> = ({
  baseCommitId,
  baseCommitSummary,
  projectedCommits,
}) => {
  const { t } = useTranslation();

  return (
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
      {projectedCommits.map((item, idx) => (
        <RebaseLivePreviewTimelineItem
          key={item.id}
          item={item}
          isLastItem={idx === projectedCommits.length - 1}
        />
      ))}

      {/* Empty state if all commits dropped */}
      {projectedCommits.length === 0 && (
        <div className="p-4 text-center text-xs text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20 my-2">
          {t.modals.interactiveRebase.validation.cannotDropAll}
        </div>
      )}
    </div>
  );
};
