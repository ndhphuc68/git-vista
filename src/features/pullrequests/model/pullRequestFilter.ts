import { type GitHubPullRequest } from "../../../ipc/githubApi";

export function filterPullRequests(prs: GitHubPullRequest[], query: string): GitHubPullRequest[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return prs;

  const cleanQuery =
    trimmed.startsWith("#") || trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;

  return prs.filter((pr) => {
    if (String(pr.number).includes(cleanQuery)) return true;
    if (pr.title.toLowerCase().includes(trimmed)) return true;
    if (pr.user.login.toLowerCase().includes(cleanQuery)) return true;
    if (pr.head.ref.toLowerCase().includes(trimmed)) return true;
    return false;
  });
}
