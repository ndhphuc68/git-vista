import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { CommitGraph } from "../components/graph/CommitGraph";
import { useRepoStore } from "../store/useRepoStore";
import { useToastStore } from "../store/useToastStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("CommitGraph Context Menu", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "1111111111111111111111111111111111111111",
    });
    useToastStore.setState({ toasts: [] });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("verifies right-clicking a commit row opens the context menu", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    expect(commitRow).toBeInTheDocument();

    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    expect(
      screen.getByText(/Create tag here\.\.\.|Tạo thẻ tại đây\.\.\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create branch here\.\.\.|Tạo nhánh tại đây\.\.\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Copy commit SHA|Sao chép mã commit \(SHA\)/i)
    ).toBeInTheDocument();
  });

  it("verifies clicking 'Create Tag here...' opens CreateTagModal targeting that commit", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const createTagAction = screen.getByText(/Create tag here\.\.\.|Tạo thẻ tại đây\.\.\./i);
    fireEvent.click(createTagAction);

    // Modal should be opened with target commit info
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("1111111")).toBeInTheDocument();
    });
  });

  it("verifies clicking 'Create Branch here...' opens CreateBranchModal targeting that commit", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const createBranchAction = screen.getByText(/Create branch here\.\.\.|Tạo nhánh tại đây\.\.\./i);
    fireEvent.click(createBranchAction);

    await waitFor(() => {
      expect(screen.getByText(/Tạo nhánh mới|Create Branch/i)).toBeInTheDocument();
    });
  });

  it("verifies pressing Escape closes the context menu", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    expect(
      screen.getByText(/Create tag here\.\.\.|Tạo thẻ tại đây\.\.\./i)
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.queryByText(/Create tag here\.\.\.|Tạo thẻ tại đây\.\.\./i)
    ).not.toBeInTheDocument();
  });

  it("verifies clicking 'Copy SHA' copies commit SHA and triggers toast", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const copyShaAction = screen.getByText(/Copy commit SHA|Sao chép mã commit \(SHA\)/i);
    fireEvent.click(copyShaAction);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "1111111111111111111111111111111111111111"
      );
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]?.message).toMatch(
      /Copied commit SHA to clipboard|Đã sao chép mã commit vào clipboard/i
    );
  });
});
