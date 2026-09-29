import React from "react";
import type { useTranslation } from "../../i18n";

export interface ShortcutsHelpModalFooterProps {
  t: ReturnType<typeof useTranslation>["t"];
}

export const ShortcutsHelpModalFooter: React.FC<ShortcutsHelpModalFooterProps> = ({ t }) => (
  <div className="px-5 py-3 border-t border-border-subtle bg-surface-header/20 flex items-center justify-between text-xs text-secondary">
    <span>
      {t.shortcuts.tip.includes("{key}") ? (
        <>
          {t.shortcuts.tip.split("{key}")[0]}
          <kbd className="px-1 py-0.2 text-[10px] font-mono bg-window border border-border-subtle rounded">
            ?
          </kbd>
          {t.shortcuts.tip.split("{key}")[1]}
        </>
      ) : (
        t.shortcuts.tip
      )}
    </span>
    <span className="text-[11px] text-secondary/70">{t.shortcuts.escToClose}</span>
  </div>
);
