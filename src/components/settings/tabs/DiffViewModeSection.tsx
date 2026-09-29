import React from "react";
import { Columns, AlignLeft } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type DiffViewMode } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { DiffModeDiagram } from "../helpDiagrams";

export const DiffViewModeSection: React.FC = () => {
  const { t } = useTranslation();
  const { diffViewMode, setDiffViewMode } = useSettingsStore();

  const viewModeOptions: {
    value: DiffViewMode;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "unified",
      title: t.settings.diff.viewModeUnified,
      desc: t.settings.diff.viewModeUnifiedDesc,
      icon: <AlignLeft size={18} />,
    },
    {
      value: "split",
      title: t.settings.diff.viewModeSplit,
      desc: t.settings.diff.viewModeSplitDesc,
      icon: <Columns size={18} />,
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.diff.viewModeTitle}
        </label>
        <HelpTooltip
          title={t.settings.help.diffModeTitle}
          description={t.settings.help.diffModeDesc}
          tag={t.settings.help.tagVisual}
          diagram={<DiffModeDiagram />}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {viewModeOptions.map((opt) => {
          const isSelected = diffViewMode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`diff-mode-${opt.value}`}
              onClick={() => setDiffViewMode(opt.value)}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <div
                className={`p-1.5 rounded-md ${isSelected ? "text-accent bg-accent/15" : "text-secondary bg-surface"}`}
              >
                {opt.icon}
              </div>
              <div>
                <div className="text-xs font-semibold text-primary">{opt.title}</div>
                <div className="text-[11px] text-secondary mt-0.5 leading-relaxed">{opt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
