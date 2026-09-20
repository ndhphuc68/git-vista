import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useMergeBranch, useRebaseBranch } from "../index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    mergeBranch: vi.fn().mockResolvedValue({ success: true, status: "Merged", output: "Merged" }),
    rebaseBranch: vi
      .fn()
      .mockResolvedValue({ success: true, status: "Success", output: "Rebased" }),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

function expectSidebarScopeInvalidated(invalidateSpy: ReturnType<typeof vi.spyOn>) {
  expect(invalidateSpy).toHaveBeenCalledTimes(4);
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.branches(REPO) });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.commitGraph(REPO) });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO) });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.head(REPO) });
}

describe("merge mutation hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it("useMergeBranch returns the backend result and refreshes the sidebar scope", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.mergeBranch).mockResolvedValueOnce({
      success: true,
      status: "Merged",
      output: "Merged feature/login",
    });
    const { result } = renderHook(() => useMergeBranch(REPO), { wrapper: makeWrapper(client) });

    const mergeResult = await result.current.mutateAsync({
      targetBranch: "feature/login",
      noFf: true,
    });

    expect(mergeResult).toEqual({
      success: true,
      status: "Merged",
      output: "Merged feature/login",
    });
    expect(invokeCommand.mergeBranch).toHaveBeenCalledWith(REPO, "feature/login", true);
    expectSidebarScopeInvalidated(invalidateSpy);
  });

  it("useRebaseBranch returns the backend result and refreshes the sidebar scope", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.rebaseBranch).mockResolvedValueOnce({
      success: true,
      status: "Success",
      output: "Rebased onto origin/main",
    });
    const { result } = renderHook(() => useRebaseBranch(REPO), { wrapper: makeWrapper(client) });

    const rebaseResult = await result.current.mutateAsync({ upstreamBranch: "origin/main" });

    expect(rebaseResult).toEqual({
      success: true,
      status: "Success",
      output: "Rebased onto origin/main",
    });
    expect(invokeCommand.rebaseBranch).toHaveBeenCalledWith(REPO, "origin/main");
    expectSidebarScopeInvalidated(invalidateSpy);
  });

  it("does not invalidate when merge fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.mergeBranch).mockRejectedValueOnce(new Error("merge conflict"));
    const { result } = renderHook(() => useMergeBranch(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ targetBranch: "feature/login", noFf: false });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("does not invalidate when rebase fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.rebaseBranch).mockRejectedValueOnce(new Error("rebase conflict"));
    const { result } = renderHook(() => useRebaseBranch(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ upstreamBranch: "origin/main" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
