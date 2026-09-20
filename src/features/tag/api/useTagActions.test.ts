import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useCheckoutTag, usePushTag } from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    checkoutTag: vi.fn().mockResolvedValue(undefined),
    pushTag: vi.fn().mockResolvedValue(undefined),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("tag action hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it("useCheckoutTag forwards the name and refreshes the repository after success", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useCheckoutTag(REPO), { wrapper: makeWrapper(client) });

    await result.current.mutateAsync({ name: "v1.0.0" });

    expect(invokeCommand.checkoutTag).toHaveBeenCalledWith(REPO, "v1.0.0");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("usePushTag forwards the remote name and refreshes the repository after success", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => usePushTag(REPO), { wrapper: makeWrapper(client) });

    await result.current.mutateAsync({ name: "v2.0.0", remoteName: "upstream" });

    expect(invokeCommand.pushTag).toHaveBeenCalledWith(REPO, "v2.0.0", "upstream");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("does not invalidate when checkout fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.checkoutTag).mockRejectedValueOnce(new Error("checkout failed"));

    const { result } = renderHook(() => useCheckoutTag(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "v1.0.0" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("does not invalidate when push fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.pushTag).mockRejectedValueOnce(new Error("push failed"));

    const { result } = renderHook(() => usePushTag(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "v2.0.0" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
