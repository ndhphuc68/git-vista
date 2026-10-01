import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { CheckoutConflictModal } from "../features/branch";
import { invokeCommand } from "../ipc/client";
import { useRepoStore } from "../store/useRepoStore";
import { useToastStore } from "../store/useToastStore";
import { qk } from "../domain/queryKeys";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CheckoutConflictModal", () => {
  it("does not render when isOpen is false", () => {
    renderWithClient(
      <CheckoutConflictModal
        isOpen={false}
        onClose={vi.fn()}
        targetBranch="feature/next"
        errorMessage="CHECKOUT_CONFLICT: file1.txt"
        onNavigateToChanges={vi.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders conflict details and navigates to changes", () => {
    const onClose = vi.fn();
    const onNavigateToChanges = vi.fn();

    renderWithClient(
      <CheckoutConflictModal
        isOpen={true}
        onClose={onClose}
        targetBranch="feature/next"
        errorMessage="CHECKOUT_CONFLICT: file1.txt"
        onNavigateToChanges={onNavigateToChanges}
      />
    );

    expect(screen.getByText("feature/next")).toBeInTheDocument();
    expect(screen.getByText("file1.txt")).toBeInTheDocument();

    const navigateBtn = screen.getByRole("button", { name: /đến màn hình thay đổi/i });
    fireEvent.click(navigateBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onNavigateToChanges).toHaveBeenCalled();
  });

  it("renders stash and checkout button and handles stash-and-checkout action", async () => {
    const saveStashSpy = vi.spyOn(invokeCommand, "saveStash").mockResolvedValue("stash123");
    const checkoutBranchSpy = vi
      .spyOn(invokeCommand, "checkoutBranch")
      .mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithClient(
      <CheckoutConflictModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        targetBranch="feature/next"
        errorMessage="CHECKOUT_CONFLICT: file1.txt"
        onNavigateToChanges={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    const stashBtn = screen.getByRole("button", { name: /lưu tạm \(stash\) rồi chuyển nhánh/i });
    expect(stashBtn).toBeInTheDocument();
    fireEvent.click(stashBtn);

    await waitFor(() => {
      expect(saveStashSpy).toHaveBeenCalledWith(
        "/test/repo",
        expect.stringContaining("feature/next"),
        true
      );
      expect(checkoutBranchSpy).toHaveBeenCalledWith("/test/repo", "feature/next");
      expect(onClose).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    saveStashSpy.mockRestore();
    checkoutBranchSpy.mockRestore();
  });
  // Pinned before migrating onto the shared Modal: nothing covered the shell
  // (Escape, the close button), which is what the migration replaces.
  describe("closing", () => {
    const props = {
      isOpen: true,
      targetBranch: "feature/next",
      errorMessage: "CHECKOUT_CONFLICT: file1.txt",
      onNavigateToChanges: vi.fn(),
    };

    it("closes on Escape", () => {
      const onClose = vi.fn();
      renderWithClient(<CheckoutConflictModal {...props} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      renderWithClient(<CheckoutConflictModal {...props} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on the header close button", () => {
      const onClose = vi.fn();
      renderWithClient(<CheckoutConflictModal {...props} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText("Đóng"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("is labelled by its title for screen readers", () => {
      renderWithClient(<CheckoutConflictModal {...props} onClose={vi.fn()} />);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      const labelledBy = dialog.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toBeTruthy();
    });

    it("hides the stash action when no repo path is given", () => {
      renderWithClient(<CheckoutConflictModal {...props} onClose={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /stash/i })).not.toBeInTheDocument();
    });
  });
});

describe("CheckoutConflictModal - after stash-and-checkout", () => {
  it("selects the checked-out local branch and shows a success toast", async () => {
    const item = (name: string) => ({
      name,
      is_head: false,
      target_commit_id: "abc",
      upstream: null,
      ahead: 0,
      behind: 0,
    });
    vi.spyOn(invokeCommand, "getBranches").mockResolvedValue({
      current_branch: "main",
      is_detached: false,
      local: [item("main")],
      remote: [item("origin/feature/next")],
      tags: [],
    });
    const saveStashSpy = vi.spyOn(invokeCommand, "saveStash").mockResolvedValue("stash123");
    const checkoutBranchSpy = vi
      .spyOn(invokeCommand, "checkoutBranch")
      .mockResolvedValue(undefined);
    useRepoStore.getState().setSelectedBranch("main");
    useToastStore.setState({ toasts: [] });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CheckoutConflictModal
          isOpen={true}
          onClose={vi.fn()}
          repoPath="/test/repo"
          targetBranch="origin/feature/next"
          errorMessage="CHECKOUT_CONFLICT: file1.txt"
          onNavigateToChanges={vi.fn()}
        />
      </QueryClientProvider>
    );

    await waitFor(() => expect(client.getQueryData(qk.branches("/test/repo"))).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /lưu tạm \(stash\) rồi chuyển nhánh/i }));

    await waitFor(() => {
      expect(checkoutBranchSpy).toHaveBeenCalledWith("/test/repo", "origin/feature/next");
      expect(useRepoStore.getState().selectedBranch).toBe("feature/next");
    });
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((toast) => toast.type === "success")).toBe(true);

    saveStashSpy.mockRestore();
    checkoutBranchSpy.mockRestore();
    vi.mocked(invokeCommand.getBranches).mockRestore();
  });
});

describe("CheckoutConflictModal - checkout fails after the auto-stash", () => {
  function renderModal(onClose = vi.fn()) {
    renderWithClient(
      <CheckoutConflictModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        targetBranch="feature/next"
        errorMessage="CHECKOUT_CONFLICT: file1.txt"
        onNavigateToChanges={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /lưu tạm \(stash\) rồi chuyển nhánh/i }));
    return onClose;
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(invokeCommand, "saveStash").mockResolvedValue("stash123");
    vi.spyOn(invokeCommand, "checkoutBranch").mockRejectedValue({
      type: "Git",
      message: "index is locked",
    });
  });

  it("pops the auto-stash back and says the changes were restored", async () => {
    const popSpy = vi.spyOn(invokeCommand, "popStash").mockResolvedValue(undefined);

    const onClose = renderModal();

    expect(
      await screen.findByText(/index is locked.*đã được khôi phục từ Stash/i)
    ).toBeInTheDocument();
    expect(popSpy).toHaveBeenCalledWith("/test/repo", 0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("names the stash holding the changes when the pop fails too", async () => {
    vi.spyOn(invokeCommand, "popStash").mockRejectedValue({
      type: "Git",
      message: "pop conflict",
    });

    renderModal();

    expect(
      await screen.findByText(/vẫn được lưu an toàn trong Stash ".*feature\/next"/i)
    ).toBeInTheDocument();
  });

  it("does not pop anything when the stash itself fails", async () => {
    vi.mocked(invokeCommand.saveStash).mockRejectedValue({ type: "Git", message: "no space" });
    const popSpy = vi.spyOn(invokeCommand, "popStash").mockResolvedValue(undefined);

    renderModal();

    expect(await screen.findByText(/Lỗi khi Stash & chuyển nhánh: no space/)).toBeInTheDocument();
    expect(popSpy).not.toHaveBeenCalled();
  });
});
