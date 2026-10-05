import { undoDeleteBranch } from "../../undo";
import { useToastStore } from "../../../store/useToastStore";
import type { Translations } from "../../../i18n/vi";

/** Success toast for a deleted branch, with an undo action that restores it from its backup ref. */
export function showDeleteBranchUndoToast(
  repoPath: string,
  branchName: string,
  backupRef: string,
  t: Translations
): void {
  useToastStore.getState().showToast({
    message: t.modals.deleteBranch.successToast.replace("{name}", branchName),
    type: "success",
    durationMs: 10000,
    undoAction: async () => {
      await undoDeleteBranch(repoPath, branchName, backupRef);
    },
  });
}
