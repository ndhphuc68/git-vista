import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CommitGraphBranchPills } from "../features/history/components/CommitGraphBranchPills";
import { useSettingsStore } from "../store/useSettingsStore";
import type { RefBadge } from "../ipc/bindings.generated";

describe("CommitGraphBranchPills", () => {
  beforeEach(() => {
    useSettingsStore.setState({ locale: "en" });
  });

  it("renders nothing when refs is empty", () => {
    const { container } = render(<CommitGraphBranchPills refs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single branch pill with HEAD badge when head ref is provided", () => {
    const refs: RefBadge[] = [{ name: "main", ref_type: "head" }];
    render(<CommitGraphBranchPills refs={refs} />);

    expect(screen.getByTitle("main")).toBeInTheDocument();
    expect(screen.getAllByText("main").length).toBe(2);
    expect(screen.getAllByText("HEAD").length).toBe(2);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it("prioritizes HEAD ref over tags and other branches as the primary pill", () => {
    const refs: RefBadge[] = [
      { name: "origin/feat-a", ref_type: "remote" },
      { name: "feat-a", ref_type: "local" },
      { name: "v1.0.0", ref_type: "tag" },
      { name: "main", ref_type: "head" },
    ];
    render(<CommitGraphBranchPills refs={refs} />);

    // Primary pill should display main
    const primaryPill = screen.getByTitle("main");
    expect(primaryPill).toBeInTheDocument();
    expect(within(primaryPill).getByText("HEAD")).toBeInTheDocument();

    // Overflow badge should show +3
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("renders the vertical list popover displaying all refs in order", () => {
    const refs: RefBadge[] = [
      { name: "origin/main", ref_type: "remote" },
      { name: "v2.0", ref_type: "tag" },
      { name: "feature/receipt", ref_type: "local" },
      { name: "main", ref_type: "head" },
    ];
    render(<CommitGraphBranchPills refs={refs} isFirstRow={true} />);

    // Check all names exist in the document (within the popover list)
    expect(screen.getAllByText("main").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("feature/receipt")).toBeInTheDocument();
    expect(screen.getByText("v2.0")).toBeInTheDocument();
    expect(screen.getByText("origin/main")).toBeInTheDocument();

    // Check type indicators in popup
    expect(screen.getByText("tag")).toBeInTheDocument();
    expect(screen.getByText("remote")).toBeInTheDocument();
  });
});
