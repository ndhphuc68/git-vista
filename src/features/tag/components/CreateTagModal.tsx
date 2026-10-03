import React from "react";
import { Tag } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Modal, Button, Alert, Input } from "../../../shared/ui";
import { useCreateTagForm } from "../hooks/useCreateTagForm";
import { TagTargetCommitInfo } from "./TagTargetCommitInfo";
import { TagAnnotationFields } from "./TagAnnotationFields";

const TITLE_ID = "create-tag-title";

export interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  targetCommitId: string;
  targetCommitSummary?: string | null;
  onSuccess?: () => void;
}

export const CreateTagModal: React.FC<CreateTagModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommitId,
  targetCommitSummary,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const {
    createTag,
    name,
    isAnnotated,
    setIsAnnotated,
    message,
    error,
    handleNameChange,
    handleMessageChange,
    handleSubmit,
  } = useCreateTagForm({ isOpen, repoPath, targetCommitId, onSuccess, onClose });

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.createTag.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Tag}
      />

      {/* The form wraps Body and Footer so Enter and the submit button both
          still submit across the two sections. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body>
          <TagTargetCommitInfo
            targetCommitId={targetCommitId}
            targetCommitSummary={targetCommitSummary}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="tag-name-input" className="text-xs font-medium text-primary">
              {t.modals.createTag.nameLabel}
            </label>
            <Input
              id="tag-name-input"
              data-autofocus
              aria-label={t.modals.createTag.nameLabel}
              placeholder={t.modals.createTag.namePlaceholder}
              value={name}
              onChange={handleNameChange}
              disabled={createTag.isPending}
              size="lg"
            />
          </div>

          <TagAnnotationFields
            isAnnotated={isAnnotated}
            onIsAnnotatedChange={setIsAnnotated}
            message={message}
            onMessageChange={handleMessageChange}
            disabled={createTag.isPending}
          />

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={createTag.isPending} size="lg">
            {t.modals.createTag.cancel}
          </Button>
          <Button type="submit" loading={createTag.isPending} size="lg">
            {createTag.isPending ? t.modals.createTag.creating : t.modals.createTag.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
