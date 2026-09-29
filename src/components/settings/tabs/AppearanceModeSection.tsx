import React from "react";
import { Sparkles, Laptop } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";

export const AppearanceModeSection: React.FC = () => {
  const { t } = useTranslation();
  const { mode, setMode } = useSettingsStore();

  return (
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
  );
};
