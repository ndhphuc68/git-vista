import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StagingFileList } from "../components/changes/StagingFileList";
import { type StatusFileItem } from "../ipc/bindings";

describe("StagingFileList with Conflicted files", () => {
  const mockConflicted: StatusFileItem[] = [
    { path: "conflict1.txt", status: "Conflicted", is_staged: false, old_path: null },
  ];

  it("renders conflicted section and triggers onOpenConflictResolver", () => {
    const handleResolve = vi.fn();

    render(
      <StagingFileList
        staged={[]}
        unstaged={[]}
        untracked={[]}
        conflicted={mockConflicted}
        selectedFile={null}
        onSelectFile={vi.fn()}
        onStageFile={vi.fn()}
        onUnstageFile={vi.fn()}
        onDiscardFile={vi.fn()}
        onStageAll={vi.fn()}
        onUnstageAll={vi.fn()}
        onOpenConflictResolver={handleResolve}
      />
    );

    expect(screen.getByText(/TỆP XUNG ĐỘT/i)).toBeInTheDocument();
    expect(screen.getByText("conflict1.txt")).toBeInTheDocument();

    const resolveBtn = screen.getByRole("button", { name: /Giải quyết/i });
    fireEvent.click(resolveBtn);
    expect(handleResolve).toHaveBeenCalledWith("conflict1.txt");
  });
});
