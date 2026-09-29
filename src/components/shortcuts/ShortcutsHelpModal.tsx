import React, { useMemo } from "react";
import { useTranslation } from "../../i18n";
import { Modal } from "../../shared/ui";
import { buildShortcutSections } from "./shortcutsHelpSections";
import { ShortcutsHelpModalHeader } from "./ShortcutsHelpModalHeader";
import { ShortcutsHelpModalSections } from "./ShortcutsHelpModalSections";
import { ShortcutsHelpModalFooter } from "./ShortcutsHelpModalFooter";

const TITLE_ID = "shortcuts-modal-title";

export interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const sections = useMemo(() => buildShortcutSections(t), [t]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" labelledBy={TITLE_ID}>
      <>
        <ShortcutsHelpModalHeader t={t} titleId={TITLE_ID} onClose={onClose} />
        <ShortcutsHelpModalSections sections={sections} />
        <ShortcutsHelpModalFooter t={t} />
      </>
    </Modal>
  );
};
