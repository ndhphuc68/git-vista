import React from "react";
import { Loader2, Info } from "lucide-react";
import type { Translations } from "../../i18n/vi";
import type {
  RebaseCommitItem,
  RebasePlanStep,
  RebaseActionKind,
} from "../../ipc/bindings.generated";
import { RebaseCommitRow } from "./RebaseCommitRow";

export interface InteractiveRebaseModalStepListProps {
  t: Translations;
  steps: RebasePlanStep[];
  commitMap: Map<string, RebaseCommitItem>;
  isLoading: boolean;
  draggedIndex: number | null;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onActionChange: (index: number, action: RebaseActionKind) => void;
  onMessageChange: (index: number, message: string) => void;
  onDragStart: (index: number) => (e: React.DragEvent) => void;
  onDragOver: (index: number) => (e: React.DragEvent) => void;
  onDrop: (index: number) => (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export const InteractiveRebaseModalStepList: React.FC<InteractiveRebaseModalStepListProps> = ({
  t,
  steps,
  commitMap,
  isLoading,
  draggedIndex,
  onMoveUp,
  onMoveDown,
  onActionChange,
  onMessageChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  return (
    <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-surface">
      {/* Tip info bar */}
      <div className="px-4 py-2 bg-surface-subtle/50 border-b border-border-subtle flex items-center justify-between text-[11px] text-secondary shrink-0">
        <span className="flex items-center gap-1.5">
          <Info size={12} className="text-link" />
          {t.modals.interactiveRebase.dragHandleTooltip}
        </span>
        <span className="font-mono">{steps.length} commits</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-secondary">
            <Loader2 size={20} className="animate-spin text-link" />
            <span className="text-xs">{t.modals.interactiveRebase.loadingCommits}</span>
          </div>
        ) : steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-secondary text-xs">
            <span>{t.modals.interactiveRebase.noCommits}</span>
          </div>
        ) : (
          steps.map((step, index) => {
            const commit = commitMap.get(step.commit_id);
            if (!commit) return null;
            return (
              <RebaseCommitRow
                key={step.commit_id}
                step={step}
                commit={commit}
                index={index}
                total={steps.length}
                onMoveUp={() => onMoveUp(index)}
                onMoveDown={() => onMoveDown(index)}
                onActionChange={(action) => onActionChange(index, action)}
                onMessageChange={(msg) => onMessageChange(index, msg)}
                isDragging={draggedIndex === index}
                onDragStart={onDragStart(index)}
                onDragOver={onDragOver(index)}
                onDrop={onDrop(index)}
                onDragEnd={onDragEnd}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
