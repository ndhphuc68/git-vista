import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Archive } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { Modal, Button, Alert } from "../../shared/ui";

const TITLE_ID = "checkout-conflict-title";

export interface CheckoutConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBranch: string;
  errorMessage: string;
  onNavigateToChanges: () => void;
  repoPath?: string;
  onSuccess?: () => void;
}

export const CheckoutConflictModal: React.FC<CheckoutConflictModalProps> = ({
  isOpen,
  onClose,
  targetBranch,
  errorMessage,
  onNavigateToChanges,
  repoPath,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [isStashing, setIsStashing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsStashing(false);
      setActionError(null);
    }
  }, [isOpen]);

  const handleStashAndCheckout = async () => {
    if (!repoPath) return;
    setIsStashing(true);
    setActionError(null);
    try {
      await invokeCommand.saveStash(
        repoPath,
        t.modals.checkoutConflict.autoStashMessage.replace("{target}", targetBranch),
        true
      );
      await invokeCommand.checkoutBranch(repoPath, targetBranch);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(t.modals.checkoutConflict.stashError.replace("{msg}", msg));
    } finally {
      setIsStashing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.checkoutConflict.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={AlertTriangle}
        tone="danger"
      />

      <Modal.Body>
        <p className="text-xs text-primary leading-normal m-0">
          {t.modals.checkoutConflict.description.split("{target}")[0]}
          <strong className="font-semibold">{targetBranch}</strong>
          {t.modals.checkoutConflict.description.split("{target}")[1]}
        </p>

        <div className="p-3 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs font-mono break-all leading-relaxed max-h-40 overflow-y-auto">
          {errorMessage.replace("CHECKOUT_CONFLICT: ", "")}
        </div>

        {actionError && <Alert variant="error">{actionError}</Alert>}

        <p className="text-[11px] text-secondary leading-normal m-0">
          {t.modals.checkoutConflict.advice}
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isStashing}>
          {t.modals.checkoutConflict.close}
        </Button>
        {repoPath && (
          <Button variant="ghost" onClick={handleStashAndCheckout} disabled={isStashing}>
            <Archive size={13} className="text-accent" />
            {isStashing
              ? t.modals.checkoutConflict.stashingAndCheckout
              : t.modals.checkoutConflict.stashAndCheckout}
          </Button>
        )}
        <Button
          disabled={isStashing}
          onClick={() => {
            onClose();
            onNavigateToChanges();
          }}
        >
          {t.modals.checkoutConflict.toChanges}
          <ArrowRight size={13} />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
