import React from "react";
import clsx from "clsx";
import { useTranslation } from "../../i18n";
import type { CompareMode } from "../../ipc/bindings.generated";

interface CompareModeToggleProps {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
}

/** MergeBase/Direct comparison mode segmented toggle. */
export const CompareModeToggle: React.FC<CompareModeToggleProps> = ({ mode, onModeChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center rounded-lg bg-window p-0.5 border border-border-subtle text-xs shrink-0">
      <button
        type="button"
        onClick={() => onModeChange("MergeBase")}
        title={t.compare.modeMergeBaseDesc}
        className={clsx(
          "px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
          mode === "MergeBase"
            ? "bg-accent text-accent-contrast shadow-2xs font-semibold"
            : "text-secondary hover:text-primary"
        )}
      >
        {t.compare.modeMergeBase}
      </button>
      <button
        type="button"
        onClick={() => onModeChange("Direct")}
        title={t.compare.modeDirectDesc}
        className={clsx(
          "px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
          mode === "Direct"
            ? "bg-accent text-accent-contrast shadow-2xs font-semibold"
            : "text-secondary hover:text-primary"
        )}
      >
        {t.compare.modeDirect}
      </button>
    </div>
  );
};
