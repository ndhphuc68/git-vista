# GitHub Pull Requests Integration (Phase 2.0.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native, end-to-end GitHub Pull Requests integration into GitVista, allowing users to browse PRs in the sidebar, inspect details/CI checks/changed files in a slide-over drawer, checkout PR branches locally with one click, and create new PRs directly to GitHub.

**Architecture:** A hybrid architecture where Rust backend handles safe local Git operations (detecting GitHub repo URL, reading/saving PAT, probing `gh auth token` fallback, fetching and checking out `pull/<id>/head` refspecs), while the frontend TypeScript layer interacts with GitHub REST API v3 using the system webview's native network stack (ensuring seamless support for Windows proxies and VPNs).

**Tech Stack:** Rust (Tauri v2, Specta, libgit2), React 19, TypeScript, Tailwind CSS, Lucide React, TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-18-github-pull-requests-design.md`

## Global Constraints
- Only use unit and component tests via Vitest and Rust cargo tests. Do NOT add or modify Playwright E2E tests (per AGENTS.md).
- Commit messages must follow Gitmoji: `<emoji> <short description>` without Conventional Commit prefixes (`feat:`, `fix:`) or scope parentheses (per AGENTS.md).
- Preserve 100% bilingual parity between `src/i18n/vi.ts` and `src/i18n/en.ts`.
- Ensure non-GitHub repositories and offline states fail gracefully without crashing or blocking local Git features.

---

### Task 1: Backend Rust GitHub Module (Repo Info Detection, Token Management & Tests)

**Files:**
- Create: `src-tauri/src/read/github.rs`
- Create: `src-tauri/src/write/github_config.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Create: `src-tauri/src/commands/github.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/tests/github_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub struct GitHubRepoInfo {
      pub is_github: bool,
      pub owner: Option<String>,
      pub repo: Option<String>,
      pub default_branch: Option<String>,
  }
  pub fn parse_github_remote_url(url: &str) -> Option<(String, String)>;
  pub fn get_github_repo_info(repo_path: &str) -> Result<GitHubRepoInfo, String>;
  pub fn get_github_token() -> Result<Option<String>, String>;
  pub fn save_github_token(token: &str) -> Result<(), String>;
  pub fn remove_github_token() -> Result<(), String>;
  ```

- [ ] **Step 1: Write integration tests in `src-tauri/tests/github_test.rs`**

```rust
use visual_git_lib::read::github::parse_github_remote_url;

#[test]
fn test_parse_github_urls() {
    // HTTPS standard
    assert_eq!(
        parse_github_remote_url("https://github.com/facebook/react.git"),
        Some(("facebook".to_string(), "react".to_string()))
    );
    // HTTPS without .git
    assert_eq!(
        parse_github_remote_url("https://github.com/rust-lang/rust"),
        Some(("rust-lang".to_string(), "rust".to_string()))
    );
    // SSH
    assert_eq!(
        parse_github_remote_url("git@github.com:tauri-apps/tauri.git"),
        Some(("tauri-apps".to_string(), "tauri".to_string()))
    );
    // Non-github
    assert_eq!(
        parse_github_remote_url("https://gitlab.com/gitlab-org/gitlab.git"),
        None
    );
    assert_eq!(
        parse_github_remote_url("/local/path/to/repo"),
        None
    );
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test github_test`
Expected: FAIL (module or function not found)

- [ ] **Step 3: Implement `src-tauri/src/read/github.rs` and `src-tauri/src/write/github_config.rs`**

Implement URL parsing regex/splitting, `get_github_repo_info`, config file read/write (`~/.config/gitvista/github_token`), and fallback probe to `gh auth token`.

- [ ] **Step 4: Expose IPC commands in `src-tauri/src/commands/github.rs` and register in `src-tauri/src/lib.rs`**

Add `get_github_repo_info`, `get_github_token`, `save_github_token`, `remove_github_token` to Specta builder.

- [ ] **Step 5: Run tests and verify they pass**

Run: `cargo test --test github_test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/read/github.rs src-tauri/src/write/github_config.rs src-tauri/src/commands/github.rs src-tauri/src/read/mod.rs src-tauri/src/write/mod.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs src-tauri/tests/github_test.rs
git commit -m "✨ add github repo detection and token management in backend"
```

---

### Task 2: Backend Rust Native PR Checkout & Integration Tests

**Files:**
- Create: `src-tauri/src/exec/github_checkout.rs`
- Modify: `src-tauri/src/exec/mod.rs`
- Modify: `src-tauri/src/commands/github.rs`
- Test: `src-tauri/tests/github_checkout_test.rs`

