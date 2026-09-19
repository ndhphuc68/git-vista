import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateBranchModal } from "../features/branch";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    createBranch: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CreateBranchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    renderWithClient(<CreateBranchModal isOpen={false} onClose={vi.fn()} repoPath="/test/repo" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with input focused, auto-sanitizes spaces to dash, and creates branch", async () => {
    const onClose = vi.fn();
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

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

    renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

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

  // The existing tests above cover the business logic but nothing covered the
  // shell — Escape, the backdrop and the close button — which is exactly what
  // the migration onto the shared Modal replaces. These pin that behaviour
  // before the swap (convention #5).
  describe("closing", () => {
    it("closes on Escape", () => {
      const onClose = vi.fn();
      renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      renderWithClient(
        <CreateBranchModal isOpen={false} onClose={onClose} repoPath="/test/repo" />
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on the header close button", () => {
      const onClose = vi.fn();
      renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

      fireEvent.click(screen.getByLabelText("Đóng"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on cancel without creating anything", () => {
      const onClose = vi.fn();
      renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

      fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(invokeCommand.createBranch).not.toHaveBeenCalled();
    });
  });

  it("is labelled by its title for screen readers", () => {
    renderWithClient(<CreateBranchModal isOpen={true} onClose={vi.fn()} repoPath="/test/repo" />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent(/tạo nhánh mới/i);
  });

  it("shows the source commit when creating from one", () => {
    renderWithClient(
      <CreateBranchModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit="f1e2d3c4b5a6978"
      />
    );

    expect(screen.getByText("f1e2d3c")).toBeInTheDocument();
  });

  it("surfaces the error and stays open when creating fails", async () => {
    const onClose = vi.fn();
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("branch already exists")
    );

    renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);
    fireEvent.change(screen.getByLabelText("Tên nhánh mới"), { target: { value: "dup" } });
    fireEvent.click(screen.getByRole("button", { name: /tạo nhánh/i }));

    expect(await screen.findByText(/branch already exists/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
