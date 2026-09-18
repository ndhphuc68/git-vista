import React, { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { FileDiffViewer } from "../diff/FileDiffViewer";
import {
  getAuthorAvatarStyle,
  getAuthorInitials,
  formatRelativeTime,
} from "../diff/CommitDetailPanel";

interface FileHistoryViewProps {
  repoPath: string;
  filePath: string;
}

export const FileHistoryView: React.FC<FileHistoryViewProps> = ({ repoPath, filePath }) => {
  const { t } = useTranslation();
  const [filterText, setFilterText] = useState("");
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["file-history", repoPath, filePath],
    queryFn: () => invokeCommand.getFileHistory(repoPath, filePath, 0, 100),
  });

  // Set default selected commit to the latest commit
  useEffect(() => {
    if (history?.commits && history.commits.length > 0 && !selectedCommitId) {
      setSelectedCommitId(history.commits[0]!.commit_id);
    }
  }, [history, selectedCommitId]);

  const filteredCommits = useMemo(() => {
    if (!history?.commits) return [];
    if (!filterText.trim()) return history.commits;
    const q = filterText.toLowerCase();
    return history.commits.filter(
      (c) =>
        c.summary.toLowerCase().includes(q) ||
        c.author_name.toLowerCase().includes(q) ||
        c.short_id.toLowerCase().includes(q) ||
        c.commit_id.toLowerCase().includes(q)
    );
  }, [history, filterText]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-secondary text-xs">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>{t.inspector.loadingHistory}</span>
      </div>
    );
  }

  if (error || !history || history.commits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-tertiary text-xs">
        {error ? String(error) : t.inspector.noHistoryData}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-surface">
      {/* Left Pane: Commit History List */}
      <div className="w-80 shrink-0 border-r border-border-subtle flex flex-col bg-window/30 overflow-hidden">
        {/* Search header */}
        <div className="p-2 border-b border-border-subtle bg-window flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-bold text-secondary tracking-wide uppercase px-1">
            <span>{t.inspector.historyTab}</span>
            <span className="text-tertiary font-mono text-[10px] lowercase">
              {t.inspector.totalCommits.replace("{count}", String(history.total_count))}
            </span>
          </div>

          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-tertiary pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t.inspector.searchHistoryPlaceholder}
              className="w-full pl-7 pr-7 py-1 text-xs rounded-md bg-surface border border-border-subtle text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText("")}
                className="absolute right-2 text-tertiary hover:text-primary cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Commit List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredCommits.length === 0 ? (
            <div className="py-6 text-center text-xs text-tertiary">
              {t.inspector.noMatchingCommits}
            </div>
          ) : (
            filteredCommits.map((c) => {
              const isSelected = selectedCommitId === c.commit_id;
              const avatar = getAuthorAvatarStyle(c.author_name);
              const initials = getAuthorInitials(c.author_name);

              const changeTypeBadge =
                c.change_type === "added"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : c.change_type === "deleted"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";

              return (
                <button
                  key={c.commit_id}
                  type="button"
                  onClick={() => setSelectedCommitId(c.commit_id)}
                  className={clsx(
                    "group flex flex-col p-2 rounded-md text-xs cursor-pointer transition-all text-left w-full border relative gap-1",
                    isSelected
                      ? "bg-accent-subtle/80 border-accent/80 text-primary font-semibold shadow-2xs ring-1 ring-accent/30"
                      : "bg-surface border-border-subtle hover:bg-surface-hover text-primary font-normal"
                  )}
                >
                  {/* Left Active Indicator Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-accent rounded-r" />
                  )}

                  {/* Top row: Change badge, Short SHA, Date */}
                  <div className="flex items-center justify-between gap-1 select-none">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={clsx(
                          "px-1 py-0.2 rounded text-[9px] font-mono font-bold uppercase border shrink-0",
                          changeTypeBadge
                        )}
                        title={
                          c.change_type === "added"
                            ? t.inspector.changeTypeAdded
                            : c.change_type === "deleted"
                              ? t.inspector.changeTypeDeleted
                              : t.inspector.changeTypeModified
                        }
                      >
                        {c.change_type.slice(0, 1)}
                      </span>
                      <span className="font-mono text-[10px] text-accent font-bold truncate">
                        {c.short_id}
                      </span>
                    </div>

                    <span className="text-[10px] text-tertiary font-mono shrink-0">
                      {formatRelativeTime(c.timestamp_sec)}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="text-xs text-primary line-clamp-2 leading-snug">
                    {c.summary || "No commit message"}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-1.5 text-[10px] text-secondary mt-0.5">
                    <span
                      className={clsx(
                        "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0",
                        avatar.bg
                      )}
                    >
                      {initials}
                    </span>
                    <span className="truncate">{c.author_name}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: File Diff at selected commit */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto p-3">
        {selectedCommitId ? (
          <FileDiffViewer repoPath={repoPath} commitId={selectedCommitId} filePath={filePath} />
        ) : (
          <div className="flex items-center justify-center h-64 text-tertiary text-xs">
            {t.inspector.noHistoryData}
          </div>
        )}
      </div>
    </div>
  );
};
