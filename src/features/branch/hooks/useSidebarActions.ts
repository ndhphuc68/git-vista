import { useQueryClient } from "@tanstack/react-query";
import type { StashItem } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { qk } from "../../../domain/queryKeys";
import { useCheckoutTag, usePushTag } from "../../tag";
import { useApplyStash, usePopStash, useDropStash } from "../../stash";
import { useMergeBranch, useRebaseBranch } from "../../merge";
import { useUndoDropStash } from "../../undo";
import { createStashActionHandlers, createTagActionHandlers } from "./useSidebarActions.actions";

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

  const { applyStash, popStash, dropStash } = createStashActionHandlers({
    stashes,
    closeStashPanel,
    apply,
    pop,
    drop,
    undoDrop,
  });
  const { checkoutTag, pushTag } = createTagActionHandlers({ t, closeMenu, checkout, push });

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
