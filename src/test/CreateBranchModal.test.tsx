import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateBranchModal } from "../components/sidebar/CreateBranchModal";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    createBranch: vi.fn(),
  },
}));

describe("CreateBranchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<CreateBranchModal isOpen={false} onClose={vi.fn()} repoPath="/test/repo" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with input focused, auto-sanitizes spaces to dash, and creates branch", async () => {
    const onClose = vi.fn();
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

    const input = screen.getByLabelText("Tên nhánh mới");
    expect(input).toBeInTheDocument();

    // Type name with spaces
    fireEvent.change(input, { target: { value: "feature awesome login" } });
    expect(input).toHaveValue("feature-awesome-login");

    const submitBtn = screen.getByRole("button", { name: /tạo nhánh/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.createBranch).toHaveBeenCalledWith(
        "/test/repo",
        "feature-awesome-login",
        undefined,
        true
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("toggles checkout checkbox and respects unchecked state", async () => {
    const onClose = vi.fn();
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

    const input = screen.getByLabelText("Tên nhánh mới");
    fireEvent.change(input, { target: { value: "quick-fix" } });

    const checkbox = screen.getByLabelText("Chuyển sang nhánh mới sau khi tạo") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    const submitBtn = screen.getByRole("button", { name: /tạo nhánh/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.createBranch).toHaveBeenCalledWith(
        "/test/repo",
        "quick-fix",
        undefined,
        false
      );
    });
  });
});
