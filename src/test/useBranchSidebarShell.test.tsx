import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeCommand } from "../ipc/client";
import { useToastStore } from "../store/useToastStore";
import { useBranchSidebarShell } from "../features/branch/hooks/useBranchSidebarShell";

const REPO = "d:/test-repo";

function setup(initialSelectedBranch: string | null = "main") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  let selected = initialSelectedBranch;
  const setSelectedBranch = vi.fn((branch: string) => {
    selected = branch;
  });

  const hook = renderHook(
    () =>
      useBranchSidebarShell({
        repoPath: REPO,
        selectedBranch: selected,
        setSelectedBranch,
      }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );

  return { hook, client, setSelectedBranch };
}

describe("useBranchSidebarShell - checkout guards and handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ toasts: [] });
  });

  it("blocks checkout and shows error toast when repo operation is in progress", async () => {
    vi.spyOn(invokeCommand, "getRepoState").mockResolvedValue({
      state: "merge",
      is_in_progress: true,
      head_name: "main",
      target_name: "feature",
      conflict_count: 1,
    });
    const checkoutSpy = vi.spyOn(invokeCommand, "checkoutBranch").mockResolvedValue(undefined);

    const { hook } = setup();

    await waitFor(() => {
      expect(hook.result.current.data.repoState?.is_in_progress).toBe(true);
    });

    await act(async () => {
      await hook.result.current.handleCheckout("feature-new");
    });

    expect(checkoutSpy).not.toHaveBeenCalled();
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0]!.type).toBe("error");
    expect(toasts[0]!.title).toContain("Tiến trình Git đang dở dang");
    expect(toasts[0]!.message).toContain("Không thể chuyển nhánh");
  });

  it("checks out branch, updates selected branch and shows success toast on success", async () => {
    vi.spyOn(invokeCommand, "getRepoState").mockResolvedValue({
      state: "clean",
      is_in_progress: false,
      head_name: "main",
      target_name: null,
      conflict_count: 0,
    });
    const checkoutSpy = vi.spyOn(invokeCommand, "checkoutBranch").mockResolvedValue(undefined);

    const { hook, setSelectedBranch } = setup();

    await act(async () => {
      await hook.result.current.handleCheckout("feature-new");
    });

    expect(checkoutSpy).toHaveBeenCalledWith(REPO, "feature-new");
    expect(setSelectedBranch).toHaveBeenCalledWith("feature-new");
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.type === "success")).toBe(true);
  });

  it("selects the local branch after checking out a remote-tracking branch", async () => {
    const item = (name: string) => ({
      name,
      is_head: false,
      target_commit_id: "abc",
      upstream: null,
      ahead: 0,
      behind: 0,
    });
    vi.spyOn(invokeCommand, "getBranches").mockResolvedValue({
      current_branch: "main",
      is_detached: false,
      local: [item("main")],
      remote: [item("origin/feature/login")],
      tags: [],
    });
    const checkoutSpy = vi.spyOn(invokeCommand, "checkoutBranch").mockResolvedValue(undefined);

    const { hook, setSelectedBranch } = setup();

    await waitFor(() => {
      expect(hook.result.current.data.branchData?.remote).toHaveLength(1);
    });
    await act(async () => {
      await hook.result.current.handleCheckout("origin/feature/login");
    });

    expect(checkoutSpy).toHaveBeenCalledWith(REPO, "origin/feature/login");
    expect(setSelectedBranch).toHaveBeenCalledWith("feature/login");
  });

  it("opens checkoutConflict dialog when checkout fails with CHECKOUT_CONFLICT", async () => {
    vi.spyOn(invokeCommand, "checkoutBranch").mockRejectedValue(
      new Error("CHECKOUT_CONFLICT: file1.txt")
    );

    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckout("feature-conflict");
    });

    expect(hook.result.current.dialog.kind).toBe("checkoutConflict");
  });

  it("opens the conflict dialog for the {type, message} error the IPC layer throws", async () => {
    vi.spyOn(invokeCommand, "checkoutBranch").mockRejectedValue({
      type: "InvalidOperation",
      message: "CHECKOUT_CONFLICT: file1.txt",
    });

    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckout("feature-conflict");
    });

    expect(hook.result.current.dialog).toEqual({
      kind: "checkoutConflict",
      targetBranch: "feature-conflict",
      errorMessage: "CHECKOUT_CONFLICT: file1.txt",
    });
  });

  it("shows an error toast, not the conflict dialog, for other errors that mention a conflict", async () => {
    vi.spyOn(invokeCommand, "checkoutBranch").mockRejectedValue(
      new Error("Git error: failed to lock file 'index.lock': conflict with another process")
    );

    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckout("feature-locked");
    });

    expect(hook.result.current.dialog.kind).not.toBe("checkoutConflict");
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.type).toBe("error");
  });

  it("ignores a second checkout while the first is still running", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const checkoutSpy = vi.spyOn(invokeCommand, "checkoutBranch").mockReturnValue(gate);

    const { hook } = setup();

    await act(async () => {
      const first = hook.result.current.handleCheckout("feature-a");
      const second = hook.result.current.handleCheckout("feature-b");
      release();
      await Promise.all([first, second]);
    });

    expect(checkoutSpy).toHaveBeenCalledTimes(1);
    expect(checkoutSpy).toHaveBeenCalledWith(REPO, "feature-a");
  });

  it("shows error toast without calling window.alert on non-conflict failure", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(invokeCommand, "checkoutBranch").mockRejectedValue(
      new Error("fatal: unable to read tree")
    );

    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckout("feature-err");
    });

    expect(alertSpy).not.toHaveBeenCalled();
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0]!.type).toBe("error");
  });
});
