import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreatePullRequestModal } from "../components/pullrequests/CreatePullRequestModal";
import * as githubService from "../services/githubService";
import { invokeCommand } from "../ipc/client";
import { usePullRequestStore } from "../store/usePullRequestStore";
import { useToastStore } from "../store/useToastStore";
import { vi as viTranslations } from "../i18n/vi";
import { qk } from "../domain/queryKeys";

type BranchListResponse = Awaited<ReturnType<typeof invokeCommand.getBranches>>;

const RESOLVED_BRANCHES: BranchListResponse = {
  current_branch: "feature/login-page",
  is_detached: false,
  local: [
    {
      name: "main",
      is_head: false,
      target_commit_id: "c1",
      upstream: "origin/main",
      ahead: 0,
      behind: 0,
    },
    {
      name: "feature/login-page",
      is_head: true,
      target_commit_id: "c2",
      upstream: "origin/feature/login-page",
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
  ],
  tags: [],
};

const t = viTranslations;

vi.mock("../services/githubService", () => ({
  createPullRequest: vi.fn(),
}));

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    getGitHubRepoInfo: vi.fn(),
    getGitHubToken: vi.fn(),
    getBranches: vi.fn(),
    pushRepo: vi.fn(),
  },
}));

describe("CreatePullRequestModal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    usePullRequestStore.setState({
      isDrawerOpen: false,
      selectedPr: null,
      isCreateModalOpen: true,
    });
    useToastStore.setState({ toasts: [] });

    vi.mocked(invokeCommand.getGitHubRepoInfo).mockResolvedValue({
      is_github: true,
      owner: "acme-corp",
      repo: "web-portal",
      default_branch: "main",
    });

    vi.mocked(invokeCommand.getBranches).mockResolvedValue({
      current_branch: "feature/login-page",
      is_detached: false,
      local: [
        {
          name: "main",
          is_head: false,
          target_commit_id: "c1",
          upstream: "origin/main",
          ahead: 0,
          behind: 0,
        },
        {
          name: "feature/login-page",
          is_head: true,
          target_commit_id: "c2",
          upstream: "origin/feature/login-page",
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
      ],
      tags: [],
    });

    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue("ghp_valid_token_123");
  });

  it("renders modal with branch options and pre-filled selections", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    expect(await screen.findByText(t.pullRequests.createModalTitle)).toBeInTheDocument();
    expect(screen.getByLabelText(t.pullRequests.baseBranch)).toBeInTheDocument();
    expect(screen.getByLabelText(t.pullRequests.compareBranch)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t.pullRequests.prTitlePlaceholder)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t.pullRequests.prBodyPlaceholder)).toBeInTheDocument();
  });

  it("validates empty title and disables submit button", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    await screen.findByText(t.pullRequests.createModalTitle);
    const submitBtn = screen.getByRole("button", { name: t.pullRequests.submitCreate });
    expect(submitBtn).toBeDisabled();
  });

  it("submits new pull request successfully and closes modal", async () => {
    vi.mocked(githubService.createPullRequest).mockResolvedValue({
      number: 42,
      title: "Add login page UI",
      state: "open",
      draft: false,
      user: { login: "testuser", avatar_url: "", html_url: "" },
      created_at: "2026-09-18T12:00:00Z",
      updated_at: "2026-09-18T12:00:00Z",
      head: { ref: "feature/login-page", sha: "c2" },
      base: { ref: "main", sha: "c1" },
      comments: 0,
      labels: [],
      html_url: "https://github.com/acme-corp/web-portal/pull/42",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    await screen.findByText(t.pullRequests.createModalTitle);

    const titleInput = screen.getByPlaceholderText(t.pullRequests.prTitlePlaceholder);
    fireEvent.change(titleInput, { target: { value: "Add login page UI" } });

    const bodyInput = screen.getByPlaceholderText(t.pullRequests.prBodyPlaceholder);
    fireEvent.change(bodyInput, { target: { value: "Implemented modern login layout." } });

    const draftCheckbox = screen.getByLabelText(t.pullRequests.isDraft);
    fireEvent.click(draftCheckbox);

    const submitBtn = screen.getByRole("button", { name: t.pullRequests.submitCreate });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(githubService.createPullRequest).toHaveBeenCalledWith(
        "acme-corp",
        "web-portal",
        {
          title: "Add login page UI",
          head: "feature/login-page",
          base: "main",
          body: "Implemented modern login layout.",
          draft: true,
        },
        "ghp_valid_token_123"
      );
    });

    // Expect modal to be closed
    expect(usePullRequestStore.getState().isCreateModalOpen).toBe(false);
  });

  it("shows warning when compare branch has unpushed commits", async () => {
    vi.mocked(invokeCommand.getBranches).mockResolvedValue({
      current_branch: "feature/unpushed",
      is_detached: false,
      local: [
        {
          name: "feature/unpushed",
          is_head: true,
          target_commit_id: "c3",
          upstream: "origin/feature/unpushed",
          ahead: 2,
          behind: 0,
        },
        {
          name: "main",
          is_head: false,
          target_commit_id: "c1",
          upstream: "origin/main",
          ahead: 0,
          behind: 0,
        },
      ],
      remote: [],
      tags: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    expect(await screen.findByText(t.pullRequests.unpushedWarning)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.pullRequests.pushFirst })).toBeInTheDocument();
  });

  it("shows error when GitHub token is missing", async () => {
    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue(null);

    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    await screen.findByText(t.pullRequests.createModalTitle);

    const titleInput = screen.getByPlaceholderText(t.pullRequests.prTitlePlaceholder);
    fireEvent.change(titleInput, { target: { value: "Add login page UI" } });

    const submitBtn = screen.getByRole("button", { name: t.pullRequests.submitCreate });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(t.pullRequests.needToken)).toBeInTheDocument();
  });

  // Characterization tests for the branch-selection defaults, pinning the
  // observable <select> values rather than just their presence. These were
  // verified to pass against both the split hooks (HEAD) and the original,
  // pre-split component (commit 537d5e0) — see the phase 7c task-4 fix report.
  it("pins default branch selections on first open: base = repo default branch, compare = current branch", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    await screen.findByText(t.pullRequests.createModalTitle);

    await waitFor(() => {
      expect(screen.getByLabelText(t.pullRequests.baseBranch)).toHaveValue("main");
      expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue(
        "feature/login-page"
      );
    });
  });

  it("resets the compare branch back to the default after closing and reopening, discarding a user change", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    await screen.findByText(t.pullRequests.createModalTitle);
    await waitFor(() => {
      expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue(
        "feature/login-page"
      );
    });

    fireEvent.change(screen.getByLabelText(t.pullRequests.compareBranch), {
      target: { value: "main" },
    });
    expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue("main");

    // Close the modal and let it fully unmount (it animates out).
    usePullRequestStore.getState().closeCreateModal();
    await waitFor(() => {
      expect(screen.queryByText(t.pullRequests.createModalTitle)).not.toBeInTheDocument();
    });

    // Reopen: the compare branch must come back as the default, not the
    // user's earlier choice of "main".
    usePullRequestStore.getState().openCreateModal();
    await screen.findByText(t.pullRequests.createModalTitle);
    await waitFor(() => {
      expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue(
        "feature/login-page"
      );
    });
  });

  it("applies the resolved current branch as the default compare branch once branch data arrives after opening", async () => {
    let resolveBranches!: (value: BranchListResponse) => void;
    vi.mocked(invokeCommand.getBranches).mockReturnValue(
      new Promise((resolve) => {
        resolveBranches = resolve;
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    await screen.findByText(t.pullRequests.createModalTitle);

    // Branch data hasn't resolved yet: the compare branch falls back to "main".
    expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue("main");

    resolveBranches(RESOLVED_BRANCHES);

    await waitFor(() => {
      expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue(
        "feature/login-page"
      );
    });
  });

  it("does not overwrite a user-selected compare branch when branch data is refetched after opening", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreatePullRequestModal repoPath="/mock/repo" />
      </QueryClientProvider>
    );

    await screen.findByText(t.pullRequests.createModalTitle);
    await waitFor(() => {
      expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue(
        "feature/login-page"
      );
    });

    fireEvent.change(screen.getByLabelText(t.pullRequests.compareBranch), {
      target: { value: "main" },
    });
    expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue("main");

    // Simulate branch data arriving again (e.g. a refetch) with the same
    // resolved current branch; the user's manual selection must survive it.
    await queryClient.refetchQueries({ queryKey: qk.branches("/mock/repo") });

    expect(screen.getByLabelText(t.pullRequests.compareBranch)).toHaveValue("main");
  });
});
