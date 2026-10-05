import React, { useState, useEffect } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import type { CommitActionResult } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { Modal, Button, Alert } from "../../../shared/ui";
import { revertCommit } from "../api/commitActionsApi";
import { CommitActionTargetCard } from "./CommitActionTargetCard";
import { AutoCommitCheckbox } from "./AutoCommitCheckbox";
import { toErrorMessage } from "../../../shared/utils/toError";

const TITLE_ID = "revert-modal-title";

export interface RevertModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  targetCommit: {
    id: string;
    short_id: string;
    summary: string;
    author: string;
    time?: string;
  };
  onSuccess?: (result: CommitActionResult) => void;
}

export const RevertModal: React.FC<RevertModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommit,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [autoCommit, setAutoCommit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAutoCommit(true);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await revertCommit(repoPath, targetCommit.id, autoCommit);

      if (res.success || res.status === "Conflict") {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        const errorMsg = res.output || t.modals.revert.genericError.replace("{msg}", res.status);
        setError(errorMsg);
      }
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.revert.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={RotateCcw}
      />

      {/* The form wraps Body and Footer so Enter and the submit button both
          still submit across the two sections. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body>
          {/* Warning description banner */}
          <div className="flex items-start gap-2 p-2.5 bg-window border border-border-subtle rounded-md text-xs text-secondary">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <span>{t.modals.revert.desc}</span>
          </div>

          <CommitActionTargetCard
            label={t.modals.revert.targetCommit}
            targetCommit={targetCommit}
          />

          <AutoCommitCheckbox
            checked={autoCommit}
            onChange={setAutoCommit}
            disabled={loading}
            label={t.modals.revert.autoCommitLabel}
            description={t.modals.revert.autoCommitDesc}
          />

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.modals.revert.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? t.modals.revert.submitting : t.modals.revert.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
