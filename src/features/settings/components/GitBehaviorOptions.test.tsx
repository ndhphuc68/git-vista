import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GitBehaviorOptions } from "./GitBehaviorOptions";
import { useSettingsStore } from "../../../store/useSettingsStore";

const baseProps = {
  activeScope: "global" as const,
  currentRepoPath: null,
  localPullRebase: null,
  globalPullRebase: false,
  fetchPrune: false,
  rebaseAutostash: false,
  autoFetchInterval: 0,
  loading: false,
  saving: false,
  onGlobalPullStrategyChange: vi.fn(),
  onRepoPullStrategyChange: vi.fn(),
  onToggleFetchPrune: vi.fn(),
  onToggleRebaseAutostash: vi.fn(),
  onAutoFetchChange: vi.fn(),
};

describe("GitBehaviorOptions", () => {
  it("reports the chosen auto-fetch interval", () => {
    const onAutoFetchChange = vi.fn();
    render(<GitBehaviorOptions {...baseProps} onAutoFetchChange={onAutoFetchChange} />);

    fireEvent.click(screen.getByText("Mỗi 5 phút"));
    expect(onAutoFetchChange).toHaveBeenCalledWith(300);

    fireEvent.click(screen.getByText("Mỗi 15 phút"));
    expect(onAutoFetchChange).toHaveBeenCalledWith(900);

    fireEvent.click(screen.getByText("Tắt"));
    expect(onAutoFetchChange).toHaveBeenCalledWith(0);
  });

  it("toggles safety confirmations from the settings store", () => {
    useSettingsStore.getState().setConfirmDiscard(true);
    render(<GitBehaviorOptions {...baseProps} />);

    fireEvent.click(screen.getByTestId("toggle-confirm-discard"));
    expect(useSettingsStore.getState().confirmDiscard).toBe(false);
  });

  it("toggles the fetch.prune and rebase.autoStash flags", () => {
    const onToggleFetchPrune = vi.fn();
    const onToggleRebaseAutostash = vi.fn();
    render(
      <GitBehaviorOptions
        {...baseProps}
        onToggleFetchPrune={onToggleFetchPrune}
        onToggleRebaseAutostash={onToggleRebaseAutostash}
      />
    );

    fireEvent.click(screen.getByTestId("toggle-fetch-prune"));
    expect(onToggleFetchPrune).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("toggle-rebase-autostash"));
    expect(onToggleRebaseAutostash).toHaveBeenCalled();
  });
});
