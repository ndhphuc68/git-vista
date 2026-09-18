import React from "react";
import clsx from "clsx";
import { GitCompare, ArrowLeftRight, X, GitCommit, FileCode } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareMode, CompareSummary } from "../../ipc/bindings";

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

  const isIdentical =
    summary &&
    (summary.resolved_base_oid === summary.resolved_target_oid ||
      (summary.ahead_count === 0 &&
        summary.behind_count === 0 &&
        summary.files.length === 0));

  return (
    <div className="flex flex-col border-b border-border-subtle bg-surface px-5 py-4 gap-3 shrink-0 select-none">
      {/* Top row: Title and Close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/15 text-accent">
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
        {/* Base revision input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
          <span className="text-xs font-semibold text-secondary whitespace-nowrap">
            {t.compare.base}:
          </span>
          <input
            type="text"
            list="compare-revision-options"
            value={baseRev}
            onChange={(e) => onBaseRevChange(e.target.value)}
            placeholder="e.g. main"
            aria-label={t.compare.base}
            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded bg-window border border-border-subtle text-primary focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

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

        {/* Target revision input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
          <span className="text-xs font-semibold text-secondary whitespace-nowrap">
            {t.compare.target}:
          </span>
          <input
            type="text"
            list="compare-revision-options"
            value={targetRev}
            onChange={(e) => onTargetRevChange(e.target.value)}
            placeholder="e.g. feature/branch"
            aria-label={t.compare.target}
            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded bg-window border border-border-subtle text-primary focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Mode switcher toggle */}
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
      </div>

      {/* Bottom row: Statistics & status info */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-border-subtle/40 min-h-[24px]">
        {isLoading ? (
          <div className="flex items-center gap-1.5 text-secondary">
            <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Đang tải thông tin so sánh...</span>
          </div>
        ) : isIdentical ? (
          <div className="text-emerald-500 dark:text-emerald-400 font-medium">
            {t.compare.identical}
          </div>
        ) : summary ? (
          <div className="flex flex-wrap items-center gap-3 text-secondary">
            <div className="flex items-center gap-1">
              <GitCommit size={13} className="text-accent" />
              <span>
                {t.compare.aheadBehind
                  .replace("{ahead}", String(summary.ahead_count))
                  .replace("{behind}", String(summary.behind_count))}
              </span>
            </div>
            <span className="text-border-subtle">•</span>
            <div className="flex items-center gap-1">
              <FileCode size={13} className="text-secondary" />
              <span>
                {t.compare.stats
                  .replace("{additions}", String(summary.total_additions))
                  .replace("{deletions}", String(summary.total_deletions))
                  .replace("{files}", String(summary.files.length))}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-tertiary">
            Nhập 2 điểm mốc commit/nhánh để xem khác biệt.
          </div>
        )}
      </div>
    </div>
  );
};
