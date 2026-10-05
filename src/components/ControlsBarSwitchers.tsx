import React from "react";
import clsx from "clsx";
import { Languages, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { type Theme, type Locale } from "../store/useSettingsStore";
import { type Translations } from "../i18n/vi";
import { ControlsBarAppearanceSwitchers } from "./ControlsBarAppearanceSwitchers";

interface ControlsBarSwitchersProps {
  t: Translations;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorblind: boolean;
  setColorblind: (colorblind: boolean) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  devToolsOpen: boolean;
  toggleDevTools: () => void;
}

/** Theme, colorblind, language and devtools switchers in the ControlsBar top row. */
export const ControlsBarSwitchers: React.FC<ControlsBarSwitchersProps> = ({
  t,
  theme,
  setTheme,
  colorblind,
  setColorblind,
  locale,
  setLocale,
  devToolsOpen,
  toggleDevTools,
}) => {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <ControlsBarAppearanceSwitchers
        t={t}
        theme={theme}
        setTheme={setTheme}
        colorblind={colorblind}
        setColorblind={setColorblind}
      />

      {/* Language Switcher */}
      <div className="inline-flex bg-window p-0.5 rounded-md border border-border-subtle">
        {(["vi", "en"] as Locale[]).map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc)}
            className={clsx(
              "px-1.5 py-0.5 rounded-sm text-xs flex items-center gap-0.5 cursor-pointer transition-colors",
              locale === loc
                ? "bg-surface text-primary shadow-sm font-semibold"
                : "bg-transparent text-secondary hover:text-primary font-normal"
            )}
          >
            <Languages size={11} />
            <span>{loc.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* DevTools Toggle Button */}
      <button
        type="button"
        data-testid="toggle-devtools"
        onClick={toggleDevTools}
        className={clsx(
          "px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 border border-border-subtle cursor-pointer transition-colors",
          devToolsOpen
            ? "bg-accent-subtle text-link font-medium"
            : "bg-window text-secondary hover:text-primary"
        )}
        title="Công cụ nhà phát triển & IPC"
      >
        <Cpu size={11} />
        <span>Dev</span>
        {devToolsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
    </div>
  );
};
