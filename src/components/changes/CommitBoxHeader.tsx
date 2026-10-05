import React from "react";
import clsx from "clsx";
import { GitCommit } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface CommitBoxHeaderProps {
  summaryLength: number;
  limit: number;
  isOverLimit: boolean;
}

/** Title row plus the summary character counter (no denominator when the limit is off). */
export const CommitBoxHeader: React.FC<CommitBoxHeaderProps> = ({
  summaryLength,
  limit,
  isOverLimit,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <GitCommit size={14} className="text-accent" />
        <span className="text-xs font-semibold text-secondary">{t.commit.title}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={clsx(
            "text-[11px] font-mono",
            isOverLimit ? "text-diff-remove-text font-semibold" : "text-secondary font-normal"
          )}
        >
          {limit > 0 ? `${summaryLength}/${limit}` : summaryLength}
        </span>
      </div>
    </div>
  );
};
