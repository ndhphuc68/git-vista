import { useDeleteBranch } from "../api";
import { isDialog, type SidebarDialog } from "../model/sidebarDialog";
import { showDeleteBranchUndoToast } from "./deleteBranchToast";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { mapGitError } from "../../../utils/errorMapping";
import { toErrorMessage } from "../../../shared/utils/toError";

/**
 * Wraps the sidebar's `setDialog` so that, with the delete-branch confirmation
 * turned off in settings, a delete request runs straight away instead of
 * opening the dialog. An unmerged branch still opens the dialog in its
 * unmerged state, so a force delete is always confirmed.
 */
export function useDeleteBranchRequest(
  repoPath: string,
  setDialog: (dialog: SidebarDialog) => void
): (dialog: SidebarDialog) => void {
  const { t } = useTranslation();
  const deleteBranch = useDeleteBranch(repoPath);
  const confirmDeleteBranch = useSettingsStore((s) => s.confirmDeleteBranch);

  const deleteDirectly = async (name: string) => {
    try {
      const backupRef = await deleteBranch.mutateAsync({ name, force: false });
      showDeleteBranchUndoToast(repoPath, name, backupRef, t);
    } catch (err: unknown) {
      if (toErrorMessage(err).includes("UNMERGED_BRANCH")) {
        setDialog({ kind: "deleteBranch", name, unmerged: true });
      } else {
        useToastStore.getState().showError(mapGitError(err, t));
      }
    }
  };

  return (dialog: SidebarDialog) => {
    if (isDialog(dialog, "deleteBranch") && !dialog.unmerged && !confirmDeleteBranch) {
      void deleteDirectly(dialog.name);
      return;
    }
    setDialog(dialog);
  };
}
