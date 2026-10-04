import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GitProfileTab } from "./GitProfileTab";
import { invokeCommand, type GitConfigDto } from "../../../ipc/client";

const GLOBAL_CONFIG: GitConfigDto = {
  userName: "Global User",
  userNameSource: "global",
  userEmail: "global@example.com",
  userEmailSource: "global",
  defaultBranch: "main",
  pullRebase: false,
  gpgSign: false,
  gpgKey: null,
  fetchPrune: false,
  rebaseAutostash: false,
};

const LOCAL_CONFIG: GitConfigDto = {
  ...GLOBAL_CONFIG,
  userName: "Local User",
  userNameSource: "local",
  userEmail: "local@example.com",
  userEmailSource: "local",
};

describe("GitProfileTab", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reads both the global and the repo-local git config on mount", async () => {
    const getSpy = vi
      .spyOn(invokeCommand, "getGitConfig")
      .mockImplementation(async (repoPath) => (repoPath === null ? GLOBAL_CONFIG : LOCAL_CONFIG));

    render(<GitProfileTab currentRepoPath="/repo/one" />);

    await waitFor(() => expect(getSpy).toHaveBeenCalledWith(null));
    expect(getSpy).toHaveBeenCalledWith("/repo/one");
  });

  it("saves trimmed user.name and user.email at global scope", async () => {
    vi.spyOn(invokeCommand, "getGitConfig").mockResolvedValue(GLOBAL_CONFIG);
    const setSpy = vi.spyOn(invokeCommand, "setGitConfig").mockResolvedValue(undefined);

    render(<GitProfileTab currentRepoPath={null} />);

    const nameInput = await screen.findByDisplayValue("Global User");
    fireEvent.change(nameInput, { target: { value: "  Jane Doe  " } });

    const emailInput = screen.getByLabelText(/user\.email/i);
    fireEvent.change(emailInput, { target: { value: "  jane@example.com  " } });

    fireEvent.click(screen.getByTestId("save-profile-btn"));

    await waitFor(() =>
      expect(setSpy).toHaveBeenCalledWith(null, "global", "user.name", "Jane Doe")
    );
    expect(setSpy).toHaveBeenCalledWith(null, "global", "user.email", "jane@example.com");
  });

  it("shows the save bar only after an edit and discards back to the loaded values", async () => {
    vi.spyOn(invokeCommand, "getGitConfig").mockResolvedValue(GLOBAL_CONFIG);

    render(<GitProfileTab currentRepoPath={null} />);

    const nameInput = await screen.findByDisplayValue("Global User");
    expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Someone Else" } });
    expect(screen.getByTestId("save-profile-btn")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("discard-profile-btn"));
    expect(nameInput).toHaveValue("Global User");
    expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument();
  });

  it("hides the save bar after saving a cleared default branch at global scope", async () => {
    vi.spyOn(invokeCommand, "getGitConfig").mockResolvedValue(GLOBAL_CONFIG);
    vi.spyOn(invokeCommand, "setGitConfig").mockResolvedValue(undefined);

    render(<GitProfileTab currentRepoPath={null} />);

    await screen.findByDisplayValue("Global User");
    const branchInput = document.getElementById("default-branch") as HTMLInputElement;
    fireEvent.change(branchInput, { target: { value: "" } });
    fireEvent.click(screen.getByTestId("save-profile-btn"));

    await waitFor(() => expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument());
    expect(branchInput).toHaveValue("main");
  });

  it("hides the save bar after clearing an overridden signing key in repo scope", async () => {
    const globalCfg: GitConfigDto = { ...GLOBAL_CONFIG, gpgSign: true, gpgKey: "GLOBALKEY" };
    let localCfg: GitConfigDto = { ...LOCAL_CONFIG, gpgSign: true, gpgKey: "LOCALKEY" };
    vi.spyOn(invokeCommand, "getGitConfig").mockImplementation(async (repoPath) =>
      repoPath === null ? globalCfg : localCfg
    );
    vi.spyOn(invokeCommand, "setGitConfig").mockImplementation(async (_repo, scope, key, value) => {
      // The merged repo config falls back to the global key once the local one is removed.
      if (scope === "local" && key === "user.signingkey" && value === "") {
        localCfg = { ...localCfg, gpgKey: "GLOBALKEY" };
      }
    });

    render(<GitProfileTab currentRepoPath="/repo/one" scope="repo" />);

    const keyInput = await screen.findByDisplayValue("LOCALKEY");
    fireEvent.change(keyInput, { target: { value: "" } });
    fireEvent.click(screen.getByTestId("save-profile-btn"));

    await waitFor(() => expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument());
  });
});
