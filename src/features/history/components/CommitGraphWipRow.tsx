import { useTranslation } from "../../../i18n";

interface CommitGraphWipRowProps {
  modifiedCount: number;
  untrackedCount: number;
  onShowChanges: () => void;
}

/** Row 0: working directory changes (WIP), shown above the commit list when present. */
export function CommitGraphWipRow({
  modifiedCount,
  untrackedCount,
  onShowChanges,
}: CommitGraphWipRowProps) {
  const { t } = useTranslation();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onShowChanges()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onShowChanges();
        }
      }}
      aria-label={t.graph.wipChanges}
      className="flex items-center px-3 h-8 bg-amber-50/50 dark:bg-amber-950/25 hover:bg-amber-100/60 dark:hover:bg-amber-950/45 border-b border-border-subtle cursor-pointer transition-colors group shrink-0"
    >
      <div className="w-32 shrink-0 flex items-center">
        <svg width="128" height="32" className="overflow-visible">
          <line
            x1="16"
            y1="16"
            x2="16"
            y2="32"
            stroke="#0284C7"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <circle
            cx="16"
            cy="16"
            r="6"
            className="fill-surface stroke-[#0284C7]"
            strokeWidth="2"
            strokeDasharray="2.5,2.5"
          />
          <circle cx="16" cy="16" r="2.5" fill="#0284C7" />
        </svg>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0 pl-2">
        <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-1.5 py-0.5 rounded shrink-0">
          // WIP
        </span>
        <span className="font-semibold text-primary truncate text-xs group-hover:text-accent transition-colors">
          {t.graph.wipChanges}
        </span>
        <div className="flex items-center gap-1.5 font-mono text-[10.5px] shrink-0">
          {modifiedCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              ✏️ {t.graph.modifiedCount.replace("{n}", String(modifiedCount))}
            </span>
          )}
          {untrackedCount > 0 && (
            <span className="text-diff-add-text font-semibold">
              + {t.graph.untrackedCount.replace("{n}", String(untrackedCount))}
            </span>
          )}
        </div>
      </div>

      <div className="w-64 shrink-0"></div>
      <div className="w-32 shrink-0 pl-2 text-secondary font-mono text-[11px]">
        <span className="px-1.5 py-0.5 rounded bg-window text-secondary font-medium">
          {t.graph.justNow}
        </span>
      </div>
      <div className="w-24 shrink-0"></div>
    </div>
  );
}
