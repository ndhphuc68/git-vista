import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { invokeCommand } from "../ipc/client";
import { qk } from "../domain/queryKeys";
import { CommitGraph, useCommitGraph } from "../features/history";
import { CreateTagModal } from "../features/tag";
import { CreateBranchModal } from "../features/branch";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("commit graph pagination", () => {
  afterEach(() => vi.restoreAllMocks());

  function setup(repoPath: string) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, ...renderHook(() => ({ ...useCommitGraph(repoPath) }), { wrapper }) };
  }

  it("loads pages of 50 under the repository graph key and stops at the last page", async () => {
    const getGraph = vi
      .spyOn(invokeCommand, "getCommitGraph")
      .mockResolvedValueOnce({ commits: [], has_more: true, total_count: 150 })
      .mockResolvedValueOnce({ commits: [], has_more: true, total_count: 150 })
      .mockResolvedValueOnce({ commits: [], has_more: false, total_count: 150 });
    const { result, client } = setup("/repo/history");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getGraph).toHaveBeenNthCalledWith(1, "/repo/history", 0, 50);
    expect(client.getQueryData(qk.commitGraph("/repo/history"))).toEqual({
      pages: [{ commits: [], has_more: true, total_count: 150 }],
      pageParams: [0],
    });

    await act(() => result.current.fetchNextPage());
    expect(getGraph).toHaveBeenNthCalledWith(2, "/repo/history", 50, 50);
    await act(() => result.current.fetchNextPage());
    expect(getGraph).toHaveBeenNthCalledWith(3, "/repo/history", 100, 50);
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    await act(() => result.current.fetchNextPage());
    expect(getGraph).toHaveBeenCalledTimes(3);
  });

  it("does not request a graph without a repository", () => {
    const getGraph = vi.spyOn(invokeCommand, "getCommitGraph");
    const { result } = setup("");
    expect(result.current.fetchStatus).toBe("idle");
    expect(getGraph).not.toHaveBeenCalled();
  });
});

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
        <CommitGraph CreateTagModal={CreateTagModal} CreateBranchModal={CreateBranchModal} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("feat(m1): visual git viewer")).toBeInTheDocument();
      expect(screen.getByText("1111111")).toBeInTheDocument();
      expect(screen.getByText("Visual Git Team")).toBeInTheDocument();
    });
  });
});
