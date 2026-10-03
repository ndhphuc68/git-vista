import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Archive, FileText } from "lucide-react";
import { Modal, Button, Alert } from "../../../shared/ui";
import type { useTranslation } from "../../../i18n";
import { useCheckoutConflictForm } from "../hooks/useCheckoutConflictForm";
import { CheckoutConflictStashModal } from "./CheckoutConflictStashModal";

const TITLE_ID = "checkout-conflict-title";

type Translation = ReturnType<typeof useTranslation>["t"];

interface ConflictBodyProps {
  t: Translation;
  targetBranch: string;
  cleanMessage: string;
  actionError: string | null;
  hideActionError?: boolean;
}

function ConflictBody({
  t,
  targetBranch,
  cleanMessage,
  actionError,
  hideActionError,
}: ConflictBodyProps) {
  return (
    <Modal.Body className="p-5 gap-3.5">
      <p className="text-sm text-primary leading-relaxed m-0">
        {t.modals.checkoutConflict.description.split("{target}")[0]}
        <strong className="font-semibold text-primary">{targetBranch}</strong>
        {t.modals.checkoutConflict.description.split("{target}")[1]}
      </p>

      {cleanMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-window border border-border-subtle rounded-lg text-xs font-mono text-primary max-h-48 overflow-y-auto break-words leading-relaxed">
          <FileText size={16} className="text-secondary shrink-0 mt-0.5" />
          <span className="min-w-0 flex-1">{cleanMessage}</span>
        </div>
      )}

      {actionError && !hideActionError && <Alert variant="error">{actionError}</Alert>}

      <p className="text-xs text-secondary leading-normal m-0">
        {t.modals.checkoutConflict.advice}
      </p>
    </Modal.Body>
  );
}

interface ConflictFooterProps {
  t: Translation;
  repoPath?: string;
  isStashing: boolean;
  onClose: () => void;
  onNavigateToChanges: () => void;
  onOpenStashModal: () => void;
}

function ConflictFooter({
  t,
  repoPath,
  isStashing,
  onClose,
  onNavigateToChanges,
  onOpenStashModal,
}: ConflictFooterProps) {
  return (
    <Modal.Footer className="px-5 py-3.5 gap-2.5">
      <Button variant="secondary" onClick={onClose} disabled={isStashing}>
        {t.modals.checkoutConflict.close}
      </Button>
      <Button
        variant={repoPath ? "secondary" : "primary"}
        disabled={isStashing}
        onClick={() => {
          onClose();
          onNavigateToChanges();
        }}
      >
        {t.modals.checkoutConflict.toChanges}
        <ArrowRight size={13} />
      </Button>
      {repoPath && (
        <Button
          variant="primary"
          onClick={onOpenStashModal}
          loading={isStashing}
          disabled={isStashing}
        >
          {!isStashing && <Archive size={13} />}
          {isStashing
            ? t.modals.checkoutConflict.stashingAndCheckout
            : t.modals.checkoutConflict.stashAndCheckout}
        </Button>
      )}
    </Modal.Footer>
  );
}

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
  const [isStashModalOpen, setIsStashModalOpen] = useState(false);
  const { t, actionError, isStashing, handleStashAndCheckout } = useCheckoutConflictForm({
    isOpen,
    targetBranch,
    repoPath,
    onClose,
    onSuccess,
  });

  useEffect(() => {
    if (isOpen) {
      setIsStashModalOpen(false);
    }
  }, [isOpen]);

  const cleanMessage = errorMessage.replace("CHECKOUT_CONFLICT: ", "").trim();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" labelledBy={TITLE_ID}>
        <Modal.Header
          title={t.modals.checkoutConflict.title}
          onClose={onClose}
          titleId={TITLE_ID}
          icon={AlertTriangle}
          tone="danger"
        />

        <ConflictBody
          t={t}
          targetBranch={targetBranch}
          cleanMessage={cleanMessage}
          actionError={actionError}
          hideActionError={isStashModalOpen}
        />

        <ConflictFooter
          t={t}
          repoPath={repoPath}
          isStashing={isStashing}
          onClose={onClose}
          onNavigateToChanges={onNavigateToChanges}
          onOpenStashModal={() => setIsStashModalOpen(true)}
        />
      </Modal>

      {repoPath && (
        <CheckoutConflictStashModal
          isOpen={isStashModalOpen}
          onClose={() => setIsStashModalOpen(false)}
          targetBranch={targetBranch}
          isStashing={isStashing}
          actionError={actionError}
          onConfirm={handleStashAndCheckout}
        />
      )}
    </>
  );
};
