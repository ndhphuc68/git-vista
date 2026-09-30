import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useCheckoutBranch } from "./useCheckoutBranch";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    checkoutBranch: vi.fn().mockResolvedValue(undefined),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("history useCheckoutBranch", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it("calls checkoutBranch and invalidates repo scope on success", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useCheckoutBranch(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "feature/new" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeCommand.checkoutBranch).toHaveBeenCalledWith(REPO, "feature/new");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });
});
