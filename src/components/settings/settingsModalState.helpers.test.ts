import { describe, it, expect } from "vitest";
import {
  buildNavGroups,
  buildRepoChoices,
  isGitConfigTab,
  repoDisplayName,
} from "./settingsModalState.helpers";
import { en } from "../../i18n/en";
import type { TabItem } from "../../types/tab";

const repoTab = (path: string, name: string, alias?: string): TabItem =>
  ({
    id: path,
    type: "repo",
    alias,
    repo: { path, name, is_bare: false, head_branch: "main", head_commit_id: "1" },
  }) as TabItem;

describe("settingsModalState helpers", () => {
  it("groups git config tabs before application tabs", () => {
    const groups = buildNavGroups(en);
    expect(groups.map((g) => g.id)).toEqual(["git", "app"]);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(["profile", "behavior"]);
    expect(groups[1]?.items.map((i) => i.id)).toEqual(["appearance", "diff", "tools", "github"]);
  });

  it("flags only profile and behavior as git config tabs", () => {
    expect(isGitConfigTab("profile")).toBe(true);
    expect(isGitConfigTab("behavior")).toBe(true);
    expect(isGitConfigTab("appearance")).toBe(false);
  });

  it("uses alias, then repo name, for repo choices", () => {
    const choices = buildRepoChoices(
      [repoTab("d:/a", "alpha", "Work"), repoTab("d:/b", "beta")],
      "d:/a"
    );
    expect(choices).toEqual([
      { path: "d:/a", label: "Work" },
      { path: "d:/b", label: "beta" },
    ]);
  });

  it("adds the current repo when no tab matches it", () => {
    expect(buildRepoChoices([], "d:/work/gamma")).toEqual([
      { path: "d:/work/gamma", label: "gamma" },
    ]);
  });

  it("derives a display name from the last path segment", () => {
    expect(repoDisplayName("C:\\code\\nomi\\")).toBe("nomi");
  });
});
