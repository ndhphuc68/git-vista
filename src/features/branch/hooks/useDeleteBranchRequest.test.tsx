import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useDeleteBranchRequest } from "./useDeleteBranchRequest";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useToastStore } from "../../../store/useToastStore";
import { invokeCommand } from "../../../ipc/client";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: { deleteBranch: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function setup() {
  const setDialog = vi.fn();
  const { result } = renderHook(() => useDeleteBranchRequest("/repo", setDialog), { wrapper });
  return { setDialog, openDialog: result.current };
}

describe("useDeleteBranchRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.getState().clearToasts();
    useSettingsStore.getState().setConfirmDeleteBranch(true);
  });

  it("opens the confirmation dialog when confirmation is on", () => {
    const { setDialog, openDialog } = setup();
    act(() => openDialog({ kind: "deleteBranch", name: "feat" }));
    expect(setDialog).toHaveBeenCalledWith({ kind: "deleteBranch", name: "feat" });
    expect(invokeCommand.deleteBranch).not.toHaveBeenCalled();
  });

  it("passes other dialogs through unchanged", () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    const { setDialog, openDialog } = setup();
    act(() => openDialog({ kind: "renameBranch", name: "feat" }));
    expect(setDialog).toHaveBeenCalledWith({ kind: "renameBranch", name: "feat" });
  });

  it("deletes directly with an undo toast when confirmation is off", async () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    vi.mocked(invokeCommand.deleteBranch).mockResolvedValue("refs/gitui-backup/x");
    const { setDialog, openDialog } = setup();

    act(() => openDialog({ kind: "deleteBranch", name: "feat" }));

    await waitFor(() =>
      expect(invokeCommand.deleteBranch).toHaveBeenCalledWith("/repo", "feat", false)
    );
    await waitFor(() => expect(useToastStore.getState().toasts[0]?.type).toBe("success"));
    expect(setDialog).not.toHaveBeenCalled();
  });

  it("falls back to the unmerged dialog when git refuses a safe delete", async () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    vi.mocked(invokeCommand.deleteBranch).mockRejectedValue(
      new Error("UNMERGED_BRANCH: not merged")
    );
    const { setDialog, openDialog } = setup();

    act(() => openDialog({ kind: "deleteBranch", name: "feat" }));

    await waitFor(() =>
      expect(setDialog).toHaveBeenCalledWith({ kind: "deleteBranch", name: "feat", unmerged: true })
    );
  });

  it("does not short-circuit the unmerged dialog itself", () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    const { setDialog, openDialog } = setup();
    act(() => openDialog({ kind: "deleteBranch", name: "feat", unmerged: true }));
    expect(setDialog).toHaveBeenCalledWith({ kind: "deleteBranch", name: "feat", unmerged: true });
    expect(invokeCommand.deleteBranch).not.toHaveBeenCalled();
  });
});
