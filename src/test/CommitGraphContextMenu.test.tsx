import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { CommitGraph } from "../components/graph/CommitGraph";
import { useRepoStore } from "../store/useRepoStore";
import { useViewStore } from "../store/useViewStore";
import { useToastStore } from "../store/useToastStore";
import { invokeCommand } from "../ipc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { qk } from "../domain/queryKeys";

// The repo path used throughout this test file - shares a single source with
// setRepo() below so expectations and reality always match.
const REPO_PATH = "d:/project-v3";

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
      path: REPO_PATH,
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "1111111111111111111111111111111111111111",
    });
    useViewStore.setState({ activeScreen: "history" });
    useToastStore.setState({ toasts: [] });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.restoreAllMocks();
  });

  it("verifies right-clicking a commit row opens the context menu with cherry-pick and revert options", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    expect(commitRow).toBeInTheDocument();

    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    expect(screen.getByText(/Create tag here|Tạo thẻ tại đây/i)).toBeInTheDocument();
    expect(screen.getByText(/Create branch here|Tạo nhánh tại đây/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Cherry-pick into current branch|Cherry-pick vào nhánh hiện tại/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Revert this commit|Hoàn tác \(Revert\) commit này/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Copy commit SHA|Sao chép mã commit \(SHA\)/i)).toBeInTheDocument();
  });

  it("verifies clicking 'Create Tag here...' opens CreateTagModal targeting that commit", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const createTagAction = screen.getByText(/Create tag here|Tạo thẻ tại đây/i);
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

    const createBranchAction = screen.getByText(/Create branch here|Tạo nhánh tại đây/i);
    fireEvent.click(createBranchAction);

    await waitFor(() => {
      expect(screen.getByText(/Tạo nhánh mới|Create Branch/i)).toBeInTheDocument();
    });
  });

  it("verifies clicking 'Cherry-pick...' opens CherryPickModal targeting that commit", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const cherryPickAction = screen.getByText(
      /Cherry-pick into current branch|Cherry-pick vào nhánh hiện tại/i
    );
    fireEvent.click(cherryPickAction);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/Cherry-pick Commit/i)).toBeInTheDocument();
      expect(within(dialog).getByText("1111111")).toBeInTheDocument();
      expect(within(dialog).getByText("feat(m1): visual git viewer")).toBeInTheDocument();
    });
  });

  it("verifies clicking 'Revert...' opens RevertModal targeting that commit", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const revertAction = screen.getByText(/Revert this commit|Hoàn tác \(Revert\) commit này/i);
    fireEvent.click(revertAction);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(
        within(dialog).getByRole("heading", { name: /Revert Commit|Hoàn tác Commit/i })
      ).toBeInTheDocument();
      expect(within(dialog).getByText("1111111")).toBeInTheDocument();
      expect(within(dialog).getByText("feat(m1): visual git viewer")).toBeInTheDocument();
    });
  });

  it("verifies CherryPick onSuccess with Committed status shows success toast with undo action", async () => {
    const cherryPickSpy = vi.spyOn(invokeCommand, "cherryPickCommit").mockResolvedValue({
      success: true,
      status: "Committed",
      undo_token: "token-undo-cp-123",
      output: "Cherry-pick completed",
    });
    const undoSpy = vi.spyOn(invokeCommand, "undoCommit").mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const cherryPickAction = screen.getByText(
      /Cherry-pick into current branch|Cherry-pick vào nhánh hiện tại/i
    );
    fireEvent.click(cherryPickAction);

    const dialog = await screen.findByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", { name: /^Cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(cherryPickSpy).toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Check queries invalidated
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.commitGraph(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.head(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.branches(REPO_PATH) });

    // Check toast with undoAction
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    const toast = toasts[0]!;
    expect(toast.type).toBe("success");
    expect(toast.undoAction).toBeDefined();

    // Trigger undo action
    await toast.undoAction!();
    expect(undoSpy).toHaveBeenCalledWith(REPO_PATH, "token-undo-cp-123");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO_PATH) });
  });

  // Regression test: this is the proof for this whole phase. It asserts that
  // after a Git action from the CommitGraph context menu (checkout/cherry-pick/...),
  // invalidateQueries is called with a key that actually refreshes the data
  // ChangesScreen reads. Matching through qk itself (not a hardcoded string) means
  // the test can't drift from qk later - this is exactly how the original bug happened.
  it("verifies a Git action from the context menu invalidates the key ChangesScreen reads", async () => {
    vi.spyOn(invokeCommand, "cherryPickCommit").mockResolvedValue({
      success: true,
      status: "Committed",
      undo_token: "token-undo-cp-789",
      output: "Cherry-pick completed",
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const cherryPickAction = screen.getByText(
      /Cherry-pick into current branch|Cherry-pick vào nhánh hiện tại/i
    );
    fireEvent.click(cherryPickAction);

    const dialog = await screen.findByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", { name: /^Cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // ChangesScreen reads qk.repo.status(REPO_PATH). React Query invalidates by
    // prefix, so a call with a shorter key (e.g. qk.repo.all) also refreshes the
    // longer key - hence matching in a "is a prefix of" style here.
    const calls = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    const statusKey = qk.repo.status(REPO_PATH);
    const matched = calls.some(
      (k) => Array.isArray(k) && statusKey.slice(0, k.length).every((seg, i) => seg === k[i])
    );
    expect(matched).toBe(true);
  });

  it("verifies CherryPick onSuccess with Staged status shows info toast and navigates to changes", async () => {
    vi.spyOn(invokeCommand, "cherryPickCommit").mockResolvedValue({
      success: true,
      status: "Staged",
      output: "Changes staged",
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const cherryPickAction = screen.getByText(
      /Cherry-pick into current branch|Cherry-pick vào nhánh hiện tại/i
    );
    fireEvent.click(cherryPickAction);

    const dialog = await screen.findByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", { name: /^Cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]?.type).toBe("info");
    expect(useViewStore.getState().activeScreen).toBe("changes");
  });

  it("verifies CherryPick onSuccess with Conflict status shows error toast and navigates to changes", async () => {
    vi.spyOn(invokeCommand, "cherryPickCommit").mockResolvedValue({
      success: false,
      status: "Conflict",
      output: "Conflict occurred",
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const cherryPickAction = screen.getByText(
      /Cherry-pick into current branch|Cherry-pick vào nhánh hiện tại/i
    );
    fireEvent.click(cherryPickAction);

    const dialog = await screen.findByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", { name: /^Cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.state(REPO_PATH) });
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]?.type).toBe("error");
    expect(useViewStore.getState().activeScreen).toBe("changes");
  });

  it("verifies Revert onSuccess with Committed status shows success toast with undo action", async () => {
    const revertSpy = vi.spyOn(invokeCommand, "revertCommit").mockResolvedValue({
      success: true,
      status: "Committed",
      undo_token: "token-undo-rev-456",
      output: "Revert completed",
    });
    const undoSpy = vi.spyOn(invokeCommand, "undoCommit").mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const revertAction = screen.getByText(/Revert this commit|Hoàn tác \(Revert\) commit này/i);
    fireEvent.click(revertAction);

    const dialog = await screen.findByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", {
      name: /Revert Commit|Hoàn tác commit/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(revertSpy).toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.commitGraph(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.head(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.branches(REPO_PATH) });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    const toast = toasts[0]!;
    expect(toast.type).toBe("success");
    expect(toast.undoAction).toBeDefined();

    await toast.undoAction!();
    expect(undoSpy).toHaveBeenCalledWith(REPO_PATH, "token-undo-rev-456");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO_PATH) });
  });

  it("verifies Revert onSuccess with Staged status shows info toast and navigates to changes", async () => {
    vi.spyOn(invokeCommand, "revertCommit").mockResolvedValue({
      success: true,
      status: "Staged",
      output: "Inverted changes staged",
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const revertAction = screen.getByText(/Revert this commit|Hoàn tác \(Revert\) commit này/i);
    fireEvent.click(revertAction);

    const dialog = await screen.findByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", {
      name: /Revert Commit|Hoàn tác commit/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]?.type).toBe("info");
    expect(useViewStore.getState().activeScreen).toBe("changes");
  });

  it("verifies Revert onSuccess with Conflict status shows error toast and navigates to changes", async () => {
    vi.spyOn(invokeCommand, "revertCommit").mockResolvedValue({
      success: false,
      status: "Conflict",
      output: "Conflict occurred",
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    const revertAction = screen.getByText(/Revert this commit|Hoàn tác \(Revert\) commit này/i);
    fireEvent.click(revertAction);

    const dialog = await screen.findByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", {
      name: /Revert Commit|Hoàn tác commit/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.status(REPO_PATH) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.state(REPO_PATH) });
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]?.type).toBe("error");
    expect(useViewStore.getState().activeScreen).toBe("changes");
  });

  it("verifies pressing Escape closes the context menu", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    const commitRow = await screen.findByText("feat(m1): visual git viewer");
    fireEvent.contextMenu(commitRow, { clientX: 200, clientY: 300 });

    expect(screen.getByText(/Create tag here|Tạo thẻ tại đây/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByText(/Create tag here|Tạo thẻ tại đây/i)).not.toBeInTheDocument();
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
