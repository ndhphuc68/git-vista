import React from "react";
import { GitCommit, FileCode } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareSummary } from "../../ipc/bindings.generated";

export interface CompareHeaderStatsProps {
  summary?: CompareSummary | null;
  isLoading?: boolean;
}

/** Bottom row of CompareHeader: loading spinner, identical notice, or ahead/behind + additions/deletions. */
export const CompareHeaderStats: React.FC<CompareHeaderStatsProps> = ({
  summary,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const isIdentical =
    summary &&
    (summary.resolved_base_oid === summary.resolved_target_oid ||
      (summary.ahead_count === 0 && summary.behind_count === 0 && summary.files.length === 0));

  return (
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
            <GitCommit size={13} className="text-link" />
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
        <div className="text-tertiary">Nhập 2 điểm mốc commit/nhánh để xem khác biệt.</div>
      )}
    </div>
  );
};
