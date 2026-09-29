import React from "react";
import clsx from "clsx";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useTranslation } from "../../i18n";
import { getAuthorAvatarStyle, getAuthorInitials, formatRelativeTime } from "../../features/history";
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
  const avatar = getAuthorAvatarStyle(line.author_name);
  const initials = getAuthorInitials(line.author_name);

  return (
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
