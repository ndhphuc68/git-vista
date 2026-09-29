import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { GlobalLoadingIndicator, GLOBAL_LOADING_DELAY_MS } from "./GlobalLoadingIndicator";
import { useGlobalLoadingStore } from "../../store/useGlobalLoadingStore";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("GlobalLoadingIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGlobalLoadingStore.setState({ pendingCount: 0 });
    useSettingsStore.setState({ locale: "vi" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing while idle", () => {
    render(<GlobalLoadingIndicator />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("appears only after the delay so fast operations do not flash", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());

    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS - 1));
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("progressbar", { name: "Đang xử lý..." })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Đang xử lý...");
  });

  it("never appears for an operation that finishes before the delay", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS / 2));
    act(() => useGlobalLoadingStore.getState().end());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS));

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("hides as soon as the last operation settles", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    act(() => useGlobalLoadingStore.getState().end());
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
