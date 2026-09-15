import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RepoHeader } from "../components/header/RepoHeader";
import { useRepoStore } from "../store/useRepoStore";
import { useViewStore } from "../store/useViewStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { invokeCommand } from "../ipc/client";

describe("RepoHeader - Screen Switcher & View Store", () => {
  let queryClient: QueryClient;
  const mockOnBackToWelcome = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    useSettingsStore.getState().setLocale("vi");
    useRepoStore.getState().setRepo({
      path: "/test/repo",
      name: "test-repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc1234",
    });
    useViewStore.getState().setActiveScreen("history");
    mockOnBackToWelcome.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders screen switcher tabs with history active by default", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    const historyTab = screen.getByTestId("tab-history");
    const changesTab = screen.getByTestId("tab-changes");

    expect(historyTab).toBeInTheDocument();
    expect(changesTab).toBeInTheDocument();
    expect(historyTab).toHaveAttribute("aria-selected", "true");
    expect(changesTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Lịch sử")).toBeInTheDocument();
    expect(screen.getByText("Thay đổi")).toBeInTheDocument();
    expect(screen.queryByTestId("changes-badge")).not.toBeInTheDocument();
  });

  it("renders tabs in English when locale is set to en", async () => {
    useSettingsStore.getState().setLocale("en");
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Changes")).toBeInTheDocument();
  });

  it("switches active screen when clicking tabs", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    const historyTab = screen.getByTestId("tab-history");
    const changesTab = screen.getByTestId("tab-changes");

    fireEvent.click(changesTab);
    expect(useViewStore.getState().activeScreen).toBe("changes");
    expect(changesTab).toHaveAttribute("aria-selected", "true");
    expect(historyTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(historyTab);
    expect(useViewStore.getState().activeScreen).toBe("history");
    expect(historyTab).toHaveAttribute("aria-selected", "true");
    expect(changesTab).toHaveAttribute("aria-selected", "false");
  });

  it("displays change count badge when there are uncommitted changes", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [
        { path: "staged.txt", status: "Modified", is_staged: true, old_path: null },
      ],
      unstaged: [
        { path: "unstaged.txt", status: "Modified", is_staged: false, old_path: null },
      ],
      untracked: [
        { path: "untracked.txt", status: "New", is_staged: false, old_path: null },
      ],
      conflicted: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const badge = screen.getByTestId("changes-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("3");
    });
  });

  it("switches active screen using keyboard shortcuts Cmd/Ctrl+1 and Cmd/Ctrl+2 and prevents default", () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    expect(useViewStore.getState().activeScreen).toBe("history");

    // Cmd+2
    const eventCmd2 = new KeyboardEvent("keydown", { key: "2", metaKey: true, bubbles: true, cancelable: true });
    fireEvent(window, eventCmd2);
    expect(useViewStore.getState().activeScreen).toBe("changes");
    expect(eventCmd2.defaultPrevented).toBe(true);

    // Ctrl+1
    const eventCtrl1 = new KeyboardEvent("keydown", { key: "1", ctrlKey: true, bubbles: true, cancelable: true });
    fireEvent(window, eventCtrl1);
    expect(useViewStore.getState().activeScreen).toBe("history");
    expect(eventCtrl1.defaultPrevented).toBe(true);

    // Ctrl+2
    const eventCtrl2 = new KeyboardEvent("keydown", { key: "2", ctrlKey: true, bubbles: true, cancelable: true });
    fireEvent(window, eventCtrl2);
    expect(useViewStore.getState().activeScreen).toBe("changes");
    expect(eventCtrl2.defaultPrevented).toBe(true);

    // Cmd+1
    const eventCmd1 = new KeyboardEvent("keydown", { key: "1", metaKey: true, bubbles: true, cancelable: true });
    fireEvent(window, eventCmd1);
    expect(useViewStore.getState().activeScreen).toBe("history");
    expect(eventCmd1.defaultPrevented).toBe(true);
  });

  it("removes shortcut listeners when unmounted", () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    unmount();

    expect(useViewStore.getState().activeScreen).toBe("history");
    const eventCmd2 = new KeyboardEvent("keydown", { key: "2", metaKey: true, bubbles: true, cancelable: true });
    fireEvent(window, eventCmd2);
    expect(useViewStore.getState().activeScreen).toBe("history");
    expect(eventCmd2.defaultPrevented).toBe(false);
  });

  it("renders nothing when currentRepo is null", () => {
    useRepoStore.getState().clearRepo();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it("toggles sidebar, controls, and detail panel when clicking header toggle buttons", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    const toggleSidebarBtn = screen.getByTestId("toggle-sidebar");
    const toggleDetailPanelBtn = screen.getByTestId("toggle-detail-panel");

    expect(toggleSidebarBtn).toBeInTheDocument();
    expect(toggleDetailPanelBtn).toBeInTheDocument();

    fireEvent.click(toggleSidebarBtn);
    fireEvent.click(toggleDetailPanelBtn);
  });

  it("toggles sidebar with Cmd+B / Ctrl+B keyboard shortcut", () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    const eventCmdB = new KeyboardEvent("keydown", {
      key: "b",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, eventCmdB);
    expect(eventCmdB.defaultPrevented).toBe(true);
  });

  it("renders Fetch, Pull, Push controls and triggers operations", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    });
    vi.spyOn(invokeCommand, "getRepoHeadInfo").mockResolvedValue({
      branch_name: "main",
      head_commit_id: "abc1234",
      is_detached: false,
      ahead: 3,
      behind: 2,
      upstream: "origin/main",
    });

    const fetchSpy = vi.spyOn(invokeCommand, "fetchRepo").mockResolvedValue("Fetch ok");
    const pullSpy = vi.spyOn(invokeCommand, "pullRepo").mockResolvedValue("Pull ok");
    const pushSpy = vi.spyOn(invokeCommand, "pushRepo").mockResolvedValue("Push ok");

    render(
      <QueryClientProvider client={queryClient}>
        <RepoHeader onBackToWelcome={mockOnBackToWelcome} />
      </QueryClientProvider>
    );

    const fetchBtn = await screen.findByTestId("btn-fetch");
    const pullBtn = await screen.findByTestId("btn-pull");
    const pushBtn = await screen.findByTestId("btn-push");

    expect(fetchBtn).toBeInTheDocument();
    expect(pullBtn).toBeInTheDocument();
    expect(pushBtn).toBeInTheDocument();

    // Verify badges
    const aheadBadge = await screen.findByTestId("ahead-badge");
    const behindBadge = await screen.findByTestId("behind-badge");
    expect(aheadBadge).toHaveTextContent("3");
    expect(behindBadge).toHaveTextContent("2");

    // Click operations
    await act(async () => {
      fireEvent.click(fetchBtn);
    });
    expect(fetchSpy).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(pullBtn);
    });
    expect(pullSpy).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(pushBtn);
    });
    expect(pushSpy).toHaveBeenCalled();
  });
});

