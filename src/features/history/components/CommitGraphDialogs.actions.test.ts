import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createCommitActionSuccessHandler } from "./CommitGraphDialogs.actions";
import { useToastStore } from "../../../store/useToastStore";
import { qk } from "../../../domain/queryKeys";

const REPO_PATH = "/repo/path";

function makeContext(
  overrides: Partial<Parameters<typeof createCommitActionSuccessHandler>[0]> = {}
) {
  const queryClient = new QueryClient();
  const onClose = vi.fn();
  const setActiveScreen = vi.fn();
  const undoCommit = vi.fn().mockResolvedValue(undefined);
  const handler = createCommitActionSuccessHandler({
    queryClient,
    repoPath: REPO_PATH,
    onClose,
    setActiveScreen,
    undoCommit,
    messages: {
      successToast: (shortId) => `Committed ${shortId}`,
      stagedToast: "Staged toast",
      conflictToast: "Conflict toast",
      undoLabel: "Undo",
      ...overrides.messages,
    },
    ...overrides,
  });
  return { handler, queryClient, onClose, setActiveScreen, undoCommit };
}

describe("createCommitActionSuccessHandler", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("invalidates graph/status/head/branches and shows an undoable success toast on Committed", async () => {
    const { handler, queryClient, onClose, undoCommit } = makeContext();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    handler(
      {
        success: true,
        status: "Committed",
        undo_token: "undo-token-1",
        new_commit_id: "new-id",
        output: "ok",
      },
      "abc1234"
    );

    expect(onClose).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.commitGraph(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.head(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.branches(REPO_PATH) });

    const toast = useToastStore.getState().toasts[0]!;
    expect(toast.type).toBe("success");
    expect(toast.message).toBe("Committed abc1234");
    expect(toast.undoAction).toBeDefined();

    await toast.undoAction!();
    expect(undoCommit).toHaveBeenCalledWith("undo-token-1");
  });

  it("shows a plain success toast with no undo action when there is no undo token", () => {
    const { handler } = makeContext();
    handler(
      { success: true, status: "Committed", undo_token: null, new_commit_id: "id", output: "ok" },
      "abc1234"
    );
    const toast = useToastStore.getState().toasts[0]!;
    expect(toast.undoAction).toBeUndefined();
  });

  it("invalidates only status and navigates to changes on Staged", () => {
    const { handler, queryClient, setActiveScreen } = makeContext();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    handler(
      { success: true, status: "Staged", undo_token: null, new_commit_id: null, output: "ok" },
      "abc1234"
    );

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(setActiveScreen).toHaveBeenCalledWith("changes");
    const toast = useToastStore.getState().toasts[0]!;
    expect(toast.type).toBe("info");
    expect(toast.message).toBe("Staged toast");
  });

  it("invalidates status and state and navigates to changes on Conflict", () => {
    const { handler, queryClient, setActiveScreen } = makeContext();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    handler(
      { success: false, status: "Conflict", undo_token: null, new_commit_id: null, output: "x" },
      "abc1234"
    );

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.state(REPO_PATH) });
    expect(setActiveScreen).toHaveBeenCalledWith("changes");
    const toast = useToastStore.getState().toasts[0]!;
    expect(toast.type).toBe("error");
    expect(toast.message).toBe("Conflict toast");
  });

  it("does nothing beyond closing for an unrecognized status", () => {
    const { handler, queryClient, setActiveScreen } = makeContext();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    handler(
      { success: false, status: "Error", undo_token: null, new_commit_id: null, output: "x" },
      "abc1234"
    );

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(setActiveScreen).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
