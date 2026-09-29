import React from "react";
import { Eye } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";

export const AppearanceColorblindSection: React.FC = () => {
  const { t } = useTranslation();
  const { colorblind, setColorblind } = useSettingsStore();

  return (
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
  );
};
