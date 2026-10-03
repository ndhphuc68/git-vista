import { describe, it, expect } from "vitest";
import { type GitHubPullRequest } from "../../../ipc/githubApi";
import { filterPullRequests } from "./pullRequestFilter";

function createMockPr(overrides: Partial<GitHubPullRequest> = {}): GitHubPullRequest {
  return {
    number: 101,
    title: "Feature: Add dark mode toggle",
    state: "open",
    draft: false,
    user: {
      login: "alice",
      avatar_url: "https://example.com/avatar1.png",
      html_url: "https://github.com/alice",
    },
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-02T12:00:00Z",
    head: {
      ref: "feat/dark-mode",
      sha: "aaa111",
    },
    base: {
      ref: "main",
      sha: "bbb222",
    },
    comments: 3,
    labels: [
      {
        id: 1,
        name: "enhancement",
        color: "0075ca",
      },
    ],
    html_url: "https://github.com/org/repo/pull/101",
    ...overrides,
  };
}

describe("filterPullRequests", () => {
  const pr1 = createMockPr({
    number: 42,
    title: "Fix broken button hover state",
    user: {
      login: "octocat",
      avatar_url: "https://example.com/octo.png",
      html_url: "https://github.com/octocat",
    },
    head: { ref: "fix/button-hover", sha: "111" },
  });

  const pr2 = createMockPr({
    number: 105,
    title: "Implement pull requests screen",
    user: {
      login: "developer99",
      avatar_url: "https://example.com/dev.png",
      html_url: "https://github.com/developer99",
    },
    head: { ref: "feat/pr-screen", sha: "222" },
  });

  const samplePrs: GitHubPullRequest[] = [pr1, pr2];

  it("returns full list when query is empty or whitespace", () => {
    expect(filterPullRequests(samplePrs, "")).toEqual(samplePrs);
    expect(filterPullRequests(samplePrs, "   ")).toEqual(samplePrs);
  });

  it("filters by PR number without '#' prefix", () => {
    const result = filterPullRequests(samplePrs, "42");
    expect(result).toEqual([pr1]);
  });

  it("filters by PR number with '#' prefix", () => {
    const result = filterPullRequests(samplePrs, "#105");
    expect(result).toEqual([pr2]);
  });

  it("filters by title case-insensitively", () => {
    const result = filterPullRequests(samplePrs, "PULL REQUESTS");
    expect(result).toEqual([pr2]);
  });

  it("filters by author login without '@' prefix", () => {
    const result = filterPullRequests(samplePrs, "octocat");
    expect(result).toEqual([pr1]);
  });

  it("filters by author login with '@' prefix", () => {
    const result = filterPullRequests(samplePrs, "@developer99");
    expect(result).toEqual([pr2]);
  });

  it("filters by head branch name", () => {
    const result = filterPullRequests(samplePrs, "button-hover");
    expect(result).toEqual([pr1]);
  });

  it("returns empty array on non-matching query", () => {
    const result = filterPullRequests(samplePrs, "nonexistent-query-12345");
    expect(result).toEqual([]);
  });
});
