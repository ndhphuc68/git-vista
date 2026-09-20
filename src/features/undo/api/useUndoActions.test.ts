import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useUndoDropStash } from "../index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    undoDropStash: vi.fn().mockResolvedValue(undefined),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("undo action hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it("useUndoDropStash forwards the receipt and refreshes stashes after success", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useUndoDropStash(REPO), { wrapper: makeWrapper(client) });

    await expect(result.current.mutateAsync({ receipt: "undo-receipt" })).resolves.toBeUndefined();

    expect(invokeCommand.undoDropStash).toHaveBeenCalledWith(REPO, "undo-receipt");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.stashes(REPO) });
  });

  it("does not invalidate when undoing a dropped stash fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.undoDropStash).mockRejectedValueOnce(new Error("receipt expired"));
    const { result } = renderHook(() => useUndoDropStash(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ receipt: "undo-receipt" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
