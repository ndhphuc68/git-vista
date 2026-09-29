import clsx from "clsx";
import { useTranslation } from "../../../i18n";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import {
  formatExactDateTime,
  formatShortDateTime,
  getAuthorAvatarStyle,
  getAuthorInitials,
} from "../model/commitDetails";

interface CommitGraphCommitRowSummaryProps {
  commit: GraphCommitNode;
  isSelected: boolean;
}

/** Columns 3-6 of a commit row: message, author, date and short SHA. */
export function CommitGraphCommitRowSummary({
  commit,
  isSelected,
}: CommitGraphCommitRowSummaryProps) {
  const { t } = useTranslation();
  const avatarStyle = getAuthorAvatarStyle(commit.author_name);
  return (
    <>
      {/* Col 3: Commit Message */}
      <div className="flex-1 min-w-0 flex items-center gap-2 pl-2">
        <span
          className={clsx(
            "whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-xs",
            isSelected
              ? "font-semibold text-accent"
              : "font-normal text-primary group-hover:text-accent transition-colors"
          )}
        >
          {commit.summary}
        </span>
      </div>

      {/* Col 4: Avatar, author name, then email. Left-aligned so every name
          starts on the same edge; the email takes whatever width is left. */}
      <div
        title={commit.author_email ? `${commit.author_name} <${commit.author_email}>` : undefined}
        className="w-64 shrink-0 min-w-0 flex items-center gap-2 pl-3 pr-2 text-xs whitespace-nowrap"
      >
        <span
          aria-hidden="true"
          className={clsx(
            "w-4.5 h-4.5 shrink-0 rounded-full flex items-center justify-center text-[8px] font-bold select-none",
            avatarStyle.bg
          )}
        >
          {getAuthorInitials(commit.author_name)}
        </span>
        <span className="shrink-0 max-w-[55%] truncate text-primary font-medium">
          {commit.author_name}
        </span>
        {commit.author_email && (
          <span className="min-w-0 truncate text-tertiary text-[11px]">{commit.author_email}</span>
        )}
      </div>

      {/* Col 5: Commit date */}
      <span
        title={formatExactDateTime(commit.timestamp_sec)}
        className="w-32 shrink-0 pl-2 text-secondary font-mono tabular-nums text-[11px] whitespace-nowrap"
      >
        {formatShortDateTime(commit.timestamp_sec)}
      </span>

      {/* Col 6: Short SHA */}
      <div className="w-24 text-right pr-3 shrink-0">
        <span
          title={`${t.graph.columns.sha}: ${commit.id}`}
          className="font-mono font-bold text-accent dark:text-accent text-xs px-1.5 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border-subtle shadow-2xs inline-block"
        >
          {commit.short_id}
        </span>
      </div>
    </>
  );
}
