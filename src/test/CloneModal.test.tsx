import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CloneModal } from "../components/welcome/CloneModal";
import { invokeCommand } from "../ipc/client";

describe("CloneModal", () => {
  const mockOnClose = vi.fn();
  const mockOnCloneSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <CloneModal isOpen={false} onClose={mockOnClose} onCloneSuccess={mockOnCloneSuccess} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders URL and Target Directory inputs when isOpen is true", () => {
    render(<CloneModal isOpen={true} onClose={mockOnClose} onCloneSuccess={mockOnCloneSuccess} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/URL kho chứa|Repository URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thư mục đích|Target Directory/i)).toBeInTheDocument();
  });

  it("auto-suggests target directory when URL is entered", () => {
    render(<CloneModal isOpen={true} onClose={mockOnClose} onCloneSuccess={mockOnCloneSuccess} />);

    const urlInput = screen.getByLabelText(/URL kho chứa|Repository URL/i);
    fireEvent.change(urlInput, {
      target: { value: "https://github.com/owner/cool-project.git" },
    });

    const dirInput = screen.getByLabelText(/Thư mục đích|Target Directory/i) as HTMLInputElement;
    expect(dirInput.value).toContain("cool-project");
  });

  it("allows selecting folder using directory picker", async () => {
    vi.spyOn(invokeCommand, "selectRepoFolder").mockResolvedValue("D:/Projects");

    render(<CloneModal isOpen={true} onClose={mockOnClose} onCloneSuccess={mockOnCloneSuccess} />);

    const browseBtn = screen.getByRole("button", { name: /chọn thư mục|browse folder/i });
    fireEvent.click(browseBtn);

    await waitFor(() => {
      const dirInput = screen.getByLabelText(/Thư mục đích|Target Directory/i) as HTMLInputElement;
      expect(dirInput.value).toContain("D:/Projects");
    });
  });

  it("triggers cloneRepo and onCloneSuccess on submit", async () => {
    const cloneSpy = vi.spyOn(invokeCommand, "cloneRepo").mockResolvedValue("Clone ok");
    const openSpy = vi.spyOn(invokeCommand, "openRepository").mockResolvedValue({
      path: "D:/Projects/my-app",
      name: "my-app",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc",
    });

    render(<CloneModal isOpen={true} onClose={mockOnClose} onCloneSuccess={mockOnCloneSuccess} />);

    const urlInput = screen.getByLabelText(/URL kho chứa|Repository URL/i);
    fireEvent.change(urlInput, {
      target: { value: "https://github.com/owner/my-app.git" },
    });

    const dirInput = screen.getByLabelText(/Thư mục đích|Target Directory/i);
    fireEvent.change(dirInput, {
      target: { value: "D:/Projects/my-app" },
    });

    const cloneSubmitBtn = screen.getByRole("button", { name: /^clone$/i });
    fireEvent.click(cloneSubmitBtn);

    await waitFor(() => {
      expect(cloneSpy).toHaveBeenCalledWith(
        "https://github.com/owner/my-app.git",
        "D:/Projects/my-app",
        expect.any(String)
      );
      expect(openSpy).toHaveBeenCalledWith("D:/Projects/my-app");
      expect(mockOnCloneSuccess).toHaveBeenCalled();
    });
  });

  it("closes modal on cancel button click", () => {
    render(<CloneModal isOpen={true} onClose={mockOnClose} onCloneSuccess={mockOnCloneSuccess} />);

    const cancelBtn = screen.getByRole("button", { name: /huỷ|cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
