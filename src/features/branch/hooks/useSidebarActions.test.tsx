import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeCommand } from "../../../ipc/client";
import type { StashItem, TagItem } from "../../../ipc/bindings.generated";
import { useToastStore } from "../../../store/useToastStore";
import { qk } from "../../../domain/queryKeys";
import { useSidebarActions } from "./useSidebarActions";

const REPO = "d:/project-v3";
const stash: StashItem = {
  index: 0,
  message: "Saved work",
  commit_id: "stash-commit",
  created_at: 1700000000,
};
const tag: TagItem = {
  name: "v1.0.0",
  target_commit_id: "tag-commit",
  short_commit_id: "tag-com",
  commit_summary: "Release",
  is_annotated: false,
  message: null,
  tagger_name: null,
  tagger_email: null,
  timestamp_sec: null,
};

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const closeStashPanel = vi.fn();
  const closeMenu = vi.fn();
  const { result } = renderHook(
    () => useSidebarActions({ repoPath: REPO, stashes: [stash], closeStashPanel, closeMenu }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
  return { result, client, closeStashPanel, closeMenu };
}

describe("sidebar actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.getState().clearToasts();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it.each(["checkoutTag", "pushTag"] as const)(
    "%s closes the menu, uses owner invalidation and shows success",
    async (command) => {
      vi.spyOn(invokeCommand, command).mockResolvedValue(undefined);
      const { result, client, closeMenu } = setup();
      const invalidate = vi.spyOn(client, "invalidateQueries");
      await act(async () => {
        await result.current[command](tag);
      });
      expect(invokeCommand[command]).toHaveBeenCalledWith(
        REPO,
        tag.name,
        ...(command === "pushTag" ? [undefined] : [])
      );
      expect(closeMenu).toHaveBeenCalledOnce();
      expect(invalidate.mock.calls).toEqual([[{ queryKey: qk.repo.all(REPO) }]]);
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({ type: "success", message: expect.stringContaining(tag.name) }),
      ]);
    }
  );

  it.each(["checkoutTag", "pushTag"] as const)(
    "%s maps errors without a success toast or refresh",
    async (command) => {
      vi.spyOn(invokeCommand, command).mockRejectedValue(new Error("command failed"));
      const { result, client } = setup();
      const invalidate = vi.spyOn(client, "invalidateQueries");
      await act(async () => {
        await result.current[command](tag);
      });
      expect(invalidate).not.toHaveBeenCalled();
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({ type: "error", rawError: "command failed" }),
      ]);
    }
  );

  it("keeps drop confirmation, receipt and undo refresh together", async () => {
    vi.spyOn(invokeCommand, "dropStash").mockResolvedValue("drop-receipt");
    vi.spyOn(invokeCommand, "undoDropStash").mockResolvedValue(undefined);
    const { result, client, closeStashPanel } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await act(async () => {
      await result.current.dropStash(0);
    });
    expect(window.confirm).toHaveBeenCalledWith("Xoa stash nay?");
    expect(invokeCommand.dropStash).toHaveBeenCalledExactlyOnceWith(REPO, 0);
    expect(closeStashPanel).toHaveBeenCalledOnce();
    const toast = useToastStore.getState().toasts[0]!;
    expect(toast).toMatchObject({
      message: "Đã xoá stash@{0}",
      type: "success",
      durationMs: 10000,
    });
    invalidate.mockClear();
    await act(async () => {
      await toast.undoAction!();
    });
    expect(invokeCommand.undoDropStash).toHaveBeenCalledExactlyOnceWith(REPO, "drop-receipt");
    expect(invalidate.mock.calls).toEqual([[{ queryKey: qk.stashes(REPO) }]]);
  });

  it("leaves the selected stash and command untouched when drop is cancelled", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.spyOn(invokeCommand, "dropStash").mockResolvedValue("unused");
    const { result, closeStashPanel } = setup();
    await act(async () => {
      await result.current.dropStash(0);
    });
    expect(invokeCommand.dropStash).not.toHaveBeenCalled();
    expect(closeStashPanel).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("undoes a dropped stash in its original repository after switching repositories", async () => {
    vi.spyOn(invokeCommand, "dropStash").mockResolvedValue("original-repo-receipt");
    vi.spyOn(invokeCommand, "undoDropStash").mockResolvedValue(undefined);
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result, rerender } = renderHook(
      ({ repoPath }) =>
        useSidebarActions({
          repoPath,
          stashes: [stash],
          closeStashPanel: () => {},
          closeMenu: () => {},
        }),
      {
        initialProps: { repoPath: REPO },
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      }
    );

    await act(async () => {
      await result.current.dropStash(0);
    });
    const undoAction = useToastStore.getState().toasts[0]!.undoAction!;
    rerender({ repoPath: "d:/another-repository" });
    invalidate.mockClear();
    await act(async () => {
      await undoAction();
    });

    expect(invokeCommand.undoDropStash).toHaveBeenCalledExactlyOnceWith(
      REPO,
      "original-repo-receipt"
    );
    expect(invalidate.mock.calls).toEqual([[{ queryKey: qk.stashes(REPO) }]]);
  });

  it.each(["applyStash", "popStash"] as const)(
    "%s preserves selection and alert text on failure",
    async (command) => {
      vi.spyOn(invokeCommand, command).mockRejectedValue(new Error("stash failure"));
      const { result, closeStashPanel, client } = setup();
      const invalidate = vi.spyOn(client, "invalidateQueries");
      await act(async () => {
        await result.current[command](0);
      });
      expect(window.alert).toHaveBeenCalledWith(
        command === "applyStash"
          ? "Khong the ap dung stash: stash failure"
          : "Khong the pop stash: stash failure"
      );
      expect(closeStashPanel).not.toHaveBeenCalled();
      expect(invalidate).not.toHaveBeenCalled();
    }
  );

  it("preserves selection and reports a mapped error when dropping fails", async () => {
    vi.spyOn(invokeCommand, "dropStash").mockRejectedValue(new Error("drop failed"));
    const { result, closeStashPanel } = setup();
    await act(async () => {
      await result.current.dropStash(0);
    });
    expect(closeStashPanel).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ type: "error", rawError: "drop failed" }),
    ]);
    expect(useToastStore.getState().toasts[0]!.undoAction).toBeUndefined();
  });

  it("returns merge and rebase results for their dialogs", async () => {
    const mergeResult = { success: true, status: "Merged", output: "Merged topic" };
    const rebaseResult = { success: true, status: "Success", output: "Rebased onto main" };
    vi.spyOn(invokeCommand, "mergeBranch").mockResolvedValue(mergeResult);
    vi.spyOn(invokeCommand, "rebaseBranch").mockResolvedValue(rebaseResult);
    const { result } = setup();
    await act(async () => {
      expect(await result.current.mergeBranch("topic", true)).toEqual(mergeResult);
      expect(await result.current.rebaseBranch("main")).toEqual(rebaseResult);
    });
    expect(invokeCommand.mergeBranch).toHaveBeenCalledExactlyOnceWith(REPO, "topic", true);
    expect(invokeCommand.rebaseBranch).toHaveBeenCalledExactlyOnceWith(REPO, "main");
  });
});
