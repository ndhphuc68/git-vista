import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import { CommitGraphCommitRow } from "./CommitGraphCommitRow";

const mockCommit: GraphCommitNode = {
  id: "commit-1234567890",
  short_id: "commit1",
  summary: "feat: test commit",
  author_name: "Test Author",
  author_email: "author@example.com",
  timestamp_sec: 1700000000,
  parent_ids: [],
  col: 0,
  color_index: 0,
  lines: [],
  refs: [],
};

describe("CommitGraphCommitRow", () => {
  it("selects commit on click", () => {
    const onSelectCommit = vi.fn();
    const onContextMenu = vi.fn();

    render(
      <CommitGraphCommitRow
        commit={mockCommit}
        style={{}}
        isSelected={false}
        isFirstRow={false}
        maxCols={1}
        selectedCommitId={null}
        nextCommitId={null}
        prevCommitId={null}
        onSelectCommit={onSelectCommit}
        onCompare={vi.fn()}
        onContextMenu={onContextMenu}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /commit1/i }));

    expect(onSelectCommit).toHaveBeenCalledTimes(1);
    expect(onSelectCommit).toHaveBeenCalledWith(mockCommit.id);
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  it("opens context menu on right click without selecting commit or triggering details", () => {
    const onSelectCommit = vi.fn();
    const onContextMenu = vi.fn();

    render(
      <CommitGraphCommitRow
        commit={mockCommit}
        style={{}}
        isSelected={false}
        isFirstRow={false}
        maxCols={1}
        selectedCommitId="other-commit-id"
        nextCommitId={null}
        prevCommitId={null}
        onSelectCommit={onSelectCommit}
        onCompare={vi.fn()}
        onContextMenu={onContextMenu}
      />
    );

    fireEvent.contextMenu(screen.getByRole("button", { name: /commit1/i }));

    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        commit: mockCommit,
      })
    );
    expect(onSelectCommit).not.toHaveBeenCalled();
  });
});
