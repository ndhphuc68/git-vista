import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTranslation } from "../../../i18n";
import { createCloneCancelHandler, type CloneSubmitContext } from "./useCloneModalState.actions";
import { cancelRemoteTask } from "../api";

vi.mock("../api", () => ({
  cancelRemoteTask: vi.fn(),
  cloneRepo: vi.fn(),
  openRepository: vi.fn(),
  selectRepoFolder: vi.fn(),
}));

function context(): CloneSubmitContext {
  return {
    t: getTranslation("en"),
    url: "https://example.com/repo.git",
    targetDir: "/tmp/repo",
    isCloning: true,
    activeTaskIdRef: { current: "task-1" },
    setError: vi.fn(),
    setIsCloning: vi.fn(),
    setProgressPercent: vi.fn(),
    setStatusText: vi.fn(),
    onCloneSuccess: vi.fn(),
    onClose: vi.fn(),
  };
}

describe("createCloneCancelHandler", () => {
  beforeEach(() => {
    vi.mocked(cancelRemoteTask).mockReset();
  });

  it("stops the clone and reports the cancellation", async () => {
    vi.mocked(cancelRemoteTask).mockResolvedValue(undefined);
    const ctx = context();

    await createCloneCancelHandler(ctx)();

    expect(cancelRemoteTask).toHaveBeenCalledWith("task-1");
    expect(ctx.setIsCloning).toHaveBeenCalledWith(false);
    expect(ctx.setError).toHaveBeenCalledWith("Clone operation cancelled.");
  });

  it("keeps the clone running and shows the error when the cancel request fails", async () => {
    vi.mocked(cancelRemoteTask).mockRejectedValue({ type: "Git", message: "task not found" });
    const ctx = context();

    await expect(createCloneCancelHandler(ctx)()).resolves.toBeUndefined();

    expect(ctx.setIsCloning).not.toHaveBeenCalled();
    expect(ctx.setError).toHaveBeenCalledWith("task not found");
  });
});
