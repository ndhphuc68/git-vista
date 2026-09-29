import React from "react";
import { ArrowLeftRight } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareMode } from "../../ipc/bindings.generated";
import { CompareRevisionInput } from "./CompareRevisionInput";
import { CompareModeToggle } from "./CompareModeToggle";

export interface CompareRevisionInputsProps {
  baseRev: string;
  targetRev: string;
  mode: CompareMode;
  onBaseRevChange: (rev: string) => void;
  onTargetRevChange: (rev: string) => void;
  onModeChange: (mode: CompareMode) => void;
  onSwap: () => void;
  branches?: Array<{ name: string; is_head?: boolean }>;
  tags?: Array<{ name: string }>;
}

/** Base/Swap/Target revision inputs and the MergeBase/Direct mode toggle. */
export const CompareRevisionInputs: React.FC<CompareRevisionInputsProps> = ({
  baseRev,
  targetRev,
  mode,
  onBaseRevChange,
  onTargetRevChange,
  onModeChange,
  onSwap,
  branches = [],
  tags = [],
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Datalist for revisions autocomplete */}
      <datalist id="compare-revision-options">
        {branches.map((b) => (
          <option key={`branch-${b.name}`} value={b.name}>
            {b.is_head ? `${b.name} (HEAD)` : b.name}
          </option>
        ))}
        {tags.map((tag) => (
          <option key={`tag-${tag.name}`} value={tag.name}>
            {`tag: ${tag.name}`}
          </option>
        ))}
      </datalist>

      {/* Middle row: Base / Swap / Target + Mode selection */}
      <div className="flex flex-wrap items-center gap-3">
        <CompareRevisionInput
          label={t.compare.base}
          value={baseRev}
          onChange={onBaseRevChange}
          placeholder="e.g. main"
          ariaLabel={t.compare.base}
        />

        {/* Swap button */}
        <button
          type="button"
          onClick={onSwap}
          title={t.compare.swap}
          aria-label={t.compare.swap}
          className="p-2 rounded-md bg-surface-hover border border-border-subtle text-secondary hover:text-primary hover:bg-surface-active transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeftRight size={14} />
        </button>

        <CompareRevisionInput
          label={t.compare.target}
          value={targetRev}
          onChange={onTargetRevChange}
          placeholder="e.g. feature/branch"
          ariaLabel={t.compare.target}
        />

        <CompareModeToggle mode={mode} onModeChange={onModeChange} />
      </div>
    </>
  );
};
