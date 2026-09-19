import React, { useState, useEffect } from "react";
import { Archive } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Modal, Button } from "../../../shared/ui";

const TITLE_ID = "create-stash-title";

export interface CreateStashModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  onSaveStash: (message: string, includeUntracked: boolean) => Promise<string>;
}

export const CreateStashModal: React.FC<CreateStashModalProps> = ({
  isOpen,
  onClose,
  repoPath: _repoPath,
  onSaveStash,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [includeUntracked, setIncludeUntracked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setIncludeUntracked(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSaveStash(message, includeUntracked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.createStash.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Archive}
      />

      <Modal.Body>
        <div className="flex flex-col gap-1">
          <label htmlFor="stash-message" className="text-xs text-secondary font-medium">
            {t.modals.createStash.descLabel}
          </label>
          <input
            id="stash-message"
            data-autofocus
            type="text"
            placeholder={t.modals.createStash.descPlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="px-3 py-1.5 bg-window border border-border-subtle rounded-sm text-xs text-primary outline-none focus:border-accent transition-colors"
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="stash-include-untracked"
            type="checkbox"
            checked={includeUntracked}
            onChange={(e) => setIncludeUntracked(e.target.checked)}
            disabled={loading}
            className="w-3 h-3 accent-accent cursor-pointer"
          />
          <label
            htmlFor="stash-include-untracked"
            className="text-xs text-primary cursor-pointer select-none"
          >
            {t.modals.createStash.untrackedLabel}
          </label>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.modals.createStash.cancel}
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {loading ? t.modals.createStash.saving : t.modals.createStash.submit}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
