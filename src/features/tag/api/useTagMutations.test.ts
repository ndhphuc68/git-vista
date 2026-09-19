import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useCreateTag, useDeleteTag } from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getTags: vi.fn().mockResolvedValue([]),
    createTag: vi.fn().mockResolvedValue(undefined),
    deleteTag: vi.fn().mockResolvedValue(undefined),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("tag mutation hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it("useCreateTag invalidates the whole repo scope after success", async () => {
    const { result } = renderHook(() => useCreateTag(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "v1.0.0", targetCommitId: "abc123" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("useDeleteTag invalidates the whole repo scope after success", async () => {
    const { result } = renderHook(() => useDeleteTag(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "v1.0.0", deleteRemote: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("does not invalidate when the mutation fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.deleteTag).mockRejectedValueOnce(new Error("tag not found"));

    const { result } = renderHook(() => useDeleteTag(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "missing", deleteRemote: false });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("passes the deleteRemote flag through to ipc", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useDeleteTag(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "v2.0.0", deleteRemote: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeCommand.deleteTag).toHaveBeenCalledWith(REPO, "v2.0.0", true);
  });
});
