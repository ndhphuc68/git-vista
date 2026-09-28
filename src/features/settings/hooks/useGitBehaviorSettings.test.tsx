import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useGitBehaviorSettings } from "./useGitBehaviorSettings";
import { useToastStore } from "../../../store/useToastStore";

const { getGitConfig, setGitConfig, setRepoPullRebase } = vi.hoisted(() => ({
  getGitConfig: vi.fn(),
  setGitConfig: vi.fn(),
  setRepoPullRebase: vi.fn(),
}));

vi.mock("../api", () => ({
  getGitConfig,
  setGitConfig,
  setRepoPullRebase,
}));

const GLOBAL_CONFIG = {
  userName: "Global User",
  userNameSource: "global" as const,
  userEmail: "global@example.com",
  userEmailSource: "global" as const,
  defaultBranch: "main",
  pullRebase: false,
  gpgSign: false,
  gpgKey: null,
  fetchPrune: false,
  rebaseAutostash: false,
};

describe("useGitBehaviorSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.setState({ toasts: [] } as never);
    getGitConfig.mockResolvedValue(GLOBAL_CONFIG);
    setGitConfig.mockResolvedValue(undefined);
    setRepoPullRebase.mockResolvedValue(undefined);
  });

  it("uses global config when no repo is open", async () => {
    const { result } = renderHook(() =>
      useGitBehaviorSettings({ currentRepoPath: null, scope: "global" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activeScope).toBe("global");
    expect(result.current.globalPullRebase).toBe(false);
    expect(result.current.localPullRebase).toBeNull();
    expect(getGitConfig).toHaveBeenCalledWith(null);
    expect(getGitConfig).toHaveBeenCalledTimes(1);
  });

  it("repository values override globals when present", async () => {
    getGitConfig.mockImplementation(async (repoPath: string | null) => {
      if (repoPath === null) return GLOBAL_CONFIG;
      return {
        ...GLOBAL_CONFIG,
        pullRebase: true,
        fetchPrune: true,
        rebaseAutostash: true,
      };
    });

    const { result } = renderHook(() =>
      useGitBehaviorSettings({ currentRepoPath: "/repo/one", scope: "repo" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.localPullRebase).toBe(true);
    expect(result.current.fetchPrune).toBe(true);
    expect(result.current.rebaseAutostash).toBe(true);
    expect(getGitConfig).toHaveBeenCalledWith(null);
    expect(getGitConfig).toHaveBeenCalledWith("/repo/one");
  });

  it("inherit clears the repo-local pull.rebase override", async () => {
    getGitConfig.mockImplementation(async (repoPath: string | null) => {
      if (repoPath === null) return GLOBAL_CONFIG;
      return { ...GLOBAL_CONFIG, pullRebase: true };
    });

    const { result } = renderHook(() =>
      useGitBehaviorSettings({ currentRepoPath: "/repo/one", scope: "repo" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.localPullRebase).toBe(true);

    await act(async () => {
      await result.current.handleRepoPullStrategyChange("inherit");
    });

    expect(setGitConfig).toHaveBeenCalledWith("/repo/one", "local", "pull.rebase", "");
    expect(result.current.localPullRebase).toBeNull();
    expect(result.current.saving).toBe(false);
  });

  it("resets saving after a successful save", async () => {
    const { result } = renderHook(() =>
      useGitBehaviorSettings({ currentRepoPath: null, scope: "global" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleGlobalPullStrategyChange(true);
    });

    expect(setGitConfig).toHaveBeenCalledWith(null, "global", "pull.rebase", "true");
    expect(result.current.saving).toBe(false);
    expect(result.current.globalPullRebase).toBe(true);
  });

  it("resets saving after a failed save", async () => {
    setGitConfig.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() =>
      useGitBehaviorSettings({ currentRepoPath: null, scope: "global" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleGlobalPullStrategyChange(true);
    });

    expect(result.current.saving).toBe(false);
  });

  it("persists the selected auto-fetch interval", async () => {
    localStorage.clear();

    const { result } = renderHook(() =>
      useGitBehaviorSettings({ currentRepoPath: null, scope: "global" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleAutoFetchChange(900);
    });

    expect(result.current.autoFetchInterval).toBe(900);
    expect(localStorage.getItem("gitvista_autofetch_interval")).toBe("900");
  });
});
