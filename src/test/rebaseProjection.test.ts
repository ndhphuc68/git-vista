import { describe, it, expect } from "vitest";
import { projectRebasePlan } from "../components/rebase/rebaseProjection";
import type { RebaseCommitItem, RebasePlanStep } from "../ipc/bindings.generated";

function makeCommit(id: string, short: string, summary: string): RebaseCommitItem {
  return {
    id,
    short_id: short,
    summary,
    message: summary,
    author_name: "Dev",
    author_email: "dev@example.com",
    timestamp: 1700000000,
    parent_ids: [],
  };
}

describe("projectRebasePlan", () => {
  it("keeps picked commits as-is", () => {
    const commit = makeCommit("c1", "1111111", "Pick me");
    const commitMap = new Map([[commit.id, commit]]);
    const steps: RebasePlanStep[] = [{ commit_id: "c1", action: "Pick", new_message: null }];

    const result = projectRebasePlan(steps, commitMap);

    expect(result.projectedCommits).toHaveLength(1);
    expect(result.projectedCommits[0]).toMatchObject({
      short_id: "1111111",
      displayMessage: "Pick me",
      isReworded: false,
      isSquashed: false,
    });
    expect(result.droppedCommits).toHaveLength(0);
    expect(result.squashedCount).toBe(0);
    expect(result.rewordedCount).toBe(0);
  });

  it("overrides the display message and counts a reworded commit", () => {
    const commit = makeCommit("c1", "1111111", "Original");
    const commitMap = new Map([[commit.id, commit]]);
    const steps: RebasePlanStep[] = [
      { commit_id: "c1", action: "Reword", new_message: "New message\nbody" },
    ];

    const result = projectRebasePlan(steps, commitMap);

    expect(result.projectedCommits[0]?.displayMessage).toBe("New message");
    expect(result.projectedCommits[0]?.isReworded).toBe(true);
    expect(result.rewordedCount).toBe(1);
  });

  it("folds Squash/Fixup steps into the preceding projected commit", () => {
    const c1 = makeCommit("c1", "1111111", "Base pick");
    const c2 = makeCommit("c2", "2222222", "Squash me");
    const commitMap = new Map([
      [c1.id, c1],
      [c2.id, c2],
    ]);
    const steps: RebasePlanStep[] = [
      { commit_id: "c1", action: "Pick", new_message: null },
      { commit_id: "c2", action: "Squash", new_message: "Combined message" },
    ];

    const result = projectRebasePlan(steps, commitMap);

    expect(result.projectedCommits).toHaveLength(1);
    expect(result.projectedCommits[0]?.isSquashed).toBe(true);
    expect(result.projectedCommits[0]?.displayMessage).toBe("Combined message");
    expect(result.projectedCommits[0]?.squashedSubCommits).toEqual([
      { short_id: "2222222", summary: "Squash me" },
    ]);
    expect(result.squashedCount).toBe(1);
  });

  it("ignores a leading Squash/Fixup step with nothing to fold into", () => {
    const commit = makeCommit("c1", "1111111", "Squash first");
    const commitMap = new Map([[commit.id, commit]]);
    const steps: RebasePlanStep[] = [{ commit_id: "c1", action: "Fixup", new_message: null }];

    const result = projectRebasePlan(steps, commitMap);

    expect(result.projectedCommits).toHaveLength(0);
    expect(result.squashedCount).toBe(1);
  });

  it("collects dropped commits separately", () => {
    const commit = makeCommit("c1", "1111111", "Drop me");
    const commitMap = new Map([[commit.id, commit]]);
    const steps: RebasePlanStep[] = [{ commit_id: "c1", action: "Drop", new_message: null }];

    const result = projectRebasePlan(steps, commitMap);

    expect(result.projectedCommits).toHaveLength(0);
    expect(result.droppedCommits).toEqual([{ short_id: "1111111", summary: "Drop me" }]);
  });

  it("falls back to the step's commit id when the commit is not in the map", () => {
    const steps: RebasePlanStep[] = [
      { commit_id: "abcdef1234567890", action: "Pick", new_message: null },
    ];

    const result = projectRebasePlan(steps, new Map());

    expect(result.projectedCommits[0]?.short_id).toBe("abcdef1");
    expect(result.projectedCommits[0]?.author_name).toBe("Author");
  });
});
