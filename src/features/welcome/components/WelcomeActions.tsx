import React from "react";
import { FolderGit2, FolderOpen, Download } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface WelcomeActionsProps {
  onOpenFolder: () => void;
  onOpenClone: () => void;
}

/**
 * Primary "Open Folder" / "Clone Repository" action cards plus the
 * drag-and-drop hint row below them. Moved intact from the old
 * `WelcomeScreen` component.
 */
export const WelcomeActions: React.FC<WelcomeActionsProps> = ({ onOpenFolder, onOpenClone }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 animate-slide-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Open Folder Card */}
        <button
          onClick={onOpenFolder}
          className="group flex items-start gap-4 p-4.5 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-accent rounded-xl text-left card-lift btn-press cursor-pointer shadow-xs hover:shadow-md min-h-[92px]"
        >
          <div className="w-11 h-11 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
            <FolderOpen size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base font-bold text-primary group-hover:text-accent transition-colors">
                {t.welcome.openFolder}
              </span>
              <kbd className="text-xs font-mono text-tertiary bg-window px-2 py-0.5 rounded border border-border-subtle shrink-0">
                Ctrl+O
              </kbd>
            </div>
            <p className="text-xs text-secondary mt-1 leading-relaxed">
              {t.welcome.openFolderDesc}
            </p>
          </div>
        </button>

        {/* Clone Repo Card */}
        <button
          type="button"
          data-testid="welcome-clone-btn"
          onClick={onOpenClone}
          className="group flex items-start gap-4 p-4.5 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-emerald-500 rounded-xl text-left card-lift btn-press cursor-pointer shadow-xs hover:shadow-md min-h-[92px]"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
            <Download size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base font-bold text-primary group-hover:text-emerald-600 transition-colors">
                {t.welcome.cloneRepo}
              </span>
              <kbd className="text-xs font-mono text-tertiary bg-window px-2 py-0.5 rounded border border-border-subtle shrink-0">
                Ctrl+N
              </kbd>
            </div>
            <p className="text-xs text-secondary mt-1 leading-relaxed">
              {t.welcome.cloneRepoDesc}
            </p>
          </div>
        </button>
      </div>

      {/* Integrated Drag & Drop Zone */}
      <div
        onClick={onOpenFolder}
        className="p-3.5 rounded-xl bg-surface/70 border border-dashed border-border-strong/70 hover:border-accent flex items-center justify-center gap-2.5 text-xs sm:text-sm text-secondary hover:text-primary transition-all card-lift btn-press cursor-pointer shadow-2xs hover:bg-surface"
      >
        <FolderGit2 size={16} className="text-tertiary shrink-0" />
        <span>{t.welcome.dropzoneHint}</span>
      </div>
    </div>
  );
};
