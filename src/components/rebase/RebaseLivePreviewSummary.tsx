import React from "react";
import { GitBranch } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface RebaseLivePreviewSummaryProps {
  resultingCount: number;
  rewordedCount: number;
  squashedCount: number;
  droppedCount: number;
}

export const RebaseLivePreviewSummary: React.FC<RebaseLivePreviewSummaryProps> = ({
  resultingCount,
  rewordedCount,
  squashedCount,
  droppedCount,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5">
          <GitBranch size={13} className="text-link" />
          {t.modals.interactiveRebase.preview.title}
        </h3>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
          {t.modals.interactiveRebase.preview.resultingCommits.replace(
            "{count}",
            resultingCount.toString()
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
            {droppedCount}
          </span>
        </div>
      </div>
    </>
  );
};
