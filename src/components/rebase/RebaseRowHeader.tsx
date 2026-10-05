import React from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { RebaseCommitItem } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";

export interface RebaseRowHeaderProps {
  commit: RebaseCommitItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isDropped: boolean;
  isRewordOrSquash: boolean;
  currentMessageFirstLine: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const RebaseRowHeader: React.FC<RebaseRowHeaderProps> = ({
  commit,
  index,
  isFirst,
  isLast,
  isDropped,
  isRewordOrSquash,
  currentMessageFirstLine,
  onMoveUp,
  onMoveDown,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Drag Handle */}
      <div
        title={t.modals.interactiveRebase.dragHandleTooltip}
        className="cursor-grab active:cursor-grabbing text-secondary hover:text-primary p-0.5 rounded touch-none shrink-0"
      >
        <GripVertical size={14} />
      </div>

      {/* Up / Down Arrow buttons */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          title={t.modals.interactiveRebase.moveUpTooltip}
          className="p-0.5 rounded text-secondary hover:text-primary hover:bg-surface-hover disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronUp size={11} />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          title={t.modals.interactiveRebase.moveDownTooltip}
          className="p-0.5 rounded text-secondary hover:text-primary hover:bg-surface-hover disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronDown size={11} />
        </button>
      </div>

      {/* Step Index Number */}
      <span className="w-5 text-center text-[11px] font-mono font-medium text-secondary shrink-0">
        #{index + 1}
      </span>

      {/* Commit SHA Badge */}
      <span className="px-1.5 py-0.5 rounded bg-surface-subtle border border-border-subtle text-[11px] font-mono text-secondary shrink-0">
        {commit.short_id}
      </span>

      {/* Commit summary and author */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              "text-xs font-medium text-primary truncate",
              isDropped && "line-through text-secondary",
              isRewordOrSquash && "italic text-link"
            )}
            title={commit.summary}
          >
            {isRewordOrSquash ? currentMessageFirstLine : commit.summary}
          </span>
        </div>
        <div className="text-[10px] text-secondary truncate flex items-center gap-1 mt-0.5">
          <span>{commit.author_name}</span>
          <span>•</span>
          <span className="opacity-80">
            {new Date(commit.timestamp * 1000).toLocaleDateString()}
          </span>
        </div>
      </div>
    </>
  );
};
