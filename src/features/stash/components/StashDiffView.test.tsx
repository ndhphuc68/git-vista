import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StashDiffView } from "./StashDiffView";
import { useSettingsStore } from "../../../store/useSettingsStore";
import type { StashItem, CommitDetails } from "../../../ipc/bindings.generated";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getCommitDetails: vi.fn(),
  },
}));

import { invokeCommand } from "../../../ipc/client";

const stashItem: StashItem = {
  index: 0,
  message: "wip: stuff",
  commit_id: "commit-abc123",
  created_at: 1700000000,
};

const details: CommitDetails = {
  id: "commit-abc123",
  full_message: "wip",
  author_name: "Ada Lovelace",
  author_email: "ada@example.com",
  author_timestamp_sec: 1700000000,
  parent_ids: [],
  files: [{ path: "src/alpha.ts", status: "modified", additions: 3, deletions: 1 }],
  total_additions: 3,
  total_deletions: 1,
};

beforeEach(() => {
  useSettingsStore.setState({ locale: "en" });
  vi.mocked(invokeCommand.getCommitDetails).mockResolvedValue(details);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderView() {
  const onApply = vi.fn();
  const onPop = vi.fn();
  const onDrop = vi.fn();
  const utils = render(
    <StashDiffView
      stashItem={stashItem}
      repoPath="/test/repo"
      onApply={onApply}
      onPop={onPop}
      onDrop={onDrop}
    />
  );
  return { ...utils, onApply, onPop, onDrop };
}

describe("StashDiffView", () => {
  it("loads commit details on mount and renders the changed files", async () => {
    renderView();

    expect(invokeCommand.getCommitDetails).toHaveBeenCalledWith("/test/repo", stashItem.commit_id);
    expect(await screen.findByText("src/alpha.ts")).toBeInTheDocument();
  });

  it("calls the apply, pop and drop handlers exactly once with the stash index", async () => {
    const { onApply, onPop, onDrop } = renderView();
    await screen.findByText("src/alpha.ts");

    fireEvent.click(screen.getByText("Apply"));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(stashItem.index);
    expect(onPop).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Apply & Pop"));
    expect(onPop).toHaveBeenCalledTimes(1);
    expect(onPop).toHaveBeenCalledWith(stashItem.index);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onDrop).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Drop Stash"));
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(stashItem.index);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onPop).toHaveBeenCalledTimes(1);
  });
});
