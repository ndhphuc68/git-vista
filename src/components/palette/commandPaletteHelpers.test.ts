import { describe, it, expect } from "vitest";
import { groupCommandsByCategory } from "./commandPaletteHelpers";
import type { CommandCategory, CommandItem } from "../../utils/commandRegistry";

function makeCommand(id: string, category: CommandCategory): CommandItem {
  return { id, title: id, category, action: () => {} };
}

const labels: Record<CommandCategory, string> = {
  navigation: "Navigation",
  branch: "Branch",
  git: "Git",
  settings: "Settings",
};

describe("groupCommandsByCategory", () => {
  it("groups commands by category and preserves flat indices", () => {
    const commands = [
      makeCommand("nav-1", "navigation"),
      makeCommand("git-1", "git"),
      makeCommand("nav-2", "navigation"),
    ];

    const groups = groupCommandsByCategory(commands, labels);

    const navGroup = groups.find((g) => g.category === "navigation");
    const gitGroup = groups.find((g) => g.category === "git");

    expect(navGroup?.label).toBe("Navigation");
    expect(navGroup?.items.map((i) => i.flatIndex)).toEqual([0, 2]);
    expect(gitGroup?.items.map((i) => i.flatIndex)).toEqual([1]);
  });

  it("returns an empty array when there are no commands", () => {
    expect(groupCommandsByCategory([], labels)).toEqual([]);
  });

  it("falls back to the raw category value when no label is provided", () => {
    const commands = [makeCommand("settings-1", "settings")];
    const groups = groupCommandsByCategory(commands, {
      ...labels,
      settings: "",
    });

    expect(groups[0]?.label).toBe("settings");
  });
});
