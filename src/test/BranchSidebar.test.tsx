import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BranchSidebar } from "../features/branch";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("BranchSidebar", () => {
  it("renders local branches with active HEAD indicator", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("main").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("origin")).toBeInTheDocument();
    });
  });

  it("renders new branch button and opens CreateBranchModal", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    const newBranchBtn = screen.getByLabelText(/Tạo nhánh mới/i);
    expect(newBranchBtn).toBeInTheDocument();

    fireEvent.click(newBranchBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Tạo nhánh mới")).toBeInTheDocument();
  });

  it("opens action menu on branch item and triggers rename modal", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("main").length).toBeGreaterThanOrEqual(1);
    });

    const menuBtn = screen.getByLabelText("Menu thao tác nhánh main");
    fireEvent.click(menuBtn);

    const renameBtn = screen.getByRole("button", { name: /đổi tên/i });
    expect(renameBtn).toBeInTheDocument();

    fireEvent.click(renameBtn);
    expect(screen.getByRole("heading", { name: "Đổi tên nhánh" })).toBeInTheDocument();
  });

  it("ensures only 1 context menu is shown at any time", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("origin")).toBeInTheDocument();
    });

    // 1. Open remote context menu on origin
    const originNode = screen.getByText("origin");
    fireEvent.contextMenu(originNode);

    // Remote menu item should be visible
    expect(screen.getByText(/Dọn dẹp nhánh mồ côi/i)).toBeInTheDocument();

    // 2. Right-click on a branch item (e.g. main)
    const branchBtn = screen.getAllByText("main")[0]!;
    fireEvent.contextMenu(branchBtn);

    // Branch menu item should now be visible
    expect(screen.getByText(/Đổi tên/i)).toBeInTheDocument();

    // Remote menu item MUST have closed and NOT be in the document!
    expect(screen.queryByText(/Dọn dẹp nhánh mồ côi/i)).not.toBeInTheDocument();

    // 3. Press Escape key to close the menu
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByText(/Đổi tên/i)).not.toBeInTheDocument();
  });
});
