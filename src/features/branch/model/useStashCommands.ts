/**
 * The stash commands the branch sidebar runs: apply, pop and drop.
 *
 * These belong to the stash domain, not the branch one. They live here only
 * because the sidebar still owns the stash list; they move to features/stash
 * when that feature lands, and this file goes away with them. The IPC calls
 * are kept verbatim for that reason — this is a lift, not a rewrite.
 */
import { useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { type StashItem } from "../../../ipc/bindings.generated";

export interface StashCommands {
  applyStash: (index: number) => Promise<void>;
  popStash: (index: number) => Promise<void>;
  dropStash: (index: number) => Promise<void>;
}

export function useStashCommands(
  repoPath: string,
  stashes: StashItem[],
  onStashGone: () => void
): StashCommands {
  const queryClient = useQueryClient();

  const invalidateStashes = () => {
    queryClient.invalidateQueries({ queryKey: qk.stashes(repoPath) });
  };

  const applyStash = async (index: number) => {
    try {
      await invokeCommand.applyStash(repoPath, index);
      invalidateStashes();
      // Fixed bug: this used a camelCase key mismatched with ["repo_status", ...];
      // now both use the shared qk.repo.status.
      queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
    } catch (err: unknown) {
      alert(`Khong the ap dung stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const popStash = async (index: number) => {
    try {
      await invokeCommand.popStash(repoPath, index);
      invalidateStashes();
      // Fixed bug: this used a camelCase key mismatched with ["repo_status", ...];
      // now both use the shared qk.repo.status.
      queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
      onStashGone();
    } catch (err: unknown) {
      alert(`Khong the pop stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const dropStash = async (index: number) => {
    if (!window.confirm("Xoa stash nay?")) return;
    const stashToDrop = stashes[index];
    try {
      const receipt = await invokeCommand.dropStash(repoPath, index);
      invalidateStashes();
      onStashGone();
      if (stashToDrop) {
        useToastStore.getState().showToast({
          message: `Đã xoá stash@{${index}}`,
          type: "success",
          durationMs: 10000,
          undoAction: async () => {
            await invokeCommand.undoDropStash(repoPath, receipt);
            invalidateStashes();
          },
        });
      }
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  return { applyStash, popStash, dropStash };
}
