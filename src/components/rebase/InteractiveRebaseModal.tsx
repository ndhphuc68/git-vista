import React from "react";
import { Modal } from "../../shared/ui";
import type { InteractiveRebaseResult } from "../../ipc/bindings.generated";
import { useInteractiveRebase } from "./useInteractiveRebase";
import { InteractiveRebaseModalHeader } from "./InteractiveRebaseModalHeader";
import { InteractiveRebaseModalBody } from "./InteractiveRebaseModalBody";
import { InteractiveRebaseModalFooter } from "./InteractiveRebaseModalFooter";

const TITLE_ID = "interactive-rebase-title";

export interface InteractiveRebaseModalProps {
  isOpen: boolean;
  baseCommitId: string;
  baseCommitSummary?: string;
  repoPath?: string;
  onClose: () => void;
  onRebaseSuccess?: (result: InteractiveRebaseResult) => void;
}

export const InteractiveRebaseModal: React.FC<InteractiveRebaseModalProps> = ({
  isOpen,
  baseCommitId,
  baseCommitSummary,
  repoPath: propRepoPath,
  onClose,
  onRebaseSuccess,
}) => {
  const r = useInteractiveRebase({ isOpen, baseCommitId, propRepoPath, onClose, onRebaseSuccess });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      labelledBy={TITLE_ID}
      // A rebase in flight must not be abandoned midway, so neither Escape
      // nor a stray backdrop click may close the modal while submitting.
      // The backdrop used to close regardless, which was inconsistent with
      // the Escape guard and both Cancel buttons; it is now guarded too.
      closeOnEscape={!r.submitting}
      closeOnBackdrop={!r.submitting}
    >
      {/* Fixed height, not just a max: the two-column body below sizes its
          scroll areas with flex-1/h-full, which needs a definite height to
          resolve against. Modal's panel only caps height (max-h-[90vh]), so
          without this the modal would shrink to fit a short commit list
          instead of staying the 85vh it was before. */}
      <div className="h-[85vh] flex flex-col min-h-0">
        <InteractiveRebaseModalHeader
          t={r.t}
          titleId={TITLE_ID}
          baseCommitId={baseCommitId}
          baseCommitSummary={baseCommitSummary}
          error={r.error}
          submitting={r.submitting}
          onClose={onClose}
        />

        <InteractiveRebaseModalBody
          t={r.t}
          baseCommitId={baseCommitId}
          baseCommitSummary={baseCommitSummary}
          steps={r.steps}
          commitMap={r.commitMap}
          isLoading={r.isLoading}
          draggedIndex={r.draggedIndex}
          onMoveUp={r.handleMoveUp}
          onMoveDown={r.handleMoveDown}
          onActionChange={r.handleActionChange}
          onMessageChange={r.handleMessageChange}
          onDragStart={r.handleDragStart}
          onDragOver={r.handleDragOver}
          onDrop={r.handleDrop}
          onDragEnd={r.handleDragEnd}
        />

        <InteractiveRebaseModalFooter
          t={r.t}
          autoStash={r.autoStash}
          setAutoStash={r.setAutoStash}
          submitting={r.submitting}
          isLoading={r.isLoading}
          canSubmit={r.canSubmit}
          onReset={r.handleReset}
          onClose={onClose}
          onSubmit={r.handleSubmit}
        />
      </div>
    </Modal>
  );
};
