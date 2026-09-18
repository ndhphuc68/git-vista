# Design Specification: GitHub Pull Requests Integration (Phase 2.0.3)

- **Date:** 2026-09-18
- **Phase:** 2.0.3 (Advanced Power Tools)
- **Status:** Approved for Implementation Planning

---

## 1. Overview & Goals

In modern software development teams, code collaboration centers heavily around Pull Requests (PRs) on GitHub. Developers frequently need to view incoming PRs, understand review and CI check statuses, inspect code changes, checkout PR branches locally for testing and debugging, and open new PRs directly without having to switch to a web browser.

The goal of **Phase 2.0.3: GitHub Pull Requests Integration** is to provide a seamless, native PR experience inside GitVista:
1. **Seamless GitHub Connectivity:** Automatic repository detection (`owner/repo`) from remote URLs (HTTPS & SSH). Dual authentication support via Personal Access Token (PAT) in Settings and auto-detection from GitHub CLI (`gh auth token`).
2. **Pull Requests Browsing in Sidebar:** Dedicated "PULL REQUESTS" section in `BranchSidebar` with count badge, quick filters (`Open`, `Mine`, `Closed/Merged`), and visual indicators for CI check status and review state.
3. **Slide-over PR Detail Drawer:** A fast, responsive drawer (`PullRequestDetailDrawer`) displaying full PR metadata, markdown-rendered description, author, labels, reviewers, CI checks (GitHub Actions status), and changed files with line counts.
4. **1-Click Local PR Checkout:** Instant checkout of any PR branch to local Git using native refspecs:
   ```bash
   git fetch origin pull/<number>/head:pr/<number>
   git checkout pr/<number>
   ```
5. **Direct PR Creation:** Dedicated modal (`CreatePullRequestModal`) allowing users to choose base/compare branches, auto-populate title/description from commits, push branch if unpushed, and create PRs directly to GitHub.
6. **Robust Offline & Error Handling:** Graceful offline detection, rate limit tracking (`X-RateLimit-Reset`), invalid token warnings with direct links to Settings.

---

## 2. Architecture & Component Interaction

```
┌────────────────────────────────────────────────────────────────────────┐
│                             React Frontend                             │
│                                                                        │
│  [BranchSidebar] (PULL REQUESTS section, filters, items, "+" button)   │
│  [CommandPalette] ("Git: Create Pull Request", "Git: View PRs")        │
│  [SettingsModal] (GitHub Tab: PAT configuration, test connection)      │
│                         │                                              │
│                         ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ PullRequestDetailDrawer.tsx (Slide-over from right edge)         │  │
│  │ - Header: #ID, Title, State badge (Open/Merged/Closed/Draft)     │  │
│  │ - Actions: [⬇ Checkout PR]  [🌐 View on GitHub]  [⇄ View Diff]   │  │
│  │ - Body: Markdown description, Labels, Reviewers, Base → Head     │  │
│  │ - CI Checks: GitHub Actions list (Passed / Failed / Running)     │  │
│  │ - Changed Files: List of files with (+ / -) & diff view trigger  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ CreatePullRequestModal.tsx                                       │  │
│  │ - Base branch selector (e.g. main) & Compare branch selector     │  │
│  │ - Title input & Markdown description textarea                    │  │
│  │ - Draft PR checkbox & "Create Pull Request" submit button        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                         │                                              │
│                         ▼ (Tauri IPC Invoke via client.ts)             │
│  getGitHubRepoInfo(path)                                               │
│  getPullRequests(path, state, filter)                                  │
│  getPullRequestDetail(path, number)                                    │
│  createPullRequest(path, payload)                                      │
│  checkoutPullRequest(path, number)                                     │
│  setGitHubToken(token) / getGitHubToken()                              │
└─────────────────────────┬──────────────────────────────────────────────┘
                          │ IPC
┌─────────────────────────▼──────────────────────────────────────────────┐
│                         Rust Tauri Backend                             │
│                                                                        │
│  src-tauri/src/commands/github.rs (Specta IPC endpoints)               │
│  src-tauri/src/read/github.rs (Repo URL parsing, GitHub REST client)   │
│  src-tauri/src/write/github_config.rs (Safe token storage & settings)  │
│  src-tauri/src/exec/github_checkout.rs (Git native fetch & checkout)   │
│                         │                                              │
│           ┌─────────────┴─────────────┐                                │
│           ▼                           ▼                                │
│   GitHub REST API v3            Local Git CLI / Libgit2                │
│   (api.github.com)              - fetch origin pull/X/head:pr/X        │
│   - /repos/:owner/:repo/pulls   - checkout pr/X                        │
│   - /commits/:sha/check-runs    - emit repo-changed event              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Data Models & IPC Commands (Rust + Specta)

### 3.1 Data Structures

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GitHubRepoInfo {
    pub is_github: bool,
    pub owner: Option<String>,
    pub repo: Option<String>,
    pub authenticated_user: Option<String>,
    pub has_token: bool,
    pub default_branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum PullRequestState {
    Open,
    Closed,
    Merged,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GitHubUserSummary {
    pub login: String,
    pub avatar_url: String,
    pub html_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GitHubLabel {
    pub name: String,
    pub color: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GitHubPullRequest {
    pub number: u64,
    pub title: String,
    pub state: PullRequestState,
    pub is_draft: bool,
    pub user: GitHubUserSummary,
    pub created_at: String,
    pub updated_at: String,
    pub head_ref: String,
    pub base_ref: String,
    pub comments_count: u32,
    pub labels: Vec<GitHubLabel>,
    pub html_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum CheckStatus {
    Success,
    Failure,
    InProgress,
    Queued,
    Neutral,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CheckRunItem {
    pub name: String,
    pub status: CheckStatus,
    pub details_url: Option<String>,
    pub duration_seconds: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PullRequestFileItem {
    pub filename: String,
    pub status: String, // "added", "modified", "deleted"
    pub additions: u32,
    pub deletions: u32,
    pub changes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PullRequestDetail {
    pub pr: GitHubPullRequest,
    pub body: String,
    pub mergeable: Option<bool>,
    pub assignees: Vec<GitHubUserSummary>,
    pub requested_reviewers: Vec<GitHubUserSummary>,
    pub check_runs: Vec<CheckRunItem>,
    pub files: Vec<PullRequestFileItem>,
    pub commits_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreatePullRequestPayload {
    pub title: String,
    pub body: String,
    pub head: String,
    pub base: String,
    pub draft: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CheckoutPrResult {
    pub branch_name: String,
    pub message: String,
}
```

