import React from "react";
import clsx from "clsx";
import { Sun, Moon, Laptop, Eye } from "lucide-react";
import { type Theme } from "../store/useSettingsStore";
import { type Translations } from "../i18n/vi";

interface ControlsBarAppearanceSwitchersProps {
  t: Translations;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorblind: boolean;
  setColorblind: (colorblind: boolean) => void;
}

/** Theme and colorblind switchers in the ControlsBar top row. */
export const ControlsBarAppearanceSwitchers: React.FC<ControlsBarAppearanceSwitchersProps> = ({
  t,
  theme,
  setTheme,
  colorblind,
  setColorblind,
}) => {
  return (
    <>
      {/* Theme Switcher */}
      <div className="inline-flex bg-window p-0.5 rounded-md border border-border-subtle">
        {(["light", "dark", "system"] as Theme[]).map((tVal) => (
          <button
            key={tVal}
            onClick={() => setTheme(tVal)}
            className={clsx(
              "px-1.5 py-0.5 rounded-sm text-xs flex items-center gap-1 cursor-pointer transition-colors",
              theme === tVal
                ? "bg-surface text-primary shadow-sm font-semibold"
                : "bg-transparent text-secondary hover:text-primary font-normal"
            )}
            title={`Theme: ${tVal}`}
          >
            {tVal === "light" && <Sun size={11} />}
            {tVal === "dark" && <Moon size={11} />}
            {tVal === "system" && <Laptop size={11} />}
            <span>
              {tVal === "light"
                ? t.settings.themeLight
                : tVal === "dark"
                  ? t.settings.themeDark
                  : t.settings.themeSystem}
            </span>
          </button>
        ))}
      </div>

      {/* Colorblind Toggle */}
      <button
        onClick={() => setColorblind(!colorblind)}
        className={clsx(
          "px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 border border-border-subtle cursor-pointer transition-colors",
          colorblind
            ? "bg-accent-subtle text-accent font-medium"
            : "bg-window text-secondary hover:text-primary"
        )}
        title={t.settings.colorblind}
      >
        <Eye size={11} />
        <span>{colorblind ? t.settings.colorblindOn : t.settings.colorblindOff}</span>
      </button>
    </>
  );
};
