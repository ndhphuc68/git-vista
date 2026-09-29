import { describe, it, expect } from "vitest";
import { getStatusKey } from "./pullRequestStatusKey";
import { type GitHubPullRequest } from "../../ipc/githubApi";

type StatusInput = Pick<GitHubPullRequest, "merged_at" | "state" | "draft">;

function makeStatusInput(overrides: Partial<StatusInput> = {}): StatusInput {
  return {
    merged_at: null,
    state: "open",
    draft: false,
    ...overrides,
  };
}

describe("getStatusKey", () => {
  it("returns merged when merged_at is set, regardless of state or draft", () => {
    expect(
      getStatusKey(makeStatusInput({ merged_at: "2024-01-01T00:00:00Z", state: "closed", draft: true }))
    ).toBe("merged");
  });

  it("returns closed when state is closed and the PR was not merged", () => {
    expect(getStatusKey(makeStatusInput({ merged_at: null, state: "closed", draft: true }))).toBe(
      "closed"
    );
  });

  it("returns draft when the PR is open, unmerged and marked draft", () => {
    expect(getStatusKey(makeStatusInput({ merged_at: null, state: "open", draft: true }))).toBe(
      "draft"
    );
  });

  it("returns open when the PR is open, unmerged and not a draft", () => {
    expect(getStatusKey(makeStatusInput({ merged_at: null, state: "open", draft: false }))).toBe(
      "open"
    );
  });
});
