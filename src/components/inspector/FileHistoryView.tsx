import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "../../i18n";
import { useFileHistory, FileDiffViewer } from "../../features/history";
import { FileHistoryCommitRow } from "./FileHistoryCommitRow";
import { FileHistorySearchHeader } from "./FileHistorySearchHeader";

interface FileHistoryViewProps {
  repoPath: string;
  filePath: string;
}

export const FileHistoryView: React.FC<FileHistoryViewProps> = ({ repoPath, filePath }) => {
  const { t } = useTranslation();
  const [filterText, setFilterText] = useState("");
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  const { data: history, isLoading, error } = useFileHistory(repoPath, filePath);

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
        <FileHistorySearchHeader
          totalCount={history.total_count}
          filterText={filterText}
          onFilterTextChange={setFilterText}
        />

        {/* Commit List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredCommits.length === 0 ? (
            <div className="py-6 text-center text-xs text-tertiary">
              {t.inspector.noMatchingCommits}
            </div>
          ) : (
            filteredCommits.map((c) => (
              <FileHistoryCommitRow
                key={c.commit_id}
                commit={c}
                isSelected={selectedCommitId === c.commit_id}
                onSelect={setSelectedCommitId}
              />
            ))
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
