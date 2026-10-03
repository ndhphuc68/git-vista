# Design Specification: Dedicated GitHub Pull Requests Screen

- **Date:** 2026-10-03
- **Phase:** Feature Enhancement (GitHub Collaboration)
- **Status:** Approved for Implementation Planning

---

## 1. Overview & Goals

GitVista currently supports viewing GitHub Pull Requests (PRs) via a small collapsible section in the left sidebar and a slide-over drawer (`PullRequestDetailDrawer`). While functional for quick glances, users managing multiple PRs require a richer, dedicated management experience similar to GitHub's web interface, integrated directly into the main workspace.

### Goals
1. **Dedicated Workspace Screen:** Provide a full-screen, master-detail Pull Requests management view (`PullRequestsScreen`) as a first-class screen alongside History and Changes.
2. **Dynamic Screen Navigation:** Add a conditional 3rd tab to the top repo header switcher (`History` | `Changes` | `Pull Requests`). The tab automatically appears when the repository is hosted on GitHub (`repoInfo?.is_github === true`) and displays an open PR count badge.
3. **Master-Detail Desktop Layout:**
   - **Left Pane (Master):** Fast search, state filters (`Open` / `Closed`), and a rich list of pull requests showing statuses, branches, authors, labels, and timestamps.
   - **Right Pane (Detail):** Comprehensive PR inspection view with:
     - Header: Title, PR #number, status badge (`Open`, `Merged`, `Closed`, `Draft`), branch mapping (`base` $\leftarrow$ `head`), and actions (Checkout, Open in Browser, Copy Link).
     - Sub-tab 1 - **Conversation / Overview:** PR description, CI checks (GitHub Actions check runs), and metadata card (Reviewers, Assignees, Labels).
     - Sub-tab 2 - **Files Changed:** Changed files list with additions/deletions stats and integrated patch diff viewer.
4. **Seamless Sidebar Integration:** Clicking any PR item in the sidebar automatically switches the active screen to `pull-requests` and selects that PR for immediate inspection.
5. **Architectural Compliance:** Structure all new code within `src/features/pullrequests/` following strict layer boundaries, line/function length limits, design tokens, and bidirectional i18n (`vi` and `en`).

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                             RepoHeader                                 │
│  [Sidebar Toggle]  [ History | Changes | (GitPullRequest) Pull Requests ]│
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ activeScreen === "pull-requests"
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ScreenRouter.tsx                                │
│                                 │                                      │
│                                 ▼                                      │
│                     PullRequestsScreen.tsx                             │
│ ┌───────────────────────────────┬────────────────────────────────────┐ │
│ │  PullRequestsMasterPane.tsx   │     PullRequestsDetailPane.tsx     │ │
│ │  - Filter tabs: Open | Closed │  - Header: #Num, Title, Badges     │ │
│ │  - Search input               │  - Actions: Checkout, Browser, Copy│ │
│ │  - "+ New PR" action          │  - Sub-tabs:                       │ │
│ │  - Scrollable PR list items:  │    ├─ [Conversation]               │ │
│ │    * Status indicator         │    │  * Description                │ │
│ │    * Title & #number          │    │  * CI Checks (Passed/Failed)  │ │
│ │    * Base <- Head branches    │    │  * Reviewers / Assignees      │ │
│ │    * Author avatar & login    │    └─ [Files Changed]              │ │
│ │    * Labels & comment count   │       * File tree / list (+ / -)   │ │
│ │                               │       * Patch Diff Viewer          │ │
│ └───────────────────────────────┴────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component & State Design

### 3.1 Store & View State (`useViewStore` & `usePullRequestStore`)

1. **`src/store/useViewStore.ts`**:
   - Extend `ActiveScreen` union:
     ```typescript
     export type ActiveScreen = "history" | "changes" | "conflict" | "pull-requests";
     ```
2. **`src/store/usePullRequestStore.ts`**:
   - Store active selection:
     ```typescript
     selectedPr: GitHubPullRequest | null;
     setSelectedPr: (pr: GitHubPullRequest | null) => void;
     ```
   - When selecting a PR from the sidebar, set `selectedPr` and call `setActiveScreen("pull-requests")`.

### 3.2 Header Navigation (`RepoHeaderScreenTabs.tsx` & `RepoHeader.tsx`)

- Query `useGitHubRepoInfo(currentRepo.path)` in `RepoHeader.tsx`.
- Pass `isGitHub: boolean` and `openPrCount: number` to `RepoHeaderScreenSwitcher` $\rightarrow$ `RepoHeaderScreenTabs`.
- Render the 3rd tab when `isGitHub` is true:
  - Icon: `GitPullRequest` from `lucide-react`.
  - Label: `t.screens.pullRequests`.
  - Badge: Count of open PRs (styled with amber/accent subtle badge).
  - Shortcut: `Ctrl+3` / `Cmd+3`.
- If repo changes to non-GitHub while `activeScreen === "pull-requests"`, automatically fallback to `"history"`.

### 3.3 Screen Layout & Feature Module (`src/features/pullrequests/`)

