import React from "react";
import { AlertTriangle, ArrowRight, Archive } from "lucide-react";
import { Modal, Button, Alert } from "../../../shared/ui";
import { useCheckoutConflictForm } from "../hooks/useCheckoutConflictForm";

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
  const { t, actionError, isStashing, handleStashAndCheckout } = useCheckoutConflictForm({
    isOpen,
    targetBranch,
    repoPath,
    onClose,
    onSuccess,
  });

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
