import clsx from "clsx";
import { useTranslation } from "../../../i18n";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";

interface CommitGraphCommitRowSummaryProps {
  commit: GraphCommitNode;
  isSelected: boolean;
}

/** Columns 3-5 of a commit row: message, author and short SHA. */
export function CommitGraphCommitRowSummary({
  commit,
  isSelected,
}: CommitGraphCommitRowSummaryProps) {
  const { t } = useTranslation();
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

      {/* Col 4: Author */}
      <span
        title={commit.author_name}
        className="w-36 text-right pr-2 text-primary font-semibold text-xs whitespace-nowrap truncate shrink-0"
      >
        {commit.author_name}
      </span>

      {/* Col 5: Short SHA */}
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
