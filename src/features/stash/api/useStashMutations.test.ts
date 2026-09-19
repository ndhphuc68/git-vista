import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useApplyStash, useDropStash, usePopStash, useSaveStash } from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getStashes: vi.fn().mockResolvedValue([]),
    saveStash: vi.fn().mockResolvedValue("commit-id"),
    applyStash: vi.fn().mockResolvedValue(undefined),
    popStash: vi.fn().mockResolvedValue(undefined),
    dropStash: vi.fn().mockResolvedValue("receipt"),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("stash mutation hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it.each([
    ["useSaveStash", useSaveStash, { message: "wip" }],
    ["useApplyStash", useApplyStash, { index: 0 }],
    ["usePopStash", usePopStash, { index: 0 }],
  ] as const)("%s refreshes the whole repo scope", async (_label, hook, vars) => {
    const { result } = renderHook(() => hook(REPO), { wrapper: makeWrapper(client) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.mutate(vars as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("useDropStash refreshes only the stash list", async () => {
    // Dropping an entry does not touch the working tree, so widening this to
    // qk.repo.all would refetch the status, graph and branches for nothing.
    const { result } = renderHook(() => useDropStash(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ index: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.stashes(REPO) });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("does not invalidate when the command fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.applyStash).mockRejectedValueOnce(new Error("CONFLICT"));

    const { result } = renderHook(() => useApplyStash(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ index: 0 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("useDropStash resolves with the undo receipt", async () => {
    // The undo toast is built from this value. A mutationFn that forgets to
    // return it still type-checks and still passes every other test here.
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.dropStash).mockResolvedValueOnce("receipt-42");

    const { result } = renderHook(() => useDropStash(REPO), { wrapper: makeWrapper(client) });
    const receipt = await result.current.mutateAsync({ index: 0 });

    expect(receipt).toBe("receipt-42");
  });

  it("useSaveStash resolves with the new commit id and forwards its flags", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.saveStash).mockResolvedValueOnce("stash-commit");

    const { result } = renderHook(() => useSaveStash(REPO), { wrapper: makeWrapper(client) });
    const id = await result.current.mutateAsync({ message: "wip", includeUntracked: true });

    expect(id).toBe("stash-commit");
    expect(invokeCommand.saveStash).toHaveBeenCalledWith(REPO, "wip", true);
  });
});
