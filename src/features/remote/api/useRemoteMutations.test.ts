import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import {
  useAddRemote,
  usePruneRemote,
  useRemoveRemote,
  useRenameRemote,
  useSetRemoteUrl,
} from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getRemotes: vi.fn().mockResolvedValue([]),
    addRemote: vi.fn().mockResolvedValue({ name: "origin" }),
    renameRemote: vi.fn().mockResolvedValue(undefined),
    removeRemote: vi.fn().mockResolvedValue(undefined),
    setRemoteUrl: vi.fn().mockResolvedValue(undefined),
    pruneRemote: vi.fn().mockResolvedValue({ remote: "origin", pruned_branches: [], message: "" }),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("remote mutation hooks", () => {
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
    ["useAddRemote", useAddRemote, { name: "origin", url: "git@x:y.git" }],
    ["useRenameRemote", useRenameRemote, { oldName: "a", newName: "b" }],
    ["useRemoveRemote", useRemoveRemote, { name: "origin" }],
    ["useSetRemoteUrl", useSetRemoteUrl, { name: "origin", fetchUrl: "git@x:y.git" }],
    ["usePruneRemote", usePruneRemote, { remote: "origin" }],
  ] as const)("%s refreshes remotes and branches", async (_label, hook, vars) => {
    const { result } = renderHook(() => hook(REPO), { wrapper: makeWrapper(client) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.mutate(vars as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.remotes(REPO) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.branches(REPO) });
  });

  it("does not widen invalidation to the whole repo scope", async () => {
    // Changing a remote touches neither the working tree nor HEAD, so pulling
    // in qk.repo.all would refetch the status and the commit graph for nothing.
    const { result } = renderHook(() => useSetRemoteUrl(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "origin", fetchUrl: "git@x:y.git" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("does not invalidate when the command fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.addRemote).mockRejectedValueOnce(new Error("REMOTE_EXISTS"));

    const { result } = renderHook(() => useAddRemote(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "origin", url: "git@x:y.git" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("useSetRemoteUrl forwards the optional push url", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useSetRemoteUrl(REPO), { wrapper: makeWrapper(client) });

    await result.current.mutateAsync({
      name: "origin",
      fetchUrl: "git@x:y.git",
      pushUrl: "git@x:z.git",
    });

    expect(invokeCommand.setRemoteUrl).toHaveBeenCalledWith(
      REPO,
      "origin",
      "git@x:y.git",
      "git@x:z.git"
    );
  });

  it("usePruneRemote resolves with the prune result", async () => {
    // The modal renders the pruned branch names from this value; a mutationFn
    // that forgets to return it still type-checks.
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.pruneRemote).mockResolvedValueOnce({
      remote: "origin",
      pruned_branches: ["origin/gone"],
      message: "1 branch pruned",
    });

    const { result } = renderHook(() => usePruneRemote(REPO), { wrapper: makeWrapper(client) });
    const res = await result.current.mutateAsync({ remote: "origin" });

    expect(res.pruned_branches).toEqual(["origin/gone"]);
  });
});
