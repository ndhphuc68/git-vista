import React from "react";
import { GitCompare, X } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareMode, CompareSummary } from "../../ipc/bindings.generated";
import { CompareRevisionInputs } from "./CompareRevisionInputs";
import { CompareHeaderStats } from "./CompareHeaderStats";

export interface CompareHeaderProps {
  baseRev: string;
  targetRev: string;
  mode: CompareMode;
  onBaseRevChange: (rev: string) => void;
  onTargetRevChange: (rev: string) => void;
  onModeChange: (mode: CompareMode) => void;
  onSwap: () => void;
  onClose: () => void;
  branches?: Array<{ name: string; is_head?: boolean }>;
  tags?: Array<{ name: string }>;
  summary?: CompareSummary | null;
  isLoading?: boolean;
}

export const CompareHeader: React.FC<CompareHeaderProps> = ({
  baseRev,
  targetRev,
  mode,
  onBaseRevChange,
  onTargetRevChange,
  onModeChange,
  onSwap,
  onClose,
  branches = [],
  tags = [],
  summary,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col border-b border-border-subtle bg-surface px-5 py-4 gap-3 shrink-0 select-none">
      {/* Top row: Title and Close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/15 text-link">
            <GitCompare size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary">{t.compare.title}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.compare.close}
          title={t.compare.close}
          className="p-1.5 rounded-md text-tertiary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <CompareRevisionInputs
        baseRev={baseRev}
        targetRev={targetRev}
        mode={mode}
        onBaseRevChange={onBaseRevChange}
        onTargetRevChange={onTargetRevChange}
        onModeChange={onModeChange}
        onSwap={onSwap}
        branches={branches}
        tags={tags}
      />

      <CompareHeaderStats summary={summary} isLoading={isLoading} />
    </div>
  );
};
