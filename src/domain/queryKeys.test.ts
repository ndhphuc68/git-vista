import { describe, it, expect } from "vitest";
import { qk } from "./queryKeys";

describe("queryKeys", () => {
  const REPO = "/home/user/project";

  it("mọi key của một repo đều bắt đầu bằng tiền tố repo để invalidate theo phạm vi", () => {
    const prefix = qk.repo.all(REPO);
    const keys = [
      qk.repo.status(REPO),
      qk.repo.head(REPO),
      qk.branches(REPO),
      qk.tags(REPO),
      qk.remotes(REPO),
      qk.commitGraph(REPO),
      qk.stashes(REPO),
    ];

    for (const key of keys) {
      expect(key.slice(0, prefix.length)).toEqual([...prefix]);
    }
  });

  it("hai repo khác nhau cho ra key khác nhau", () => {
    expect(qk.branches("/a")).not.toEqual(qk.branches("/b"));
  });

  it("cùng tham số thì cho ra key bằng nhau, để React Query nhận diện đúng cache", () => {
    expect(qk.commitGraph(REPO)).toEqual(qk.commitGraph(REPO));
  });

  it("key phụ thuộc tham số phụ phải phân biệt theo tham số đó", () => {
    expect(qk.fileDiff(REPO, "abc", "a.ts", false)).not.toEqual(
      qk.fileDiff(REPO, "abc", "b.ts", false)
    );
    expect(qk.fileDiff(REPO, "abc", "a.ts", false)).not.toEqual(
      qk.fileDiff(REPO, "def", "a.ts", false)
    );
  });

  it("fileDiff phân biệt theo tuỳ chọn bỏ qua khoảng trắng — thiếu tham số này thì hai chế độ hiển thị dùng chung một ô cache", () => {
    expect(qk.fileDiff(REPO, "abc", "a.ts", false)).not.toEqual(
      qk.fileDiff(REPO, "abc", "a.ts", true)
    );
  });

  it("key mới cũng mang tiền tố repo để invalidate theo phạm vi", () => {
    const prefix = qk.repo.all(REPO);
    const keys = [
      qk.workingFileDiff(REPO, "a.ts", true, false),
      qk.conflictFile(REPO, "a.ts"),
      qk.compareSummary(REPO, "main", "dev", "twodot"),
      qk.rebaseCommits(REPO, "abc123"),
    ];
    for (const key of keys) {
      expect(key.slice(0, prefix.length)).toEqual([...prefix]);
    }
  });

  it("workingFileDiff phân biệt theo từng tham số", () => {
    const base = qk.workingFileDiff(REPO, "a.ts", true, false);
    // Phân biệt theo filePath
    expect(base).not.toEqual(qk.workingFileDiff(REPO, "b.ts", true, false));
    // Phân biệt theo isStaged
    expect(base).not.toEqual(qk.workingFileDiff(REPO, "a.ts", false, false));
    // Phân biệt theo ignoreWhitespace
    expect(base).not.toEqual(qk.workingFileDiff(REPO, "a.ts", true, true));
    // Phân biệt theo repo
    expect(base).not.toEqual(qk.workingFileDiff("/other/repo", "a.ts", true, false));
  });

  it("conflictFile phân biệt theo từng tham số", () => {
    const base = qk.conflictFile(REPO, "a.ts");
    // Phân biệt theo filePath
    expect(base).not.toEqual(qk.conflictFile(REPO, "b.ts"));
    // Phân biệt theo repo
    expect(base).not.toEqual(qk.conflictFile("/other/repo", "a.ts"));
  });

  it("compareSummary phân biệt theo từng tham số", () => {
    const base = qk.compareSummary(REPO, "main", "dev", "twodot");
    // Phân biệt theo baseRev
    expect(base).not.toEqual(qk.compareSummary(REPO, "master", "dev", "twodot"));
    // Phân biệt theo targetRev
    expect(base).not.toEqual(qk.compareSummary(REPO, "main", "other", "twodot"));
    // Phân biệt theo mode
    expect(base).not.toEqual(qk.compareSummary(REPO, "main", "dev", "threedot"));
    // Phân biệt theo repo
    expect(base).not.toEqual(qk.compareSummary("/other/repo", "main", "dev", "twodot"));
  });

  it("rebaseCommits phân biệt theo từng tham số", () => {
    const base = qk.rebaseCommits(REPO, "abc123");
    // Phân biệt theo baseCommitId
    expect(base).not.toEqual(qk.rebaseCommits(REPO, "def456"));
    // Phân biệt theo repo
    expect(base).not.toEqual(qk.rebaseCommits("/other/repo", "abc123"));
  });

  it("compareFileDiff phân biệt theo từng tham số, gồm cả tuỳ chọn bỏ qua khoảng trắng", () => {
    const base = qk.compareFileDiff(REPO, "main", "dev", "a.ts", "twodot", false);
    // Phân biệt theo baseRev
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "master", "dev", "a.ts", "twodot", false));
    // Phân biệt theo targetRev
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "other", "a.ts", "twodot", false));
    // Phân biệt theo filePath
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "dev", "b.ts", "twodot", false));
    // Phân biệt theo mode
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "dev", "a.ts", "threedot", false));
    // Phân biệt theo ignoreWhitespace
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "dev", "a.ts", "twodot", true));
    // Phân biệt theo repo
    expect(base).not.toEqual(
      qk.compareFileDiff("/other/repo", "main", "dev", "a.ts", "twodot", false)
    );
  });
});
