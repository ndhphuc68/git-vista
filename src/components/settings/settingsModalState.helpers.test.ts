import { describe, it, expect } from "vitest";
import {
  buildNavGroups,
  currentRepoLabel,
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

  it("labels the current repo by alias, then repo name", () => {
    const tabs = [repoTab("d:/a", "alpha", "Work"), repoTab("d:/b", "beta")];
    expect(currentRepoLabel(tabs, "d:/a")).toBe("Work");
    expect(currentRepoLabel(tabs, "d:/b")).toBe("beta");
  });

  it("falls back to the path when no tab matches the current repo", () => {
    expect(currentRepoLabel([], "d:/work/gamma")).toBe("gamma");
  });

  it("derives a display name from the last path segment", () => {
    expect(repoDisplayName("C:\\code\\nomi\\")).toBe("nomi");
  });
});
