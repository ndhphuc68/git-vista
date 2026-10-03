import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { GlobalLoadingIndicator, GLOBAL_LOADING_DELAY_MS } from "./GlobalLoadingIndicator";
import { useGlobalLoadingStore } from "../../store/useGlobalLoadingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Z_INDEX } from "../../domain/constants/zIndex";
import { vi as viTranslations } from "../../i18n/vi";

describe("GlobalLoadingIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGlobalLoadingStore.setState({ pendingCount: 0, message: undefined });
    useSettingsStore.setState({ locale: "vi" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing while idle", () => {
    render(<GlobalLoadingIndicator />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("has a 200ms delay to avoid flashing on instant operations", () => {
    expect(GLOBAL_LOADING_DELAY_MS).toBe(200);
  });

  it("appears only after the delay so fast operations do not flash", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());

    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS - 1));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    const overlay = screen.getByRole("alertdialog");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute("aria-modal", "true");
    expect(overlay).toHaveAttribute("aria-busy", "true");
    expect(overlay).toHaveStyle({ zIndex: String(Z_INDEX.globalLoading) });
    expect(screen.getByText(viTranslations.common.processing)).toBeInTheDocument();
    expect(screen.getByText(viTranslations.common.pleaseWait)).toBeInTheDocument();
  });

  it("displays custom message when provided", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin("Đang chuyển nhánh..."));
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS));

    expect(screen.getByText("Đang chuyển nhánh...")).toBeInTheDocument();
    expect(screen.getByText(viTranslations.common.pleaseWait)).toBeInTheDocument();
  });

  it("never appears for an operation that finishes before the delay", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS / 2));
    act(() => useGlobalLoadingStore.getState().end());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("hides as soon as the last operation settles", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    act(() => useGlobalLoadingStore.getState().end());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("blocks mouse click events on the overlay", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS));

    const overlay = screen.getByRole("alertdialog");
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    const prevented = !overlay.dispatchEvent(clickEvent);
    expect(prevented).toBe(true);
  });

  it("intercepts keyboard events while active and releases them when settled", () => {
    render(<GlobalLoadingIndicator />);
    act(() => useGlobalLoadingStore.getState().begin());
    act(() => vi.advanceTimersByTime(GLOBAL_LOADING_DELAY_MS));

    const keyEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(keyEvent);
    expect(keyEvent.defaultPrevented).toBe(true);

    // After loading settles, keydown events should not be prevented
    act(() => useGlobalLoadingStore.getState().end());
    const nextKeyEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(nextKeyEvent);
    expect(nextKeyEvent.defaultPrevented).toBe(false);
  });
});
