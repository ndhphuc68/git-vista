import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
      expect(screen.getByText("main")).toBeInTheDocument();
      expect(screen.getByText("origin/main")).toBeInTheDocument();
    });
  });
});
