import React from "react";
import { GitCommit, Edit3, Layers } from "lucide-react";
import clsx from "clsx";
import type { ProjectedCommit } from "./rebaseProjection";

export interface RebaseLivePreviewTimelineItemProps {
  item: ProjectedCommit;
  isLastItem: boolean;
}

export const RebaseLivePreviewTimelineItem: React.FC<RebaseLivePreviewTimelineItemProps> = ({
  item,
  isLastItem,
}) => {
  return (
    <div className="flex items-start gap-3 relative pb-4">
      {/* Vertical connecting line */}
      {!isLastItem && <div className="absolute left-[9px] top-4 bottom-0 w-[2px] bg-accent/40" />}

      {/* Dot Icon */}
      <div
        className={clsx(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs border-2",
          isLastItem ? "bg-accent border-accent text-white" : "bg-surface border-accent text-link"
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
              <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-accent/20 text-link">
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
            item.isReworded && "italic text-link"
          )}
          title={item.displayMessage}
        >
          {item.displayMessage}
        </span>

        {/* Squashed commits info */}
        {item.squashedSubCommits.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-border-subtle flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Layers size={10} />+{item.squashedSubCommits.length} squashed into this commit:
            </span>
            {item.squashedSubCommits.map((sub) => (
              <div
                key={sub.short_id}
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
};
