import type { StashItem, TagItem } from "../../../ipc/bindings.generated";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import type { Translations } from "../../../i18n/vi";
import type { useApplyStash, useDropStash, usePopStash } from "../../stash";
import type { useCheckoutTag, usePushTag } from "../../tag";
import type { useUndoDropStash } from "../../undo";

export interface SidebarStashContext {
  stashes: StashItem[];
  closeStashPanel: () => void;
  apply: ReturnType<typeof useApplyStash>;
  pop: ReturnType<typeof usePopStash>;
  drop: ReturnType<typeof useDropStash>;
  undoDrop: ReturnType<typeof useUndoDropStash>;
}

/** Wraps the stash mutations with the sidebar's confirm/alert/toast policy. */
export function createStashActionHandlers(context: SidebarStashContext) {
  const { stashes, closeStashPanel, apply, pop, drop, undoDrop } = context;

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
          undoAction: undoDrop.createUndoAction(receipt),
        });
      }
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  return { applyStash, popStash, dropStash };
}

export interface SidebarTagContext {
  t: Translations;
  closeMenu: () => void;
  checkout: ReturnType<typeof useCheckoutTag>;
  push: ReturnType<typeof usePushTag>;
}

/** Wraps the tag mutations with the sidebar's menu-close/toast policy. */
export function createTagActionHandlers(context: SidebarTagContext) {
  const { t, closeMenu, checkout, push } = context;

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

  return { checkoutTag, pushTag };
}
