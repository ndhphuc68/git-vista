import React from "react";
import { Type } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type DiffFontSize } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";

export const DiffFontSizeSection: React.FC = () => {
  const { t } = useTranslation();
  const { diffFontSize, setDiffFontSize } = useSettingsStore();

  const fontSizeOptions: { value: DiffFontSize; label: string }[] = [
    { value: 12, label: t.settings.diff.fontSize12 },
    { value: 13, label: t.settings.diff.fontSize13 },
    { value: 14, label: t.settings.diff.fontSize14 },
    { value: 16, label: t.settings.diff.fontSize16 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Type size={14} className="text-secondary" />
        <label className="text-xs font-medium text-secondary block">
          {t.settings.diff.fontSizeTitle}
        </label>
        <HelpTooltip
          title={t.settings.help.diffFontSizeTitle}
          description={t.settings.help.diffFontSizeDesc}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fontSizeOptions.map((opt) => {
          const isSelected = diffFontSize === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`diff-fontsize-${opt.value}`}
              onClick={() => setDiffFontSize(opt.value)}
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
