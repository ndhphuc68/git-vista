import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeCommand } from "../ipc/client";
import { useRepoStore } from "../store/useRepoStore";
import { useToastStore } from "../store/useToastStore";
import { useCommitGraphState } from "../features/history/hooks/useCommitGraphState";

const REPO = "d:/test-repo";

function setup() {
  useRepoStore.getState().setRepo({
    path: REPO,
    name: "test-repo",
    is_bare: false,
    head_branch: "main",
    head_commit_id: "c1",
  });

  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const hook = renderHook(() => useCommitGraphState(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  return { hook, client };
}

describe("useCommitGraphState - checkout branch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ toasts: [] });
  });

  it("blocks checkout and shows error toast when repo operation is in progress", async () => {
    vi.spyOn(invokeCommand, "getRepoState").mockResolvedValue({
      state: "rebase",
      is_in_progress: true,
      head_name: "main",
      target_name: "main",
      conflict_count: 0,
    });
    const checkoutSpy = vi.spyOn(invokeCommand, "checkoutBranch").mockResolvedValue(undefined);

    const { hook, client } = setup();

    await waitFor(() => {
      expect(client.getQueryData(["repo", REPO, "state"])).toBeDefined();
    });

    await act(async () => {
      await hook.result.current.handleCheckoutBranch("other-branch");
    });

    expect(checkoutSpy).not.toHaveBeenCalled();
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0]!.type).toBe("error");
    expect(toasts[0]!.title).toContain("Tiến trình Git đang dở dang");
  });

  it("checks out branch and shows success toast when repo state is clean", async () => {
    vi.spyOn(invokeCommand, "getRepoState").mockResolvedValue({
      state: "clean",
      is_in_progress: false,
      head_name: "main",
      target_name: null,
      conflict_count: 0,
    });
    const checkoutSpy = vi.spyOn(invokeCommand, "checkoutBranch").mockResolvedValue(undefined);

    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckoutBranch("other-branch");
    });

    expect(checkoutSpy).toHaveBeenCalledWith(REPO, "other-branch");
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.type === "success")).toBe(true);
  });

  it("selects the local branch after checking out a remote-tracking pill", async () => {
    vi.spyOn(invokeCommand, "getCommitGraph").mockResolvedValue({
      commits: [
        {
          id: "c1",
          short_id: "c1",
          summary: "Initial commit",
          author_name: "Tester",
          author_email: "tester@example.com",
          timestamp_sec: 0,
          parent_ids: [],
          col: 0,
          color_index: 0,
          lines: [],
          refs: [{ name: "origin/feature/login", ref_type: "remote" }],
        },
      ],
      has_more: false,
      total_count: 1,
    });
    const checkoutSpy = vi.spyOn(invokeCommand, "checkoutBranch").mockResolvedValue(undefined);

    const { hook } = setup();

    await waitFor(() => {
      expect(hook.result.current.commits).toHaveLength(1);
    });
    await act(async () => {
      await hook.result.current.handleCheckoutBranch("origin/feature/login");
    });

    expect(checkoutSpy).toHaveBeenCalledWith(REPO, "origin/feature/login");
    expect(useRepoStore.getState().selectedBranch).toBe("feature/login");
  });

  it("opens the checkout conflict dialog instead of a toast on CHECKOUT_CONFLICT", async () => {
    vi.spyOn(invokeCommand, "checkoutBranch").mockRejectedValue(
      new Error("CHECKOUT_CONFLICT: file1.txt")
    );

    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckoutBranch("feature-conflict");
    });

    expect(hook.result.current.dialog).toEqual({
      type: "checkoutConflict",
      targetBranch: "feature-conflict",
      errorMessage: "CHECKOUT_CONFLICT: file1.txt",
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("keeps showing an error toast for other checkout failures", async () => {
    vi.spyOn(invokeCommand, "checkoutBranch").mockRejectedValue(
      new Error("fatal: unable to read tree")
    );

    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckoutBranch("feature-err");
    });

    expect(hook.result.current.dialog).toEqual({ type: "closed" });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.type).toBe("error");
  });
});

describe("useCommitGraphState - checkout commit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ toasts: [] });
  });

  it("blocks checkout commit and shows error toast when repo operation is in progress", async () => {
    vi.spyOn(invokeCommand, "getRepoState").mockResolvedValue({
      state: "rebase",
      is_in_progress: true,
      head_name: "main",
      target_name: "main",
      conflict_count: 0,
    });
    const checkoutCommitSpy = vi.spyOn(invokeCommand, "checkoutCommit").mockResolvedValue(undefined);

    const { hook, client } = setup();

    await waitFor(() => {
      expect(client.getQueryData(["repo", REPO, "state"])).toBeDefined();
    });

    await act(async () => {
      await hook.result.current.handleCheckoutCommit("commit1234567890");
    });

    expect(checkoutCommitSpy).not.toHaveBeenCalled();
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0]!.type).toBe("error");
    expect(toasts[0]!.title).toContain("Tiến trình Git đang dở dang");
  });

  it("checks out commit, clears selected branch, and shows success toast when repo state is clean", async () => {
    vi.spyOn(invokeCommand, "getRepoState").mockResolvedValue({
      state: "clean",
      is_in_progress: false,
      head_name: "main",
      target_name: null,
      conflict_count: 0,
    });
    const checkoutCommitSpy = vi.spyOn(invokeCommand, "checkoutCommit").mockResolvedValue(undefined);

    useRepoStore.getState().setSelectedBranch("feature");
    const { hook } = setup();

    await act(async () => {
      await hook.result.current.handleCheckoutCommit("commit1234567890");
    });

    expect(checkoutCommitSpy).toHaveBeenCalledWith(REPO, "commit1234567890");
    expect(useRepoStore.getState().selectedBranch).toBeNull();
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.type === "success" && t.message.includes("commit1"))).toBe(true);
  });
});

