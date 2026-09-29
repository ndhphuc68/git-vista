import { describe, it, expect } from "vitest";
import { setMockGlobalConfig, setMockLocalConfig, deleteMockLocalConfig } from "../ipc/config";
import { mockState, resetMockGitConfig } from "../ipc/mocks";
import type { GitConfigDto } from "../ipc/bindings.generated";

describe("ipc/config mock lookup-table helpers", () => {
  describe("setMockGlobalConfig", () => {
    it("resets to a known baseline before each case", () => {
      resetMockGitConfig();
      expect(mockState.globalConfig.userName).toBe("GitVista User");
    });

    it("sets a string field (user.name)", () => {
      resetMockGitConfig();
      setMockGlobalConfig("user.name", "Alice");
      expect(mockState.globalConfig.userName).toBe("Alice");
    });

    it("sets the branch-only string field (init.defaultBranch)", () => {
      resetMockGitConfig();
      setMockGlobalConfig("init.defaultBranch", "develop");
      expect(mockState.globalConfig.defaultBranch).toBe("develop");
    });

    it("sets a boolean field (pull.rebase) by parsing the string value", () => {
      resetMockGitConfig();
      setMockGlobalConfig("pull.rebase", "true");
      expect(mockState.globalConfig.pullRebase).toBe(true);
      setMockGlobalConfig("pull.rebase", "false");
      expect(mockState.globalConfig.pullRebase).toBe(false);
    });

    it("ignores an unknown key", () => {
      resetMockGitConfig();
      const before = { ...mockState.globalConfig };
      setMockGlobalConfig("some.unknown.key", "value");
      expect(mockState.globalConfig).toEqual(before);
    });
  });

  describe("setMockLocalConfig / deleteMockLocalConfig", () => {
    it("sets a string field (user.email) on the local override", () => {
      const local: Partial<GitConfigDto> = {};
      setMockLocalConfig(local, "user.email", "alice@example.com");
      expect(local.userEmail).toBe("alice@example.com");
    });

    it("sets a boolean field (commit.gpgsign) on the local override", () => {
      const local: Partial<GitConfigDto> = {};
      setMockLocalConfig(local, "commit.gpgsign", "true");
      expect(local.gpgSign).toBe(true);
    });

    it("does not support init.defaultBranch locally (global-only key)", () => {
      const local: Partial<GitConfigDto> = {};
      setMockLocalConfig(local, "init.defaultBranch", "develop");
      expect(local.defaultBranch).toBeUndefined();
    });

    it("ignores an unknown key", () => {
      const local: Partial<GitConfigDto> = { userName: "Bob" };
      setMockLocalConfig(local, "some.unknown.key", "value");
      expect(local).toEqual({ userName: "Bob" });
    });

    it("deletes a previously set string field", () => {
      const local: Partial<GitConfigDto> = { userName: "Bob" };
      deleteMockLocalConfig(local, "user.name");
      expect(local.userName).toBeUndefined();
    });

    it("deletes a previously set boolean field", () => {
      const local: Partial<GitConfigDto> = { fetchPrune: true };
      deleteMockLocalConfig(local, "fetch.prune");
      expect(local.fetchPrune).toBeUndefined();
    });

    it("deleting an unknown key is a no-op", () => {
      const local: Partial<GitConfigDto> = { userName: "Bob" };
      deleteMockLocalConfig(local, "some.unknown.key");
      expect(local).toEqual({ userName: "Bob" });
    });
  });
});
