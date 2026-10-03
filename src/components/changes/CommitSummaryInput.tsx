import React from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "../../i18n";
import { Input } from "../../shared/ui";

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
      <Input
        data-testid="commit-summary-input"
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t.commit.summaryPlaceholder}
        invalid={isOver72}
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
