import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAutoFetch } from "./useAutoFetch";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: { fetchRepo: vi.fn() },
}));

let hidden = false;
let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderAutoFetch(repoPath: string | undefined, busy = false) {
  return renderHook(({ path, isBusy }) => useAutoFetch(path, isBusy), {
    wrapper,
    initialProps: { path: repoPath, isBusy: busy },
  });
}

describe("useAutoFetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(invokeCommand.fetchRepo).mockReset().mockResolvedValue("ok");
    queryClient = new QueryClient();
    hidden = false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    useSettingsStore.getState().setAutoFetchInterval(300);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches the repo once per interval and refreshes its queries", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    renderAutoFetch("/repo");

    await act(() => vi.advanceTimersByTimeAsync(299_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1_000));
    expect(invokeCommand.fetchRepo).toHaveBeenCalledWith("/repo", undefined, false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.repo.all("/repo") });
  });

  it("does nothing when the interval is 0 or no repo is open", async () => {
    useSettingsStore.getState().setAutoFetchInterval(0);
    renderAutoFetch("/repo");
    renderAutoFetch(undefined);
    await act(() => vi.advanceTimersByTimeAsync(3_600_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();
  });

  it("skips ticks while the window is hidden or a manual task runs", async () => {
    hidden = true;
    const { rerender } = renderAutoFetch("/repo");
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();

    hidden = false;
    rerender({ path: "/repo", isBusy: true });
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();
  });

  it("skips a tick while the previous auto-fetch is still running", async () => {
    vi.mocked(invokeCommand.fetchRepo).mockReturnValue(new Promise(() => {}));
    renderAutoFetch("/repo");
    await act(() => vi.advanceTimersByTimeAsync(600_000));
    expect(invokeCommand.fetchRepo).toHaveBeenCalledTimes(1);
  });

  it("swallows fetch errors", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(invokeCommand.fetchRepo).mockRejectedValue(new Error("offline"));
    renderAutoFetch("/repo");
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("reschedules when the interval changes", async () => {
    renderAutoFetch("/repo");
    act(() => useSettingsStore.getState().setAutoFetchInterval(900));
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(600_000));
    expect(invokeCommand.fetchRepo).toHaveBeenCalledTimes(1);
  });
});
