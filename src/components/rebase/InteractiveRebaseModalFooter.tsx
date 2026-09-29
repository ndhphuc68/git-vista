import React from "react";
import { RotateCcw, Loader2, Play } from "lucide-react";
import type { Translations } from "../../i18n/vi";

export interface InteractiveRebaseModalFooterProps {
  t: Translations;
  autoStash: boolean;
  setAutoStash: (value: boolean) => void;
  submitting: boolean;
  isLoading: boolean;
  canSubmit: boolean;
  onReset: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const InteractiveRebaseModalFooter: React.FC<InteractiveRebaseModalFooterProps> = ({
  t,
  autoStash,
  setAutoStash,
  submitting,
  isLoading,
  canSubmit,
  onReset,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-border-subtle bg-surface-subtle/50 shrink-0">
      {/* Auto-stash toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={autoStash}
          onChange={(e) => setAutoStash(e.target.checked)}
          className="rounded border-border-strong text-accent focus:ring-accent/30 w-3.5 h-3.5"
        />
        <span className="text-xs text-primary font-medium">
          {t.modals.interactiveRebase.autoStash}
        </span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onReset}
          disabled={submitting || isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
        >
          <RotateCcw size={12} />
          <span>{t.modals.interactiveRebase.resetBtn}</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-3.5 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
        >
          {t.modals.interactiveRebase.cancelBtn}
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          {submitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>{t.modals.interactiveRebase.rebasing}</span>
            </>
          ) : (
            <>
              <Play size={13} className="fill-current" />
              <span>{t.modals.interactiveRebase.startBtn}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
