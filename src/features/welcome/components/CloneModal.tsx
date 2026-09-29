import React from "react";
import { X, AlertCircle } from "lucide-react";
import { type RepoSummary } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { Modal } from "../../../shared/ui";
import { useCloneModalState } from "../hooks/useCloneModalState";
import { CloneModalHeader } from "./CloneModalHeader";
import { CloneModalFields } from "./CloneModalFields";
import { CloneProgressBar } from "./CloneProgressBar";
import { CloneModalActions } from "./CloneModalActions";

const TITLE_ID = "clone-modal-title";

export interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloneSuccess: (repo: RepoSummary) => void;
}

export const CloneModal: React.FC<CloneModalProps> = ({ isOpen, onClose, onCloneSuccess }) => {
  const { t } = useTranslation();
  const {
    url,
    targetDir,
    setTargetDir,
    error,
    isCloning,
    progressPercent,
    statusText,
    urlInputRef,
    handleUrlChange,
    handleSelectFolder,
    handleCancel,
    handleSubmit,
  } = useCloneModalState({ isOpen, onCloneSuccess, onClose });

  return (
    <Modal
      isOpen={isOpen}
      // handleCancel, not onClose: while a clone is running this aborts the
      // remote task rather than just dismissing the dialog, which is what the
      // backdrop and the X button did before the migration.
      onClose={handleCancel}
      size="lg"
      labelledBy={TITLE_ID}
      // Escape was already ignored mid-clone; the backdrop instead routed to
      // handleCancel, which aborts. Both paths are preserved as they were.
      closeOnEscape={!isCloning}
    >
      {/* This modal keeps its own single-panel layout rather than using
          Modal.Header/Body/Footer: it has no header bar or footer row, just
          one padded card with an absolutely positioned close button. */}
      <div className="relative p-6 sm:p-7">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCloning}
            className="absolute top-4 right-4 text-tertiary hover:text-primary p-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
            aria-label={t.cloneModal.close}
          >
            <X size={18} />
          </button>

          <CloneModalHeader titleId={TITLE_ID} />

          {/* Error Notification */}
          {error && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 bg-diff-remove-bg text-diff-remove-text rounded-xl text-xs sm:text-sm border border-diff-remove-border flex items-start gap-2.5"
            >
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
            <CloneModalFields
              url={url}
              onUrlChange={handleUrlChange}
              urlInputRef={urlInputRef}
              targetDir={targetDir}
              onTargetDirChange={setTargetDir}
              onSelectFolder={handleSelectFolder}
              isCloning={isCloning}
            />

            {isCloning && (
              <CloneProgressBar progressPercent={progressPercent} statusText={statusText} />
            )}

            <CloneModalActions
              onCancel={handleCancel}
              isSubmitDisabled={!url.trim() || !targetDir.trim() || isCloning}
              isCloning={isCloning}
            />
          </form>
      </div>
    </Modal>
  );
};
