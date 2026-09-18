import React, { useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { GitCommit, Copy, Check, ExternalLink } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useRepoStore } from "../../store/useRepoStore";
import { useToastStore } from "../../store/useToastStore";
import {
  getAuthorAvatarStyle,
  getAuthorInitials,
  formatRelativeTime,
  formatExactDateTime,
} from "../diff/CommitDetailPanel";

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

  const { data: blame, isLoading, error } = useQuery({
    queryKey: ["file-blame", repoPath, filePath, commitId],
    queryFn: () => invokeCommand.getFileBlame(repoPath, filePath, commitId),
  });

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
          {blame.lines.map((line) => {
            const avatar = getAuthorAvatarStyle(line.author_name);
            const initials = getAuthorInitials(line.author_name);
            const isHunk = line.is_hunk_start;
            const hasCommit = Boolean(line.commit_id);

            return (
              <div
                key={line.line_no}
                className={clsx(
                  "flex items-stretch hover:bg-surface-hover/80 transition-colors group",
                  isHunk ? "border-t border-border-subtle/40" : ""
                )}
              >
                {/* Blame Author & Commit Gutter (Fixed width) */}
                <div
                  className="w-72 shrink-0 flex items-center gap-2 px-2.5 py-0.5 border-r border-border-subtle/60 bg-window/30 text-[11px] select-none"
                  title={
                    hasCommit
                      ? `${line.summary}\n${line.author_name} <${line.author_email}>\n${formatExactDateTime(
                          line.timestamp_sec
                        )} (${line.commit_id})`
                      : undefined
                  }
                >
                  {isHunk && hasCommit ? (
                    <>
                      {/* Avatar */}
                      <span
                        className={clsx(
                          "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ring-1",
                          avatar.bg,
                          avatar.ring
                        )}
                      >
                        {initials}
                      </span>

                      {/* Author Name */}
                      <span className="truncate flex-1 text-primary font-medium text-[11px]">
                        {line.author_name}
                      </span>

                      {/* Time */}
                      <span className="text-[10px] text-tertiary shrink-0">
                        {formatRelativeTime(line.timestamp_sec)}
                      </span>

                      {/* Commit SHA button */}
                      <button
                        type="button"
                        onClick={() => handleCommitClick(line.commit_id)}
                        className="flex items-center gap-1 font-mono text-[10px] text-accent hover:underline shrink-0 p-0.5 rounded hover:bg-accent/10 transition-colors cursor-pointer"
                        title={t.inspector.jumpToCommit}
                      >
                        <span>{line.short_id}</span>
                        <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      {/* Copy SHA icon */}
                      <button
                        type="button"
                        onClick={(e) => handleCopySha(line.commit_id, e)}
                        className="text-tertiary hover:text-primary p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        title={t.inspector.copyShaSuccess}
                      >
                        {copiedSha === line.commit_id ? (
                          <Check size={10} className="text-emerald-500" />
                        ) : (
                          <Copy size={10} />
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                {/* Line number */}
                <div className="w-12 shrink-0 pr-2 py-0.5 text-right font-mono text-[11px] text-tertiary border-r border-border-subtle/50 select-none bg-window/10">
                  {line.line_no}
                </div>

                {/* Line text */}
                <div className="flex-1 pl-3 pr-4 py-0.5 whitespace-pre font-mono text-xs text-primary leading-5 overflow-x-visible">
                  {line.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
