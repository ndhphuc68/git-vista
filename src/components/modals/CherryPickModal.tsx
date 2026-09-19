import React, { useState, useEffect } from "react";
import { GitPullRequest, GitBranch } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import type { CommitActionResult } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Modal, Button, Alert } from "../../shared/ui";

const TITLE_ID = "cherry-pick-title";

export interface CherryPickModalProps {
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
  currentBranch?: string;
  onSuccess?: (result: CommitActionResult) => void;
}

export const CherryPickModal: React.FC<CherryPickModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommit,
  currentBranch,
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
      const res = await invokeCommand.cherryPickCommit(repoPath, targetCommit.id, autoCommit);

      if (res.success || res.status === "Conflict") {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        const errorMsg =
          res.output || t.modals.cherryPick.genericError.replace("{msg}", res.status);
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
        title={t.modals.cherryPick.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={GitPullRequest}
      />

      {/* The form wraps Body and Footer so Enter and the submit button both
          still submit across the two sections. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body>
          {/* Target commit info card */}
          <div className="bg-window px-3 py-2.5 rounded-md border border-border-subtle flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-secondary text-[11px] font-medium">
                {t.modals.cherryPick.targetCommit}
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

          {/* Destination Branch */}
          {currentBranch && (
            <div className="flex items-center justify-between text-xs bg-window px-3 py-2 rounded-md border border-border-subtle">
              <span className="text-secondary text-[11px]">
                {t.modals.cherryPick.destinationBranch}
              </span>
              <span className="flex items-center gap-1 font-semibold text-primary">
                <GitBranch size={13} className="text-accent" />
                {currentBranch}
              </span>
            </div>
          )}

          {/* Auto-commit checkbox */}
          <div className="flex flex-col gap-1 mt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none">
              <input
                type="checkbox"
                checked={autoCommit}
                onChange={(e) => setAutoCommit(e.target.checked)}
                disabled={loading}
                aria-label={t.modals.cherryPick.autoCommitLabel}
                className="accent-accent cursor-pointer rounded-sm"
              />
              <span className="font-medium">{t.modals.cherryPick.autoCommitLabel}</span>
            </label>
            <span className="text-[11px] text-secondary pl-6">
              {t.modals.cherryPick.autoCommitDesc}
            </span>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.modals.cherryPick.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? t.modals.cherryPick.submitting : t.modals.cherryPick.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
