import {
  type GitHubPullRequest,
  type PullRequestDetail,
  type CreatePullRequestPayload,
  type GitHubUserSummary,
  type CheckRunItem,
  type CheckStatus,
  type PullRequestFileItem,
} from "../ipc/githubApi";

const GITHUB_API_BASE = "https://api.github.com";

function getHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token && token.trim()) {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }
  return headers;
}

export async function testGitHubToken(token: string): Promise<GitHubUserSummary> {
  const res = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Token không hợp lệ hoặc đã hết hạn.");
    }
    throw new Error(`Kiểm tra token thất bại (mã lỗi ${res.status}).`);
  }
  const data = await res.json();
  return {
    login: data.login,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  };
}

export async function fetchPullRequests(
  owner: string,
  repo: string,
  token?: string | null,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubPullRequest[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=${state}&per_page=30`;
  const res = await fetch(url, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Không tìm thấy kho lưu trữ trên GitHub.");
    }
    if (res.status === 403) {
      throw new Error("Vượt quá giới hạn tần suất GitHub API hoặc không có quyền truy cập.");
    }
    throw new Error(`Tải danh sách PR thất bại (mã lỗi ${res.status}).`);
  }

  const items = await res.json();
  return items.map((p: any) => ({
    number: p.number,
    title: p.title,
    state: p.state,
    merged_at: p.merged_at ?? null,
    draft: Boolean(p.draft),
    user: {
      login: p.user?.login ?? "unknown",
      avatar_url: p.user?.avatar_url ?? "",
      html_url: p.user?.html_url ?? "",
    },
    created_at: p.created_at,
    updated_at: p.updated_at,
    head: {
      ref: p.head?.ref ?? "",
      sha: p.head?.sha ?? "",
    },
    base: {
      ref: p.base?.ref ?? "",
      sha: p.base?.sha ?? "",
    },
    comments: p.comments ?? 0,
    labels: (p.labels || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      description: l.description,
    })),
    html_url: p.html_url,
  }));
}

export async function fetchPullRequestDetail(
  owner: string,
  repo: string,
  number: number,
  token?: string | null
): Promise<PullRequestDetail> {
  const prUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${number}`;
  const prRes = await fetch(prUrl, { headers: getHeaders(token) });
  if (!prRes.ok) {
    throw new Error(`Không thể lấy thông tin PR #${number} (mã lỗi ${prRes.status}).`);
  }
  const p = await prRes.json();

  const pr: GitHubPullRequest = {
    number: p.number,
    title: p.title,
    state: p.state,
    merged_at: p.merged_at ?? null,
    draft: Boolean(p.draft),
    user: {
      login: p.user?.login ?? "unknown",
      avatar_url: p.user?.avatar_url ?? "",
      html_url: p.user?.html_url ?? "",
    },
    created_at: p.created_at,
    updated_at: p.updated_at,
    head: {
      ref: p.head?.ref ?? "",
      sha: p.head?.sha ?? "",
    },
    base: {
      ref: p.base?.ref ?? "",
      sha: p.base?.sha ?? "",
    },
    comments: p.comments ?? 0,
    labels: (p.labels || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      description: l.description,
    })),
    html_url: p.html_url,
  };

  // Fetch checks if head sha is present
  let check_runs: CheckRunItem[] = [];
  if (p.head?.sha) {
    try {
      const checksUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${p.head.sha}/check-runs`;
      const checksRes = await fetch(checksUrl, { headers: getHeaders(token) });
      if (checksRes.ok) {
        const checksData = await checksRes.json();
        if (Array.isArray(checksData.check_runs)) {
          check_runs = checksData.check_runs.map((c: any) => {
            let status: CheckStatus = "neutral";
            if (c.status === "completed") {
              status = c.conclusion === "success" ? "success" : "failure";
            } else if (c.status === "in_progress") {
              status = "in_progress";
            } else if (c.status === "queued") {
              status = "queued";
            }
            return {
              name: c.name,
              status,
              details_url: c.html_url ?? null,
            };
          });
        }
      }
    } catch {
      // Ignore check runs error
    }
  }

  // Fetch files
  let files: PullRequestFileItem[] = [];
  try {
    const filesUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${number}/files`;
    const filesRes = await fetch(filesUrl, { headers: getHeaders(token) });
    if (filesRes.ok) {
      const filesData = await filesRes.json();
      if (Array.isArray(filesData)) {
        files = filesData.map((f: any) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions ?? 0,
          deletions: f.deletions ?? 0,
          changes: f.changes ?? 0,
        }));
      }
    }
  } catch {
    // Ignore files fetch error
  }

  return {
    pr,
    body: p.body ?? "",
    mergeable: p.mergeable ?? null,
    assignees: (p.assignees || []).map((a: any) => ({
      login: a.login,
      avatar_url: a.avatar_url,
      html_url: a.html_url,
    })),
    requested_reviewers: (p.requested_reviewers || []).map((r: any) => ({
      login: r.login,
      avatar_url: r.avatar_url,
      html_url: r.html_url,
    })),
    check_runs,
    files,
    commits_count: p.commits ?? 0,
  };
}

export async function createPullRequest(
  owner: string,
  repo: string,
  payload: CreatePullRequestPayload,
  token: string
): Promise<GitHubPullRequest> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...getHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: payload.title,
      body: payload.body,
      head: payload.head,
      base: payload.base,
      draft: payload.draft ?? false,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || `Lỗi khi tạo Pull Request (mã ${res.status})`;
    throw new Error(message);
  }

  const p = await res.json();
  return {
    number: p.number,
    title: p.title,
    state: p.state,
    merged_at: p.merged_at ?? null,
    draft: Boolean(p.draft),
    user: {
      login: p.user?.login ?? "unknown",
      avatar_url: p.user?.avatar_url ?? "",
      html_url: p.user?.html_url ?? "",
    },
    created_at: p.created_at,
    updated_at: p.updated_at,
    head: {
      ref: p.head?.ref ?? "",
      sha: p.head?.sha ?? "",
    },
    base: {
      ref: p.base?.ref ?? "",
      sha: p.base?.sha ?? "",
    },
    comments: p.comments ?? 0,
    labels: (p.labels || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      description: l.description,
    })),
    html_url: p.html_url,
  };
}
