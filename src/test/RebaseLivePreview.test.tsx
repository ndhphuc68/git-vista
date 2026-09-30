import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RebaseLivePreview } from "../components/rebase/RebaseLivePreview";
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

describe("RebaseLivePreview", () => {
  it("projects picked, reworded, squashed and dropped commits into the timeline", () => {
    const commits = [
      makeCommit("c1", "1111111", "Commit One"),
      makeCommit("c2", "2222222", "Commit Two"),
      makeCommit("c3", "3333333", "Commit Three"),
      makeCommit("c4", "4444444", "Commit Four"),
    ];
    const commitMap = new Map(commits.map((c) => [c.id, c]));

    const steps: RebasePlanStep[] = [
      { commit_id: "c1", action: "Pick", new_message: null },
      { commit_id: "c2", action: "Reword", new_message: "Reworded message" },
      { commit_id: "c3", action: "Squash", new_message: null },
      { commit_id: "c4", action: "Drop", new_message: null },
    ];

    render(
      <RebaseLivePreview
        baseCommitId="0000000000000000000000000000000000000000"
        baseCommitSummary="Base"
        steps={steps}
        commitMap={commitMap}
      />
    );

    // 2 resulting commits: Commit One, Commit Two(reworded)+Commit Three squashed into it
    expect(screen.getByText("2 commit thành phẩm")).toBeInTheDocument();

    expect(screen.getByText("Reworded message")).toBeInTheDocument();
    expect(screen.getByText(/squashed into this/i)).toBeInTheDocument();
    expect(screen.getByText("4444444")).toBeInTheDocument();
  });

  it("shows the empty state when all commits are dropped", () => {
    const commit = makeCommit("c1", "1111111", "Only commit");
    const commitMap = new Map([[commit.id, commit]]);
    const steps: RebasePlanStep[] = [{ commit_id: "c1", action: "Drop", new_message: null }];

    render(
      <RebaseLivePreview
        baseCommitId="0000000000000000000000000000000000000000"
        steps={steps}
        commitMap={commitMap}
      />
    );

    expect(screen.getByText(/không thể loại bỏ tất cả/i)).toBeInTheDocument();
  });

  it("renders squashed and dropped rows without duplicate keys", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const commits = [
      makeCommit("c1", "1111111", "Commit One"),
      makeCommit("c2", "2222222", "Commit Two"),
      makeCommit("c3", "3333333", "Commit Three"),
      makeCommit("c4", "4444444", "Commit Four"),
      makeCommit("c5", "5555555", "Commit Five"),
    ];
    const steps: RebasePlanStep[] = [
      { commit_id: "c1", action: "Pick", new_message: null },
      { commit_id: "c2", action: "Squash", new_message: null },
      { commit_id: "c3", action: "Fixup", new_message: null },
      { commit_id: "c4", action: "Drop", new_message: null },
      { commit_id: "c5", action: "Drop", new_message: null },
    ];

    render(
      <RebaseLivePreview
        baseCommitId="0000000000000000000000000000000000000000"
        baseCommitSummary="Base"
        steps={steps}
        commitMap={new Map(commits.map((c) => [c.id, c]))}
      />
    );

    const keyWarnings = errorSpy.mock.calls.filter((args) => String(args[0]).includes("same key"));
    expect(keyWarnings).toEqual([]);
    errorSpy.mockRestore();
  });
});
