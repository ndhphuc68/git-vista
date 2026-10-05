import React from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useFormatDate, useTranslation } from "../../i18n";
import { AuthorAvatar } from "../../features/history";
import type { BlameLine } from "../../ipc/bindings.generated";

interface BlameLineGutterProps {
  line: BlameLine;
  copiedSha: string | null;
  onCommitClick: (sha: string) => void;
  onCopySha: (sha: string, e: React.MouseEvent) => void;
}

/** Avatar, author name, time, and commit-sha buttons shown at the start of a blame hunk. */
export const BlameLineGutter: React.FC<BlameLineGutterProps> = ({
  line,
  copiedSha,
  onCommitClick,
  onCopySha,
}) => {
  const { t } = useTranslation();
  const formatDate = useFormatDate();

  return (
    <>
      {/* Avatar */}
      <AuthorAvatar
        name={line.author_name}
        email={line.author_email}
        size={16}
        className="text-[9px]"
      />

      {/* Author Name */}
      <span className="truncate flex-1 text-primary font-medium text-[11px]">
        {line.author_name}
      </span>

      {/* Time */}
      <span className="text-[10px] text-tertiary shrink-0">{formatDate(line.timestamp_sec)}</span>

      {/* Commit SHA button */}
      <button
        type="button"
        onClick={() => onCommitClick(line.commit_id)}
        className="flex items-center gap-1 font-mono text-[10px] text-accent hover:underline shrink-0 p-0.5 rounded hover:bg-accent/10 transition-colors cursor-pointer"
        title={t.inspector.jumpToCommit}
      >
        <span>{line.short_id}</span>
        <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Copy SHA icon */}
      <button
        type="button"
        onClick={(e) => onCopySha(line.commit_id, e)}
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
  );
};
