import React from "react";
import { X, Keyboard } from "lucide-react";
import type { useTranslation } from "../../i18n";

export interface ShortcutsHelpModalHeaderProps {
  t: ReturnType<typeof useTranslation>["t"];
  titleId: string;
  onClose: () => void;
}

// Kept custom rather than using Modal.Header: it carries a subtitle
// alongside the title.
export const ShortcutsHelpModalHeader: React.FC<ShortcutsHelpModalHeaderProps> = ({
  t,
  titleId,
  onClose,
}) => (
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-surface-header/40">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-link">
        <Keyboard size={18} />
      </div>
      <div>
        <h2 id={titleId} className="text-base font-semibold text-primary m-0">
          {t.shortcuts.title}
        </h2>
        <p className="text-[11px] text-secondary m-0">{t.shortcuts.subtitle}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="flex items-center justify-center w-7 h-7 bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover rounded-md transition-colors"
      aria-label={t.common.close}
    >
      <X size={16} />
    </button>
  </div>
);
