import React from "react";
import { RotateCcw, Loader2, Play } from "lucide-react";
import type { Translations } from "../../i18n/vi";
import { Button, Checkbox } from "../../shared/ui";

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
        <Checkbox checked={autoStash} onChange={(e) => setAutoStash(e.target.checked)} />
        <span className="text-xs text-primary font-medium">
          {t.modals.interactiveRebase.autoStash}
        </span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <Button variant="secondary" onClick={onReset} disabled={submitting || isLoading}>
          <RotateCcw size={12} />
          <span>{t.modals.interactiveRebase.resetBtn}</span>
        </Button>

        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          {t.modals.interactiveRebase.cancelBtn}
        </Button>

        <Button onClick={onSubmit} disabled={!canSubmit}>
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
        </Button>
      </div>
    </div>
  );
};
