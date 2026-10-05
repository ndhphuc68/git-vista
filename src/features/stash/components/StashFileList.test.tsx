import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StashFileList } from "./StashFileList";
import type { CommitDetails } from "../../../ipc/bindings.generated";

function details(status: string): CommitDetails {
  return {
    id: "abc123",
    full_message: "WIP",
    author_name: "Dev",
    author_email: "dev@example.com",
    author_timestamp_sec: 0,
    parent_ids: [],
    files: [{ path: "src/a.ts", status, additions: 1, deletions: 0 }],
    total_additions: 1,
    total_deletions: 0,
  };
}

describe("StashFileList", () => {
  it.each([
    ["added", "A", "text-diff-add-text"],
    ["deleted", "D", "text-diff-remove-text"],
    ["modified", "M", "text-secondary"],
  ])("renders a %s file as %s", (status, letter, className) => {
    render(<StashFileList commitId="abc123" error={null} commitDetails={details(status)} />);
    expect(screen.getByText(letter)).toHaveClass(className);
  });
});
