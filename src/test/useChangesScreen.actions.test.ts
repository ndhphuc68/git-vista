import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { qk } from "../domain/queryKeys";
import { useToastStore } from "../store/useToastStore";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    stageFile: vi.fn().mockResolvedValue(undefined),
    unstageFile: vi.fn().mockResolvedValue(undefined),
    stageAll: vi.fn().mockResolvedValue(undefined),
    unstageAll: vi.fn().mockResolvedValue(undefined),
    discardFileChanges: vi.fn().mockResolvedValue("discard-token"),
    restoreDiscard: vi.fn().mockResolvedValue(undefined),
    stageHunk: vi.fn().mockResolvedValue(undefined),
    stageLines: vi.fn().mockResolvedValue(undefined),
    createCommit: vi.fn().mockResolvedValue({ id: "commit-1" }),
  },
}));

import {
  createStageFileHandler,
  createStageAllHandler,
  createDiscardFileHandler,
  createStageHunkHandler,
  createCommitHandler,
} from "../components/changes/useChangesScreen.actions";
import { invokeCommand } from "../ipc/client";

const REPO = "/test/repo";

describe("useChangesScreen action factories", () => {
  let queryClient: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.setState({ toasts: [] });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  });

  it("createStageFileHandler stages, then selects, then invalidates qk.repo.all in order", async () => {
    const setSelectedFile = vi.fn();
    const callOrder: string[] = [];
    vi.mocked(invokeCommand.stageFile).mockImplementationOnce(async () => {
      callOrder.push("stage");
    });
    setSelectedFile.mockImplementation(() => callOrder.push("select"));
    invalidateSpy.mockImplementationOnce(async (...args: unknown[]) => {
      callOrder.push("invalidate");
      return QueryClient.prototype.invalidateQueries.apply(queryClient, args as never);
    });

    const handler = createStageFileHandler({ repoPath: REPO, setSelectedFile, queryClient });
    await handler("src/a.ts");

    expect(invokeCommand.stageFile).toHaveBeenCalledWith(REPO, "src/a.ts");
    expect(setSelectedFile).toHaveBeenCalledWith({ path: "src/a.ts", is_staged: true });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
    expect(callOrder).toEqual(["stage", "select", "invalidate"]);
  });

  it("createStageAllHandler invalidates qk.repo.all after staging all", async () => {
    const handler = createStageAllHandler({ repoPath: REPO, queryClient });
    await handler();

    expect(invokeCommand.stageAll).toHaveBeenCalledWith(REPO);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("createStageHunkHandler is a no-op without a selected file", async () => {
    const handler = createStageHunkHandler({ repoPath: REPO, selectedFile: null, queryClient });
    await handler(0);

    expect(invokeCommand.stageHunk).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("createStageHunkHandler stages the hunk of the selected file and invalidates", async () => {
    const handler = createStageHunkHandler({
      repoPath: REPO,
      selectedFile: { path: "src/a.ts", is_staged: false },
      queryClient,
    });
    await handler(2);

    expect(invokeCommand.stageHunk).toHaveBeenCalledWith(REPO, "src/a.ts", 2, false);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("createCommitHandler invalidates after commit and returns the created commit", async () => {
    const handler = createCommitHandler({ repoPath: REPO, queryClient });
    const result = await handler("feat: x", "body", false);

    expect(invokeCommand.createCommit).toHaveBeenCalledWith(REPO, "feat: x", "body", false);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
    expect(result).toEqual({ id: "commit-1" });
  });

  it("createDiscardFileHandler shows an undo toast and invalidates once immediately", async () => {
    const t = { discard: { success: "Đã huỷ thay đổi {path}" } } as never;
    const handler = createDiscardFileHandler({ repoPath: REPO, t, queryClient });
    await handler("src/a.ts");

    expect(invokeCommand.discardFileChanges).toHaveBeenCalledWith(REPO, "src/a.ts");
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });

    const toast = useToastStore.getState().toasts.at(-1);
    expect(toast?.undoAction).toBeTypeOf("function");

    await toast!.undoAction!();

    expect(invokeCommand.restoreDiscard).toHaveBeenCalledWith(REPO, "discard-token");
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("createDiscardFileHandler shows an error toast and does not invalidate on failure", async () => {
    vi.mocked(invokeCommand.discardFileChanges).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const t = { discard: { success: "Đã huỷ thay đổi {path}" } } as never;
    const handler = createDiscardFileHandler({ repoPath: REPO, t, queryClient });
    await handler("src/missing.ts");

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts.some((toast) => toast.type === "error")).toBe(true);
  });
});
