import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommitBox } from "../components/changes/CommitBox";

import { useSettingsStore } from "../store/useSettingsStore";

describe("CommitBox", () => {
  const mockOnCommit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.getState().setMode("advanced");
  });

  it("renders summary input, description textarea, character counter, and commit button", () => {
    render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={2}
        onCommit={mockOnCommit}
      />
    );

    expect(screen.getByTestId("commit-summary-input")).toBeInTheDocument();
    expect(screen.getByTestId("commit-description-input")).toBeInTheDocument();
    expect(screen.getByText("0/72")).toBeInTheDocument();
    expect(screen.getByTestId("commit-button")).toBeInTheDocument();
    expect(screen.getByText(/Commit \(2 files\)/i)).toBeInTheDocument();
  });

  it("disables commit button when summary is empty or stagedCount is 0", () => {
    const { rerender } = render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={0}
        onCommit={mockOnCommit}
      />
    );

    const commitBtn = screen.getByTestId("commit-button");
    expect(commitBtn).toBeDisabled();

    // With staged count > 0 but empty summary
    rerender(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={3}
        onCommit={mockOnCommit}
      />
    );
    expect(commitBtn).toBeDisabled();

    // Type summary -> enabled
    fireEvent.change(screen.getByTestId("commit-summary-input"), {
      target: { value: "feat: new feature" },
    });
    expect(commitBtn).not.toBeDisabled();
  });

  it("displays 72-character counter and shows warning when exceeded", () => {
    render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={1}
        onCommit={mockOnCommit}
      />
    );

    const summaryInput = screen.getByTestId("commit-summary-input");
    fireEvent.change(summaryInput, {
      target: { value: "Short summary" },
    });
    expect(screen.getByText("13/72")).toBeInTheDocument();
    expect(
      screen.queryByText(/Vượt quá 72 ký tự khuyến nghị/i)
    ).not.toBeInTheDocument();

    // 75 chars
    const longSummary = "a".repeat(75);
    fireEvent.change(summaryInput, {
      target: { value: longSummary },
    });
    expect(screen.getByText("75/72")).toBeInTheDocument();
    expect(
      screen.getByText(/Vượt quá 72 ký tự khuyến nghị/i)
    ).toBeInTheDocument();
  });

  it("submits commit on button click and clears form", async () => {
    render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={1}
        onCommit={mockOnCommit}
      />
    );

    const summaryInput = screen.getByTestId("commit-summary-input") as HTMLInputElement;
    const descInput = screen.getByTestId("commit-description-input") as HTMLTextAreaElement;

    fireEvent.change(summaryInput, { target: { value: "feat: add commit box" } });
    fireEvent.change(descInput, { target: { value: "detailed commit body" } });

    fireEvent.click(screen.getByTestId("commit-button"));

    expect(mockOnCommit).toHaveBeenCalledWith(
      "feat: add commit box",
      "detailed commit body",
      false
    );

    await waitFor(() => {
      expect(summaryInput.value).toBe("");
      expect(descInput.value).toBe("");
    });
  });

  it("supports amend toggle and pre-fills lastCommitMessage", () => {
    render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={0}
        lastCommitMessage={"fix: previous commit summary\n\nExtended message body"}
        onCommit={mockOnCommit}
      />
    );

    const amendCheckbox = screen.getByTestId("amend-checkbox");
    fireEvent.click(amendCheckbox);

    const summaryInput = screen.getByTestId("commit-summary-input") as HTMLInputElement;
    const descInput = screen.getByTestId("commit-description-input") as HTMLTextAreaElement;

    expect(summaryInput.value).toBe("fix: previous commit summary");
    expect(descInput.value).toBe("Extended message body");
    expect(screen.getByText(/Amend Commit/i)).toBeInTheDocument();
    // Amend allows commit even if stagedCount === 0
    expect(screen.getByTestId("commit-button")).not.toBeDisabled();
  });

  it("triggers commit on Cmd+Enter / Ctrl+Enter", async () => {
    render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={1}
        onCommit={mockOnCommit}
      />
    );

    const summaryInput = screen.getByTestId("commit-summary-input");
    fireEvent.change(summaryInput, { target: { value: "feat: shortcut commit" } });

    fireEvent.keyDown(summaryInput, { key: "Enter", ctrlKey: true });

    await waitFor(() => {
      expect(mockOnCommit).toHaveBeenCalledWith(
        "feat: shortcut commit",
        undefined,
        false
      );
    });
  });
});
