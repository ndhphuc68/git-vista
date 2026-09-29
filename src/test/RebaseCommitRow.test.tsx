import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RebaseCommitRow } from "../components/rebase/RebaseCommitRow";
import type { RebaseCommitItem, RebasePlanStep } from "../ipc/bindings.generated";

const commit: RebaseCommitItem = {
  id: "1111111111111111111111111111111111111111",
  short_id: "1111111",
  summary: "Commit summary",
  message: "Commit summary\n\nBody",
  author_name: "Dev One",
  author_email: "dev1@example.com",
  timestamp: 1700000000,
  parent_ids: ["0000000000000000000000000000000000000000"],
};

function makeStep(overrides: Partial<RebasePlanStep> = {}): RebasePlanStep {
  return {
    commit_id: commit.id,
    action: "Pick",
    new_message: null,
    ...overrides,
  };
}

describe("RebaseCommitRow", () => {
  it("renders commit metadata and calls onMoveUp/onMoveDown", () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <RebaseCommitRow
        step={makeStep()}
        commit={commit}
        index={1}
        total={3}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onActionChange={vi.fn()}
        onMessageChange={vi.fn()}
      />
    );

    expect(screen.getByText("Commit summary")).toBeInTheDocument();
    expect(screen.getByText("1111111")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/di chuyển lên|move up/i));
    expect(onMoveUp).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/di chuyển xuống|move down/i));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it("disables Squash/Fixup for the first row and calls onActionChange otherwise", () => {
    const onActionChange = vi.fn();

    render(
      <RebaseCommitRow
        step={makeStep()}
        commit={commit}
        index={0}
        total={3}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onActionChange={onActionChange}
        onMessageChange={vi.fn()}
      />
    );

    const squashBtn = screen.getByRole("button", { name: /squash/i });
    expect(squashBtn).toBeDisabled();

    const pickBtn = screen.getByRole("button", { name: /pick/i });
    fireEvent.click(pickBtn);
    expect(onActionChange).toHaveBeenCalledWith("Pick");
  });

  it("shows the inline editor and calls onMessageChange when the step is Reword", () => {
    const onMessageChange = vi.fn();

    render(
      <RebaseCommitRow
        step={makeStep({ action: "Reword", new_message: "New message" })}
        commit={commit}
        index={1}
        total={3}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onActionChange={vi.fn()}
        onMessageChange={onMessageChange}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("New message");

    fireEvent.change(textarea, { target: { value: "Edited message" } });
    expect(onMessageChange).toHaveBeenCalledWith("Edited message");
  });

  it("fires drag handlers", () => {
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();

    const { container } = render(
      <RebaseCommitRow
        step={makeStep()}
        commit={commit}
        index={0}
        total={1}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onActionChange={vi.fn()}
        onMessageChange={vi.fn()}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );

    const draggable = container.querySelector("[draggable=true]")!;
    fireEvent.dragStart(draggable);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    fireEvent.dragEnd(draggable);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
