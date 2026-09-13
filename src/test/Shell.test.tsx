import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Shell } from "../components/Shell";
import { useRepoStore } from "../store/useRepoStore";
import { useLayoutStore } from "../store/useLayoutStore";

describe("Shell responsive layout", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useRepoStore.getState().setRepo({
      path: "/test/repo",
      name: "test-repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc1234",
    });
    useLayoutStore.setState({
      sidebarOpen: true,
      detailPanelOpen: true,
      controlsOpen: true,
      devToolsOpen: false,
      activeChangesView: "split",
    });
    vi.clearAllMocks();
  });

  it("renders 3 columns when sidebarOpen and detailPanelOpen are true", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Shell />
      </QueryClientProvider>
    );

    expect(screen.getByTestId("shell-sidebar-container")).toBeInTheDocument();
    expect(screen.getByTestId("shell-graph-container")).toBeInTheDocument();
    expect(screen.getByTestId("shell-detail-container")).toBeInTheDocument();
  });

  it("hides sidebar when sidebarOpen is false", () => {
    useLayoutStore.setState({ sidebarOpen: false });

    render(
      <QueryClientProvider client={queryClient}>
        <Shell />
      </QueryClientProvider>
    );

    expect(screen.queryByTestId("shell-sidebar-container")).not.toBeInTheDocument();
    expect(screen.getByTestId("shell-graph-container")).toBeInTheDocument();
  });

  it("hides detail panel when detailPanelOpen is false", () => {
    useLayoutStore.setState({ detailPanelOpen: false });

    render(
      <QueryClientProvider client={queryClient}>
        <Shell />
      </QueryClientProvider>
    );

    expect(screen.queryByTestId("shell-detail-container")).not.toBeInTheDocument();
  });
});
