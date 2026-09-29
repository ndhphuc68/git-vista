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

    await waitFor(() => expect(screen.getByTestId("save-profile-btn")).not.toBeDisabled());

    const nameInput = screen.getByLabelText(/user\.name/i);
    fireEvent.change(nameInput, { target: { value: "  Jane Doe  " } });

    const emailInput = screen.getByLabelText(/user\.email/i);
    fireEvent.change(emailInput, { target: { value: "  jane@example.com  " } });

    fireEvent.click(screen.getByTestId("save-profile-btn"));

    await waitFor(() =>
      expect(setSpy).toHaveBeenCalledWith(null, "global", "user.name", "Jane Doe")
    );
    expect(setSpy).toHaveBeenCalledWith(null, "global", "user.email", "jane@example.com");
  });
});
