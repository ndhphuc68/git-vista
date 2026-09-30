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
