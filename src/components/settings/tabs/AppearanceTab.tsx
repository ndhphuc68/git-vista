import React from "react";
import { Sun, Moon, Laptop, Eye, Sparkles, Clock, UserCheck } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, Theme, Locale, DateFormat, AvatarStyle } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";

export const AppearanceTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    theme,
    locale,
    mode,
    colorblind,
    dateFormat,
    avatarStyle,
    setTheme,
    setLocale,
    setMode,
    setColorblind,
    setDateFormat,
    setAvatarStyle,
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

  const dateFormatOptions: { value: DateFormat; label: string }[] = [
    { value: "relative", label: t.settings.appearance.dateRelative },
    { value: "absolute", label: t.settings.appearance.dateAbsolute },
  ];

  const avatarOptions: { value: AvatarStyle; label: string }[] = [
    { value: "initials", label: t.settings.appearance.avatarInitials },
    { value: "gravatar", label: t.settings.appearance.avatarGravatar },
    { value: "none", label: t.settings.appearance.avatarNone },
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
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-secondary block">
            {t.settings.appearance.themeTitle}
          </label>
          <HelpTooltip
            title={t.settings.help.appearanceThemeTitle}
            description={t.settings.help.appearanceThemeDesc}
            tag={t.settings.help.tagVisual}
          />
        </div>
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
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-secondary block">
            {t.settings.appearance.modeTitle}
          </label>
          <HelpTooltip
            title={t.settings.help.appearanceModeTitle}
            description={t.settings.help.appearanceModeDesc}
            tag={t.settings.help.tagWorkflow}
          />
        </div>
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
                {t.settings.appearance.modeSimpleDesc}
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
                {t.settings.appearance.modeAdvancedDesc}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Date & Time Format */}
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

      {/* Avatar Style */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <UserCheck size={14} className="text-secondary" />
          <label className="text-xs font-medium text-secondary block">
            {t.settings.appearance.avatarTitle}
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {avatarOptions.map((opt) => {
            const isSelected = avatarStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`avatar-style-${opt.value}`}
                onClick={() => setAvatarStyle(opt.value)}
                className={`p-3 rounded-lg border text-center transition-all text-xs font-medium ${
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

      {/* Colorblind Accessibility */}
      <div className="pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-secondary shrink-0" />
            <div>
              <span className="text-xs font-semibold text-primary block">
                {t.settings.appearance.colorblindTitle}
              </span>
              <span className="text-[11px] text-secondary block mt-0.5">
                {t.settings.appearance.colorblindDesc}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={colorblind}
            onClick={() => setColorblind(!colorblind)}
            aria-label={t.settings.appearance.colorblindTitle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
              colorblind ? "bg-accent" : "bg-border-strong"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                colorblind ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
