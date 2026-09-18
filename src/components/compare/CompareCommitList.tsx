import React from "react";
import { GitCommit, Calendar, User } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareCommitItem } from "../../ipc/bindings";

export interface CompareCommitListProps {
  commits: CompareCommitItem[];
  isLoading?: boolean;
}

function formatRelativeTime(timestampSec: number): string {
  if (!timestampSec) return "";
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = nowSec - timestampSec;

  if (diffSec < 60) return "vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} ngày trước`;

  const date = new Date(timestampSec * 1000);
  return date.toLocaleDateString();
}

export const CompareCommitList: React.FC<CompareCommitListProps> = ({
  commits,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-secondary text-xs gap-2 h-48">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>Đang tải danh sách commit...</span>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-tertiary text-xs gap-2 h-48 text-center">
        <GitCommit size={24} className="opacity-40" />
        <span>{t.compare.noCommits}</span>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle/50 overflow-y-auto">
      {commits.map((commit) => (
        <div
          key={commit.id}
          className="flex flex-col px-4 py-2.5 hover:bg-surface-hover/80 transition-colors gap-1 text-xs"
        >
          {/* Top line: short SHA + summary */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[11px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">
              {commit.short_id}
            </span>
            <span className="text-primary font-medium truncate flex-1" title={commit.summary}>
              {commit.summary}
            </span>
          </div>

          {/* Bottom line: author + timestamp */}
          <div className="flex items-center gap-3 text-secondary text-[11px] pl-0.5">
            <div className="flex items-center gap-1 truncate max-w-[150px]">
              <User size={11} className="shrink-0 text-tertiary" />
              <span className="truncate">{commit.author_name}</span>
            </div>
            <div className="flex items-center gap-1 text-tertiary shrink-0">
              <Calendar size={11} />
              <span>{formatRelativeTime(commit.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
