import {
  type GitHubPullRequest,
  type PullRequestDetail,
  type CreatePullRequestPayload,
  type GitHubUserSummary,
  type GitHubLabel,
  type CheckRunItem,
  type CheckStatus,
  type PullRequestFileItem,
} from "../ipc/githubApi";
import { readJson } from "./readJson";

const GITHUB_API_BASE = "https://api.github.com";

// Minimal shapes of the GitHub REST payloads this service reads. Every field
// is optional because GitHub omits fields freely; the mappers below apply the
// same `?? default` fallbacks the inline code used.
interface RawGitHubUser {
  login?: string;
  avatar_url?: string;
  html_url?: string;
}

// GitHub always sends these three fields for assignees and requested
// reviewers, so this raw shape matches `GitHubUserSummary` (required strings)
// directly instead of the all-optional `RawGitHubUser` used for `p.user`.
interface RawGitHubUserLink {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface RawGitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface RawCheckRun {
  name: string;
  status?: string;
  conclusion?: string | null;
  html_url?: string | null;
}

interface RawPullRequestFile {
  filename: string;
  status: string;
  additions?: number;
  deletions?: number;
  changes?: number;
}

interface RawPullRequest {
  number: number;
  title: string;
  state: string;
  merged_at?: string | null;
  draft?: boolean;
  user?: RawGitHubUser;
  created_at: string;
  updated_at: string;
  head?: { ref?: string; sha?: string };
  base?: { ref?: string; sha?: string };
  comments?: number;
  labels?: RawGitHubLabel[];
  html_url: string;
  body?: string | null;
  mergeable?: boolean | null;
  assignees?: RawGitHubUserLink[];
  requested_reviewers?: RawGitHubUserLink[];
  commits?: number;
}

function mapLabel(l: RawGitHubLabel): GitHubLabel {
  return { id: l.id, name: l.name, color: l.color, description: l.description };
}

function mapUserLink(u: RawGitHubUserLink): GitHubUserSummary {
  return { login: u.login, avatar_url: u.avatar_url, html_url: u.html_url };
}

// Exported for unit testing only; not part of this module's public API surface.
export function mapPullRequestUser(u?: RawGitHubUser): GitHubUserSummary {
  return {
    login: u?.login ?? "unknown",
    avatar_url: u?.avatar_url ?? "",
    html_url: u?.html_url ?? "",
  };
}

// Exported for unit testing only; not part of this module's public API surface.
export function mapRefPoint(point?: { ref?: string; sha?: string }): { ref: string; sha: string } {
  return { ref: point?.ref ?? "", sha: point?.sha ?? "" };
}

// The shared shape every PR-returning endpoint (list, detail, create) sends back.
// Exported for unit testing only; not part of this module's public API surface.
export function mapRawPullRequest(p: RawPullRequest): GitHubPullRequest {
  return {
    number: p.number,
    title: p.title,
    state: p.state as GitHubPullRequest["state"],
    merged_at: p.merged_at ?? null,
    draft: Boolean(p.draft),
    user: mapPullRequestUser(p.user),
    created_at: p.created_at,
    updated_at: p.updated_at,
    head: mapRefPoint(p.head),
    base: mapRefPoint(p.base),
    comments: p.comments ?? 0,
    labels: (p.labels || []).map(mapLabel),
    html_url: p.html_url,
  };
}

// Exported for unit testing only; not part of this module's public API surface.
export function mapCheckRunStatus(status?: string, conclusion?: string | null): CheckStatus {
  if (status === "completed") return conclusion === "success" ? "success" : "failure";
  if (status === "in_progress") return "in_progress";
  if (status === "queued") return "queued";
  return "neutral";
}

function mapCheckRun(c: RawCheckRun): CheckRunItem {
  return {
    name: c.name,
    status: mapCheckRunStatus(c.status, c.conclusion),
    details_url: c.html_url ?? null,
  };
}

// Exported for unit testing only; not part of this module's public API surface.
export function mapPullRequestFile(f: RawPullRequestFile): PullRequestFileItem {
  return {
    filename: f.filename,
    status: f.status as PullRequestFileItem["status"],
    additions: f.additions ?? 0,
    deletions: f.deletions ?? 0,
    changes: f.changes ?? 0,
  };
}

async function fetchPullRequestCheckRuns(
  owner: string,
  repo: string,
  sha: string,
  token?: string | null
): Promise<CheckRunItem[]> {
  try {
    const checksUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}/check-runs`;
    const checksRes = await fetch(checksUrl, { headers: getHeaders(token) });
    if (!checksRes.ok) return [];
    const checksData = await readJson<{ check_runs?: RawCheckRun[] }>(checksRes);
    if (!Array.isArray(checksData.check_runs)) return [];
    return checksData.check_runs.map(mapCheckRun);
  } catch {
    // Ignore check runs error
    return [];
  }
}

async function fetchPullRequestFilesList(
  owner: string,
  repo: string,
  number: number,
  token?: string | null
): Promise<PullRequestFileItem[]> {
  try {
    const filesUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${number}/files`;
    const filesRes = await fetch(filesUrl, { headers: getHeaders(token) });
    if (!filesRes.ok) return [];
    const filesData = await readJson<RawPullRequestFile[]>(filesRes);
    if (!Array.isArray(filesData)) return [];
    return filesData.map(mapPullRequestFile);
  } catch {
    // Ignore files fetch error
    return [];
  }
}

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
  const data = await readJson<RawGitHubUserLink>(res);
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

  const items = await readJson<RawPullRequest[]>(res);
  return items.map(mapRawPullRequest);
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
  const p = await readJson<RawPullRequest>(prRes);
  const pr = mapRawPullRequest(p);

  // Fetch checks if head sha is present
  const check_runs: CheckRunItem[] = p.head?.sha
    ? await fetchPullRequestCheckRuns(owner, repo, p.head.sha, token)
    : [];

  // Fetch files
  const files: PullRequestFileItem[] = await fetchPullRequestFilesList(owner, repo, number, token);

  return {
    pr,
    body: p.body ?? "",
    mergeable: p.mergeable ?? null,
    assignees: (p.assignees || []).map(mapUserLink),
    requested_reviewers: (p.requested_reviewers || []).map(mapUserLink),
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
    const errorData = await readJson<{ message?: string }>(res).catch(
      (): { message?: string } => ({})
    );
    const message = errorData.message || `Lỗi khi tạo Pull Request (mã ${res.status})`;
    throw new Error(message);
  }

  const p = await readJson<RawPullRequest>(res);
  return mapRawPullRequest(p);
}
