import { describe, it, expect, vi } from "vitest";
import { getAppCommands, filterCommands, type CommandContext } from "../utils/commandRegistry";

describe("Command Registry - GitHub Pull Requests", () => {
  it("includes git-create-pr and git-view-prs in command list", () => {
    const mockCreatePr = vi.fn();
    const mockViewPrs = vi.fn();

    const ctx: CommandContext = {
      repoPath: "/test/repo",
      navigate: vi.fn(),
      openCreatePullRequest: mockCreatePr,
      openPullRequests: mockViewPrs,
    };

    const commands = getAppCommands(ctx);

    const createPrCmd = commands.find((c) => c.id === "git-create-pr");
    expect(createPrCmd).toBeDefined();
    expect(createPrCmd?.category).toBe("git");

    createPrCmd?.action();
    expect(mockCreatePr).toHaveBeenCalled();

    const viewPrsCmd = commands.find((c) => c.id === "git-view-prs");
    expect(viewPrsCmd).toBeDefined();
    expect(viewPrsCmd?.category).toBe("git");

    viewPrsCmd?.action();
    expect(mockViewPrs).toHaveBeenCalled();
  });

  it("filters PR commands by pr, pull request, github keywords", () => {
    const ctx: CommandContext = {
      navigate: vi.fn(),
      openCreatePullRequest: vi.fn(),
      openPullRequests: vi.fn(),
    };

    const commands = getAppCommands(ctx);

    const prMatches = filterCommands(commands, "pull request");
    expect(prMatches.some((c) => c.id === "git-create-pr")).toBe(true);

    const githubMatches = filterCommands(commands, "github");
    expect(githubMatches.some((c) => c.id === "git-create-pr" || c.id === "git-view-prs")).toBe(
      true
    );
  });
});
