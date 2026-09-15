import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BranchSidebar } from "../components/sidebar/BranchSidebar";
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
});

