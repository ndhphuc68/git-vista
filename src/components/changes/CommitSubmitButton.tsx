import React from "react";
import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { AppMode } from "../../store/useSettingsStore";

export interface CommitSubmitButtonProps {
  canCommit: boolean;
  submitting: boolean;
  isLoading: boolean;
  isAmend: boolean;
  mode: AppMode;
  stagedCount: number;
  onSubmit: () => void;
}

/** The commit form's submit button, its label depending on amend/mode/loading state. */
export const CommitSubmitButton: React.FC<CommitSubmitButtonProps> = ({
  canCommit,
  submitting,
  isLoading,
  isAmend,
  mode,
  stagedCount,
  onSubmit,
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-testid="commit-button"
      disabled={!canCommit}
      onClick={onSubmit}
      className={clsx(
        "flex items-center justify-center gap-1.5 w-full py-2 px-3 border rounded-sm text-xs font-semibold transition-all duration-150 ease-macos btn-press",
        canCommit
          ? "bg-accent text-accent-contrast border-accent cursor-pointer hover:bg-accent-hover active:scale-[0.98]"
          : "bg-window text-tertiary border-border-subtle cursor-not-allowed"
      )}
    >
      {submitting || isLoading ? (
        <>
          <RefreshCw size={13} className="animate-spin" />
          <span>{t.commit.saving}</span>
        </>
      ) : isAmend ? (
        <span>{mode === "simple" ? t.commit.amendCommitSimple : t.commit.amendCommitAdvanced}</span>
      ) : (
        <span>
          {mode === "simple"
            ? t.commit.commitSimple.replace("{count}", String(stagedCount))
            : t.commit.commitAdvanced.replace("{count}", String(stagedCount))}
        </span>
      )}
    </button>
  );
};
