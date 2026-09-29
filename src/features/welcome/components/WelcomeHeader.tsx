import React from "react";
import { Settings } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface WelcomeHeaderProps {
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

/**
 * Logo, product name/tagline, and the settings/shortcuts buttons at the top
 * of `WelcomeScreen`. Extracted from the component body, keeping the same
 * markup verbatim.
 */
export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  onOpenSettings,
  onOpenShortcuts,
}) => {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 animate-slide-down">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1">
          <img
            src="/app-icon.png"
            alt="GitVista Logo"
            className="w-full h-full object-contain select-none pointer-events-none"
          />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              GitVista
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
              v0.1
            </span>
          </div>
          <p className="text-secondary text-xs sm:text-sm mt-0.5">{t.welcome.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <button
          onClick={onOpenSettings}
          type="button"
          className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-subtle text-xs font-medium text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          title={`${t.settings.title} (Ctrl+,)`}
        >
          <Settings size={13} className="text-secondary" />
          <span>{t.settings.title}</span>
        </button>
        <button
          onClick={onOpenShortcuts}
          type="button"
          className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-subtle text-xs font-medium text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          title={t.welcome.shortcuts}
        >
          <kbd className="font-mono text-[10px] bg-window px-1.5 py-0.2 rounded border border-border-subtle">
            ?
          </kbd>
          <span>{t.welcome.shortcuts}</span>
        </button>
      </div>
    </header>
  );
};
