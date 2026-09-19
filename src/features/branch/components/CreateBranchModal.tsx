import React, { useState, useEffect } from "react";
import { GitBranch } from "lucide-react";
import { useCreateBranch } from "../api";
import { useTranslation } from "../../../i18n";
import { Modal, Button, Alert } from "../../../shared/ui";

const TITLE_ID = "create-branch-title";

export interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  targetCommit?: string | null;
  onSuccess?: () => void;
}

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommit,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const createBranch = useCreateBranch(repoPath);
  const [branchName, setBranchName] = useState("");
  const [checkout, setCheckout] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loading = createBranch.isPending;

  useEffect(() => {
    if (isOpen) {
      setBranchName("");
      setCheckout(true);
      setError(null);
    }
  }, [isOpen]);

  const sanitizeBranchName = (val: string) => {
    // Turn spaces into '-' and strip characters Git does not allow in a ref name
    return val.replace(/\s+/g, "-").replace(/[~^:?*[\\@{}]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeBranchName(e.target.value);
    setBranchName(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = branchName.trim();
    if (!trimmed) {
      setError(t.modals.createBranch.errorEmpty);
      return;
    }

    setError(null);

    try {
      await createBranch.mutateAsync({
        name: trimmed,
        targetCommit: targetCommit ?? undefined,
        checkout,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.createBranch.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={GitBranch}
      />

      {/* The form wraps Body and Footer so Enter and the submit button both
          still submit across the two sections. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body>
          {targetCommit && (
            <div className="text-[11px] text-secondary flex items-center gap-1 bg-window px-2.5 py-1.5 rounded-sm border border-border-subtle">
              <span>{t.modals.createBranch.fromCommit}</span>
              <span className="font-mono text-primary font-semibold">
                {targetCommit.substring(0, 7)}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="branch-name-input" className="text-xs font-medium text-primary">
              {t.modals.createBranch.nameLabel}
            </label>
            <input
              id="branch-name-input"
              data-autofocus
              aria-label={t.modals.createBranch.nameLabel}
              type="text"
              placeholder={t.modals.createBranch.namePlaceholder}
              value={branchName}
              onChange={handleNameChange}
              disabled={loading}
              className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none mt-1">
            <input
              type="checkbox"
              checked={checkout}
              onChange={(e) => setCheckout(e.target.checked)}
              disabled={loading}
              aria-label={t.modals.createBranch.checkoutLabel}
              className="accent-accent cursor-pointer rounded-sm"
            />
            <span>{t.modals.createBranch.checkoutLabel}</span>
          </label>

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.modals.createBranch.cancel}
          </Button>
          <Button type="submit" loading={loading} disabled={!branchName.trim()}>
            {loading ? t.modals.createBranch.creating : t.modals.createBranch.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