### 3.2 Specta IPC Commands

- `get_github_repo_info(repo_path: String) -> Result<GitHubRepoInfo, String>`
- `save_github_token(token: String) -> Result<GitHubUserSummary, String>`
- `get_github_token() -> Result<Option<String>, String>`
- `remove_github_token() -> Result<(), String>`
- `get_pull_requests(repo_path: String, state: Option<String>, filter: Option<String>) -> Result<Vec<GitHubPullRequest>, String>`
- `get_pull_request_detail(repo_path: String, number: u64) -> Result<PullRequestDetail, String>`
- `create_pull_request(repo_path: String, payload: CreatePullRequestPayload) -> Result<GitHubPullRequest, String>`
- `checkout_pull_request(repo_path: String, number: u64) -> Result<CheckoutPrResult, String>`

---

## 4. Authentication & Security Specification

1. **Token Resolution Precedence:**
   - **Step 1:** Check stored Personal Access Token (PAT) in GitVista config (`~/.config/gitvista/github_token` or local settings).
   - **Step 2:** If no PAT is set, probe the system for `gh auth token` via command execution. If available and authenticated, use it seamlessly.
   - **Step 3:** If neither is found, inform the user that public repositories can still be browsed (subject to standard GitHub IP rate limits: 60 req/hour), and provide a direct 1-click button to configure a PAT in Settings.
2. **Token Security:**
   - Never log or display tokens in plaintext in logs, traces, or UI.
   - Masked input with toggle visibility (`password` input type) in Settings.
   - Revoke/Disconnect button cleanly deletes stored token.

---

## 5. Native Git Operations (Local PR Branch Checkout)

When checking out a PR branch:
1. **Safety Check:** Ensure working tree is clean. If uncommitted changes exist, return an error requesting the user to stash or commit first.
2. **Fetch PR Head:**
   ```bash
   git fetch origin pull/<number>/head:pr/<number> --force
   ```
3. **Checkout Branch:**
   ```bash
   git checkout pr/<number>
   ```
4. **Trigger Event:** Emit `repo-changed` so `CommitGraph`, `BranchSidebar`, and `RepoHeader` refresh instantly.

---

## 6. Frontend UI/UX Specification

### 6.1 Sidebar Section (`BranchSidebar.tsx`)
- Section Header: `PULL REQUESTS` with badge showing total open count (e.g. `3`).
- Action icons:
  - `+`: Open `CreatePullRequestModal`.
  - `↻`: Refresh PR list (invalidates React Query cache).
- Quick Filter Tabs:
  - `Open` (default)
  - `Mine` (filtered by authenticated user login)
  - `Closed` (includes closed and merged)
