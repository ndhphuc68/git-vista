import { describe, it, expect, beforeEach } from "vitest";
import { invokeCommand, resetMockRemotes } from "../ipc/client";
import { vi } from "../i18n/vi";
import { en } from "../i18n/en";

describe("IPC Client - Remotes Management & Prune", () => {
  beforeEach(() => {
    resetMockRemotes();
  });

  it("fetches list of remotes in mock mode", async () => {
    const remotes = await invokeCommand.getRemotes("/path/to/repo");
    expect(remotes).toBeDefined();
    expect(remotes.length).toBe(1);
    expect(remotes[0]?.name).toBe("origin");
    expect(remotes[0]?.is_default).toBe(true);
    expect(remotes[0]?.fetch_url).toBe("https://github.com/gitvista/git-vista.git");
  });

  it("adds, renames, updates URL, and removes remote in mock mode", async () => {
    // 1. Add remote
    const added = await invokeCommand.addRemote(
      "/path/to/repo",
      "upstream",
      "https://github.com/upstream/git-vista.git"
    );
    expect(added.name).toBe("upstream");
    expect(added.fetch_url).toBe("https://github.com/upstream/git-vista.git");

    let list = await invokeCommand.getRemotes("/path/to/repo");
    expect(list.length).toBe(2);
    expect(list.find((r) => r.name === "upstream")).toBeDefined();

    // 2. Set remote URL with separate push URL
    await invokeCommand.setRemoteUrl(
      "/path/to/repo",
      "upstream",
      "https://github.com/upstream/fetch-repo.git",
      "https://github.com/upstream/push-repo.git"
    );
    list = await invokeCommand.getRemotes("/path/to/repo");
    const updated = list.find((r) => r.name === "upstream");
    expect(updated?.fetch_url).toBe("https://github.com/upstream/fetch-repo.git");
    expect(updated?.push_url).toBe("https://github.com/upstream/push-repo.git");

    // 3. Rename remote
    await invokeCommand.renameRemote("/path/to/repo", "upstream", "backup");
    list = await invokeCommand.getRemotes("/path/to/repo");
    expect(list.find((r) => r.name === "upstream")).toBeUndefined();
    expect(list.find((r) => r.name === "backup")).toBeDefined();

    // 4. Remove remote
    await invokeCommand.removeRemote("/path/to/repo", "backup");
    list = await invokeCommand.getRemotes("/path/to/repo");
    expect(list.length).toBe(1);
    expect(list.find((r) => r.name === "backup")).toBeUndefined();
  });

  it("prunes remote in mock mode and returns pruned branches", async () => {
    const pruneRes = await invokeCommand.pruneRemote("/path/to/repo", "origin");
    expect(pruneRes).toBeDefined();
    expect(pruneRes.remote).toBe("origin");
    expect(pruneRes.pruned_branches.length).toBeGreaterThan(0);
    expect(pruneRes.pruned_branches[0]).toContain("origin/");
  });

  it("ensures 100% bilingual parity for remotes translations", () => {
    // Check sidebar keys
    expect(vi.sidebar.manageRemotesTitle).toBeDefined();
    expect(en.sidebar.manageRemotesTitle).toBeDefined();
    expect(vi.sidebar.pruneRemote).toBeDefined();
    expect(en.sidebar.pruneRemote).toBeDefined();
    expect(vi.sidebar.editRemote).toBeDefined();
    expect(en.sidebar.editRemote).toBeDefined();
    expect(vi.sidebar.removeRemote).toBeDefined();
    expect(en.sidebar.removeRemote).toBeDefined();

    // Check modals.remotes
    expect(vi.modals.remotes).toBeDefined();
    expect(en.modals.remotes).toBeDefined();
    expect(vi.modals.remotes.title).toBeDefined();
    expect(en.modals.remotes.title).toBeDefined();
    expect(vi.modals.remotes.addModal.title).toBeDefined();
    expect(en.modals.remotes.addModal.title).toBeDefined();
    expect(vi.modals.remotes.pruneModal.title).toBeDefined();
    expect(en.modals.remotes.pruneModal.title).toBeDefined();
    expect(vi.modals.remotes.deleteModal.title).toBeDefined();
    expect(en.modals.remotes.deleteModal.title).toBeDefined();

    // Compare keys between vi and en
    const viKeys = Object.keys(vi.modals.remotes);
    const enKeys = Object.keys(en.modals.remotes);
    expect(viKeys.sort()).toEqual(enKeys.sort());

    const viAddModalKeys = Object.keys(vi.modals.remotes.addModal);
    const enAddModalKeys = Object.keys(en.modals.remotes.addModal);
    expect(viAddModalKeys.sort()).toEqual(enAddModalKeys.sort());
  });
});
