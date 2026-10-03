import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { BranchSelectButton } from "./BranchSelectButton";

function branch(name: string, isHead: boolean) {
  return { name, is_head: isHead, target_commit_id: "abc", upstream: null, ahead: 0, behind: 0 };
}

describe("BranchSelectButton", () => {
  beforeEach(() => {
    useSettingsStore.setState({ locale: "en" });
  });

  it("translates the double-click checkout hint", () => {
    render(
      <BranchSelectButton
        branch={branch("feature", false)}
        name="feature"
        isSelected={false}
        onSelectBranch={vi.fn()}
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "title",
      "Double-click to check out branch feature"
    );
  });

  it("shows the branch name with a HEAD marker for the current branch", () => {
    render(
      <BranchSelectButton
        branch={branch("main", true)}
        name="main"
        isSelected={false}
        onSelectBranch={vi.fn()}
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute("title", "main (HEAD)");
  });

  it("styles the current branch (HEAD) in accent color even when unselected", () => {
    render(
      <BranchSelectButton
        branch={branch("main", true)}
        name="main"
        isSelected={false}
        onSelectBranch={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-accent");
    expect(button).toHaveClass("font-semibold");
    expect(button).not.toHaveClass("bg-accent-subtle");
  });

  it("styles the current branch (HEAD) with accent-subtle background when selected", () => {
    render(
      <BranchSelectButton
        branch={branch("main", true)}
        name="main"
        isSelected={true}
        onSelectBranch={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-accent");
    expect(button).toHaveClass("bg-accent-subtle");
    expect(button).toHaveClass("font-semibold");
  });

  it("styles a non-head branch with surface-active background and primary text when selected", () => {
    render(
      <BranchSelectButton
        branch={branch("feature", false)}
        name="feature"
        isSelected={true}
        onSelectBranch={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-surface-active");
    expect(button).toHaveClass("text-primary");
    expect(button).not.toHaveClass("text-accent");
    expect(button).not.toHaveClass("bg-accent-subtle");
  });
});
