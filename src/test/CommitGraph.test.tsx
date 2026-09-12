import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CommitGraph } from "../components/graph/CommitGraph";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("CommitGraph", () => {
  it("renders virtualized commit items with summary and author", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "1111111",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("feat(m1): visual git viewer")).toBeInTheDocument();
      expect(screen.getByText("1111111")).toBeInTheDocument();
      expect(screen.getByText("Visual Git Team")).toBeInTheDocument();
    });
  });
});
