/**
 * Git config fixtures for browser dev mode. See `../mocks.ts` for context.
 */
import type { GitConfigDto } from "../bindings.generated";

let mockGlobalConfig: GitConfigDto = {
  userName: "GitVista User",
  userNameSource: "global",
  userEmail: "user@gitvista.dev",
  userEmailSource: "global",
  defaultBranch: "main",
  pullRebase: false,
  gpgSign: false,
  gpgKey: "",
  fetchPrune: false,
  rebaseAutostash: false,
};

let mockLocalConfigs: Record<string, Partial<GitConfigDto>> = {};

export function getMockGlobalConfig(): GitConfigDto {
  return mockGlobalConfig;
}

export function getMockLocalConfigs(): Record<string, Partial<GitConfigDto>> {
  return mockLocalConfigs;
}

export function resetMockGitConfig() {
  mockGlobalConfig = {
    userName: "GitVista User",
    userNameSource: "global",
    userEmail: "user@gitvista.dev",
    userEmailSource: "global",
    defaultBranch: "main",
    pullRebase: false,
    gpgSign: false,
    gpgKey: "",
    fetchPrune: false,
    rebaseAutostash: false,
  };
  mockLocalConfigs = {};
}