**Interfaces:**
- Consumes: `AppError`, `git2::Repository`
- Produces:
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct CheckoutPrResult {
      pub branch_name: String,
      pub message: String,
  }
  pub fn checkout_pull_request(repo_path: &str, pr_number: u64) -> Result<CheckoutPrResult, AppError>;
  ```

- [ ] **Step 1: Write integration tests in `src-tauri/tests/github_checkout_test.rs`**

Test verifying that a git command `git fetch origin pull/<number>/head:pr/<number>` is properly constructed and rejects dirty working trees.

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test github_checkout_test`
Expected: FAIL

- [ ] **Step 3: Implement `src-tauri/src/exec/github_checkout.rs`**

Implement checking repository state (ensure clean), executing `git fetch origin pull/{pr_number}/head:pr/{pr_number} --force`, checking out `pr/{pr_number}`, and emitting `repo-changed`.

- [ ] **Step 4: Expose `checkout_pull_request` in `src-tauri/src/commands/github.rs`**

Register in Specta builder.

- [ ] **Step 5: Run tests and verify they pass**

Run: `cargo test --test github_checkout_test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/exec/github_checkout.rs src-tauri/src/exec/mod.rs src-tauri/src/commands/github.rs src-tauri/tests/github_checkout_test.rs
git commit -m "✨ add native git refspec pr checkout command"
```

---

### Task 3: Frontend GitHub Service, IPC Bindings, Bilingual i18n & Tests

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Create: `src/services/githubService.ts`
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Test: `src/test/githubService.test.ts`

**Interfaces:**
- Produces:
  - `src/services/githubService.ts`:
    - `fetchPullRequests(owner: string, repo: string, token?: string, state?: 'open' | 'closed' | 'all'): Promise<GitHubPullRequest[]>`
    - `fetchPullRequestDetail(owner: string, repo: string, number: number, token?: string): Promise<PullRequestDetail>`
    - `createPullRequest(owner: string, repo: string, payload: CreatePullRequestPayload, token: string): Promise<GitHubPullRequest>`
    - `testGitHubToken(token: string): Promise<GitHubUserSummary>`

- [ ] **Step 1: Write unit tests in `src/test/githubService.test.ts`**

Mock `fetch` and verify `fetchPullRequests`, `fetchPullRequestDetail`, `createPullRequest`, and `testGitHubToken`. Also verify 100% translation key parity between `vi.ts` and `en.ts` for `pullRequests.*` and `settings.github.*`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/githubService.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/ipc/bindings.ts` and `src/ipc/client.ts`**

Add type definitions and client functions for GitHub IPC endpoints with mock fallbacks.

- [ ] **Step 4: Implement `src/services/githubService.ts`**

Handle REST API calls to `https://api.github.com`, setting `Authorization: Bearer <token>`, `Accept: application/vnd.github.v3+json`, error handling for 401, 403 (Rate Limits), and 404.

- [ ] **Step 5: Add translations to `src/i18n/vi.ts` and `src/i18n/en.ts`**

Add all needed strings: `pullRequests`, `modals.createPullRequest`, `settings.github`.

- [ ] **Step 6: Run tests and verify they pass**

Run: `pnpm vitest run src/test/githubService.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/ipc/bindings.ts src/ipc/client.ts src/services/githubService.ts src/i18n/vi.ts src/i18n/en.ts src/test/githubService.test.ts
git commit -m "✨ add github service, ipc bindings, and bilingual translations"
```

---

### Task 4: GitHub Settings Tab in SettingsModal & Connection Management

**Files:**
- Create: `src/components/settings/GitHubSettingsTab.tsx`
- Modify: `src/components/settings/SettingsModal.tsx`
- Test: `src/test/GitHubSettingsTab.test.tsx`

**Interfaces:**
- Consumes: `useSettingsStore`, `githubService`, `invokeCommand.getGitHubToken`, `invokeCommand.saveGitHubToken`

- [ ] **Step 1: Write component tests in `src/test/GitHubSettingsTab.test.tsx`**

Test rendering disconnected state, entering a token, clicking "Test Connection", showing connected user info, and clicking "Disconnect".

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/GitHubSettingsTab.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/settings/GitHubSettingsTab.tsx`**

Include:
- Token input masked with eye toggle.
- "Test Connection" button calling `testGitHubToken`.
- "Use GitHub CLI Token" button probing `getGitHubToken`.
- Account card with avatar, login, connection status, and "Disconnect" button.
- Clean help guidelines with direct link to GitHub token generation.

- [ ] **Step 4: Add "GitHub" Tab in `src/components/settings/SettingsModal.tsx`**

Add 6th tab with GitHub/GitPullRequest icon in the sidebar navigation of `SettingsModal`.

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm vitest run src/test/GitHubSettingsTab.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/GitHubSettingsTab.tsx src/components/settings/SettingsModal.tsx src/test/GitHubSettingsTab.test.tsx
git commit -m "💄 add github settings tab and connection management"
```

