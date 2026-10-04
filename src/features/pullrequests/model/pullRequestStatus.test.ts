import { describe, it, expect } from "vitest";
import { getPullRequestStatus } from "./pullRequestStatus";

describe("getPullRequestStatus", () => {
  it("prioritizes merged status when merged_at is present", () => {
    expect(
      getPullRequestStatus({
        merged_at: "2026-10-01T00:00:00Z",
        state: "closed",
        draft: false,
      })
    ).toBe("merged");
  });

  it("returns closed status when state is closed and not merged", () => {
    expect(
      getPullRequestStatus({
        merged_at: null,
        state: "closed",
        draft: false,
      })
    ).toBe("closed");
  });

  it("returns draft status when state is open and draft is true", () => {
    expect(
      getPullRequestStatus({
        merged_at: null,
        state: "open",
        draft: true,
      })
    ).toBe("draft");
  });

  it("returns open status when state is open and draft is false", () => {
    expect(
      getPullRequestStatus({
        merged_at: null,
        state: "open",
        draft: false,
      })
    ).toBe("open");
  });
});
