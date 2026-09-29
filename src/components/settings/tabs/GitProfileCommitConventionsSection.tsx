import React from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type CommitMessageLimit } from "../../../store/useSettingsStore";

export interface GitProfileCommitConventionsSectionProps {
  commitMessageLimit: number;
  onCommitMessageLimitChange: (limit: CommitMessageLimit) => void;
}

/** Commit message length convention picker (no limit / 50 / 72 columns). */
export const GitProfileCommitConventionsSection: React.FC<
  GitProfileCommitConventionsSectionProps
> = ({ commitMessageLimit, onCommitMessageLimitChange }) => {
  const { t } = useTranslation();

  const commitLimitOptions: { value: CommitMessageLimit; label: string }[] = [
    { value: 0, label: t.settings.profile.commitLengthNoLimit },
    { value: 50, label: t.settings.profile.commitLength50 },
    { value: 72, label: t.settings.profile.commitLength72 },
  ];

  return (
    <div className="pt-3 border-t border-border-subtle space-y-3">
      <div className="flex items-start gap-2">
        <FileText size={16} className="text-accent mt-0.5 shrink-0" />
        <div>
          <div className="text-xs font-semibold text-primary">
            {t.settings.profile.commitConventionsTitle}
          </div>
          <label className="text-[11px] text-secondary mt-0.5 block">
            {t.settings.profile.commitLengthLabel}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {commitLimitOptions.map((opt) => {
          const isSelected = commitMessageLimit === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`commit-limit-${opt.value}`}
              onClick={() => onCommitMessageLimitChange(opt.value)}
              className={`p-2.5 rounded-lg border text-center transition-all text-xs font-medium ${
                isSelected
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent font-semibold"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
