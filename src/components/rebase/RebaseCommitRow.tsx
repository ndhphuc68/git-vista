import React from "react";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit3,
} from "lucide-react";
import clsx from "clsx";
import type { RebasePlanStep, RebaseCommitItem, RebaseActionKind } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";

export interface RebaseCommitRowProps {
  step: RebasePlanStep;
  commit: RebaseCommitItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onActionChange: (action: RebaseActionKind) => void;
  onMessageChange: (message: string) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const RebaseCommitRow: React.FC<RebaseCommitRowProps> = ({
  step,
  commit,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onActionChange,
  onMessageChange,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isDropped = step.action === "Drop";
  const isReword = step.action === "Reword";
  const isSquash = step.action === "Squash";
  const hasInlineEditor = isReword || isSquash;

  const currentMessage = step.new_message ?? commit.message ?? commit.summary;

  const getActionColor = (action: RebaseActionKind, isSelected: boolean) => {
    if (!isSelected) {
      return "text-secondary hover:text-primary hover:bg-surface-hover border-transparent";
    }
    switch (action) {
      case "Pick":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-xs";
      case "Reword":
        return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-semibold shadow-xs";
      case "Squash":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold shadow-xs";
      case "Fixup":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold shadow-xs";
      case "Drop":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold shadow-xs";
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={clsx(
        "group relative flex flex-col p-2.5 rounded-lg border transition-all duration-150",
        isDragging
          ? "opacity-40 border-dashed border-accent bg-accent/5"
          : "bg-surface hover:bg-surface-hover/60 border-border-subtle hover:border-border-strong shadow-2xs",
        isDropped && "opacity-60 bg-surface-subtle/40"
      )}
    >
      {/* Top Row: Reorder, Index, Metadata, Actions */}
      <div className="flex items-center gap-2">
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
                (isReword || isSquash) && "italic text-accent"
              )}
              title={commit.summary}
            >
              {isReword || isSquash ? currentMessage.split("\n")[0] : commit.summary}
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

        {/* Action Button Pill Group */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-surface-subtle border border-border-subtle shrink-0">
          {/* Pick */}
          <button
            type="button"
            onClick={() => onActionChange("Pick")}
            title={t.modals.interactiveRebase.actions.pickDesc}
            className={clsx(
              "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
              getActionColor("Pick", step.action === "Pick")
            )}
          >
            {t.modals.interactiveRebase.actions.pick}
          </button>

          {/* Reword */}
          <button
            type="button"
            onClick={() => onActionChange("Reword")}
            title={t.modals.interactiveRebase.actions.rewordDesc}
            className={clsx(
              "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
              getActionColor("Reword", step.action === "Reword")
            )}
          >
            {t.modals.interactiveRebase.actions.reword}
          </button>

          {/* Squash */}
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onActionChange("Squash")}
            title={
              isFirst
                ? t.modals.interactiveRebase.validation.firstCannotSquash
                : t.modals.interactiveRebase.actions.squashDesc
            }
            className={clsx(
              "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
              getActionColor("Squash", step.action === "Squash")
            )}
          >
            {t.modals.interactiveRebase.actions.squash}
          </button>

          {/* Fixup */}
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onActionChange("Fixup")}
            title={
              isFirst
                ? t.modals.interactiveRebase.validation.firstCannotSquash
                : t.modals.interactiveRebase.actions.fixupDesc
            }
            className={clsx(
              "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
              getActionColor("Fixup", step.action === "Fixup")
            )}
          >
            {t.modals.interactiveRebase.actions.fixup}
          </button>

          {/* Drop */}
          <button
            type="button"
            onClick={() => onActionChange("Drop")}
            title={t.modals.interactiveRebase.actions.dropDesc}
            className={clsx(
              "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
              getActionColor("Drop", step.action === "Drop")
            )}
          >
            {t.modals.interactiveRebase.actions.drop}
          </button>
        </div>
      </div>

      {/* Expandable Inline Message Editor (Reword or Squash) */}
      {hasInlineEditor && (
        <div className="mt-2.5 pt-2.5 border-t border-border-subtle/70 pl-8 pr-1 flex flex-col gap-1 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] text-secondary">
            <span className="flex items-center gap-1 font-medium text-accent">
              <Edit3 size={11} />
              {isSquash
                ? t.modals.interactiveRebase.actions.squashDesc
                : t.modals.interactiveRebase.actions.rewordDesc}
            </span>
            <span className="font-mono text-[10px] opacity-75">
              {currentMessage.length} chars
            </span>
          </div>
          <textarea
            rows={3}
            value={currentMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={t.modals.interactiveRebase.editMessagePlaceholder}
            className="w-full text-xs font-mono p-2 rounded bg-surface-subtle border border-border-subtle focus:border-accent focus:ring-1 focus:ring-accent outline-none text-primary resize-y leading-relaxed"
          />
        </div>
      )}
    </div>
  );
};