- PR Row Item:
  - `#<number>` in monospace font.
  - Truncated title with full tooltip.
  - Avatar of author (18x18px) with username tooltip.
  - CI Status Dot: Green (all checks passed), Red (failed), Yellow (running/queued).
  - Draft badge (`Draft`) if draft PR.
- Right-click Context Menu:
  - *"Checkout PR branch to local"*
  - *"Open on GitHub.com"*
  - *"Copy PR link"*

### 6.2 PR Detail Drawer (`PullRequestDetailDrawer.tsx`)
- Width: `w-[500px]`, responsive slide-over overlay from right.
- Header:
  - Status Badge: `Open` (emerald), `Merged` (purple), `Closed` (rose), `Draft` (zinc).
  - PR `#<number>` with external link button (`tauri-plugin-opener`).
  - Close button (`Esc` key supported).
- Prominent Action Bar:
  - **`[ ⬇ Checkout PR Branch ]`** with loading spinner while fetching.
  - **`[ 🌐 Open in Browser ]`**
- Metadata Card:
  - Branch flow badge: `head_ref` $\rightarrow$ `base_ref`.
  - Author with avatar and timestamp.
  - Reviewers status badge: Approved (green check), Changes Requested (red cross), Review Pending (yellow clock).
  - Labels chips with GitHub custom hex colors.
- CI Checks Card:
  - Collapsible list of workflow runs with pass/fail/in-progress icons.
- Tabs / Sections:
  - **Description:** Rendered Markdown content with clean GitHub markdown styling.
  - **Changed Files:** File list with status badge (`A`, `M`, `D`), additions/deletions counts. Clicking a file opens the diff viewer.

### 6.3 Create PR Modal (`CreatePullRequestModal.tsx`)
- Base Branch selector (defaults to repository default branch, e.g. `main`).
- Compare Branch selector (defaults to current active branch).
- Unpushed Commits Warning: If the local branch has commits not yet pushed to `origin`, show an inline alert with a *"Push branch now"* button.
- Title input (auto-populated with latest commit subject).
- Description textarea (supports markdown).
- Checkbox: *"Create as draft"*.
- Submit Button: *"Create Pull Request"* (with loading state).

### 6.4 Settings Integration (`SettingsModal.tsx`)
- Dedicated **"GitHub"** section / tab.
- Connection status card:
  - Connected: Avatar, Username, Token type (PAT / CLI), "Test Connection" button, "Disconnect" button.
  - Disconnected: Quick guide to generate PAT (with link to `github.com/settings/tokens`), token input field, "Use GitHub CLI Token" button, "Connect" button.

---

## 7. Error Handling, Rate Limiting & Offline Behavior

1. **Offline / Network Failure:**
   - Display a non-intrusive warning inside the Pull Requests sidebar section: *"Unable to reach GitHub. Please check your network connection."* with a *"Retry"* button.
   - Never block or crash local Git operations (History graph, Staging, Branches, Commit all remain 100% operational).
2. **Rate Limit (`403 Forbidden / RateLimitExceeded`):**
   - Extract `x-ratelimit-reset` timestamp from response headers.
   - Display informative message: *"GitHub API rate limit exceeded. Resets at HH:MM. Add a Personal Access Token in Settings to increase rate limit to 5,000 req/hr."*
3. **Invalid Token (`401 Unauthorized`):**
   - Show error alert with a direct button opening GitHub Settings to re-enter token.
4. **Non-GitHub Repository:**
   - If `origin` remote does not point to `github.com`, show an empty state: *"This repository is not hosted on GitHub."*

---

## 8. Testing Strategy & Verification Plan

### 8.1 Automated Tests (TDD)
- **Rust Integration Tests (`tests/github_test.rs`):**
  - Remote URL parsing (HTTPS, SSH, with/without `.git`, subdomain support).
  - JSON serialization/deserialization for PR list, detail, checks, labels.
  - Refspec generation for checkout command (`pull/{number}/head:pr/{number}`).
- **Frontend Unit & Component Tests (Vitest):**
  - `src/test/ipcGitHub.test.ts`: Client API methods and browser mock responses.
  - `src/test/PullRequestsSidebar.test.tsx`: Sidebar rendering, badge count, tab filtering, context menu.
  - `src/test/PullRequestDetailDrawer.test.tsx`: Drawer rendering, markdown view, checks status, checkout action trigger.
  - `src/test/CreatePullRequestModal.test.tsx`: Form inputs, branch selection, validation, submit payload.
  - `src/test/GitHubSettings.test.tsx`: Token input, save/disconnect flow, connection testing.
  - Bilingual translation verification (`vi.ts` and `en.ts`).

### 8.2 Production Verification
- `cargo test --test github_test`
- `pnpm vitest run src/test/*GitHub*`
- `pnpm tsc --noEmit`
- `pnpm build`
