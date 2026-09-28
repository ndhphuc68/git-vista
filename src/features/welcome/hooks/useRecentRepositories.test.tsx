import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { qk } from "../../../domain/queryKeys";
import { useRecentRepositories } from "./useRecentRepositories";

const { getRecentRepos, clearRecentRepos, removeRecentRepo } = vi.hoisted(() => ({
  getRecentRepos: vi.fn(),
  clearRecentRepos: vi.fn(),
  removeRecentRepo: vi.fn(),
}));

vi.mock("../api", () => ({
  getRecentRepos,
  clearRecentRepos,
  removeRecentRepo,
  openRepository: vi.fn(),
  selectRepoFolder: vi.fn(),
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSelectRepo = vi.fn();
  const { result } = renderHook(() => useRecentRepositories(onSelectRepo), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { result, client, onSelectRepo };
}

describe("useRecentRepositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRecentRepos.mockResolvedValue([]);
    clearRecentRepos.mockResolvedValue(undefined);
    removeRecentRepo.mockResolvedValue(undefined);
  });

  it("invalidates the recent-repositories query after clearing", async () => {
    const { result, client } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.clearRecents();
    });

    expect(clearRecentRepos).toHaveBeenCalledOnce();
    expect(invalidate.mock.calls).toEqual([[{ queryKey: qk.recentRepos() }]]);
  });

  it("invalidates the recent-repositories query after removing an entry", async () => {
    const { result, client } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.removeRecent("/repo/one");
    });

    expect(removeRecentRepo).toHaveBeenCalledWith("/repo/one");
    expect(invalidate.mock.calls).toEqual([[{ queryKey: qk.recentRepos() }]]);
  });
});
