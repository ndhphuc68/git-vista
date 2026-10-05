import React from "react";
import clsx from "clsx";
import { Eye } from "lucide-react";
import { type Theme } from "../store/useSettingsStore";
import { type Translations } from "../i18n/vi";

interface ControlsBarAppearanceSwitchersProps {
  t: Translations;
  theme?: Theme;
  setTheme?: (theme: Theme) => void;
  colorblind: boolean;
  setColorblind: (colorblind: boolean) => void;
}

/** Colorblind switcher in the ControlsBar top row. */
export const ControlsBarAppearanceSwitchers: React.FC<ControlsBarAppearanceSwitchersProps> = ({
  t,
  colorblind,
  setColorblind,
}) => {
  return (
    <button
      onClick={() => setColorblind(!colorblind)}
      className={clsx(
        "px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 border border-border-subtle cursor-pointer transition-colors",
        colorblind
          ? "bg-accent-subtle text-link font-medium"
          : "bg-window text-secondary hover:text-primary"
      )}
      title={t.settings.colorblind}
    >
      <Eye size={11} />
      <span>{colorblind ? t.settings.colorblindOn : t.settings.colorblindOff}</span>
    </button>
  );
};
