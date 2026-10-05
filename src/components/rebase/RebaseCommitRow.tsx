import React from "react";
import clsx from "clsx";
import type {
  RebasePlanStep,
  RebaseCommitItem,
  RebaseActionKind,
} from "../../ipc/bindings.generated";
import { REBASE_ACTION } from "../../domain/enums";
import { RebaseRowHeader } from "./RebaseRowHeader";
import { RebaseActionPills } from "./RebaseActionPills";
import { RebaseMessageEditor } from "./RebaseMessageEditor";

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
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isDropped = step.action === REBASE_ACTION.DROP;
  const isReword = step.action === REBASE_ACTION.REWORD;
  const isSquash = step.action === REBASE_ACTION.SQUASH;
  const hasInlineEditor = isReword || isSquash;

  const currentMessage = step.new_message ?? commit.message ?? commit.summary;

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
        <RebaseRowHeader
          commit={commit}
          index={index}
          isFirst={isFirst}
          isLast={isLast}
          isDropped={isDropped}
          isRewordOrSquash={isReword || isSquash}
          currentMessageFirstLine={currentMessage.split("\n")[0] ?? ""}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />

        <RebaseActionPills step={step} isFirst={isFirst} onActionChange={onActionChange} />
      </div>

      {/* Expandable Inline Message Editor (Reword or Squash) */}
      {hasInlineEditor && (
        <RebaseMessageEditor
          isSquash={isSquash}
          currentMessage={currentMessage}
          onMessageChange={onMessageChange}
        />
      )}
    </div>
  );
};