---

### Task 5: Sidebar Pull Requests Section & PR Detail Drawer

**Files:**
- Create: `src/components/sidebar/PullRequestsSection.tsx`
- Modify: `src/components/sidebar/BranchSidebar.tsx`
- Create: `src/components/pullrequests/PullRequestDetailDrawer.tsx`
- Create: `src/components/pullrequests/index.ts`
- Modify: `src/App.tsx`
- Test: `src/test/PullRequestsSidebar.test.tsx`
- Test: `src/test/PullRequestDetailDrawer.test.tsx`

**Interfaces:**
- Produces:
  - `PullRequestsSection`: Section inside `BranchSidebar` with count badge, refresh button, filter tabs (`Open`, `Mine`, `Closed`), and PR list items with context menu.
  - `PullRequestDetailDrawer`: Slide-over drawer with status badge, action buttons (Checkout, Open in Browser), CI checks, markdown description, and changed files.

- [ ] **Step 1: Write component tests in `src/test/PullRequestsSidebar.test.tsx` and `src/test/PullRequestDetailDrawer.test.tsx`**

Test list rendering, filter switching, opening drawer, clicking checkout button.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/test/PullRequestsSidebar.test.tsx src/test/PullRequestDetailDrawer.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/sidebar/PullRequestsSection.tsx` and integrate into `BranchSidebar.tsx`**

Embed below Remotes and Tags with clean Fluent UI styling, active menu coordination (respecting single active context menu rule), and hover actions.

- [ ] **Step 4: Implement `src/components/pullrequests/PullRequestDetailDrawer.tsx` and integrate in `App.tsx`**

Slide-over drawer from right (`w-[500px]`), displaying full PR info, CI check runs with icons, body markdown, and changed files with diff navigation.

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm vitest run src/test/PullRequestsSidebar.test.tsx src/test/PullRequestDetailDrawer.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/sidebar/PullRequestsSection.tsx src/components/sidebar/BranchSidebar.tsx src/components/pullrequests/PullRequestDetailDrawer.tsx src/components/pullrequests/index.ts src/App.tsx src/test/PullRequestsSidebar.test.tsx src/test/PullRequestDetailDrawer.test.tsx
git commit -m "💄 add pull requests sidebar section and detail drawer"
```

---

### Task 6: Create PR Modal, Command Palette Integration & Verification

**Files:**
- Create: `src/components/pullrequests/CreatePullRequestModal.tsx`
- Modify: `src/utils/commandRegistry.ts`
- Modify: `src/App.tsx`
- Test: `src/test/CreatePullRequestModal.test.tsx`
- Test: `src/test/commandRegistryGitHub.test.ts`
- Modify: `docs/ROADMAP_STATUS.md`

**Interfaces:**
- Produces:
  - `CreatePullRequestModal`: Modal to select base branch, compare branch, title, description, draft checkbox, submit button.
  - Command Palette commands: `git-create-pr` and `git-view-prs`.

- [ ] **Step 1: Write component tests in `src/test/CreatePullRequestModal.test.tsx` and `src/test/commandRegistryGitHub.test.ts`**

Test validation, pre-filling branches, submit payload, and Command Palette registration.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/test/CreatePullRequestModal.test.tsx src/test/commandRegistryGitHub.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/pullrequests/CreatePullRequestModal.tsx`**

Support selecting target & source branches, auto-filling title from commit message, draft toggle, and submitting via `createPullRequest`.

- [ ] **Step 4: Register commands in `src/utils/commandRegistry.ts` and mount modal in `App.tsx`**

Register `git-create-pr` (*"Git: Tạo Pull Request mới"*) and `git-view-prs` (*"Git: Xem danh sách Pull Requests"*).

- [ ] **Step 5: Run all test suites & production build**

Run:
```bash
cargo test
pnpm vitest run
pnpm tsc --noEmit
pnpm build
```
Expected: All tests pass, 0 compile errors.

- [ ] **Step 6: Update `docs/ROADMAP_STATUS.md` to mark Phase 2.0.3 complete**

- [ ] **Step 7: Commit**

```bash
git add src/components/pullrequests/CreatePullRequestModal.tsx src/utils/commandRegistry.ts src/App.tsx src/test/CreatePullRequestModal.test.tsx src/test/commandRegistryGitHub.test.ts docs/ROADMAP_STATUS.md
git commit -m "✨ integrate create pull request modal, command palette, and update roadmap"
```
