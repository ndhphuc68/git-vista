import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GitBehaviorOptions, type GitBehaviorOptionsProps } from "./GitBehaviorOptions";
import { useSettingsStore } from "../../../store/useSettingsStore";

const props = (): GitBehaviorOptionsProps => ({
  pullRebase: false,
  pullLocked: false,
  busy: false,
  onPullStrategyChange: vi.fn(),
  fetchPrune: false,
  onToggleFetchPrune: vi.fn(),
  autoFetchInterval: 0,
  onAutoFetchChange: vi.fn(),
  rebaseAutostash: false,
  onToggleRebaseAutostash: vi.fn(),
});

describe("GitBehaviorOptions", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("vi");
    useSettingsStore.getState().setConfirmDiscard(true);
  });

  it("toggles safety confirmations from the settings store", () => {
    render(<GitBehaviorOptions {...props()} />);
    fireEvent.click(screen.getByTestId("toggle-confirm-discard"));
    expect(useSettingsStore.getState().confirmDiscard).toBe(false);
  });

  it("toggles rebase.autoStash", () => {
    const p = props();
    render(<GitBehaviorOptions {...p} />);
    fireEvent.click(screen.getByTestId("toggle-rebase-autostash"));
    expect(p.onToggleRebaseAutostash).toHaveBeenCalledTimes(1);
  });
});
