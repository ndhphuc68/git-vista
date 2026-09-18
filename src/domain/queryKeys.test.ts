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
    expect(qk.fileDiff(REPO, "abc", "a.ts")).not.toEqual(qk.fileDiff(REPO, "abc", "b.ts"));
    expect(qk.fileDiff(REPO, "abc", "a.ts")).not.toEqual(qk.fileDiff(REPO, "def", "a.ts"));
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

  it("workingFileDiff phân biệt theo trạng thái staged và tuỳ chọn khoảng trắng", () => {
    expect(qk.workingFileDiff(REPO, "a.ts", true, false)).not.toEqual(
      qk.workingFileDiff(REPO, "a.ts", false, false)
    );
    expect(qk.workingFileDiff(REPO, "a.ts", true, false)).not.toEqual(
      qk.workingFileDiff(REPO, "a.ts", true, true)
    );
  });

  it("compareSummary phân biệt theo từng tham số so sánh", () => {
    expect(qk.compareSummary(REPO, "main", "dev", "twodot")).not.toEqual(
      qk.compareSummary(REPO, "main", "dev", "threedot")
    );
    expect(qk.compareSummary(REPO, "main", "dev", "twodot")).not.toEqual(
      qk.compareSummary(REPO, "main", "other", "twodot")
    );
  });
});
