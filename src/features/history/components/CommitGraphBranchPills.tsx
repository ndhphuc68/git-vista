import clsx from "clsx";
import { GitBranch, Tag } from "lucide-react";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import { getBranchPillStyle } from "../model/graphPresentation";
import { useTranslation } from "../../../i18n";

interface CommitGraphBranchPillsProps {
  refs: GraphCommitNode["refs"];
  isFirstRow: boolean;
}

/** Column 1 of a commit row: branch/tag pills, an overflow badge, and their hover tooltips. */
export function CommitGraphBranchPills({ refs, isFirstRow }: CommitGraphBranchPillsProps) {
  const { t } = useTranslation();
  const displayedRefs = refs.slice(0, 2);
  const remainingCount = refs.length - displayedRefs.length;

  return (
    <div className="w-80 shrink-0 pr-2 flex items-center justify-end overflow-visible gap-1.5 min-w-0">
      {displayedRefs.map((r, i) => {
        const isHeadRef = r.ref_type === "head";
        const isTagRef = r.ref_type === "tag";
        const style = getBranchPillStyle(r.name, isHeadRef, isTagRef);

        return (
          <div key={i} className="relative group/pill min-w-0 shrink max-w-[190px]">
            <div
              title={r.name}
              className={clsx(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono border shadow-2xs cursor-pointer transition-all hover:brightness-95 hover:shadow-xs min-w-0",
                style.container
              )}
            >
              {isHeadRef ? (
                <GitBranch size={10.5} className="shrink-0 text-white" />
              ) : isTagRef ? (
                <Tag size={10.5} className="shrink-0 text-amber-700 dark:text-amber-300" />
              ) : (
                <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
              )}
              <span className="truncate min-w-0">{r.name}</span>
              {isHeadRef && (
                <span className="text-[8.5px] px-1 bg-white/25 rounded font-bold ml-0.5 shrink-0">
                  {t.graph.headBadge}
                </span>
              )}
            </div>

            {/* Hover floating tooltip displaying full branch name */}
            <div
              className={clsx(
                "absolute left-0 hidden group-hover/pill:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-mono rounded-md shadow-xl z-50 pointer-events-none whitespace-nowrap border border-slate-700/60 animate-fade-in",
                isFirstRow ? "top-full mt-1.5" : "bottom-full mb-1.5"
              )}
            >
              <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
              <span>{r.name}</span>
            </div>
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div
          title={refs
            .slice(2)
            .map((r) => r.name)
            .join(", ")}
          className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border-strong text-secondary shrink-0 cursor-help"
        >
          +{remainingCount}
        </div>
      )}
      {refs.length > 0 && <span className="w-2.5 h-[1.5px] bg-border-strong ml-0.5 shrink-0" />}
    </div>
  );
}
