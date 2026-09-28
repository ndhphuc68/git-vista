import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGitHubRepoInfo } from "./githubApi";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getGitHubRepoInfo: vi.fn().mockResolvedValue({
      is_github: true,
      owner: "my-org",
      repo: "my-repo",
      default_branch: "main",
    }),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("useGitHubRepoInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the app QueryClient's global staleTime when called without options", async () => {
    // Regression test: an explicit `staleTime: undefined` in the query
    // options object overrides TanStack Query's global default, dropping
    // effective staleTime to 0. This client mirrors App.tsx's default of
    // 60s so a bug here would make the query stale (and thus refetch on
    // every mount/focus) immediately instead of after 60s.
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: 1000 * 60, retry: false } },
    });

    const { result } = renderHook(() => useGitHubRepoInfo(REPO), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isStale).toBe(false);
  });
});
