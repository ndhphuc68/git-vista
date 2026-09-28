import { describe, it, expect } from "vitest";
import { type RecentRepoEntry } from "../../../ipc/bindings.generated";
import { sortRecentRepositories } from "./recentRepositories";

function makeEntry(overrides: Partial<RecentRepoEntry>): RecentRepoEntry {
  return {
    path: "/repos/default",
    name: "default",
    last_opened_at_ms: 0,
    ...overrides,
  };
}

describe("sortRecentRepositories", () => {
  it("filters by name case-insensitively", () => {
    const repos = [
      makeEntry({ path: "/a", name: "Project-V3", last_opened_at_ms: 1 }),
      makeEntry({ path: "/b", name: "other", last_opened_at_ms: 2 }),
    ];

    const result = sortRecentRepositories(repos, [], "project");

    expect(result.map((r) => r.path)).toEqual(["/a"]);
  });

  it("filters by path case-insensitively", () => {
    const repos = [
      makeEntry({ path: "/Repos/Project-V3", name: "one", last_opened_at_ms: 1 }),
      makeEntry({ path: "/repos/other", name: "two", last_opened_at_ms: 2 }),
    ];

    const result = sortRecentRepositories(repos, [], "PROJECT-V3");

    expect(result.map((r) => r.path)).toEqual(["/Repos/Project-V3"]);
  });

  it("places pinned entries before unpinned entries regardless of recency", () => {
    const repos = [
      makeEntry({ path: "/newest", name: "newest", last_opened_at_ms: 300 }),
      makeEntry({ path: "/pinned-old", name: "pinned-old", last_opened_at_ms: 100 }),
      makeEntry({ path: "/middle", name: "middle", last_opened_at_ms: 200 }),
    ];

    const result = sortRecentRepositories(repos, ["/pinned-old"], "");

    expect(result.map((r) => r.path)).toEqual(["/pinned-old", "/newest", "/middle"]);
  });

  it("sorts by descending last_opened_at_ms within the same pinned group", () => {
    const repos = [
      makeEntry({ path: "/a", name: "a", last_opened_at_ms: 100 }),
      makeEntry({ path: "/b", name: "b", last_opened_at_ms: 300 }),
      makeEntry({ path: "/c", name: "c", last_opened_at_ms: 200 }),
    ];

    const result = sortRecentRepositories(repos, [], "");

    expect(result.map((r) => r.path)).toEqual(["/b", "/c", "/a"]);
  });

  it("does not mutate the input array", () => {
    const repos = [
      makeEntry({ path: "/a", name: "a", last_opened_at_ms: 100 }),
      makeEntry({ path: "/b", name: "b", last_opened_at_ms: 300 }),
    ];
    const original = [...repos];

    sortRecentRepositories(repos, [], "");

    expect(repos).toEqual(original);
  });
});
