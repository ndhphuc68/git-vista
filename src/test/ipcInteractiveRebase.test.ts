import { describe, it, expect, beforeEach } from "vitest";
import { invokeCommand, resetMockRebaseCommits } from "../ipc/client";
import { vi } from "../i18n/vi";
import { en } from "../i18n/en";

describe("IPC Client - Visual Interactive Rebase", () => {
  beforeEach(() => {
    resetMockRebaseCommits();
  });

  it("fetches list of rebase commits in mock mode", async () => {
    const commits = await invokeCommand.getRebaseCommits(
      "/path/to/repo",
      "0000000000000000000000000000000000000000"
    );
    expect(commits).toBeDefined();
    expect(commits.length).toBe(3);
    expect(commits[0]?.short_id).toBe("a1b2c3d");
    expect(commits[0]?.summary).toBe("feat: add user authentication");
    expect(commits[1]?.summary).toBe("fix: resolve token expiry bug");
    expect(commits[2]?.summary).toBe("docs: update API readme");
  });

  it("executes interactive rebase plan in mock mode", async () => {
    const steps = [
      {
        commit_id: "b2c3d4e5f6789012345678901234567890123456",
        action: "Pick" as const,
        new_message: null,
      },
      {
        commit_id: "a1b2c3d4e5f67890123456789012345678901234",
        action: "Reword" as const,
        new_message: "feat: add user authentication (reworded)",
      },
      {
        commit_id: "c3d4e5f678901234567890123456789012345678",
        action: "Drop" as const,
        new_message: null,
      },
    ];

    const result = await invokeCommand.executeInteractiveRebase(
      "/path/to/repo",
      "0000000000000000000000000000000000000000",
      steps,
      true
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("Success");
    expect(result.head_commit_id).toBeDefined();
    expect(result.undo_token).toBe("refs/gitui-backup/commit-undo-mock-123");
  });

  it("ensures 100% bilingual parity for interactive rebase strings", () => {
    // Graph context menu
    expect(vi.graph.interactiveRebaseHere).toBeDefined();
    expect(en.graph.interactiveRebaseHere).toBeDefined();

    // Command palette
    expect(vi.palette.commands.gitInteractiveRebaseTitle).toBeDefined();
    expect(en.palette.commands.gitInteractiveRebaseTitle).toBeDefined();
    expect(vi.palette.commands.gitInteractiveRebaseDesc).toBeDefined();
    expect(en.palette.commands.gitInteractiveRebaseDesc).toBeDefined();

    // Modal translations
    const viModal = vi.modals.interactiveRebase;
    const enModal = en.modals.interactiveRebase;

    expect(viModal.title).toBe(enModal.title);
    expect(viModal.actions.pick).toBe(enModal.actions.pick);
    expect(viModal.actions.reword).toBe(enModal.actions.reword);
    expect(viModal.actions.squash).toBe(enModal.actions.squash);
    expect(viModal.actions.fixup).toBe(enModal.actions.fixup);
    expect(viModal.actions.drop).toBe(enModal.actions.drop);

    // Verify all keys in viModal exist in enModal
    const viKeys = Object.keys(viModal) as Array<keyof typeof viModal>;
    for (const key of viKeys) {
      expect(enModal[key]).toBeDefined();
    }
  });
});
