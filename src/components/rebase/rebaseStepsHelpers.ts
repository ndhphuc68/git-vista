import type { RebaseCommitItem, RebasePlanStep } from "../../ipc/bindings.generated";
import { REBASE_ACTION } from "../../domain/enums";

// Exported for unit testing only.
export function commitsToPickSteps(commits: RebaseCommitItem[]): RebasePlanStep[] {
  return commits.map((c) => ({
    commit_id: c.id,
    action: REBASE_ACTION.PICK,
    new_message: null,
  }));
}

// Exported for unit testing only.
export function buildCommitMap(commits: RebaseCommitItem[]): Map<string, RebaseCommitItem> {
  const map = new Map<string, RebaseCommitItem>();
  for (const c of commits) {
    map.set(c.id, c);
  }
  return map;
}

// Exported for unit testing only.
// The first non-dropped step cannot be Squash or Fixup (nothing precedes it to
// squash/fixup into), so it is coerced back to Pick.
export function sanitizeFirstAction(updatedSteps: RebasePlanStep[]): RebasePlanStep[] {
  if (updatedSteps.length === 0) return updatedSteps;
  const firstNonDroppedIdx = updatedSteps.findIndex((s) => s.action !== REBASE_ACTION.DROP);
  if (
    firstNonDroppedIdx !== -1 &&
    (updatedSteps[firstNonDroppedIdx]!.action === REBASE_ACTION.SQUASH ||
      updatedSteps[firstNonDroppedIdx]!.action === REBASE_ACTION.FIXUP)
  ) {
    const copy = [...updatedSteps];
    copy[firstNonDroppedIdx] = {
      ...copy[firstNonDroppedIdx]!,
      action: REBASE_ACTION.PICK,
    };
    return copy;
  }
  return updatedSteps;
}
