import { describe, it, expect } from "vitest";
import { qk } from "./queryKeys";

describe("queryKeys", () => {
  const REPO = "/home/user/project";

  it("every key for a repo starts with the repo prefix, for scoped invalidation", () => {
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

  it("two different repos produce different keys", () => {
    expect(qk.branches("/a")).not.toEqual(qk.branches("/b"));
  });

  it("the same arguments produce an equal key, so React Query recognizes the correct cache entry", () => {
    expect(qk.commitGraph(REPO)).toEqual(qk.commitGraph(REPO));
  });

  it("a key depending on a secondary parameter must vary with that parameter", () => {
    expect(qk.fileDiff(REPO, "abc", "a.ts", false)).not.toEqual(
      qk.fileDiff(REPO, "abc", "b.ts", false)
    );
    expect(qk.fileDiff(REPO, "abc", "a.ts", false)).not.toEqual(
      qk.fileDiff(REPO, "def", "a.ts", false)
    );
  });

  it("fileDiff varies with the ignore-whitespace option — without this parameter, the two display modes would share one cache slot", () => {
    expect(qk.fileDiff(REPO, "abc", "a.ts", false)).not.toEqual(
      qk.fileDiff(REPO, "abc", "a.ts", true)
    );
  });

  it("newer keys also carry the repo prefix, for scoped invalidation", () => {
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

  it("workingFileDiff varies with each parameter", () => {
    const base = qk.workingFileDiff(REPO, "a.ts", true, false);
    // Varies with filePath
    expect(base).not.toEqual(qk.workingFileDiff(REPO, "b.ts", true, false));
    // Varies with isStaged
    expect(base).not.toEqual(qk.workingFileDiff(REPO, "a.ts", false, false));
    // Varies with ignoreWhitespace
    expect(base).not.toEqual(qk.workingFileDiff(REPO, "a.ts", true, true));
    // Varies with repo
    expect(base).not.toEqual(qk.workingFileDiff("/other/repo", "a.ts", true, false));
  });

  it("conflictFile varies with each parameter", () => {
    const base = qk.conflictFile(REPO, "a.ts");
    // Varies with filePath
    expect(base).not.toEqual(qk.conflictFile(REPO, "b.ts"));
    // Varies with repo
    expect(base).not.toEqual(qk.conflictFile("/other/repo", "a.ts"));
  });

  it("compareSummary varies with each parameter", () => {
    const base = qk.compareSummary(REPO, "main", "dev", "twodot");
    // Varies with baseRev
    expect(base).not.toEqual(qk.compareSummary(REPO, "master", "dev", "twodot"));
    // Varies with targetRev
    expect(base).not.toEqual(qk.compareSummary(REPO, "main", "other", "twodot"));
    // Varies with mode
    expect(base).not.toEqual(qk.compareSummary(REPO, "main", "dev", "threedot"));
    // Varies with repo
    expect(base).not.toEqual(qk.compareSummary("/other/repo", "main", "dev", "twodot"));
  });

  it("rebaseCommits varies with each parameter", () => {
    const base = qk.rebaseCommits(REPO, "abc123");
    // Varies with baseCommitId
    expect(base).not.toEqual(qk.rebaseCommits(REPO, "def456"));
    // Varies with repo
    expect(base).not.toEqual(qk.rebaseCommits("/other/repo", "abc123"));
  });

  it("compareFileDiff varies with each parameter, including the ignore-whitespace option", () => {
    const base = qk.compareFileDiff(REPO, "main", "dev", "a.ts", "twodot", false);
    // Varies with baseRev
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "master", "dev", "a.ts", "twodot", false));
    // Varies with targetRev
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "other", "a.ts", "twodot", false));
    // Varies with filePath
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "dev", "b.ts", "twodot", false));
    // Varies with mode
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "dev", "a.ts", "threedot", false));
    // Varies with ignoreWhitespace
    expect(base).not.toEqual(qk.compareFileDiff(REPO, "main", "dev", "a.ts", "twodot", true));
    // Varies with repo
    expect(base).not.toEqual(
      qk.compareFileDiff("/other/repo", "main", "dev", "a.ts", "twodot", false)
    );
  });

  it("pullRequestsAll is a prefix of every PR list, regardless of state filter", () => {
    const prefix = qk.github.pullRequestsAll(REPO);

    for (const state of ["open", "closed", "all"]) {
      const key = qk.github.pullRequests(REPO, state);
      // React Query invalidates by prefix, so the prefix must match the start of the key.
      expect(key.slice(0, prefix.length)).toEqual([...prefix]);
    }
  });

  it("pullRequestsAll varies with repo", () => {
    expect(qk.github.pullRequestsAll("/a")).not.toEqual(qk.github.pullRequestsAll("/b"));
  });
});
