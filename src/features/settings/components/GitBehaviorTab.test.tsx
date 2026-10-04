import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GitBehaviorTab } from "./GitBehaviorTab";
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
  pullRebase: true,
  gpgSign: false,
  gpgKey: null,
  fetchPrune: false,
  rebaseAutostash: false,
};

const REPO_PATH = "/repo/one";

describe("GitBehaviorTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.setState({ toasts: [] } as never);
    getGitConfig.mockImplementation(async (repoPath: string | null) =>
      repoPath === null ? GLOBAL_CONFIG : { ...GLOBAL_CONFIG, pullRebase: null }
    );
    setGitConfig.mockResolvedValue(undefined);
    setRepoPullRebase.mockResolvedValue(undefined);
  });

  it("maps the repo inherit switch to the global mode when off and to inherit when on", async () => {
    render(<GitBehaviorTab currentRepoPath={REPO_PATH} scope="repo" />);

    const toggle = await screen.findByTestId("toggle-use-global");
    await waitFor(() => expect(toggle).not.toBeDisabled());
    expect(toggle).toHaveAttribute("aria-checked", "true");

    // Off: the repo pins the global mode ("rebase") as its own override.
    fireEvent.click(toggle);
    await waitFor(() => expect(setRepoPullRebase).toHaveBeenCalledWith(REPO_PATH, true));
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
    await waitFor(() => expect(toggle).not.toBeDisabled());

    // On: the local pull.rebase is cleared so the repo inherits again.
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(setGitConfig).toHaveBeenCalledWith(REPO_PATH, "local", "pull.rebase", "")
    );
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
  });
});
