import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface CloneProgressBarProps {
  progressPercent: number;
  statusText: string;
}

/**
 * Progress bar shown in `CloneModal` while a clone is running. Extracted
 * from the component body, keeping the same markup verbatim.
 */
export const CloneProgressBar: React.FC<CloneProgressBarProps> = ({
  progressPercent,
  statusText,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mt-1 p-3.5 rounded-xl bg-window border border-border-subtle">
      <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
        <span className="flex items-center gap-2 text-secondary">
          <Loader2 size={15} className="animate-spin text-link" />
          <span>{t.cloneModal.cloning}</span>
        </span>
        <span className="font-mono font-medium text-link">{progressPercent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full bg-surface rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {statusText && <p className="mt-2 text-xs text-tertiary truncate font-mono">{statusText}</p>}
    </div>
  );
};
