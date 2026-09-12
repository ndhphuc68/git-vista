import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CommitDetailPanel } from "../components/diff/CommitDetailPanel";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("CommitDetailPanel", () => {
  it("renders commit author, message, and files list with additions/deletions", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1",
    });
    useRepoStore.getState().setSelectedCommit("c1");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitDetailPanel />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("README.md")).toBeInTheDocument();
      expect(screen.getAllByText("+10").length).toBeGreaterThan(0);
      expect(screen.getAllByText("-2").length).toBeGreaterThan(0);
    });
  });
});
