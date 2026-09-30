import { render as rtlRender, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { invokeCommand } from "../ipc/client";
import { WindowTabBar } from "../components/header/WindowTabBar";
import { useTabStore } from "../store/useTabStore";

// Repo tabs read the live HEAD through React Query.
function render(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return rtlRender(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("WindowTabBar", () => {
  beforeEach(() => {
    useTabStore.getState().reset();
  });

  it("renders Home tab by default", () => {
    render(<WindowTabBar />);
    expect(screen.getByTestId("tab-home")).toBeInTheDocument();
  });

  it("renders opened repo tabs with title, branch, and close button", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByTestId("close-tab-d:/projects/alpha")).toBeInTheDocument();
  });

  it("shows the branch HEAD is on now, not the one it was on when the tab opened", async () => {
    vi.spyOn(invokeCommand, "getRepoHeadInfo").mockResolvedValue({
      branch_name: "feature",
      head_commit_id: "456",
      is_detached: false,
      ahead: 0,
      behind: 0,
      upstream: null,
    });
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar />);

    await waitFor(() => expect(screen.getByText("feature")).toBeInTheDocument());
    expect(screen.queryByText("main")).not.toBeInTheDocument();
    vi.mocked(invokeCommand.getRepoHeadInfo).mockRestore();
  });

  it("switches active tab on click", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar />);
    fireEvent.click(screen.getByTestId("tab-home"));
    expect(useTabStore.getState().activeTabId).toBe("home");
  });

  it("closes tab when close button is clicked", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar />);
    fireEvent.click(screen.getByTestId("close-tab-d:/projects/alpha"));
    expect(useTabStore.getState().tabs.some((t) => t.id === "d:/projects/alpha")).toBe(false);
  });

  it("does not render macOS traffic light dots", () => {
    const { container } = render(<WindowTabBar />);
    expect(container.querySelector(".bg-red-500\\/80")).toBeNull();
    expect(container.querySelector(".bg-emerald-500\\/80")).toBeNull();
  });

  it("applies distinct active styling to active tab vs inactive tab", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar />);
    const activeTab = screen.getByTestId("tab-d:/projects/alpha");
    const homeTab = screen.getByTestId("tab-home");

    expect(activeTab.className).toContain("bg-surface");
    expect(activeTab.className).toContain("rounded-t-lg");
    expect(activeTab.className).toContain("after:bg-surface");
    expect(activeTab.className).not.toContain("before:bg-accent");
    expect(homeTab.className).toContain("font-normal");
    expect(homeTab.className).toContain("text-secondary");
  });

  it("calls onNewTab when new tab button is clicked", () => {
    const handleNewTab = vi.fn();
    render(<WindowTabBar onNewTab={handleNewTab} />);
    fireEvent.click(screen.getByTestId("btn-new-tab"));
    expect(handleNewTab).toHaveBeenCalled();
  });

  it("opens home tab by default when new tab button is clicked without onNewTab", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });
    expect(useTabStore.getState().activeTabId).toBe("d:/projects/alpha");

    render(<WindowTabBar />);
    fireEvent.click(screen.getByTestId("btn-new-tab"));
    expect(useTabStore.getState().activeTabId).toBe("home");
  });
});
