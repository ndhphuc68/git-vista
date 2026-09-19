import React, { useState, useEffect } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import type { CommitActionResult } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Modal, Button, Alert } from "../../shared/ui";

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
      const res = await invokeCommand.revertCommit(repoPath, targetCommit.id, autoCommit);

      if (res.success || res.status === "Conflict") {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        const errorMsg = res.output || t.modals.revert.genericError.replace("{msg}", res.status);
        setError(errorMsg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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

          {/* Target commit info card */}
          <div className="bg-window px-3 py-2.5 rounded-md border border-border-subtle flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-secondary text-[11px] font-medium">
                {t.modals.revert.targetCommit}
              </span>
              <span className="font-mono text-primary font-semibold text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border-subtle">
                {targetCommit.short_id || targetCommit.id.substring(0, 7)}
              </span>
            </div>
            <div className="font-medium text-primary line-clamp-2" title={targetCommit.summary}>
              {targetCommit.summary}
            </div>
            <div className="flex items-center justify-between text-[11px] text-tertiary">
              <span>{targetCommit.author}</span>
              {targetCommit.time && <span>{targetCommit.time}</span>}
            </div>
          </div>

          {/* Auto-commit checkbox */}
          <div className="flex flex-col gap-1 mt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none">
              <input
                type="checkbox"
                checked={autoCommit}
                onChange={(e) => setAutoCommit(e.target.checked)}
                disabled={loading}
                aria-label={t.modals.revert.autoCommitLabel}
                className="accent-accent cursor-pointer rounded-sm"
              />
              <span className="font-medium">{t.modals.revert.autoCommitLabel}</span>
            </label>
            <span className="text-[11px] text-secondary pl-6">
              {t.modals.revert.autoCommitDesc}
            </span>
          </div>

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
