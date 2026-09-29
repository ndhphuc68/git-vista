import { describe, it, expect } from "vitest";
import { deriveRepoScopeFields, deriveGlobalScopeFields } from "./gitProfileFormHelpers";
import type { GitConfigDto } from "../../../ipc/client";

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

describe("deriveRepoScopeFields", () => {
  it("marks the form as overridden and prefers local values when the repo has its own identity", () => {
    const localCfg: GitConfigDto = {
      ...GLOBAL_CONFIG,
      userName: "Local User",
      userNameSource: "local",
      userEmail: "local@example.com",
      gpgSign: true,
      gpgKey: "LOCALKEY",
    };

    expect(deriveRepoScopeFields(localCfg, GLOBAL_CONFIG)).toEqual({
      isOverride: true,
      userName: "Local User",
      userEmail: "local@example.com",
      gpgSign: true,
      gpgKey: "LOCALKEY",
    });
  });

  it("falls back to global values when the repo has no local identity set", () => {
    const localCfg: GitConfigDto = {
      ...GLOBAL_CONFIG,
      userName: "",
      userNameSource: "global",
      userEmail: "",
    };

    expect(deriveRepoScopeFields(localCfg, GLOBAL_CONFIG)).toEqual({
      isOverride: false,
      userName: "Global User",
      userEmail: "global@example.com",
      gpgSign: false,
      gpgKey: "",
    });
  });
});

describe("deriveGlobalScopeFields", () => {
  it("seeds the form from the global config, defaulting the branch to main", () => {
    expect(deriveGlobalScopeFields(GLOBAL_CONFIG)).toEqual({
      isOverride: false,
      userName: "Global User",
      userEmail: "global@example.com",
      defaultBranch: "main",
      gpgSign: false,
      gpgKey: "",
    });
  });

  it("preserves a non-default branch and gpg settings", () => {
    const cfg: GitConfigDto = {
      ...GLOBAL_CONFIG,
      defaultBranch: "trunk",
      gpgSign: true,
      gpgKey: "GLOBALKEY",
    };

    expect(deriveGlobalScopeFields(cfg)).toEqual({
      isOverride: false,
      userName: "Global User",
      userEmail: "global@example.com",
      defaultBranch: "trunk",
      gpgSign: true,
      gpgKey: "GLOBALKEY",
    });
  });
});
