import React, { useState } from "react";
import { useTranslation } from "../../i18n";
import { useRepoStore } from "../../store/useRepoStore";
import { useToastStore } from "../../store/useToastStore";
import { useFileBlame } from "../../features/history";
import { BlameLineRow } from "./BlameLineRow";

interface BlameViewProps {
  repoPath: string;
  filePath: string;
  commitId?: string | null;
  onSelectCommit?: (commitId: string) => void;
}

export const BlameView: React.FC<BlameViewProps> = ({
  repoPath,
  filePath,
  commitId,
  onSelectCommit,
}) => {
  const { t } = useTranslation();
  const { setSelectedCommit } = useRepoStore();
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const { data: blame, isLoading, error } = useFileBlame(repoPath, filePath, commitId);

  const handleCopySha = async (sha: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(sha);
        setCopiedSha(sha);
        setTimeout(() => setCopiedSha(null), 2000);
      }
    } catch {
      // ignore
    }
    useToastStore.getState().showSuccess(t.inspector.copyShaSuccess);
  };

  const handleCommitClick = (sha: string) => {
    if (!sha) return;
    if (onSelectCommit) {
      onSelectCommit(sha);
    } else {
      setSelectedCommit(sha);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-secondary text-xs">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>{t.inspector.loadingBlame}</span>
      </div>
    );
  }

  if (error || !blame || blame.lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-tertiary text-xs">
        {error ? String(error) : t.inspector.noBlameData}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      {/* Blame summary bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-window border-b border-border-subtle text-[11px] text-secondary select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary font-medium truncate" title={blame.file_path}>
            {blame.file_path}
          </span>
          {blame.commit_id && (
            <span className="bg-accent/15 text-accent font-mono px-1.5 py-0.5 rounded text-[10px]">
              {blame.commit_id.slice(0, 7)}
            </span>
          )}
        </div>
        <span className="text-tertiary font-mono">
          {t.inspector.totalLines.replace("{count}", String(blame.total_lines))}
        </span>
      </div>

      {/* Code with Blame Gutter */}
      <div className="flex-1 overflow-auto font-mono text-xs select-text">
        <div className="min-w-full inline-block">
          {blame.lines.map((line) => (
            <BlameLineRow
              key={line.line_no}
              line={line}
              copiedSha={copiedSha}
              onCommitClick={handleCommitClick}
              onCopySha={handleCopySha}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
