import React from "react";
import { Modal } from "../../shared/ui";
import { useCreatePullRequestModal } from "./useCreatePullRequestModal";
import { CreatePullRequestModalHeader } from "./CreatePullRequestModalHeader";
import { BranchSelectionBar } from "./BranchSelectionBar";
import { UnpushedWarningBanner } from "./UnpushedWarningBanner";
import { CreatePullRequestModalFields } from "./CreatePullRequestModalFields";
import { CreatePullRequestModalFooter } from "./CreatePullRequestModalFooter";

const TITLE_ID = "create-pr-title";

export interface CreatePullRequestModalProps {
  repoPath: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CreatePullRequestModal: React.FC<CreatePullRequestModalProps> = ({
  repoPath,
  isOpen: propsIsOpen,
  onClose: propsOnClose,
}) => {
  const m = useCreatePullRequestModal({ repoPath, isOpen: propsIsOpen, onClose: propsOnClose });

  return (
    <Modal isOpen={m.isOpen} onClose={m.handleClose} size="lg" labelledBy={TITLE_ID}>
      <>
        <CreatePullRequestModalHeader
          titleId={TITLE_ID}
          repoInfo={m.repoInfo}
          onClose={m.handleClose}
          t={m.t}
        />

        {/* Form */}
        <form onSubmit={m.handleSubmit} className="p-5 flex flex-col gap-4">
          <BranchSelectionBar
            baseBranch={m.baseBranch}
            onBaseBranchChange={m.handleBaseBranchChange}
            availableBaseBranches={m.availableBaseBranches}
            compareBranch={m.compareBranch}
            onCompareBranchChange={m.handleCompareBranchChange}
            availableCompareBranches={m.availableCompareBranches}
            submitting={m.submitting}
            t={m.t}
          />

          {m.hasUnpushedCommits && (
            <UnpushedWarningBanner
              isPushing={m.isPushing}
              submitting={m.submitting}
              onPushBranch={m.handlePushBranch}
              t={m.t}
            />
          )}

          <CreatePullRequestModalFields
            titleInputRef={m.titleInputRef}
            title={m.title}
            onTitleChange={m.handleTitleChange}
            body={m.body}
            onBodyChange={m.setBody}
            submitting={m.submitting}
            t={m.t}
          />

          <CreatePullRequestModalFooter
            isDraft={m.isDraft}
            onDraftChange={m.setIsDraft}
            error={m.error}
            submitting={m.submitting}
            title={m.title}
            onClose={m.handleClose}
            t={m.t}
          />
        </form>
      </>
    </Modal>
  );
};
