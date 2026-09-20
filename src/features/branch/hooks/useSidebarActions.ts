import { useQueryClient } from "@tanstack/react-query";
import type { StashItem, TagItem } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { qk } from "../../../domain/queryKeys";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { useCheckoutTag, usePushTag } from "../../tag/api";
import { useApplyStash, usePopStash, useDropStash } from "../../stash/api";
import { useMergeBranch, useRebaseBranch } from "../../merge";
import { useUndoDropStash } from "../../undo";

interface SidebarActionsOptions {
  repoPath: string;
  stashes: StashItem[];
  closeStashPanel: () => void;
  closeMenu: () => void;
}

/** Sidebar policy lives here; domain hooks own commands and invalidation. */
export function useSidebarActions({
  repoPath,
  stashes,
  closeStashPanel,
  closeMenu,
}: SidebarActionsOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const checkout = useCheckoutTag(repoPath);
  const push = usePushTag(repoPath);
  const apply = useApplyStash(repoPath);
  const pop = usePopStash(repoPath);
  const drop = useDropStash(repoPath);
  const undoDrop = useUndoDropStash(repoPath);
  const merge = useMergeBranch(repoPath);
  const rebase = useRebaseBranch(repoPath);

  const applyStash = async (index: number) => {
    try {
      await apply.mutateAsync({ index });
    } catch (err: unknown) {
      alert(`Khong the ap dung stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const popStash = async (index: number) => {
    try {
      await pop.mutateAsync({ index });
      closeStashPanel();
    } catch (err: unknown) {
      alert(`Khong the pop stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const dropStash = async (index: number) => {
    if (!window.confirm("Xoa stash nay?")) return;
    const stashToDrop = stashes[index];
    try {
      const receipt = await drop.mutateAsync({ index });
      closeStashPanel();
      if (stashToDrop) {
        useToastStore.getState().showToast({
          message: `Đã xoá stash@{${index}}`,
          type: "success",
          durationMs: 10000,
          undoAction: () => undoDrop.mutateAsync({ receipt }),
        });
      }
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };
  const checkoutTag = async (tag: TagItem) => {
    closeMenu();
    try {
      await checkout.mutateAsync({ name: tag.name });
      useToastStore.getState().showToast({
        message: t.sidebar.checkoutTagSuccess.replace("{name}", tag.name),
        type: "success",
      });
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };
  const pushTag = async (tag: TagItem) => {
    closeMenu();
    try {
      await push.mutateAsync({ name: tag.name });
      useToastStore.getState().showToast({
        message: t.sidebar.pushTagSuccess.replace("{name}", tag.name),
        type: "success",
      });
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };
  // Existing branch dialogs also call this after completing their operation.
  const invalidateRepo = () => {
    queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.repo.head(repoPath) });
  };
  return {
    applyStash,
    popStash,
    dropStash,
    checkoutTag,
    pushTag,
    invalidateRepo,
    mergeBranch: (targetBranch: string, noFf: boolean) => merge.mutateAsync({ targetBranch, noFf }),
    rebaseBranch: (upstreamBranch: string) => rebase.mutateAsync({ upstreamBranch }),
  };
}
