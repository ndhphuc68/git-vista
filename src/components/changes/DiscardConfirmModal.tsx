import React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "../../i18n";
import { Modal, Button } from "../../shared/ui";

export interface DiscardConfirmModalProps {
  isOpen: boolean;
  filePath: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const TITLE_ID = "discard-modal-title";

export const DiscardConfirmModal: React.FC<DiscardConfirmModalProps> = ({
  isOpen,
  filePath,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen && filePath !== null}
      onClose={onCancel}
      labelledBy={TITLE_ID}
    >
      <Modal.Header
        title={t.discard.title}
        onClose={onCancel}
        titleId={TITLE_ID}
        icon={AlertTriangle}
        tone="danger"
      />

      <Modal.Body>
        <p className="text-xs text-primary leading-normal m-0">{t.discard.description}</p>

        <div className="px-3 py-2 bg-window rounded-sm border border-border-subtle font-mono text-xs text-primary break-all">
          {filePath}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" data-testid="cancel-discard-button" onClick={onCancel}>
          {t.discard.cancel}
        </Button>
        <Button variant="danger" data-testid="confirm-discard-button" onClick={onConfirm}>
          {t.discard.confirm}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
