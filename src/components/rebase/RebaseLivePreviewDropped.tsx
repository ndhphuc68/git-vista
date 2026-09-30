import React from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface RebaseLivePreviewDroppedProps {
  droppedCommits: Array<{ short_id: string; summary: string }>;
}

export const RebaseLivePreviewDropped: React.FC<RebaseLivePreviewDroppedProps> = ({
  droppedCommits,
}) => {
  const { t } = useTranslation();

  if (droppedCommits.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-border-subtle">
      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-2">
        <Trash2 size={12} />
        {t.modals.interactiveRebase.preview.droppedCount.replace(
          "{count}",
          droppedCommits.length.toString()
        )}
      </span>
      <div className="flex flex-col gap-1">
        {droppedCommits.map((d) => (
          <div
            key={d.short_id}
            className="flex items-center gap-2 text-[11px] font-mono text-secondary bg-surface-subtle/50 px-2 py-1 rounded line-through opacity-75"
          >
            <span className="font-semibold">{d.short_id}</span>
            <span className="truncate">{d.summary}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
