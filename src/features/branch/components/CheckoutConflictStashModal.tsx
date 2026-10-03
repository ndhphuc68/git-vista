import React, { useState, useEffect, useRef } from "react";
import { Archive } from "lucide-react";
import { Modal, Button, Alert, Checkbox, Input } from "../../../shared/ui";
import { useTranslation } from "../../../i18n";

const TITLE_ID = "checkout-conflict-stash-title";

type Translation = ReturnType<typeof useTranslation>["t"];

interface StashBodyProps {
  t: Translation;
  inputRef: React.RefObject<HTMLInputElement | null>;
  message: string;
  setMessage: (val: string) => void;
  includeUntracked: boolean;
  setIncludeUntracked: (val: boolean) => void;
  isStashing: boolean;
  actionError: string | null;
}

function StashBody({
  t,
  inputRef,
  message,
  setMessage,
  includeUntracked,
  setIncludeUntracked,
  isStashing,
  actionError,
}: StashBodyProps) {
  return (
    <Modal.Body className="gap-3.5 p-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="stash-message-input" className="text-xs text-secondary font-medium">
          {t.modals.checkoutConflict.stashModalDescLabel}
        </label>
        <Input
          size="md"
          ref={inputRef}
          id="stash-message-input"
          data-autofocus
          value={message}
          placeholder={t.modals.checkoutConflict.stashModalPlaceholder}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={(e) => e.target.select()}
          disabled={isStashing}
        />
      </div>

      <label
        htmlFor="stash-untracked-checkbox"
        className="flex items-center gap-2 cursor-pointer select-none"
      >
        <Checkbox
          id="stash-untracked-checkbox"
          checked={includeUntracked}
          onChange={(e) => setIncludeUntracked(e.target.checked)}
          disabled={isStashing}
        />
        <span className="text-xs text-secondary hover:text-primary transition-colors">
          {t.modals.checkoutConflict.stashModalUntrackedLabel}
        </span>
      </label>

      {actionError && <Alert variant="error">{actionError}</Alert>}
    </Modal.Body>
  );
}

interface StashFooterProps {
  t: Translation;
  onClose: () => void;
  isStashing: boolean;
}

function StashFooter({ t, onClose, isStashing }: StashFooterProps) {
  return (
    <Modal.Footer className="px-5 py-3.5 gap-2.5">
      <Button variant="secondary" onClick={onClose} disabled={isStashing}>
        {t.modals.checkoutConflict.stashModalCancel}
      </Button>
      <Button type="submit" variant="primary" loading={isStashing} disabled={isStashing}>
        {!isStashing && <Archive size={13} />}
        {isStashing
          ? t.modals.checkoutConflict.stashingAndCheckout
          : t.modals.checkoutConflict.stashModalSubmit}
      </Button>
    </Modal.Footer>
  );
}

export interface CheckoutConflictStashModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBranch: string;
  isStashing: boolean;
  actionError: string | null;
  onConfirm: (message: string, includeUntracked: boolean) => Promise<void>;
}

export const CheckoutConflictStashModal: React.FC<CheckoutConflictStashModalProps> = ({
  isOpen,
  onClose,
  targetBranch,
  isStashing,
  actionError,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const defaultMessage = t.modals.checkoutConflict.autoStashMessage.replace(
    "{target}",
    targetBranch
  );
  const [message, setMessage] = useState(defaultMessage);
  const [includeUntracked, setIncludeUntracked] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage(defaultMessage);
      setIncludeUntracked(true);
      const timer = setTimeout(() => inputRef.current?.select(), 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStashing) return;
    void onConfirm(message, includeUntracked);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      labelledBy={TITLE_ID}
      stacked
      closeOnEscape={!isStashing}
      closeOnBackdrop={!isStashing}
    >
      <form onSubmit={handleSubmit} className="flex flex-col m-0">
        <Modal.Header
          title={t.modals.checkoutConflict.stashModalTitle}
          onClose={onClose}
          titleId={TITLE_ID}
          icon={Archive}
        />
        <StashBody
          t={t}
          inputRef={inputRef}
          message={message}
          setMessage={setMessage}
          includeUntracked={includeUntracked}
          setIncludeUntracked={setIncludeUntracked}
          isStashing={isStashing}
          actionError={actionError}
        />
        <StashFooter t={t} onClose={onClose} isStashing={isStashing} />
      </form>
    </Modal>
  );
};
