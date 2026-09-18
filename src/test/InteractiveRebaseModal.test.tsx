import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InteractiveRebaseModal } from "../components/rebase/InteractiveRebaseModal";
import { invokeCommand } from "../ipc/client";
import { useRepoStore } from "../store/useRepoStore";
import type { RebaseCommitItem } from "../ipc/bindings";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    getRebaseCommits: vi.fn(),
    executeInteractiveRebase: vi.fn(),
    undoCommit: vi.fn(),
  },
}));

const mockCommits: RebaseCommitItem[] = [
  {
    id: "1111111111111111111111111111111111111111",
    short_id: "1111111",
    summary: "Commit One",
    message: "Commit One\n\nDetailed body 1",
    author_name: "Dev 1",
    author_email: "dev1@example.com",
    timestamp: 1700000000,
    parent_ids: ["0000000000000000000000000000000000000000"],
  },
  {
    id: "2222222222222222222222222222222222222222",
    short_id: "2222222",
    summary: "Commit Two",
    message: "Commit Two",
    author_name: "Dev 2",
    author_email: "dev2@example.com",
    timestamp: 1700001000,
    parent_ids: ["1111111111111111111111111111111111111111"],
  },
  {
    id: "3333333333333333333333333333333333333333",
    short_id: "3333333",
    summary: "Commit Three",
    message: "Commit Three",
    author_name: "Dev 3",
    author_email: "dev3@example.com",
    timestamp: 1700002000,
    parent_ids: ["2222222222222222222222222222222222222222"],
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("InteractiveRebaseModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRepoStore.setState({
      currentRepo: { path: "/mock/repo", name: "mock-repo" } as any,
    });
    vi.mocked(invokeCommand.getRebaseCommits).mockResolvedValue(mockCommits);
    vi.mocked(invokeCommand.executeInteractiveRebase).mockResolvedValue({
      success: true,
      status: "Success",
      head_commit_id: "new-head-oid",
      undo_token: "refs/gitui-backup/commit-undo-123",
      output: "Rebased successfully",
    });
  });

  it("renders commits list and controls correctly", async () => {
    renderWithClient(
      <InteractiveRebaseModal
        isOpen={true}
        baseCommitId="0000000000000000000000000000000000000000"
        baseCommitSummary="Initial base"
        repoPath="/mock/repo"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText("Commit One")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Commit Two")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Commit Three")[0]).toBeInTheDocument();
    });

    // Check action buttons exist
    const pickButtons = screen.getAllByRole("button", { name: /pick/i });
    expect(pickButtons.length).toBe(3);
  });

  it("disables Squash and Fixup for the first commit in the list", async () => {
    renderWithClient(
      <InteractiveRebaseModal
        isOpen={true}
        baseCommitId="0000000000000000000000000000000000000000"
        repoPath="/mock/repo"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText("Commit One")[0]).toBeInTheDocument();
    });

    const squashButtons = screen.getAllByRole("button", { name: /squash/i });
    expect(squashButtons[0]).toBeDisabled();
    expect(squashButtons[1]).not.toBeDisabled();
  });

  it("opens inline textarea when Reword is selected and updates message", async () => {
    renderWithClient(
      <InteractiveRebaseModal
        isOpen={true}
        baseCommitId="0000000000000000000000000000000000000000"
        repoPath="/mock/repo"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText("Commit Two")[0]).toBeInTheDocument();
    });

    const rewordButtons = screen.getAllByRole("button", { name: /reword/i });
    fireEvent.click(rewordButtons[1]!); // Reword Commit Two

    // Textarea appears
    const textarea = screen.getByPlaceholderText(
      /nhập thông điệp commit mới|enter new commit message/i
    );
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, {
      target: { value: "Updated Commit Two Message" },
    });
    expect(textarea).toHaveValue("Updated Commit Two Message");
  });

  it("updates live preview metrics when actions change", async () => {
    renderWithClient(
      <InteractiveRebaseModal
        isOpen={true}
        baseCommitId="0000000000000000000000000000000000000000"
        repoPath="/mock/repo"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText("Commit Three")[0]).toBeInTheDocument();
    });

    // Drop commit 3
    const dropButtons = screen.getAllByRole("button", { name: /drop/i });
    fireEvent.click(dropButtons[2]!);

    // Live preview shows 1 dropped
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument(); // Dropped metric
    });
  });

  it("submits the rebase plan and triggers success callback", async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    renderWithClient(
      <InteractiveRebaseModal
        isOpen={true}
        baseCommitId="0000000000000000000000000000000000000000"
        repoPath="/mock/repo"
        onClose={handleClose}
        onRebaseSuccess={handleSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText("Commit One")[0]).toBeInTheDocument();
    });

    const startButton = screen.getByRole("button", {
      name: /bắt đầu rebase|start rebase/i,
    });
    expect(startButton).toBeEnabled();
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(invokeCommand.executeInteractiveRebase).toHaveBeenCalledWith(
        "/mock/repo",
        "0000000000000000000000000000000000000000",
        expect.any(Array),
        true
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
