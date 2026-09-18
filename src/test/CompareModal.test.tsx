import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompareModal } from "../components/compare/CompareModal";
import { invokeCommand } from "../ipc/client";
import type { CompareSummary, FileDiffResult } from "../ipc/bindings";

const mockSummary: CompareSummary = {
  base_rev: "main",
  target_rev: "feature/login",
  resolved_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  resolved_target_oid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  effective_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  merge_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  mode: "MergeBase",
  ahead_count: 2,
  behind_count: 0,
  commits: [
    {
      id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      short_id: "a1b2c3d",
      summary: "Add user login form",
      author_name: "Alice Developer",
      author_email: "alice@example.com",
      timestamp: 1700000000,
      parent_ids: ["b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"],
    },
    {
      id: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
      short_id: "b2c3d4e",
      summary: "Setup auth middleware",
      author_name: "Bob Engineer",
      author_email: "bob@example.com",
      timestamp: 1699990000,
      parent_ids: ["c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"],
    },
  ],
  files: [
    {
      path: "src/LoginForm.tsx",
      old_path: null,
      status: "Added",
      additions: 45,
      deletions: 0,
      is_binary: false,
    },
    {
      path: "src/authMiddleware.ts",
      old_path: null,
      status: "Modified",
      additions: 12,
      deletions: 4,
      is_binary: false,
    },
  ],
  total_additions: 57,
  total_deletions: 4,
};

const mockDiffResult: FileDiffResult = {
  file_path: "src/LoginForm.tsx",
  status: "added",
  additions: 3,
  deletions: 0,
  hunks: [
    {
      header: "@@ -0,0 +1,3 @@",
      old_start: 0,
      old_lines: 0,
      new_start: 1,
      new_lines: 3,
      lines: [
        { line_type: "add", content: "+export const LoginForm = () => {\n", old_lineno: null, new_lineno: 1 },
        { line_type: "add", content: "+  return <form>Login</form>;\n", old_lineno: null, new_lineno: 2 },
        { line_type: "add", content: "+};\n", old_lineno: null, new_lineno: 3 },
      ],
    },
  ],
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CompareModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(invokeCommand, "compareCommits").mockResolvedValue(mockSummary);
    vi.spyOn(invokeCommand, "getCompareFileDiff").mockResolvedValue(mockDiffResult);
  });

  it("does not render when isOpen is false", () => {
    renderWithClient(
      <CompareModal
        isOpen={false}
        onClose={vi.fn()}
        repoPath="/test/repo"
        initialBaseRev="main"
        initialTargetRev="feature/login"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal dialog and header controls when open", async () => {
    renderWithClient(
      <CompareModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        initialBaseRev="main"
        initialTargetRev="feature/login"
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Check base and target revision input fields
    const baseInput = screen.getByRole("combobox", { name: /Gốc \(Base\)|Base/i });
    const targetInput = screen.getByRole("combobox", { name: /So với \(Target\)|Target/i });
    expect(baseInput).toHaveValue("main");
    expect(targetInput).toHaveValue("feature/login");

    // Wait for comparison summary to load
    await waitFor(() => {
      expect(screen.getByText("src/LoginForm.tsx")).toBeInTheDocument();
      expect(screen.getByText("src/authMiddleware.ts")).toBeInTheDocument();
    });
  });

  it("swaps base and target revisions when swap button is clicked", async () => {
    renderWithClient(
      <CompareModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        initialBaseRev="main"
        initialTargetRev="feature/login"
      />
    );

    const swapButton = screen.getByRole("button", { name: /Đổi chiều so sánh|Swap base and target/i });
    fireEvent.click(swapButton);

    const baseInput = screen.getByRole("combobox", { name: /Gốc \(Base\)|Base/i });
    const targetInput = screen.getByRole("combobox", { name: /So với \(Target\)|Target/i });

    expect(baseInput).toHaveValue("feature/login");
    expect(targetInput).toHaveValue("main");
  });

  it("switches tabs between Files and Commits", async () => {
    renderWithClient(
      <CompareModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        initialBaseRev="main"
        initialTargetRev="feature/login"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("src/LoginForm.tsx")).toBeInTheDocument();
    });

    // Switch to commits tab
    const commitsTab = screen.getByRole("button", { name: /Commit \(2\)|Commits \(2\)/i });
    fireEvent.click(commitsTab);

    // Expect commit summaries to be visible
    expect(screen.getByText("Add user login form")).toBeInTheDocument();
    expect(screen.getByText("Setup auth middleware")).toBeInTheDocument();
    expect(screen.getByText("Alice Developer")).toBeInTheDocument();
    expect(screen.getByText("Bob Engineer")).toBeInTheDocument();
  });

  it("changes comparison mode between MergeBase and Direct", async () => {
    renderWithClient(
      <CompareModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        initialBaseRev="main"
        initialTargetRev="feature/login"
      />
    );

    const directButton = screen.getByRole("button", { name: /Trực tiếp \(A\.\.B\)|Direct \(A\.\.B\)/i });
    fireEvent.click(directButton);

    await waitFor(() => {
      expect(invokeCommand.compareCommits).toHaveBeenCalledWith(
        "/test/repo",
        "main",
        "feature/login",
        "Direct"
      );
    });
  });

  it("renders file diff when a file is selected", async () => {
    renderWithClient(
      <CompareModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        initialBaseRev="main"
        initialTargetRev="feature/login"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("+export const LoginForm = () => {")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button or Escape key is pressed", async () => {
    const onClose = vi.fn();
    renderWithClient(
      <CompareModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        initialBaseRev="main"
        initialTargetRev="feature/login"
      />
    );

    // Close button click
    const closeBtn = screen.getByRole("button", { name: /Đóng|Close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
