import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManageRemotesModal } from "../components/remote/ManageRemotesModal";
import { AddEditRemoteModal } from "../components/remote/AddEditRemoteModal";
import { PruneConfirmModal } from "../components/remote/PruneConfirmModal";
import { DeleteRemoteModal } from "../components/remote/DeleteRemoteModal";
import { invokeCommand } from "../ipc/client";
import { Z_INDEX } from "../domain/constants/zIndex";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    getRemotes: vi.fn(),
    addRemote: vi.fn(),
    renameRemote: vi.fn(),
    removeRemote: vi.fn(),
    setRemoteUrl: vi.fn(),
    pruneRemote: vi.fn(),
  },
}));

const mockRemotesData = [
  {
    name: "origin",
    fetch_url: "https://github.com/gitvista/git-vista.git",
    push_url: "https://github.com/gitvista/git-vista.git",
    branch_count: 5,
    is_default: true,
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("ManageRemotesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invokeCommand.getRemotes).mockResolvedValue(mockRemotesData);
    vi.mocked(invokeCommand.addRemote).mockResolvedValue({
      name: "upstream",
      fetch_url: "https://github.com/upstream/repo.git",
      push_url: "https://github.com/upstream/repo.git",
      branch_count: 0,
      is_default: false,
    });
    vi.mocked(invokeCommand.pruneRemote).mockResolvedValue({
      remote: "origin",
      pruned_branches: ["origin/stale-branch"],
      message: "Đã dọn dẹp 1 nhánh remote.",
    });
    vi.mocked(invokeCommand.removeRemote).mockResolvedValue(undefined);
  });

  it("does not render when isOpen is false", () => {
    renderWithClient(<ManageRemotesModal isOpen={false} onClose={vi.fn()} repoPath="/test/repo" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders list of remotes with badges and URLs", async () => {
    renderWithClient(<ManageRemotesModal isOpen={true} onClose={vi.fn()} repoPath="/test/repo" />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("origin")).toBeInTheDocument();
      expect(screen.getByText("https://github.com/gitvista/git-vista.git")).toBeInTheDocument();
      expect(screen.getByText(/5 nhánh/i)).toBeInTheDocument();
      expect(screen.getByText(/Mặc định/i)).toBeInTheDocument();
    });
  });

  // The previous version of this test pinned the literal class "z-[9999]" on
  // the transition wrapper. That hardcoded magic number is exactly what the
  // shared Modal replaced with Z_INDEX, so keeping it would have frozen the
  // defect in place (convention #4). The replacement asserts the property
  // that actually matters and derives it from Z_INDEX rather than a literal.
  it("renders a fullscreen overlay on the base modal layer, below stacked children", () => {
    renderWithClient(
      <ManageRemotesModal isOpen={true} onClose={vi.fn()} repoPath="/test/repo" />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("fixed", "inset-0");
    expect(dialog.style.zIndex).toBe(String(Z_INDEX.modal));

    // The three sub-modals render with `stacked`, so the parent must sit
    // strictly below them or a child's backdrop would fall behind its parent.
    expect(Z_INDEX.modal).toBeLessThan(Z_INDEX.modalStacked);

    const transitionContainer = dialog.parentElement;
    expect(transitionContainer).toHaveClass("animate-fade-in");
    expect(transitionContainer).not.toHaveClass("animate-scale-in");
  });

  // This is the case the stacked/Escape-registry work in Phase 0 existed for,
  // and the reason this modal was migrated last. Before that registry, each
  // modal attached its own window listener and a single Escape press closed
  // the whole stack; ManageRemotesModal worked around it with a manual
  // "ignore Escape while a sub-modal is open" guard, which the migration
  // deleted. These tests make sure the primitive really does replace it.
  describe("nested sub-modals", () => {
    it("Escape closes only the sub-modal, leaving the parent open", async () => {
      const onClose = vi.fn();
      renderWithClient(
        <ManageRemotesModal isOpen={true} onClose={onClose} repoPath="/test/repo" />
      );

      fireEvent.click(screen.getAllByRole("button", { name: /Thêm Remote/i })[0]!);
      await screen.findByPlaceholderText(/ví dụ: origin, upstream/i);

      fireEvent.keyDown(window, { key: "Escape" });

      // The child closed, the parent did not get an onClose call.
      await waitFor(() =>
        expect(screen.queryByPlaceholderText(/ví dụ: origin, upstream/i)).not.toBeInTheDocument()
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it("Escape closes the parent once no sub-modal is open", async () => {
      const onClose = vi.fn();
      renderWithClient(
        <ManageRemotesModal isOpen={true} onClose={onClose} repoPath="/test/repo" />
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders the sub-modal above the parent", async () => {
      renderWithClient(
        <ManageRemotesModal isOpen={true} onClose={vi.fn()} repoPath="/test/repo" />
      );

      fireEvent.click(screen.getAllByRole("button", { name: /Thêm Remote/i })[0]!);
      await screen.findByPlaceholderText(/ví dụ: origin, upstream/i);

      const layers = screen.getAllByRole("dialog").map((d) => Number(d.style.zIndex));
      expect(Math.max(...layers)).toBe(Z_INDEX.modalStacked);
      expect(Math.min(...layers)).toBe(Z_INDEX.modal);
    });
  });

  it("opens AddEditRemoteModal and submits new remote", async () => {
    renderWithClient(
      <AddEditRemoteModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        onSuccess={vi.fn()}
      />
    );

    const nameInput = screen.getByPlaceholderText(/ví dụ: origin, upstream/i);
    const urlInput = screen.getByPlaceholderText(/https:\/\/github\.com/i);

    fireEvent.change(nameInput, { target: { value: "upstream" } });
    fireEvent.change(urlInput, {
      target: { value: "https://github.com/upstream/repo.git" },
    });

    const submitBtn = screen.getByRole("button", { name: /Thêm Remote/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.addRemote).toHaveBeenCalledWith(
        "/test/repo",
        "upstream",
        "https://github.com/upstream/repo.git"
      );
    });
  });

  it("opens PruneConfirmModal and calls pruneRemote", async () => {
    const onSuccess = vi.fn();
    renderWithClient(
      <PruneConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        remoteName="origin"
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Dọn dẹp nhánh mồ côi/i)).toBeInTheDocument();
    expect(screen.getByText("origin")).toBeInTheDocument();

    const pruneBtn = screen.getByRole("button", { name: /Dọn dẹp ngay/i });
    fireEvent.click(pruneBtn);

    await waitFor(() => {
      expect(invokeCommand.pruneRemote).toHaveBeenCalledWith("/test/repo", "origin");
      expect(onSuccess).toHaveBeenCalledWith(["origin/stale-branch"]);
    });
  });

  it("opens DeleteRemoteModal and calls removeRemote", async () => {
    const onSuccess = vi.fn();
    renderWithClient(
      <DeleteRemoteModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        remote={mockRemotesData[0]!}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Xoá máy chủ từ xa/i)).toBeInTheDocument();
    expect(screen.getByText("origin")).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /Xoá Remote/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(invokeCommand.removeRemote).toHaveBeenCalledWith("/test/repo", "origin");
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
