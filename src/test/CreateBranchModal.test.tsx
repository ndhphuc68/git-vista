import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateBranchModal } from "../features/branch";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    createBranch: vi.fn(),
    getBranches: vi.fn(),
  },
}));

const mockBranches = {
  current_branch: "main",
  is_detached: false,
  local: [
    {
      name: "main",
      is_head: true,
      target_commit_id: "c1",
      upstream: "origin/main",
      ahead: 0,
      behind: 0,
    },
    {
      name: "feature/existing",
      is_head: false,
      target_commit_id: "c2",
      upstream: null,
      ahead: 0,
      behind: 0,
    },
  ],
  remote: [
    {
      name: "origin/main",
      is_head: false,
      target_commit_id: "c1",
      upstream: null,
      ahead: 0,
      behind: 0,
    },
    {
      name: "origin/develop",
      is_head: false,
      target_commit_id: "c3",
      upstream: null,
      ahead: 0,
      behind: 0,
    },
  ],
  tags: [],
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CreateBranchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (invokeCommand.getBranches as ReturnType<typeof vi.fn>).mockResolvedValue(mockBranches);
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

    expect(screen.getByRole("button", { name: /f1e2d3c/i })).toBeInTheDocument();
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

  it("explains a checkout conflict instead of showing the raw error code", async () => {
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockRejectedValue({
      type: "InvalidOperation",
      message: "CHECKOUT_CONFLICT: Không thể chuyển sang nhánh 'feature/x'",
    });

    renderWithClient(<CreateBranchModal isOpen={true} onClose={vi.fn()} repoPath="/test/repo" />);
    fireEvent.change(screen.getByLabelText("Tên nhánh mới"), { target: { value: "feature/x" } });
    fireEvent.click(screen.getByRole("button", { name: /tạo nhánh/i }));

    expect(
      await screen.findByText(/thay đổi chưa lưu có thể bị ghi đè.*Stash/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/CHECKOUT_CONFLICT/)).not.toBeInTheDocument();
  });

  it("shows the source branch and creates the new branch from its ref", async () => {
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithClient(
      <CreateBranchModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit="refs/remotes/origin/develop"
        sourceBranch="origin/develop"
      />
    );

    expect(screen.getByText("Xuất phát từ nhánh:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /origin\/develop/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tên nhánh mới"), { target: { value: "feature/y" } });
    fireEvent.click(screen.getByRole("button", { name: /tạo nhánh/i }));

    await waitFor(() => {
      expect(invokeCommand.createBranch).toHaveBeenCalledWith(
        "/test/repo",
        "feature/y",
        "refs/remotes/origin/develop",
        true
      );
    });
  });

  it("renders base branch selector with local and remote branches and defaults to current branch", async () => {
    renderWithClient(<CreateBranchModal isOpen={true} onClose={vi.fn()} repoPath="/test/repo" />);

    const select = await screen.findByLabelText("Xuất phát từ nhánh");
    expect(select).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: /^main/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /^feature\/existing/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /^origin\/develop/i })).toBeInTheDocument();
  });

  it("allows selecting a different base branch and creates new branch from that selected branch", async () => {
    const onClose = vi.fn();
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

    const select = await screen.findByLabelText("Xuất phát từ nhánh");
    await screen.findByRole("option", { name: /feature\/existing/i });
    fireEvent.change(select, { target: { value: "refs/heads/feature/existing" } });

    const input = screen.getByLabelText("Tên nhánh mới");
    fireEvent.change(input, { target: { value: "feature/from-other" } });

    const submitBtn = screen.getByRole("button", { name: /tạo nhánh/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.createBranch).toHaveBeenCalledWith(
        "/test/repo",
        "feature/from-other",
        "refs/heads/feature/existing",
        true
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("allows switching from a source commit to a different branch", async () => {
    const onClose = vi.fn();
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithClient(
      <CreateBranchModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        targetCommit="f1e2d3c4b5a6978"
      />
    );

    const select = await screen.findByLabelText("Xuất phát từ nhánh");
    expect(screen.getByRole("option", { name: /f1e2d3c/i })).toBeInTheDocument();

    await screen.findByRole("option", { name: /origin\/develop/i });
    // Switch to remote branch
    fireEvent.change(select, { target: { value: "refs/remotes/origin/develop" } });

    const input = screen.getByLabelText("Tên nhánh mới");
    fireEvent.change(input, { target: { value: "feature/from-remote" } });

    const submitBtn = screen.getByRole("button", { name: /tạo nhánh/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.createBranch).toHaveBeenCalledWith(
        "/test/repo",
        "feature/from-remote",
        "refs/remotes/origin/develop",
        true
      );
    });
  });

  it("opens custom dropdown and allows picking a branch by clicking", async () => {
    const onClose = vi.fn();
    (invokeCommand.createBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithClient(<CreateBranchModal isOpen={true} onClose={onClose} repoPath="/test/repo" />);

    // Wait for branches to load
    await screen.findByRole("option", { name: /^feature\/existing/i });

    // Click custom trigger button (which has aria-haspopup="listbox")
    const triggerBtn = screen.getByRole("button", { name: /main.*HEAD/i });
    expect(triggerBtn).toBeInTheDocument();
    fireEvent.click(triggerBtn);

    // Menu should be open with search input
    const searchInput = screen.getByPlaceholderText("Lọc nhánh...");
    expect(searchInput).toBeInTheDocument();

    // Click on feature/existing in the dropdown list
    const branchItemBtn = screen.getByRole("button", { name: "feature/existing" });
    fireEvent.click(branchItemBtn);

    // Popover should close
    expect(screen.queryByPlaceholderText("Lọc nhánh...")).not.toBeInTheDocument();

    // Trigger button now shows feature/existing
    expect(screen.getByRole("button", { name: /feature\/existing/i })).toBeInTheDocument();

    // Type branch name and submit
    fireEvent.change(screen.getByLabelText("Tên nhánh mới"), { target: { value: "test-new" } });
    fireEvent.click(screen.getByRole("button", { name: /tạo nhánh/i }));

    await waitFor(() => {
      expect(invokeCommand.createBranch).toHaveBeenCalledWith(
        "/test/repo",
        "test-new",
        "refs/heads/feature/existing",
        true
      );
    });
  });

  it("filters branch list when typing into search input in custom dropdown", async () => {
    renderWithClient(<CreateBranchModal isOpen={true} onClose={vi.fn()} repoPath="/test/repo" />);

    await screen.findByRole("option", { name: /^origin\/develop/i });

    const triggerBtn = screen.getByRole("button", { name: /main.*HEAD/i });
    fireEvent.click(triggerBtn);

    const searchInput = screen.getByPlaceholderText("Lọc nhánh...");
    fireEvent.change(searchInput, { target: { value: "develop" } });

    // origin/develop should be visible, others filtered out
    expect(screen.getByRole("button", { name: "origin/develop" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "feature/existing" })).not.toBeInTheDocument();
  });
});
