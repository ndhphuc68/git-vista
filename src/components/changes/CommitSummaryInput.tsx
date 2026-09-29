import React from "react";
import clsx from "clsx";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface CommitSummaryInputProps {
  summary: string;
  onSummaryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isOver72: boolean;
}

/** The commit summary field, with its over-72-character warning. */
export const CommitSummaryInput: React.FC<CommitSummaryInputProps> = ({
  summary,
  onSummaryChange,
  onKeyDown,
  isOver72,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        data-testid="commit-summary-input"
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t.commit.summaryPlaceholder}
        className={clsx(
          "w-full px-2 py-1.5 bg-window rounded-sm text-xs text-primary outline-none box-border transition-colors",
          isOver72
            ? "border border-diff-remove-text focus:border-diff-remove-text"
            : "border border-border-subtle focus:border-accent"
        )}
      />

      {isOver72 && (
        <div className="flex items-center gap-1 text-diff-remove-text text-[10px] mt-0.5">
          <AlertCircle size={11} />
          <span>{t.commit.charLimitWarn}</span>
        </div>
      )}
    </div>
  );
};
