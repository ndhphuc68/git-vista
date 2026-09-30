import clsx from "clsx";
import { GitBranch, Tag, Globe } from "lucide-react";
import type { GraphCommitNode, RefBadge } from "../../../ipc/bindings.generated";
import { getBranchPillStyle } from "../model/graphPresentation";
import { useTranslation } from "../../../i18n";

export interface CommitGraphBranchPillsProps {
  refs: GraphCommitNode["refs"];
  isFirstRow?: boolean;
}

interface BranchPillPopoverRowProps {
  refBadge: RefBadge;
  headBadgeText: string;
}

function BranchPillPopoverRow({ refBadge, headBadgeText }: BranchPillPopoverRowProps) {
  const isHead = refBadge.ref_type === "head";
  const isTag = refBadge.ref_type === "tag";
  const isRemote = refBadge.ref_type === "remote";
  const style = getBranchPillStyle(refBadge.name, isHead, isTag);

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 min-w-0">
      {isHead ? (
        <GitBranch size={11} className="shrink-0 text-accent" />
      ) : isTag ? (
        <Tag size={11} className="shrink-0 text-amber-400" />
      ) : isRemote ? (
        <Globe size={11} className="shrink-0 text-sky-400" />
      ) : (
        <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
      )}
      <span className="truncate flex-1 text-slate-200">{refBadge.name}</span>
      {isHead && (
        <span className="text-[8.5px] px-1 bg-accent/30 text-accent-contrast rounded font-bold shrink-0">
          {headBadgeText}
        </span>
      )}
      {isTag && (
        <span className="text-[8.5px] px-1 bg-amber-500/20 text-amber-300 rounded font-medium shrink-0">
          tag
        </span>
      )}
      {isRemote && (
        <span className="text-[8.5px] px-1 bg-sky-500/20 text-sky-300 rounded font-medium shrink-0">
          remote
        </span>
      )}
    </div>
  );
}

interface BranchPillListPopoverProps {
  sortedRefs: RefBadge[];
  isFirstRow: boolean;
  title: string;
  headBadgeText: string;
}

function BranchPillListPopover({
  sortedRefs,
  isFirstRow,
  title,
  headBadgeText,
}: BranchPillListPopoverProps) {
  return (
    <div
      className={clsx(
        "absolute left-0 hidden group-hover/pills:flex flex-col gap-1 p-2 bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] font-mono rounded-lg shadow-xl z-50 pointer-events-none border border-slate-700/60 animate-fade-in min-w-[180px] max-w-[320px] backdrop-blur-xs",
        isFirstRow ? "top-full mt-1.5" : "bottom-full mb-1.5"
      )}
    >
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1 pb-1 border-b border-slate-700/50 flex items-center justify-between">
        <span>{title}</span>
        <span>{sortedRefs.length}</span>
      </div>
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pt-0.5">
        {sortedRefs.map((r, idx) => (
          <BranchPillPopoverRow key={idx} refBadge={r} headBadgeText={headBadgeText} />
        ))}
      </div>
    </div>
  );
}

function sortRefs(refs: RefBadge[]): RefBadge[] {
  return [...refs].sort((a, b) => {
    const priority = (type: string) => {
      if (type === "head") return 0;
      if (type === "tag") return 1;
      if (type === "local") return 2;
      return 3;
    };
    return priority(a.ref_type) - priority(b.ref_type);
  });
}

/** Inline branch/tag pill(s) and a vertical list popover for multi-ref commits. */
export function CommitGraphBranchPills({ refs, isFirstRow = false }: CommitGraphBranchPillsProps) {
  const { t } = useTranslation();

  if (!refs || refs.length === 0) {
    return null;
  }

  const sortedRefs = sortRefs(refs);
  const primaryRef = sortedRefs[0]!;
  const isPrimaryHead = primaryRef.ref_type === "head";
  const isPrimaryTag = primaryRef.ref_type === "tag";
  const isPrimaryRemote = primaryRef.ref_type === "remote";
  const primaryStyle = getBranchPillStyle(primaryRef.name, isPrimaryHead, isPrimaryTag);
  const remainingCount = sortedRefs.length - 1;

  return (
    <div className="relative group/pills inline-flex items-center gap-1.5 shrink-0 min-w-0">
      <div
        title={primaryRef.name}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono border shadow-2xs cursor-pointer transition-all hover:brightness-95 hover:shadow-xs min-w-0 max-w-[130px]",
          primaryStyle.container
        )}
      >
        {isPrimaryHead ? (
          <GitBranch size={10.5} className="shrink-0 text-white" />
        ) : isPrimaryTag ? (
          <Tag size={10.5} className="shrink-0 text-amber-700 dark:text-amber-300" />
        ) : isPrimaryRemote ? (
          <Globe size={10.5} className="shrink-0 opacity-80" />
        ) : (
          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", primaryStyle.dot)} />
        )}
        <span className="truncate min-w-0">{primaryRef.name}</span>
        {isPrimaryHead && (
          <span className="text-[8.5px] px-1 bg-white/25 rounded font-bold ml-0.5 shrink-0">
            {t.graph.headBadge}
          </span>
        )}
      </div>

      {remainingCount > 0 && (
        <div
          title={`${remainingCount} more`}
          className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border-strong text-secondary shrink-0 cursor-pointer"
        >
          +{remainingCount}
        </div>
      )}

      <BranchPillListPopover
        sortedRefs={sortedRefs}
        isFirstRow={isFirstRow}
        title={t.graph.columns.branchTag}
        headBadgeText={t.graph.headBadge}
      />
    </div>
  );
}
