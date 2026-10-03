import { describe, it, expect } from "vitest";
import {
  mapPullRequestUser,
  mapRefPoint,
  mapRawPullRequest,
  mapCheckRunStatus,
  mapPullRequestFile,
} from "../services/githubService";

describe("githubService mappers", () => {
  describe("mapPullRequestUser", () => {
    it("maps every field from a realistic raw user", () => {
      expect(
        mapPullRequestUser({
          login: "octocat",
          avatar_url: "https://avatars.example/octocat.png",
          html_url: "https://github.com/octocat",
        })
      ).toEqual({
        login: "octocat",
        avatar_url: "https://avatars.example/octocat.png",
        html_url: "https://github.com/octocat",
      });
    });

    it("falls back to defaults when fields are missing", () => {
      expect(mapPullRequestUser({})).toEqual({
        login: "unknown",
        avatar_url: "",
        html_url: "",
      });
    });

    it("falls back to defaults when the user is undefined", () => {
      expect(mapPullRequestUser(undefined)).toEqual({
        login: "unknown",
        avatar_url: "",
        html_url: "",
      });
    });
  });

  describe("mapRefPoint", () => {
    it("maps a realistic head/base ref", () => {
      expect(mapRefPoint({ ref: "feature/auth", sha: "abc123" })).toEqual({
        ref: "feature/auth",
        sha: "abc123",
      });
    });

    it("falls back to empty strings when fields are missing", () => {
      expect(mapRefPoint({})).toEqual({ ref: "", sha: "" });
    });

    it("falls back to empty strings when the point is undefined", () => {
      expect(mapRefPoint(undefined)).toEqual({ ref: "", sha: "" });
    });
  });

  describe("mapRawPullRequest", () => {
    it("maps a realistic raw pull request", () => {
      const raw = {
        number: 42,
        title: "Add login flow",
        state: "open",
        merged_at: null,
        draft: false,
        user: {
          login: "octocat",
          avatar_url: "https://avatars.example/octocat.png",
          html_url: "https://github.com/octocat",
        },
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        head: { ref: "feature/auth", sha: "abc123" },
        base: { ref: "main", sha: "def456" },
        comments: 3,
        labels: [{ id: 1, name: "bug", color: "ff0000", description: null }],
        html_url: "https://github.com/octo/repo/pull/42",
      };

      expect(mapRawPullRequest(raw)).toEqual({
        number: 42,
        title: "Add login flow",
        state: "open",
        merged_at: null,
        draft: false,
        user: {
          login: "octocat",
          avatar_url: "https://avatars.example/octocat.png",
          html_url: "https://github.com/octocat",
        },
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        head: { ref: "feature/auth", sha: "abc123" },
        base: { ref: "main", sha: "def456" },
        comments: 3,
        labels: [{ id: 1, name: "bug", color: "ff0000", description: null }],
        html_url: "https://github.com/octo/repo/pull/42",
      });
    });

    it("applies every fallback when optional fields are absent", () => {
      const raw = {
        number: 1,
        title: "Minimal PR",
        state: "closed",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        html_url: "https://github.com/octo/repo/pull/1",
      };

      expect(mapRawPullRequest(raw)).toEqual({
        number: 1,
        title: "Minimal PR",
        state: "closed",
        merged_at: null,
        draft: false,
        user: { login: "unknown", avatar_url: "", html_url: "" },
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        head: { ref: "", sha: "" },
        base: { ref: "", sha: "" },
        comments: 0,
        labels: [],
        html_url: "https://github.com/octo/repo/pull/1",
      });
    });
  });

  describe("mapCheckRunStatus", () => {
    it("maps a completed+success run to success", () => {
      expect(mapCheckRunStatus("completed", "success")).toBe("success");
    });

    it("maps a completed run with any other conclusion to failure", () => {
      expect(mapCheckRunStatus("completed", "failure")).toBe("failure");
      expect(mapCheckRunStatus("completed", null)).toBe("failure");
      expect(mapCheckRunStatus("completed", undefined)).toBe("failure");
    });

    it("maps in_progress to in_progress", () => {
      expect(mapCheckRunStatus("in_progress", undefined)).toBe("in_progress");
    });

    it("maps queued to queued", () => {
      expect(mapCheckRunStatus("queued", undefined)).toBe("queued");
    });

    it("maps an unknown or missing status to neutral", () => {
      expect(mapCheckRunStatus("cancelled", undefined)).toBe("neutral");
      expect(mapCheckRunStatus(undefined, undefined)).toBe("neutral");
    });
  });

  describe("mapPullRequestFile", () => {
    it("maps a realistic raw file", () => {
      expect(
        mapPullRequestFile({
          filename: "src/auth.ts",
          status: "modified",
          additions: 10,
          deletions: 2,
          changes: 12,
          patch: "@@ -1,2 +1,3 @@",
        })
      ).toEqual({
        filename: "src/auth.ts",
        status: "modified",
        additions: 10,
        deletions: 2,
        changes: 12,
        patch: "@@ -1,2 +1,3 @@",
      });
    });

    it("falls back to zero counts and empty patch when they are missing", () => {
      expect(mapPullRequestFile({ filename: "src/new.ts", status: "added" })).toEqual({
        filename: "src/new.ts",
        status: "added",
        additions: 0,
        deletions: 0,
        changes: 0,
        patch: "",
      });
    });
  });
});
