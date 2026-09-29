import React from "react";
import { Space } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type DiffTabSize } from "../../../store/useSettingsStore";

export const DiffTabSizeSection: React.FC = () => {
  const { t } = useTranslation();
  const { diffTabSize, setDiffTabSize } = useSettingsStore();

  const tabSizeOptions: { value: DiffTabSize; label: string }[] = [
    { value: 2, label: t.settings.diff.tabSize2 },
    { value: 4, label: t.settings.diff.tabSize4 },
    { value: 8, label: t.settings.diff.tabSize8 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Space size={14} className="text-secondary" />
        <label className="text-xs font-medium text-secondary block">
          {t.settings.diff.tabSizeTitle}
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tabSizeOptions.map((opt) => {
          const isSelected = diffTabSize === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`diff-tabsize-${opt.value}`}
              onClick={() => setDiffTabSize(opt.value)}
              className={`p-2.5 rounded-lg border text-center transition-all text-xs font-medium ${
                isSelected
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent font-semibold"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
