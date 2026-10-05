import type { RebaseActionKind } from "../../ipc/bindings.generated";
import { REBASE_ACTION } from "../../domain/enums";

// Exported for unit testing only.
export function getRebaseActionColor(action: RebaseActionKind, isSelected: boolean): string {
  if (!isSelected) {
    return "text-secondary hover:text-primary hover:bg-surface-hover border-transparent";
  }
  switch (action) {
    case REBASE_ACTION.PICK:
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-xs";
    case REBASE_ACTION.REWORD:
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-semibold shadow-xs";
    case REBASE_ACTION.SQUASH:
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold shadow-xs";
    case REBASE_ACTION.FIXUP:
      return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold shadow-xs";
    case REBASE_ACTION.DROP:
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold shadow-xs";
  }
}
