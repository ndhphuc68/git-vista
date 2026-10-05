import clsx from "clsx";
import { useTranslation } from "../../../i18n";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import { formatExactDateTime, formatShortDateTime } from "../model/commitDetails";
import { AuthorAvatar } from "./AuthorAvatar";
import { CommitGraphBranchPills } from "./CommitGraphBranchPills";

interface CommitGraphCommitRowSummaryProps {
  commit: GraphCommitNode;
  isSelected: boolean;
  isFirstRow?: boolean;
  onCheckoutBranch?: (branchName: string) => void;
}

/** Columns 2-5 of a commit row: message (with inline branch pills), author, date and short SHA. */
export function CommitGraphCommitRowSummary({
  commit,
  isSelected,
  isFirstRow,
  onCheckoutBranch,
}: CommitGraphCommitRowSummaryProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Col 2: Commit Message + Inline Branch/Tag Badges */}
      <div className="flex-1 min-w-0 flex items-center gap-2 pl-2">
        <CommitGraphBranchPills
          refs={commit.refs}
          isFirstRow={isFirstRow}
          onCheckout={onCheckoutBranch}
        />
        <span
          className={clsx(
            "whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-xs",
            isSelected
              ? "font-semibold text-link"
              : "font-normal text-primary group-hover:text-link transition-colors"
          )}
        >
          {commit.summary}
        </span>
      </div>

      {/* Col 3: Avatar, author name, then email. Left-aligned so every name
          starts on the same edge; the email takes whatever width is left. */}
      <div
        title={commit.author_email ? `${commit.author_name} <${commit.author_email}>` : undefined}
        className="w-64 shrink-0 min-w-0 flex items-center gap-2 pl-3 pr-2 text-xs whitespace-nowrap"
      >
        <AuthorAvatar
          name={commit.author_name}
          email={commit.author_email}
          size={18}
          className="text-[8px]"
        />
        <span className="shrink-0 max-w-[55%] truncate text-primary font-medium">
          {commit.author_name}
        </span>
        {commit.author_email && (
          <span className="min-w-0 truncate text-tertiary text-[11px]">{commit.author_email}</span>
        )}
      </div>

      {/* Col 4: Commit date */}
      <span
        title={formatExactDateTime(commit.timestamp_sec)}
        className="w-32 shrink-0 pl-2 text-secondary font-mono tabular-nums text-[11px] whitespace-nowrap"
      >
        {formatShortDateTime(commit.timestamp_sec)}
      </span>

      {/* Col 5: Short SHA */}
      <div className="w-24 text-right pr-3 shrink-0">
        <span
          title={`${t.graph.columns.sha}: ${commit.id}`}
          className="font-mono font-bold text-link dark:text-link text-xs px-1.5 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border-subtle shadow-2xs inline-block"
        >
          {commit.short_id}
        </span>
      </div>
    </>
  );
}
