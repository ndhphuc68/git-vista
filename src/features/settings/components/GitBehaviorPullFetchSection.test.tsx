import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  GitBehaviorPullFetchSection,
  type GitBehaviorPullFetchSectionProps,
} from "./GitBehaviorPullFetchSection";
import { useSettingsStore } from "../../../store/useSettingsStore";

const props = (
  over: Partial<GitBehaviorPullFetchSectionProps> = {}
): GitBehaviorPullFetchSectionProps => ({
  pullRebase: false,
  pullLocked: false,
  busy: false,
  onPullStrategyChange: vi.fn(),
  fetchPrune: false,
  onToggleFetchPrune: vi.fn(),
  autoFetchInterval: 0,
  onAutoFetchChange: vi.fn(),
  ...over,
});

describe("GitBehaviorPullFetchSection", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("vi");
  });

  it("reports the chosen pull strategy", () => {
    const p = props();
    render(<GitBehaviorPullFetchSection {...p} />);
    expect(screen.getByTestId("pull-strategy-merge")).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByTestId("pull-strategy-rebase"));
    expect(p.onPullStrategyChange).toHaveBeenCalledWith(true);
  });

  it("locks the pull strategy while the repo inherits it", () => {
    const p = props({ pullLocked: true });
    render(<GitBehaviorPullFetchSection {...p} />);
    expect(screen.getByTestId("pull-strategy-rebase")).toBeDisabled();
  });

  it("toggles fetch.prune", () => {
    const p = props();
    render(<GitBehaviorPullFetchSection {...p} />);
    fireEvent.click(screen.getByTestId("toggle-fetch-prune"));
    expect(p.onToggleFetchPrune).toHaveBeenCalledTimes(1);
  });

  it("reports the auto-fetch interval in seconds", () => {
    const p = props();
    render(<GitBehaviorPullFetchSection {...p} />);
    fireEvent.click(screen.getByTestId("auto-fetch-select"));
    fireEvent.click(screen.getByRole("option", { name: "Mỗi 15 phút" }));
    expect(p.onAutoFetchChange).toHaveBeenCalledWith(900);
  });
});
