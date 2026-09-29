import React from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type DateFormat } from "../../../store/useSettingsStore";

export const AppearanceDateFormatSection: React.FC = () => {
  const { t } = useTranslation();
  const { dateFormat, setDateFormat } = useSettingsStore();

  const dateFormatOptions: { value: DateFormat; label: string }[] = [
    { value: "relative", label: t.settings.appearance.dateRelative },
    { value: "absolute", label: t.settings.appearance.dateAbsolute },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-secondary" />
        <label className="text-xs font-medium text-secondary block">
          {t.settings.appearance.dateFormatTitle}
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dateFormatOptions.map((opt) => {
          const isSelected = dateFormat === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`date-format-${opt.value}`}
              onClick={() => setDateFormat(opt.value)}
              className={`p-3 rounded-lg border text-left transition-all text-xs font-medium ${
                isSelected
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
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
