import React, { useState, useEffect } from "react";
import { GitCommit, ArrowRight } from "lucide-react";
import { useTranslation } from "../../i18n";
import { Modal, Button, Alert } from "../../shared/ui";

const TITLE_ID = "rebase-branch-title";

export interface RebaseBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranch: string;
  upstreamBranch: string;
  hasUncommittedChanges: boolean;
  onRebase: () => Promise<{ success: boolean; status: string; output: string }>;
}

export const RebaseBranchModal: React.FC<RebaseBranchModalProps> = ({
  isOpen,
  onClose,
  currentBranch,
  upstreamBranch,
  hasUncommittedChanges,
  onRebase,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  const handleRebaseSubmit = async () => {
    if (hasUncommittedChanges) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onRebase();
      if (res.success) {
        onClose();
      } else {
        if (res.status === "Conflict") {
          setError(t.modals.rebase.conflictError);
        } else {
          setError(res.output || t.modals.rebase.genericError.replace("{msg}", res.status));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(t.modals.rebase.genericError.replace("{msg}", msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.rebase.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={GitCommit}
      />

      <Modal.Body>
        <div className="flex items-center gap-2 text-xs text-primary bg-window p-2.5 rounded-sm border border-border-subtle">
          <span className="font-semibold text-primary">{currentBranch}</span>
          <ArrowRight size={13} className="text-secondary shrink-0" />
          <span className="font-semibold text-accent">{upstreamBranch}</span>
        </div>

        <p className="text-xs text-secondary leading-normal m-0">{t.modals.rebase.desc}</p>

        {hasUncommittedChanges && <Alert variant="error">{t.modals.rebase.uncommittedWarn}</Alert>}

        {error && (
          <Alert variant="error" showIcon={false}>
            {error}
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.modals.rebase.cancel}
        </Button>
        <Button
          aria-label={t.modals.rebase.submit}
          onClick={handleRebaseSubmit}
          loading={loading}
          disabled={hasUncommittedChanges}
        >
          <GitCommit size={13} />
          {loading ? t.modals.rebase.rebasing : t.modals.rebase.submit}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