```
src/features/pullrequests/
├── api/
│   ├── usePullRequests.ts          # Query hook for PR list (open/closed)
│   ├── usePullRequestDetail.ts    # Query hook for PR detail (body, checks, files)
│   └── index.ts
├── components/
│   ├── PullRequestsScreen.tsx      # Main master-detail 2-column layout container
│   ├── PullRequestsMasterPane.tsx  # Left pane: search, filter tabs, list items
│   ├── PullRequestsDetailPane.tsx  # Right pane: header, sub-tab switcher, active tab view
│   ├── PullRequestConversationView.tsx # Conversation tab: description, CI checks, labels/users
│   ├── PullRequestFilesChangedView.tsx # Files changed tab: file list + patch diff
│   ├── PullRequestPatchDiffViewer.tsx  # Unified line diff viewer for file patch
│   └── PullRequestStatusBadge.tsx  # Reusable status pill (Open, Merged, Closed, Draft)
├── hooks/
│   ├── usePullRequestsScreen.ts    # State orchestration (filter, search, active sub-tab, active file)
│   └── usePullRequestsScreen.actions.ts # Action handlers (checkout, open link, filter change)
├── model/
│   ├── pullRequestFilter.ts        # Pure filtering logic by keyword and state
│   └── pullRequestFilter.test.ts   # Unit test for filtering logic
└── index.ts                        # Clean public interface for external consumers
```

### 3.4 Patch Diff Viewer (`PullRequestPatchDiffViewer.tsx`)

- GitHub API returns `patch: string` in `/repos/{owner}/{repo}/pulls/{number}/files`.
- A pure parser converts GitHub unified diff patches into hunk lines:
  - Line type: added (`+`), removed (`-`), context (` `), or header (`@@ ... @@`).
  - Render with syntax styling matching the app's existing DiffViewer design tokens (`diff-add`, `diff-del`, `font-mono`).

---

## 4. API & Query Keys

1. **Query Keys (`src/domain/queryKeys.ts`)**:
   - `qk.github.pullRequests(repoPath, state)`
   - `qk.github.pullRequestDetail(repoPath, prNumber)`
2. **GitHub API Client (`src/services/githubService.ts`)**:
   - Update `PullRequestFileItem` interface to include `patch?: string`.
   - Update `mapPullRequestFile` to map `patch: f.patch ?? ""` from GitHub payload.

---

## 5. Internationalization (i18n)

Add keys to both `src/i18n/vi.ts` and `src/i18n/en.ts`:
- `screens.pullRequests`: "Yêu cầu kéo" (VI) / "Pull Requests" (EN).
- `pullRequestsScreen`:
  - `title`: "Quản lý Pull Requests" / "Pull Requests Management"
  - `searchPlaceholder`: "Tìm kiếm theo tiêu đề, #số PR, tác giả..." / "Search by title, #number, author..."
  - `emptySelection`: "Chọn một Pull Request từ danh sách để xem chi tiết" / "Select a pull request from the list to view details"
  - `emptyList`: "Không tìm thấy Pull Request nào" / "No pull requests found"
  - `tabs`:
    - `conversation`: "Thảo luận" / "Conversation"
    - `filesChanged`: "Tệp thay đổi" / "Files Changed"
  - `checks`:
    - `passed`: "Kiểm tra thành công" / "Checks passed"
    - `failed`: "Kiểm tra thất bại" / "Checks failed"
    - `running`: "Đang kiểm tra" / "Checks in progress"

---

## 6. Coding Rules & Constraints Compliance

1. **Size Limits:** All files under 300 lines; functions under 80 lines; complexity $\le 15$.
2. **Design Tokens:** Exclusive use of semantic colors (`bg-surface`, `bg-window`, `text-primary`, `text-secondary`, `border-border-subtle`, `text-accent`).
3. **No Arbitrary Classes:** Standard Tailwind spacing/sizing scales (`w-80`, `w-96`, `min-h-12`).
4. **No Suppressions:** Zero `eslint-disable` or `oxlint-disable` additions.
5. **No Query Key Literals:** Every React Query hook uses `qk`.

---

## 7. Testing & Verification Plan

1. **Unit Tests:**
   - `pullRequestFilter.test.ts`: Tests keyword filtering across PR number, title, author, and branch names.
   - `repoHeaderDisplay.test.ts`: Verify shortcut labels and tab configurations.
2. **Component Tests:**
   - `RepoHeaderScreenTabs.test.tsx`: Tests rendering of the Pull Requests tab when `isGitHub === true`, and hidden when `false`.
   - `ScreenRouter.test.tsx`: Tests routing to `PullRequestsScreen` when `activeScreen === "pull-requests"`.
   - `PullRequestsScreen.test.tsx`: Tests master-detail rendering, selecting a PR, switching sub-tabs, and empty state.
3. **Verification Commands:**
   - `pnpm lint` $\rightarrow$ 0 errors, 0 warnings.
   - `pnpm test` $\rightarrow$ all tests green.
   - `pnpm check-query-keys` $\rightarrow$ passed.
   - `pnpm check-comment-language` $\rightarrow$ passed.
   - `pnpm check-lint-suppressions` $\rightarrow$ passed.
