import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
});
