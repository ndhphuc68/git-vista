import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManageRemotesModal } from "../components/remote/ManageRemotesModal";
import { AddEditRemoteModal } from "../components/remote/AddEditRemoteModal";
import { PruneConfirmModal } from "../components/remote/PruneConfirmModal";
import { DeleteRemoteModal } from "../components/remote/DeleteRemoteModal";
import { invokeCommand } from "../ipc/client";

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
