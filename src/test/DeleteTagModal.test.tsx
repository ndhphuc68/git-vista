import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteTagModal } from "../components/tag/DeleteTagModal";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    deleteTag: vi.fn(),
  },
}));

describe("DeleteTagModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <DeleteTagModal
        isOpen={false}
        onClose={vi.fn()}
        repoPath="/test/repo"
        tagName="v1.0.0"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders warning with tag name and target commit SHA", () => {
    render(
      <DeleteTagModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        tagName="v1.0.0"
        targetCommitId="f1e2d3c4b5a6"
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("f1e2d3c")).toBeInTheDocument();
    expect(
      screen.getByText(/bạn có chắc chắn muốn xoá thẻ sau đây không/i)
    ).toBeInTheDocument();
  });

  it("shows remote delete checkbox only when hasRemote is true", () => {
    const { rerender } = render(
      <DeleteTagModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        tagName="v1.0.0"
        hasRemote={false}
      />
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    rerender(
      <DeleteTagModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        tagName="v1.0.0"
        hasRemote={true}
      />
    );
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("submits local deletion via invokeCommand.deleteTag", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    (invokeCommand.deleteTag as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(
      <DeleteTagModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        tagName="v1.0.0"
        hasRemote={false}
      />
    );

    const deleteBtn = screen.getByRole("button", { name: /xoá thẻ/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(invokeCommand.deleteTag).toHaveBeenCalledWith(
        "/test/repo",
        "v1.0.0",
        false
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("submits remote deletion when deleteRemote checkbox is checked", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    (invokeCommand.deleteTag as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(
      <DeleteTagModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        tagName="v1.0.0"
        hasRemote={true}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const deleteBtn = screen.getByRole("button", { name: /xoá thẻ/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(invokeCommand.deleteTag).toHaveBeenCalledWith(
        "/test/repo",
        "v1.0.0",
        true
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("displays error message on failure", async () => {
    (invokeCommand.deleteTag as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Remote rejected")
    );

    render(
      <DeleteTagModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        tagName="v1.0.0"
      />
    );

    const deleteBtn = screen.getByRole("button", { name: /xoá thẻ/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/không thể xoá thẻ: Remote rejected/i)
      ).toBeInTheDocument();
    });
  });

  it("closes when cancel button is clicked or Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <DeleteTagModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        tagName="v1.0.0"
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /huỷ/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
