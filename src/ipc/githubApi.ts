/**
 * Types for the GitHub REST API responses the app reads directly.
 *
 * These deliberately live outside `bindings.generated.ts`: they describe
 * GitHub's HTTP payloads, not the Rust command surface, so there is nothing for
 * tauri-specta to generate them from. `githubService.ts` fetches these over
 * HTTP rather than through IPC.
 */

import type {
  CheckStatus,
  PR_STATE,
  PullRequestFileStatus,
  PullRequestState,
} from "../domain/enums";

export type { CheckStatus, PullRequestState } from "../domain/enums";

export interface GitHubUserSummary {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubLabel {
  id?: number;
  name: string;
  color: string;
  description?: string | null;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: Exclude<PullRequestState, typeof PR_STATE.ALL>;
  merged_at?: string | null;
  draft: boolean;
  user: GitHubUserSummary;
  created_at: string;
  updated_at: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  comments: number;
  labels: GitHubLabel[];
  html_url: string;
}

export interface CheckRunItem {
  name: string;
  status: CheckStatus;
  details_url: string | null;
}

export interface PullRequestFileItem {
  filename: string;
  status: PullRequestFileStatus;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface PullRequestDetail {
  pr: GitHubPullRequest;
  body: string;
  mergeable: boolean | null;
  assignees: GitHubUserSummary[];
  requested_reviewers: GitHubUserSummary[];
  check_runs: CheckRunItem[];
  files: PullRequestFileItem[];
  commits_count: number;
}

export interface CreatePullRequestPayload {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}
