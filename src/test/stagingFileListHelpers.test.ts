import { describe, it, expect } from "vitest";
import {
  getStatusBadge,
  resolveStagingLists,
} from "../components/changes/stagingFileListHelpers";
import { type StatusFileItem } from "../ipc/bindings.generated";

describe("getStatusBadge", () => {
  const badgeDict = {
    conflicted: "Xung đột",
    modified: "Đã sửa",
    untracked: "Tệp mới",
    deleted: "Đã xoá",
    renamed: "Đổi tên",
  };

  it("maps each known status to its one-letter label and tooltip", () => {
    expect(getStatusBadge("Conflicted", badgeDict)).toMatchObject({
      label: "C",
      title: "Xung đột",
    });
    expect(getStatusBadge("Modified", badgeDict)).toMatchObject({
      label: "M",
      title: "Đã sửa",
    });
    expect(getStatusBadge("New", badgeDict)).toMatchObject({
      label: "U",
      title: "Tệp mới",
    });
    expect(getStatusBadge("Untracked", badgeDict)).toMatchObject({
      label: "U",
      title: "Tệp mới",
    });
    expect(getStatusBadge("Deleted", badgeDict)).toMatchObject({
      label: "D",
      title: "Đã xoá",
    });
    expect(getStatusBadge("Renamed", badgeDict)).toMatchObject({
      label: "R",
      title: "Đổi tên",
    });
  });

  it("falls back to an 'M' badge with the raw status as its tooltip for an unknown status", () => {
    expect(getStatusBadge("Weird" as never, badgeDict)).toMatchObject({
      label: "M",
      title: "Weird",
    });
  });

  it("renders a type change with the neutral M badge and the raw status as title", () => {
    expect(getStatusBadge("Typechange", badgeDict)).toEqual({
      label: "M",
      className: "bg-window text-secondary",
      title: "Typechange",
    });
  });
});

describe("resolveStagingLists", () => {
  const staged: StatusFileItem[] = [
    { path: "staged.ts", status: "Modified", is_staged: true, old_path: null },
  ];
  const unstaged: StatusFileItem[] = [
    { path: "unstaged.ts", status: "Modified", is_staged: false, old_path: null },
  ];
  const untracked: StatusFileItem[] = [
    { path: "untracked.ts", status: "New", is_staged: false, old_path: null },
  ];
  const conflicted: StatusFileItem[] = [
    { path: "conflict.ts", status: "Conflicted", is_staged: false, old_path: null },
  ];

  it("prefers explicit staged/unstaged/untracked/conflicted props over status", () => {
    const result = resolveStagingLists({
      status: { staged: [], unstaged: [], untracked: [], conflicted: [] },
      staged,
      unstaged,
      untracked,
      conflicted,
    });

    expect(result.stagedFiles).toBe(staged);
    expect(result.conflictedFiles).toBe(conflicted);
    expect(result.changesFiles).toEqual([
      ...unstaged,
      { ...untracked[0], isUntracked: true },
    ]);
  });

  it("falls back to the equivalent field of status when a list prop is not given", () => {
    const result = resolveStagingLists({
      status: { staged, unstaged, untracked, conflicted },
    });

    expect(result.stagedFiles).toBe(staged);
    expect(result.conflictedFiles).toBe(conflicted);
    expect(result.changesFiles).toEqual([
      ...unstaged,
      { ...untracked[0], isUntracked: true },
    ]);
  });

  it("returns empty lists when neither explicit props nor status are given", () => {
    const result = resolveStagingLists({});

    expect(result.stagedFiles).toEqual([]);
    expect(result.conflictedFiles).toEqual([]);
    expect(result.changesFiles).toEqual([]);
  });
});
