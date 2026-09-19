import React, { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { Modal, Button, Alert } from "../../../shared/ui";
import { useCreateTag } from "../api";

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
  const createTag = useCreateTag(repoPath);
  const [name, setName] = useState("");
  const [isAnnotated, setIsAnnotated] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setIsAnnotated(false);
      setMessage("");
      setError(null);
    }
  }, [isOpen]);

  const sanitizeTagName = (val: string) => {
    return val.replace(/\s+/g, "-").replace(/[~^:?*[\\@{}]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeTagName(e.target.value);
    setName(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.modals.createTag.errorEmpty);
      return;
    }

    if (isAnnotated && !message.trim()) {
      setError(t.modals.createTag.errorEmptyMessage);
      return;
    }

    setError(null);

    try {
      await createTag.mutateAsync({
        name: trimmedName,
        targetCommitId,
        message: isAnnotated ? message : undefined,
      });
      useToastStore.getState().showToast({
        message: t.modals.createTag.successToast.replace("{name}", trimmedName),
        type: "success",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    }
  };

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
          {targetCommitId && (
            <div className="text-[11px] text-secondary flex items-center gap-1 bg-window px-2.5 py-1.5 rounded-sm border border-border-subtle">
              <span>{t.modals.createTag.targetCommit}</span>
              <span className="font-mono text-primary font-semibold">
                {targetCommitId.substring(0, 7)}
              </span>
              {targetCommitSummary && (
                <span
                  className="truncate text-secondary ml-1 max-w-[200px]"
                  title={targetCommitSummary}
                >
                  - {targetCommitSummary}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="tag-name-input" className="text-xs font-medium text-primary">
              {t.modals.createTag.nameLabel}
            </label>
            <input
              id="tag-name-input"
              data-autofocus
              aria-label={t.modals.createTag.nameLabel}
              type="text"
              placeholder={t.modals.createTag.namePlaceholder}
              value={name}
              onChange={handleNameChange}
              disabled={createTag.isPending}
              className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none mt-1">
            <input
              type="checkbox"
              checked={isAnnotated}
              onChange={(e) => setIsAnnotated(e.target.checked)}
              disabled={createTag.isPending}
              aria-label={t.modals.createTag.annotatedLabel}
              className="accent-accent cursor-pointer rounded-sm"
            />
            <span>{t.modals.createTag.annotatedLabel}</span>
          </label>

          {isAnnotated && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tag-message-input" className="text-xs font-medium text-primary">
                {t.modals.createTag.messageLabel}
              </label>
              <textarea
                id="tag-message-input"
                aria-label={t.modals.createTag.messageLabel}
                placeholder={t.modals.createTag.messagePlaceholder}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                disabled={createTag.isPending}
                rows={3}
                className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full resize-none"
              />
            </div>
          )}

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={createTag.isPending}>
            {t.modals.createTag.cancel}
          </Button>
          <Button type="submit" loading={createTag.isPending}>
            {createTag.isPending ? t.modals.createTag.creating : t.modals.createTag.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
