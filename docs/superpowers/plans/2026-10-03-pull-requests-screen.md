# Dedicated GitHub Pull Requests Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, full-screen Master-Detail Pull Requests management screen (`PullRequestsScreen`) under `features/pullrequests/` with a dynamic 3rd tab on the repo header when on GitHub, supporting PR list filtering, search, detailed Conversation inspection, and interactive file patch diffs.

**Architecture:** A new domain feature `src/features/pullrequests/` containing `api/`, `components/`, `hooks/`, `model/`, and `index.ts`. `ActiveScreen` in `useViewStore` is extended to support `"pull-requests"`. `ScreenRouter` routes to `PullRequestsScreen`. `RepoHeaderScreenTabs` conditionally displays a 3rd tab when the repo is hosted on GitHub (`isGitHub === true`). Clicking a PR in the sidebar navigates to this screen.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, `@tanstack/react-query`, Zustand, Lucide icons, Vitest.

**Spec:** [docs/superpowers/specs/2026-10-03-pull-requests-screen-design.md](file:///d:/project-v3/docs/superpowers/specs/2026-10-03-pull-requests-screen-design.md)

## Global Constraints

- Max 300 lines per file (excluding blanks/comments)
- Max 80 lines per function
- Max cyclomatic complexity 15
- All user-facing text goes through i18n (`src/i18n/vi.ts` and `src/i18n/en.ts`)
- Design tokens only (`bg-surface`, `bg-window`, `text-primary`, `text-secondary`, `border-border-subtle`, `text-accent`, etc.)
- Tailwind scale only for sizes (`w-80`, `w-96`, `min-h-20`) — no arbitrary pixel brackets
- No query key literals — use `qk` from `src/domain/queryKeys.ts`
- Commit messages use Gitmoji with no Conventional Commit prefix or scope

---

### Task 1: Domain, State & i18n Foundation

**Files:**
- Modify: `src/domain/queryKeys.ts:70-90`
- Modify: `src/domain/queryKeys.test.ts`
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Modify: `src/store/useViewStore.ts:1-21`
- Modify: `src/store/usePullRequestStore.ts:1-25`
- Modify: `src/ipc/githubApi.ts:50-70`
- Modify: `src/services/githubService.ts:135-145`

**Interfaces:**
- Produces:
  - `qk.github.pullRequests(repoPath: string, state: "open" | "closed" | "all")`
  - `qk.github.pullRequestDetail(repoPath: string, prNumber: number)`
  - `ActiveScreen = "history" | "changes" | "conflict" | "pull-requests"`
  - `PullRequestFileItem.patch?: string`
  - `t.screens.pullRequests`
  - `t.pullRequestsScreen.*`

- [ ] **Step 1: Write the failing tests for query keys and view store**

Add tests in `src/domain/queryKeys.test.ts` verifying `qk.github.pullRequestDetail(repoPath, prNumber)` produces the expected key array:
```typescript
it("builds pullRequestDetail query key", () => {
  expect(qk.github.pullRequestDetail("/repo", 42)).toEqual([
    "github",
    "pullRequestDetail",
    "/repo",
    42,
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/domain/queryKeys.test.ts`
Expected: FAIL with `qk.github.pullRequestDetail is not a function`.

- [ ] **Step 3: Implement query keys, view store, store state, API patch mapping, and i18n**

1. In `src/domain/queryKeys.ts`, add `pullRequestDetail: (repoPath: string, prNumber: number) => ["github", "pullRequestDetail", repoPath, prNumber] as const`.
2. In `src/ipc/githubApi.ts`, update `PullRequestFileItem` to add `patch?: string;`.
3. In `src/services/githubService.ts`, update `RawPullRequestFile` to include `patch?: string;`, and `mapPullRequestFile` to include `patch: f.patch ?? ""`.
4. In `src/store/useViewStore.ts`, change `export type ActiveScreen = "history" | "changes" | "conflict" | "pull-requests";`.
5. In `src/store/usePullRequestStore.ts`, add `setSelectedPr: (pr: GitHubPullRequest | null) => void`.
6. In `src/i18n/vi.ts` and `src/i18n/en.ts`, add translations:
   - `screens.pullRequests`: "Yêu cầu kéo" (VI) / "Pull Requests" (EN).
   - `pullRequestsScreen`:
     - `title`: "Pull Requests"
     - `newPr`: "Tạo PR" / "New PR"
     - `searchPlaceholder`: "Tìm kiếm theo tiêu đề, #số PR, tác giả..." / "Search by title, #number, author..."
     - `emptySelection`: "Chọn một Pull Request từ danh sách để xem chi tiết" / "Select a pull request from the list to view details"
     - `emptyList`: "Không tìm thấy Pull Request nào" / "No pull requests found"
     - `tabs`:
       - `conversation`: "Thảo luận" / "Conversation"
       - `filesChanged`: "Tệp thay đổi" / "Files Changed"
     - `checks`:
       - `title`: "Kiểm tra tự động" / "CI Checks"
       - `noChecks`: "Không có kiểm tra nào" / "No checks found"
     - `files`:
       - `summary`: "{count} tệp đã thay đổi (+{additions} / -{deletions})" / "{count} files changed (+{additions} / -{deletions})"
       - `noDiff`: "Không có nội dung diff cho tệp này" / "No diff available for this file"

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/domain/queryKeys.test.ts src/test/useViewStore.test.ts`
Expected: PASS

- [ ] **Step 5: Run guards**

Run: `pnpm check-query-keys; pnpm check-comment-language`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/domain/queryKeys.ts src/domain/queryKeys.test.ts src/ipc/githubApi.ts src/services/githubService.ts src/store/useViewStore.ts src/store/usePullRequestStore.ts src/i18n/vi.ts src/i18n/en.ts
git commit -m "✨ add pull request screen query keys and store state"
```

---

### Task 2: Feature API Hooks & Pure Filtering Logic

**Files:**
- Create: `src/features/pullrequests/model/pullRequestFilter.ts`
- Create: `src/features/pullrequests/model/pullRequestFilter.test.ts`
- Create: `src/features/pullrequests/api/usePullRequests.ts`
- Create: `src/features/pullrequests/api/usePullRequestDetail.ts`
- Create: `src/features/pullrequests/api/index.ts`

**Interfaces:**
- Produces:
  - `filterPullRequests(prs: GitHubPullRequest[], query: string): GitHubPullRequest[]`
  - `usePullRequests(repoPath: string, state: "open" | "closed" | "all")`
  - `usePullRequestDetail(repoPath: string, prNumber: number | null)`

- [ ] **Step 1: Write the failing tests for `pullRequestFilter`**

Create `src/features/pullrequests/model/pullRequestFilter.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { filterPullRequests } from "./pullRequestFilter";
import { type GitHubPullRequest } from "../../../ipc/githubApi";

const dummyPr: GitHubPullRequest = {
  number: 12,
  title: "Fix crash on save",
  state: "open",
  draft: false,
  user: { login: "alice", avatar_url: "", html_url: "" },
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z",
  head: { ref: "fix-crash", sha: "abc" },
  base: { ref: "main", sha: "def" },
  comments: 2,
  labels: [{ name: "bug", color: "ff0000" }],
  html_url: "https://github.com/org/repo/pull/12",
};

describe("filterPullRequests", () => {
  it("returns all items when query is empty", () => {
    expect(filterPullRequests([dummyPr], "")).toHaveLength(1);
    expect(filterPullRequests([dummyPr], "   ")).toHaveLength(1);
  });

  it("filters by PR number", () => {
    expect(filterPullRequests([dummyPr], "12")).toHaveLength(1);
    expect(filterPullRequests([dummyPr], "#12")).toHaveLength(1);
    expect(filterPullRequests([dummyPr], "99")).toHaveLength(0);
  });

  it("filters by title case-insensitively", () => {
    expect(filterPullRequests([dummyPr], "crash")).toHaveLength(1);
    expect(filterPullRequests([dummyPr], "CRASH")).toHaveLength(1);
    expect(filterPullRequests([dummyPr], "feature")).toHaveLength(0);
  });

  it("filters by author login", () => {
    expect(filterPullRequests([dummyPr], "alice")).toHaveLength(1);
    expect(filterPullRequests([dummyPr], "@alice")).toHaveLength(1);
  });

  it("filters by branch name", () => {
    expect(filterPullRequests([dummyPr], "fix-crash")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/pullrequests/model/pullRequestFilter.test.ts`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `pullRequestFilter.ts` and API hooks**

1. Create `src/features/pullrequests/model/pullRequestFilter.ts`:
   Implement `filterPullRequests(prs: GitHubPullRequest[], query: string): GitHubPullRequest[]`.
2. Create `src/features/pullrequests/api/usePullRequests.ts`:
   React Query hook wrapping `fetchPullRequests` with `qk.github.pullRequests(repoPath, state)`.
3. Create `src/features/pullrequests/api/usePullRequestDetail.ts`:
   React Query hook wrapping `fetchPullRequestDetail` with `qk.github.pullRequestDetail(repoPath, prNumber)`.
4. Create `src/features/pullrequests/api/index.ts` exporting both hooks.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/features/pullrequests/model/pullRequestFilter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "✨ add pull request filter and React Query API hooks"
```

---

### Task 3: Status Badge & Patch Diff Viewer Components

**Files:**
- Create: `src/features/pullrequests/components/PullRequestStatusBadge.tsx`
- Create: `src/features/pullrequests/components/PullRequestPatchDiffViewer.tsx`
- Create: `src/features/pullrequests/components/PullRequestPatchDiffViewer.test.tsx`

**Interfaces:**
- Produces:
  - `<PullRequestStatusBadge pr={pr} />`
  - `<PullRequestPatchDiffViewer patch={patch} filename={filename} />`

- [ ] **Step 1: Write failing test for `PullRequestPatchDiffViewer`**

Create `src/features/pullrequests/components/PullRequestPatchDiffViewer.test.tsx` testing parsing of unified diff hunks:
- Header line (`@@ -1,5 +1,6 @@`)
- Added line (`+ added code`)
- Removed line (`- removed code`)
- Context line (`  unchanged code`)
- Empty patch placeholder

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/pullrequests/components/PullRequestPatchDiffViewer.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `PullRequestStatusBadge` and `PullRequestPatchDiffViewer`**

1. `PullRequestStatusBadge.tsx`:
   - Renders state pill:
     - `draft`: bg-surface-header text-tertiary "Draft"
     - `merged_at`: bg-purple-500/15 text-purple-700 dark:text-purple-300 "Merged"
     - `open`: bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 "Open"
     - `closed`: bg-rose-500/15 text-rose-700 dark:text-rose-300 "Closed"
2. `PullRequestPatchDiffViewer.tsx`:
   - Parses patch into lines `{ type: "add" | "del" | "ctx" | "hunk", content: string, oldLine?: number, newLine?: number }`.
   - Renders line-by-line diff using design tokens:
     - "add": `bg-emerald-500/10 text-emerald-800 dark:text-emerald-200`
     - "del": `bg-rose-500/10 text-rose-800 dark:text-rose-200`
     - "hunk": `bg-surface-header/60 text-secondary font-mono text-[11px]`
     - "ctx": `text-primary`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/pullrequests/components/PullRequestPatchDiffViewer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "✨ add pull request status badge and patch diff viewer"
```

---

### Task 4: Sub-tabs: Conversation & Files Changed Views

**Files:**
- Create: `src/features/pullrequests/components/PullRequestConversationView.tsx`
- Create: `src/features/pullrequests/components/PullRequestFilesChangedView.tsx`
- Create: `src/features/pullrequests/components/PullRequestConversationView.test.tsx`
- Create: `src/features/pullrequests/components/PullRequestFilesChangedView.test.tsx`

**Interfaces:**
- Produces:
  - `<PullRequestConversationView detail={detail} t={t} />`
  - `<PullRequestFilesChangedView files={detail.files} t={t} />`

- [ ] **Step 1: Write failing tests for both sub-views**

1. `PullRequestConversationView.test.tsx`:
   - Checks rendering of PR description text or placeholder.
   - Checks rendering of check runs list with passing/failing status icons.
   - Checks rendering of reviewers, assignees, and labels.
2. `PullRequestFilesChangedView.test.tsx`:
   - Checks rendering of file count, additions (+), deletions (-) summary.
   - Checks file list items and selecting a file to view its patch diff.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/features/pullrequests/components/PullRequestConversationView.test.tsx src/features/pullrequests/components/PullRequestFilesChangedView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `PullRequestConversationView` and `PullRequestFilesChangedView`**

1. `PullRequestConversationView.tsx`:
   - Renders Description box.
   - Renders CI Checks section (reusing or adapting `PullRequestCiChecks`).
   - Renders Meta sidebar (Assignees, Reviewers, Labels).
   - Under 300 lines.
2. `PullRequestFilesChangedView.tsx`:
   - Header with stats: `{files.length} files changed (+{totalAdditions} / -{totalDeletions})`.
   - Master list of changed files with filename, status badge (`A`/`M`/`D`), and additions/deletions counts.
   - Detail area displaying `PullRequestPatchDiffViewer` for the selected file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/features/pullrequests/components/PullRequestConversationView.test.tsx src/features/pullrequests/components/PullRequestFilesChangedView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "✨ add pull request conversation and files changed views"
```

---

### Task 5: Master Pane, Detail Pane & Root `PullRequestsScreen`

**Files:**
- Create: `src/features/pullrequests/components/PullRequestsMasterPane.tsx`
- Create: `src/features/pullrequests/components/PullRequestsDetailPane.tsx`
- Create: `src/features/pullrequests/hooks/usePullRequestsScreen.ts`
- Create: `src/features/pullrequests/hooks/usePullRequestsScreen.actions.ts`
- Create: `src/features/pullrequests/components/PullRequestsScreen.tsx`
- Create: `src/features/pullrequests/index.ts`
- Create: `src/features/pullrequests/components/PullRequestsScreen.test.tsx`

**Interfaces:**
- Produces:
  - `<PullRequestsScreen repoPath={repoPath} />`
  - Exported from `src/features/pullrequests/index.ts`

- [ ] **Step 1: Write failing test for `PullRequestsScreen`**

Create `src/features/pullrequests/components/PullRequestsScreen.test.tsx`:
- Verifies master-detail 2-pane layout is rendered.
- Verifies empty state when no PR is selected.
- Verifies selecting a PR from the left pane displays details in the right pane.
- Verifies switching between "Conversation" and "Files Changed" tabs.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/pullrequests/components/PullRequestsScreen.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement MasterPane, DetailPane, hooks, and PullRequestsScreen**

1. `usePullRequestsScreen.ts` and `usePullRequestsScreen.actions.ts`:
   - Manage filter tab (`open` / `closed`), search query, selected PR, active sub-tab (`conversation` / `filesChanged`).
   - Checkout handler using `checkoutPullRequest` from `features/github`.
   - Copy link and Open browser handlers.
2. `PullRequestsMasterPane.tsx`:
   - Header with title, refresh button, "+ New PR" button (opens `usePullRequestStore.getState().openCreateModal()`).
   - Open/Closed switcher.
   - Search input.
   - List of PR items with selection indicator.
3. `PullRequestsDetailPane.tsx`:
   - Empty state when `!selectedPr`.
   - Full header with title, #id, badge, branches, and actions.
   - Sub-tab buttons (Conversation / Files Changed).
   - Body rendering the active sub-tab.
4. `PullRequestsScreen.tsx`:
   - Flex row master-detail container.
5. `index.ts`:
   - Export `PullRequestsScreen`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/pullrequests/components/PullRequestsScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "✨ add master-detail PullRequestsScreen component"
```

---

### Task 6: Header Navigation Switcher, ScreenRouter & Sidebar Integration

**Files:**
- Modify: `src/components/header/RepoHeaderScreenTabs.tsx:1-80`
- Modify: `src/components/header/RepoHeaderScreenSwitcher.tsx:1-60`
- Modify: `src/components/header/RepoHeader.tsx:1-81`
- Modify: `src/components/header/repoHeaderDisplay.ts`
- Modify: `src/components/ScreenRouter.tsx:1-45`
- Modify: `src/components/sidebar/PullRequestsSection.tsx:1-74`
- Modify: `src/components/sidebar/PullRequestsList.tsx:1-60`
- Modify: `src/components/sidebar/usePullRequestsSection.ts:1-91`
- Create: `src/components/header/RepoHeaderScreenTabs.test.tsx`
- Modify: `src/test/ScreenRouter.test.tsx`

**Interfaces:**
- Consumes:
  - `<PullRequestsScreen repoPath={repoPath} />` from `features/pullrequests`
  - `useGitHubRepoInfo` from `features/github`
- Produces:
  - 3rd tab in `RepoHeaderScreenTabs` when `isGitHub === true`
  - Routing in `ScreenRouter` to `<PullRequestsScreen />` when `activeScreen === "pull-requests"`
  - Sidebar row click sets `selectedPr` and navigates to `pull-requests`

- [ ] **Step 1: Write failing tests for RepoHeaderScreenTabs and ScreenRouter**

1. In `src/components/header/RepoHeaderScreenTabs.test.tsx`:
   - Renders 2 tabs (History, Changes) when `isGitHub` is false.
   - Renders 3 tabs (History, Changes, Pull Requests) when `isGitHub` is true.
   - Shows open PR count badge when `openPrCount > 0`.
2. In `src/test/ScreenRouter.test.tsx`:
   - Renders `PullRequestsScreen` when `activeScreen === "pull-requests"`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/components/header/RepoHeaderScreenTabs.test.tsx src/test/ScreenRouter.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement Header tabs, ScreenRouter, and Sidebar navigation**

1. In `RepoHeaderScreenTabs.tsx`:
   - Add `isGitHub?: boolean`, `openPrCount?: number`, `shortcutLabel3?: string` props.
   - When `isGitHub` is true, render the 3rd button with `GitPullRequest` icon, `t.screens.pullRequests`, badge for `openPrCount`, and shortcut `Ctrl+3` / `Cmd+3`.
2. In `RepoHeaderScreenSwitcher.tsx`:
   - Forward `isGitHub`, `openPrCount`, `shortcutLabel3`.
3. In `RepoHeader.tsx`:
   - Call `useGitHubRepoInfo(currentRepo?.path)`.
   - Fetch or compute `openPrCount`.
   - Pass `isGitHub: Boolean(repoInfo?.is_github)` to `RepoHeaderScreenSwitcher`.
   - Update shortcut listener to handle `Ctrl+3` / `Cmd+3` switching to `"pull-requests"`.
   - Add fallback effect: if `!repoInfo?.is_github && activeScreen === "pull-requests"`, call `setActiveScreen("history")`.
4. In `ScreenRouter.tsx`:
   - If `activeScreen === "pull-requests"`, return `<PullRequestsScreen repoPath={repoPath} />`.
5. In `PullRequestsSection.tsx` & `usePullRequestsSection.ts`:
   - When clicking a PR in the sidebar list, instead of opening the drawer, call `setSelectedPr(pr)` and `setActiveScreen("pull-requests")`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/components/header/RepoHeaderScreenTabs.test.tsx src/test/ScreenRouter.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "✨ integrate pull requests tab into repo header and screen router"
```

---

### Task 7: Full System Verification & Quality Gates

**Files:**
- Verification only

- [ ] **Step 1: Run query key guards**

Run: `pnpm check-query-keys`
Expected: PASS

- [ ] **Step 2: Run comment language check**

Run: `pnpm check-comment-language`
Expected: PASS

- [ ] **Step 3: Run lint suppression check**

Run: `pnpm check-lint-suppressions`
Expected: PASS

- [ ] **Step 4: Run project linter**

Run: `pnpm lint`
Expected: 0 warnings, 0 errors.

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 6: Run build check**

Run: `pnpm build`
Expected: Clean build with 0 errors.

- [ ] **Step 7: Final commit if any tweaks needed**

```bash
git commit -m "✅ verify dedicated pull requests screen implementation"
```
