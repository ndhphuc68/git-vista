import React from "react";
import { useTranslation } from "../../../i18n";

/**
 * Keyboard shortcuts hint row at the bottom of `WelcomeScreen`. Extracted
 * from the component body, keeping the same markup verbatim.
 */
export const WelcomeShortcutsFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="flex items-center justify-center gap-6 text-xs text-tertiary pt-1 border-t border-border-subtle/50">
      <div className="flex items-center gap-1.5">
        <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs text-secondary">
          Ctrl+K
        </kbd>
        <span>{t.welcome.commandPalette}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs text-secondary">
          ?
        </kbd>
        <span>{t.welcome.shortcuts}</span>
      </div>
    </footer>
  );
};
