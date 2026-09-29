import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type Theme } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";

export const AppearanceThemeSection: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useSettingsStore();

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t.settings.appearance.themeLight, icon: <Sun size={16} /> },
    { value: "dark", label: t.settings.appearance.themeDark, icon: <Moon size={16} /> },
    { value: "system", label: t.settings.appearance.themeSystem, icon: <Laptop size={16} /> },
  ];

  return (
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
  );
};
