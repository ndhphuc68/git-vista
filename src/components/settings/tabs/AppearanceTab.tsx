import React from "react";
import { Sun, Moon, Laptop, Eye, Sparkles } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, Theme, Locale } from "../../../store/useSettingsStore";

export const AppearanceTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    theme,
    locale,
    mode,
    colorblind,
    setTheme,
    setLocale,
    setMode,
    setColorblind,
  } = useSettingsStore();

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t.settings.appearance.themeLight, icon: <Sun size={16} /> },
    { value: "dark", label: t.settings.appearance.themeDark, icon: <Moon size={16} /> },
    { value: "system", label: t.settings.appearance.themeSystem, icon: <Laptop size={16} /> },
  ];

  const localeOptions: { value: Locale; label: string; flag: string }[] = [
    { value: "vi", label: t.settings.appearance.localeVi, flag: "🇻🇳" },
    { value: "en", label: t.settings.appearance.localeEn, flag: "🇬🇧" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">
          {t.settings.appearance.title}
        </h3>
        <p className="text-xs text-secondary">
          {t.settings.appearance.subtitle}
        </p>
      </div>

      {/* Theme Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.appearance.themeTitle}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                title={`Theme: ${opt.value}`}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                  isSelected
                    ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                    : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Selector */}
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

      {/* Interface Mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.appearance.modeTitle}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
              mode === "simple"
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <Sparkles size={16} className={`mt-0.5 ${mode === "simple" ? "text-accent" : "text-secondary"}`} />
            <div>
              <div className="text-xs font-semibold text-primary">{t.settings.appearance.modeSimple}</div>
              <div className="text-[11px] text-secondary mt-0.5">
                {t.settings.profile.subtitle}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("advanced")}
            className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
              mode === "advanced"
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <Laptop size={16} className={`mt-0.5 ${mode === "advanced" ? "text-accent" : "text-secondary"}`} />
            <div>
              <div className="text-xs font-semibold text-primary">{t.settings.appearance.modeAdvanced}</div>
              <div className="text-[11px] text-secondary mt-0.5">
                Full Git CLI standards
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Colorblind Accessibility */}
      <div className="pt-2 border-t border-border-subtle">
        <label className="flex items-center justify-between cursor-pointer p-2 -mx-2 rounded-lg hover:bg-surface-hover transition-colors">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-secondary" />
            <div>
              <span className="text-xs font-semibold text-primary block">
                {t.settings.appearance.colorblindTitle}
              </span>
              <span className="text-[11px] text-secondary block mt-0.5">
                {t.settings.appearance.colorblindDesc}
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={colorblind}
            onChange={(e) => setColorblind(e.target.checked)}
            className="w-4 h-4 rounded text-accent focus:ring-accent border-border-subtle cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
