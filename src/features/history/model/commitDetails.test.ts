import { afterEach, describe, expect, it, vi } from "vitest";
import { getTranslation } from "../../../i18n";
import {
  formatExactDateTime,
  formatRelativeTime,
  formatShortDateTime,
  getAuthorAvatarStyle,
  getAuthorInitials,
  getFileStatusMeta,
  getTypeBadgeStyle,
  parseCommitMessage,
  splitFilePath,
} from "./commitDetails";

afterEach(() => vi.useRealTimers());

describe("commit detail models", () => {
  it("separates a conventional subject, scope, and trimmed multiline body", () => {
    expect(
      parseCommitMessage("FEAT(history): Show details\n\nExplain changes\nKeep context\n")
    ).toEqual({
      type: "feat",
      scope: "history",
      cleanSubject: "Show details",
      fullSubject: "FEAT(history): Show details",
      body: "Explain changes\nKeep context",
    });
    expect(parseCommitMessage("fix: Correct selection")).toMatchObject({
      type: "fix",
      scope: null,
      cleanSubject: "Correct selection",
      body: "",
    });
  });

  it.each(["Merge branch main", "feat!: Breaking change", "feat:", ""])(
    "preserves non-conventional subject %j",
    (subject) => {
      expect(parseCommitMessage(subject)).toEqual({
        type: null,
        scope: null,
        cleanSubject: subject,
        fullSubject: subject,
        body: "",
      });
    }
  );

  it.each([
    ["A", "A", "Thêm mới"],
    ["added", "A", "Thêm mới"],
    ["D", "D", "Đã xoá"],
    ["deleted", "D", "Đã xoá"],
    ["R100", "R", "Đổi tên"],
    ["renamed", "R", "Đổi tên"],
    ["M", "M", "Sửa đổi"],
    ["modified", "M", "Sửa đổi"],
    ["unknown", "M", "Sửa đổi"],
    ["", "M", "Sửa đổi"],
  ])("classifies status %j with its fallback label", (status, code, label) => {
    expect(getFileStatusMeta(status)).toMatchObject({ code, label });
    expect(getFileStatusMeta(status).badgeClass).not.toBe("");
  });

  it.each([
    ["A", "Added"],
    ["D", "Deleted"],
    ["R90", "Renamed"],
    ["M", "Modified"],
  ])("uses translated status %j", (status, label) => {
    expect(
      getFileStatusMeta(status, {
        added: "Added",
        deleted: "Deleted",
        renamed: "Renamed",
        modified: "Modified",
      }).label
    ).toBe(label);
  });

  it.each([
    ["", "??"],
    ["Ada Lovelace", "AL"],
    ["ada_lovelace", "AL"],
    ["alice", "AL"],
    ["a", "A"],
  ])("derives initials for %j", (name, expected) => {
    expect(getAuthorInitials(name)).toBe(expected);
  });

  it("assigns stable avatar colors including the empty author fallback", () => {
    expect(getAuthorAvatarStyle("")).toEqual({
      bg: "bg-indigo-600 text-white",
      ring: "ring-indigo-300 dark:ring-indigo-800",
    });
    expect(getAuthorAvatarStyle("Ada Lovelace")).toEqual(getAuthorAvatarStyle("Ada Lovelace"));
  });

  it.each([
    ["feat", "blue"],
    ["fix", "red"],
    ["docs", "emerald"],
    ["refactor", "amber"],
    ["style", "purple"],
    ["test", "cyan"],
    ["chore", "stone"],
  ])("styles the %s badge", (type, color) => {
    expect(getTypeBadgeStyle(type)).toContain(`text-${color}-800`);
  });

  it("uses the neutral badge for absent or unknown commit types", () => {
    expect(getTypeBadgeStyle(null)).toBe("bg-accent-subtle text-link border-accent/30");
    expect(getTypeBadgeStyle("custom")).toBe("bg-accent-subtle text-link border-accent/30");
  });

  it.each([
    ["README.md", "", "README.md"],
    ["src/main.ts", "src/", "main.ts"],
    ["", "", ""],
  ])("splits path %j", (path, dir, fileName) => {
    expect(splitFilePath(path)).toEqual({ dir, fileName });
  });

  it.each([
    [-1, "Vừa xong", "Just now"],
    [59, "Vừa xong", "Just now"],
    [60, "1 phút trước", "1m ago"],
    [3600, "1 giờ trước", "1h ago"],
    [86400, "Hôm qua", "Yesterday"],
    [172800, "2 ngày trước", "2d ago"],
    [2592000, "1 tháng trước", "1mo ago"],
    [31536000, "1 năm trước", "1y ago"],
  ])("preserves relative time at %i seconds", (seconds, fallback, translated) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T12:00:00Z"));
    const timestamp = Date.now() / 1000 - seconds;
    expect(formatRelativeTime(timestamp)).toBe(fallback);
    expect(formatRelativeTime(timestamp, getTranslation("en").diff.time)).toBe(translated);
  });

  it("formats exact local date and time with zero padding", () => {
    expect(formatExactDateTime(new Date(2026, 0, 2, 3, 4, 5).getTime() / 1000)).toBe(
      "02/01/2026, 03:04:05"
    );
  });

  it("formats a compact local date and time without seconds", () => {
    expect(formatShortDateTime(new Date(2026, 0, 2, 3, 4, 5).getTime() / 1000)).toBe(
      "02/01/2026 03:04"
    );
  });
});
