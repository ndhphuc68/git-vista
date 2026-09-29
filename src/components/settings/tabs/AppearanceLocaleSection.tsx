import React from "react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type Locale } from "../../../store/useSettingsStore";

export const AppearanceLocaleSection: React.FC = () => {
  const { t } = useTranslation();
  const { locale, setLocale } = useSettingsStore();

  const localeOptions: { value: Locale; label: string; flag: string }[] = [
    { value: "vi", label: t.settings.appearance.localeVi, flag: "🇻🇳" },
    { value: "en", label: t.settings.appearance.localeEn, flag: "🇬🇧" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-secondary block">
        {t.settings.appearance.localeTitle}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {localeOptions.map((opt) => {
          const isSelected = locale === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLocale(opt.value)}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                isSelected
                  ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <span className="text-base">{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
