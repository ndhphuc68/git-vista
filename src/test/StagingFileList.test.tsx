import {
  render,
  screen,
  fireEvent,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StagingFileList } from "../components/changes/StagingFileList";

describe("StagingFileList & DiscardConfirmModal", () => {
  const mockProps = {
    repoPath: "/test/repo",
    status: {
      staged: [
        { path: "src/staged1.ts", status: "Modified" as const, is_staged: true, old_path: null },
      ],
      unstaged: [
        { path: "src/unstaged1.ts", status: "Modified" as const, is_staged: false, old_path: null },
      ],
      untracked: [
        { path: "src/untracked1.ts", status: "New" as const, is_staged: false, old_path: null },
      ],
      conflicted: [],
    },
    selectedFile: null,
    onSelectFile: vi.fn(),
    onStageFile: vi.fn(),
    onUnstageFile: vi.fn(),
    onStageAll: vi.fn(),
    onUnstageAll: vi.fn(),
    onDiscardFile: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders staged and changes sections with correct counts", () => {
    render(<StagingFileList {...mockProps} />);

    expect(screen.getByText(/(TỆP ĐÃ ĐÁNH DẤU|STAGED) \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/(TỆP THAY ĐỔI|CHANGES) \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText("src/staged1.ts")).toBeInTheDocument();
    expect(screen.getByText("src/unstaged1.ts")).toBeInTheDocument();
    expect(screen.getByText("src/untracked1.ts")).toBeInTheDocument();
  });

  it("calls onSelectFile when a file is clicked", () => {
    render(<StagingFileList {...mockProps} />);

    fireEvent.click(screen.getByText("src/staged1.ts"));
    expect(mockProps.onSelectFile).toHaveBeenCalledWith({
      path: "src/staged1.ts",
      is_staged: true,
    });

    fireEvent.click(screen.getByText("src/unstaged1.ts"));
    expect(mockProps.onSelectFile).toHaveBeenCalledWith({
      path: "src/unstaged1.ts",
      is_staged: false,
    });
  });

  it("calls onStageFile and onUnstageFile when stage/unstage buttons are clicked", () => {
    render(<StagingFileList {...mockProps} />);

    const unstageBtn = screen.getByTestId("unstage-file-src/staged1.ts");
    fireEvent.click(unstageBtn);
    expect(mockProps.onUnstageFile).toHaveBeenCalledWith("src/staged1.ts");

    const stageBtn = screen.getByTestId("stage-file-src/unstaged1.ts");
    fireEvent.click(stageBtn);
    expect(mockProps.onStageFile).toHaveBeenCalledWith("src/unstaged1.ts");
  });

  it("calls onStageAll and onUnstageAll when header buttons are clicked", () => {
    render(<StagingFileList {...mockProps} />);

    const unstageAllBtn = screen.getByTestId("unstage-all-button");
    fireEvent.click(unstageAllBtn);
    expect(mockProps.onUnstageAll).toHaveBeenCalled();

    const stageAllBtn = screen.getByTestId("stage-all-button");
    fireEvent.click(stageAllBtn);
    expect(mockProps.onStageAll).toHaveBeenCalled();
  });

  it("opens DiscardConfirmModal and calls onDiscardFile on confirmation", async () => {
    render(<StagingFileList {...mockProps} />);

    const discardBtn = screen.getByTestId("discard-file-src/unstaged1.ts");
    fireEvent.click(discardBtn);

    // Modal should be open with warning
    expect(screen.getByRole("heading", { name: /Huỷ thay đổi/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Các thay đổi trong file này sẽ bị huỷ vĩnh viễn/i)
    ).toBeInTheDocument();

    // Confirm discard
    const confirmBtn = screen.getByTestId("confirm-discard-button");
    fireEvent.click(confirmBtn);

    expect(mockProps.onDiscardFile).toHaveBeenCalledWith("src/unstaged1.ts");
    // Modal should close. The shared Modal fades out before unmounting, so
    // this awaits removal rather than asserting it synchronously — it still
    // fails if the modal never closes.
    //
    // This targets the dialog itself, not the warning text: the modal also
    // hides when filePath goes null, so asserting on the text alone would
    // still pass even if isOpen were stuck true.
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  it("cancels discard without calling onDiscardFile", async () => {
    render(<StagingFileList {...mockProps} />);

    const discardBtn = screen.getByTestId("discard-file-src/unstaged1.ts");
    fireEvent.click(discardBtn);

    const cancelBtn = screen.getByTestId("cancel-discard-button");
    fireEvent.click(cancelBtn);

    expect(mockProps.onDiscardFile).not.toHaveBeenCalled();
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });
});
