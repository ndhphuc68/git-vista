import React from "react";
import type { Translations } from "../../i18n/vi";
import type {
  RebaseCommitItem,
  RebasePlanStep,
  RebaseActionKind,
} from "../../ipc/bindings.generated";
import { RebaseLivePreview } from "./RebaseLivePreview";
import { InteractiveRebaseModalStepList } from "./InteractiveRebaseModalStepList";

export interface InteractiveRebaseModalBodyProps {
  t: Translations;
  baseCommitId: string;
  baseCommitSummary?: string;
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

export const InteractiveRebaseModalBody: React.FC<InteractiveRebaseModalBodyProps> = ({
  t,
  baseCommitId,
  baseCommitSummary,
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
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
      <InteractiveRebaseModalStepList
        t={t}
        steps={steps}
        commitMap={commitMap}
        isLoading={isLoading}
        draggedIndex={draggedIndex}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onActionChange={onActionChange}
        onMessageChange={onMessageChange}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />

      {/* Right Column: Live Preview Panel */}
      <div className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-surface-subtle/30">
        <RebaseLivePreview
          baseCommitId={baseCommitId}
          baseCommitSummary={baseCommitSummary}
          steps={steps}
          commitMap={commitMap}
        />
      </div>
    </div>
  );
};
