import React from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";

export interface GitBehaviorAutoFetchSectionProps {
  autoFetchInterval: number;
  onAutoFetchChange: (seconds: number) => void;
}

/** Auto-fetch interval picker: off, every 5 minutes, or every 15 minutes. */
export const GitBehaviorAutoFetchSection: React.FC<GitBehaviorAutoFetchSectionProps> = ({
  autoFetchInterval,
  onAutoFetchChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 pt-2 border-t border-border-subtle">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-accent" />
        <label className="text-xs font-medium text-primary">
          {t.settings.behavior.autoFetchTitle}
        </label>
        <HelpTooltip
          title={t.settings.help.autoFetchTitle}
          description={t.settings.help.autoFetchDesc}
          tag={t.settings.help.tagRecommended}
        />
      </div>
      <p className="text-[11px] text-secondary">{t.settings.behavior.autoFetchDesc}</p>
      <div className="grid grid-cols-3 gap-3 pt-1">
        {[
          { value: 0, label: t.settings.behavior.autoFetchOff },
          { value: 300, label: t.settings.behavior.autoFetch5m },
          { value: 900, label: t.settings.behavior.autoFetch15m },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAutoFetchChange(opt.value)}
            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
              autoFetchInterval === opt.value
                ? "border-accent bg-accent text-white font-semibold shadow-xs"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
