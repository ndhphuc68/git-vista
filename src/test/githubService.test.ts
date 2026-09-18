import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchPullRequests,
  fetchPullRequestDetail,
  createPullRequest,
  testGitHubToken,
} from "../services/githubService";
import { vi as viTranslations } from "../i18n/vi";
import { en as enTranslations } from "../i18n/en";

describe("GitHub Service & Translation Parity", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchPullRequests fetches PR list with proper headers", async () => {
    const mockPulls = [
      {
        number: 42,
        title: "Feature PR",
        state: "open",
        draft: false,
        user: { login: "alice", avatar_url: "https://avatar.url", html_url: "https://github.com/alice" },
        created_at: "2026-09-18T10:00:00Z",
        updated_at: "2026-09-18T10:30:00Z",
        head: { ref: "feature-branch", sha: "abc1234" },
        base: { ref: "main", sha: "def5678" },
        comments: 2,
        labels: [{ name: "enhancement", color: "a2eeef" }],
        html_url: "https://github.com/owner/repo/pull/42",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPulls,
    } as Response);

    const result = await fetchPullRequests("owner", "repo", "mock_token", "open");
    expect(result).toHaveLength(1);
    expect(result[0]?.number).toBe(42);
    expect(result[0]?.title).toBe("Feature PR");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/pulls?state=open&per_page=30",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mock_token",
          Accept: "application/vnd.github.v3+json",
        }),
      })
    );
  });

  it("fetchPullRequestDetail combines PR, checks, and files", async () => {
    const mockPr = {
      number: 10,
      title: "Fix bug",
      state: "open",
      draft: false,
      body: "Fixes the issue",
      user: { login: "bob", avatar_url: "https://avatar.url", html_url: "https://github.com/bob" },
      created_at: "2026-09-18T10:00:00Z",
      updated_at: "2026-09-18T10:30:00Z",
      head: { ref: "bugfix", sha: "111aaa" },
      base: { ref: "main", sha: "222bbb" },
      comments: 0,
      labels: [],
      html_url: "https://github.com/owner/repo/pull/10",
      mergeable: true,
      assignees: [],
      requested_reviewers: [],
      commits: 1,
    };

    const mockChecks = {
      check_runs: [
        {
          name: "build-test",
          status: "completed",
          conclusion: "success",
          html_url: "https://github.com/check/1",
        },
      ],
    };

    const mockFiles = [
      {
        filename: "src/index.ts",
        status: "modified",
        additions: 5,
        deletions: 2,
        changes: 7,
      },
    ];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/check-runs")) {
        return { ok: true, json: async () => mockChecks } as Response;
      }
      if (url.includes("/files")) {
        return { ok: true, json: async () => mockFiles } as Response;
      }
      return { ok: true, json: async () => mockPr } as Response;
    });

    const detail = await fetchPullRequestDetail("owner", "repo", 10, "mock_token");
    expect(detail.pr.number).toBe(10);
    expect(detail.body).toBe("Fixes the issue");
    expect(detail.check_runs).toHaveLength(1);
    expect(detail.check_runs[0]?.status).toBe("success");
    expect(detail.files).toHaveLength(1);
    expect(detail.files[0]?.filename).toBe("src/index.ts");
  });

  it("createPullRequest sends POST with json payload", async () => {
    const createdPr = {
      number: 99,
      title: "New feature",
      state: "open",
      draft: false,
      user: { login: "alice", avatar_url: "", html_url: "" },
      created_at: "2026-09-18T10:00:00Z",
      updated_at: "2026-09-18T10:00:00Z",
      head: { ref: "feat", sha: "123" },
      base: { ref: "main", sha: "456" },
      comments: 0,
      labels: [],
      html_url: "https://github.com/owner/repo/pull/99",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createdPr,
    } as Response);

    const result = await createPullRequest(
      "owner",
      "repo",
      { title: "New feature", body: "Description", head: "feat", base: "main", draft: false },
      "test_token"
    );

    expect(result.number).toBe(99);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/pulls",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "New feature",
          body: "Description",
          head: "feat",
          base: "main",
          draft: false,
        }),
      })
    );
  });

  it("testGitHubToken returns authenticated user info", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        login: "octocat",
        avatar_url: "https://github.com/images/octocat.png",
        html_url: "https://github.com/octocat",
      }),
    } as Response);

    const user = await testGitHubToken("valid_token");
    expect(user.login).toBe("octocat");
    expect(user.avatar_url).toBe("https://github.com/images/octocat.png");
  });

  it("ensures 100% bilingual parity for pullRequests and github settings keys", () => {
    const viAny = viTranslations as Record<string, unknown>;
    const enAny = enTranslations as Record<string, unknown>;

    expect(viAny.pullRequests).toBeDefined();
    expect(enAny.pullRequests).toBeDefined();

    const viPR = viAny.pullRequests as Record<string, unknown>;
    const enPR = enAny.pullRequests as Record<string, unknown>;
    expect(Object.keys(viPR).sort()).toEqual(Object.keys(enPR).sort());

    const viSettings = (viAny.settings as Record<string, unknown>).github as Record<string, unknown>;
    const enSettings = (enAny.settings as Record<string, unknown>).github as Record<string, unknown>;
    expect(viSettings).toBeDefined();
    expect(enSettings).toBeDefined();
    expect(Object.keys(viSettings).sort()).toEqual(Object.keys(enSettings).sort());
  });
});
