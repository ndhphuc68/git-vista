# Refactor Phase 7b — Route Every Runtime `ipc/` Import Through a Feature `api/` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `no-restricted-imports` from 24 warnings to 0 and raise it to `error`, so that outside `src/ipc/**` and `src/features/*/api/**` no file can pull a runtime value out of `ipc/`.

**Architecture:** Each of the 24 files keeps its UI and its control flow. Only the IPC seam moves: every `useQuery` whose `queryFn` calls `invokeCommand` moves **verbatim** (same `queryKey`, same `queryFn`, same `enabled`/`staleTime`/other options) into a hook in `features/<name>/api/`, and every imperative `invokeCommand.x(...)` call becomes a call to a same-named thin wrapper function exported from `features/<name>/api/`. Call sites import from `features/<name>` (the public `index.ts`), never from `api/` directly. Invalidation stays where it is today — moving it into mutation hooks is a behaviour-preserving but larger change and belongs to 7c, where it shrinks the very functions 7c has to split.

**Tech Stack:** oxlint 1.83 (`.oxlintrc.json`), TypeScript, React 19, TanStack Query, Vitest + Testing Library, zustand.

## Global Constraints

- Code, comments, test descriptions, test fixture strings and commit messages in **English**. User-facing strings (i18n entries, rendered text, `aria-label`, `title`) stay **Vietnamese**. `pnpm check-comment-language` enforces this.
- Commit messages use Gitmoji: `<emoji> <short description>`, no `feat:` prefixes, no parenthesized scopes. Every commit ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Do not add or modify Playwright E2E tests (`e2e/**`).
- Do not change an existing test's assertions (convention 4). Existing tests mock `ipc/client` (23 test files do); because the new `api/` modules call `invokeCommand` from that same module, those mocks keep working unchanged. If a test breaks, the move was not mechanical — fix the move, not the test.
- A file with **no test** gets a characterization test **before** its IPC seam moves: write it, see it pass on the original code, break the original code and watch it fail, restore, then do the move and see it still pass (conventions 3 and 5).
- No behaviour change. Hooks moved into `api/` keep identical `queryKey`, `queryFn` and options. Wrapper functions forward every argument unchanged, including optional ones.
- Import other features only through their public index (`features/<name>`), never `features/<name>/api` or deeper. `src/test/architectureBoundaries.test.ts` enforces this and the no-cycle rule. A feature's `api/` must **not** import `store/` (the store will import `features/repo` in Task 7 and a cycle would follow).
- Before reusing an existing hook (for example `useRepoStatus`, `useBranches`) instead of moving a `useQuery`, compare options line by line. Reuse only when `queryKey`, `queryFn` and `enabled` are equivalent for every input the call site can pass; otherwise add a new hook with the call site's exact options.
- Verification commands (repo root): `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm check-comment-language`, `pnpm check-query-keys`. Count the rule with
  `pnpm lint 2>&1 | grep -c "no-restricted-imports"` (Git Bash) — baseline **24**.

### Wrapper conventions (used by every task)

A thin wrapper copies the parameter list and return type of the `invokeCommand` method it forwards to (read the signature in the matching `src/ipc/<domain>.ts` file) and forwards every argument:

```ts
/** Cherry-picks `commitId` onto HEAD; `autoCommit=false` only stages the result. */
export function cherryPickCommit(
  repoPath: string,
  commitId: string,
  autoCommit?: boolean
): Promise<CommitActionResult> {
  return invokeCommand.cherryPickCommit(repoPath, commitId, autoCommit);
}
```

Default parameter values stay in `src/ipc/`; the wrapper marks them optional (`autoCommit?: boolean`) so the default is applied once, in the same place as today.

A moved query hook keeps the original options verbatim and takes the values the call site used as parameters:

```ts
/** Blame for `filePath` at `commitId` (or the working tree when null). */
export function useFileBlame(repoPath: string, filePath: string, commitId: string | null) {
  return useQuery({
    queryKey: qk.fileBlame(repoPath, filePath, commitId ?? ""),
    queryFn: () => invokeCommand.getFileBlame(repoPath, filePath, commitId),
    // …every other option the original useQuery had, unchanged
  });
}
```

Each `api/` file opens with the same docblock pattern `features/welcome/api/index.ts` uses: what it wraps, and that it is the only place in the feature allowed to import `ipc/`.

---

## Target map

| Task | Feature (new ★) | Call-site files | Warnings removed |
| --- | --- | --- | --- |
| 1 | `undo`, `history` | `features/branch/components/DeleteBranchModal.tsx`, `features/stash/components/StashDiffView.tsx` | 2 |
| 2 | `history` | `components/diff/FileDiffViewer.tsx`, `components/inspector/BlameView.tsx`, `components/inspector/FileHistoryView.tsx`, `components/modals/CherryPickModal.tsx`, `components/modals/RevertModal.tsx` | 5 |
| 3 | `compare` ★ | `components/compare/CompareModal.tsx`, `components/compare/CompareDiffViewer.tsx` | 2 |
| 4 | `merge` | `components/rebase/InteractiveRebaseModal.tsx` | 1 |
| 5 | `changes` ★ | `components/changes/ChangesScreen.tsx`, `components/changes/CommitBox.tsx`, `components/changes/InteractiveDiffViewer.tsx` | 3 |
| 6 | `conflict` ★ | `components/conflict/ConflictResolverScreen.tsx`, `App.tsx` (in-progress half) | 1 (+ App partial) |
| 7 | `repo` ★ | `store/useTabStore.ts`, `components/header/RepoHeader.tsx`, `components/ControlsBar.tsx`, `App.tsx` (event half) | 4 |
| 8 | `github` ★ | `components/pullrequests/PullRequestDetailDrawer.tsx`, `components/pullrequests/CreatePullRequestModal.tsx`, `components/sidebar/PullRequestsSection.tsx`, `components/settings/tabs/GitHubSettingsTab.tsx` | 4 |
| 9 | `settings`, `welcome` | `components/settings/tabs/GitProfileTab.tsx`, `components/welcome/CloneModal.tsx` | 2 |
| 10 | — | `.oxlintrc.json`, `src/test/architectureBoundaries.test.ts`, docs | raise to `error` |

Feature edges this plan adds: `stash → history`, `github → branch`, `github → remote`. None closes a cycle (today's edges all start at `branch`; `history`, `remote` import no feature). The acyclicity test re-checks this after every task.

---

### Task 1: Empty `IPC_IMPORT_EXCEPTIONS` (DeleteBranchModal, StashDiffView)

The two remaining named exceptions in `src/test/architectureBoundaries.test.ts` each say "removed once the domain has a hook". Both domains now have a place.

`StashDiffView` has **no test**, and REFACTOR_STATUS.md §11.4 records the gap: nothing covers its apply/pop/drop buttons. This task closes it as the characterization test.

**Files:**
- Modify: `src/features/undo/api/useUndoActions.ts`, `src/features/undo/index.ts`
- Modify: `src/features/history/index.ts`
- Create: `src/features/history/api/commitDetailsApi.ts`
- Modify: `src/features/branch/components/DeleteBranchModal.tsx:5-6,53`
- Modify: `src/features/stash/components/StashDiffView.tsx:4,31-36`
- Create: `src/features/stash/components/StashDiffView.test.tsx`
- Modify: `src/test/architectureBoundaries.test.ts:28-37`

**Interfaces:**
- Produces: `undoDeleteBranch(repoPath: string, branchName: string, backupRef: string): Promise<void>` and `undoCommit(repoPath: string, undoToken: string): Promise<void>` exported from `features/undo` (Task 4 and Task 5 use `undoCommit`). Copy exact param types from `src/ipc/undo.ts`.
- Produces: `getCommitDetails(repoPath: string, commitId: string): Promise<CommitDetails>` exported from `features/history`.

- [ ] **Step 1: Write the StashDiffView characterization test**

Read `StashDiffView.tsx` in full first. The test file mocks `../../../ipc/client` the way `src/features/stash/api/useStashMutations.test.ts` does, renders `StashDiffView` inside a `QueryClientProvider` and the i18n provider used by other component tests in `src/features/**` (copy their render helper), and asserts:

1. On mount `invokeCommand.getCommitDetails` is called with `(repoPath, stashItem.commit_id)` and the returned files are rendered.
2. Clicking the apply, pop and drop buttons calls the corresponding handler passed in the `handlers` prop exactly once with the stash (read the prop shape from `StashDiffViewProps`).

- [ ] **Step 2: Run it on the original code**

Run: `pnpm vitest run src/features/stash/components/StashDiffView.test.tsx`
Expected: PASS. Then change `stashItem.commit_id` to `"x"` in the component, re-run, see assertion 1 FAIL, restore. Swap the apply and pop `onClick` handlers, see assertion 2 FAIL, restore.

- [ ] **Step 3: Add the wrappers**

In `src/features/undo/api/useUndoActions.ts`, below the existing hook, add `undoDeleteBranch` and `undoCommit` wrappers following the wrapper convention. Export both from `src/features/undo/index.ts`.

Create `src/features/history/api/commitDetailsApi.ts`:

```ts
/**
 * Imperative commit-details read, for callers that load details outside a
 * React Query hook. Prefer `useCommitDetails` when rendering.
 */
import { invokeCommand } from "../../../ipc/client";
import type { CommitDetails } from "./useCommitDetails";

/** Full details (metadata and changed files) of one commit. */
export function getCommitDetails(repoPath: string, commitId: string): Promise<CommitDetails> {
  return invokeCommand.getCommitDetails(repoPath, commitId);
}
```

Add `export { getCommitDetails } from "./api/commitDetailsApi";` to `src/features/history/index.ts`.

- [ ] **Step 4: Switch the two call sites**

- `DeleteBranchModal.tsx`: delete the `invokeCommand` import and the comment above it; import `undoDeleteBranch` from `"../../undo"`; replace `invokeCommand.undoDeleteBranch(` with `undoDeleteBranch(`.
- `StashDiffView.tsx`: delete the `invokeCommand` import and the three-line comment about `IPC_IMPORT_EXCEPTIONS`; import `getCommitDetails` from `"../../history"`; replace `invokeCommand\n      .getCommitDetails(` with `getCommitDetails(`. Keep the `.then`/`.catch` chain as it is.

- [ ] **Step 5: Empty the exception list**

In `architectureBoundaries.test.ts` replace the two entries with an empty record, keeping the docblock and the "every ipc-import exception still exists" test (it now guards against re-growth being unnoticed):

```ts
const IPC_IMPORT_EXCEPTIONS: Record<string, string> = {};
```

- [ ] **Step 6: Verify**

Run: `pnpm vitest run src/features src/test/architectureBoundaries.test.ts` → PASS.
Run: `pnpm lint 2>&1 | grep -c "no-restricted-imports"` → **22**.
Run: `pnpm build` → exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/features src/test/architectureBoundaries.test.ts
git commit -m "♻️ route undo and stash diff reads through feature api"
```

---

### Task 2: History reads and commit actions (5 files)

**Files:**
- Create: `src/features/history/api/useFileInspection.ts` (hooks `useCommitFileDiff`, `useFileBlame`, `useFileHistory`)
- Create: `src/features/history/api/commitActionsApi.ts` (wrappers `cherryPickCommit`, `revertCommit`)
- Modify: `src/features/history/index.ts`
- Modify: `src/components/diff/FileDiffViewer.tsx:5,96-100`, `src/components/inspector/BlameView.tsx:5,38-41`, `src/components/inspector/FileHistoryView.tsx:5,29-32`, `src/components/modals/CherryPickModal.tsx:3,54`, `src/components/modals/RevertModal.tsx:3,52`
- Create: `src/components/diff/FileDiffViewer.test.tsx`, `src/components/inspector/BlameView.test.tsx`, `src/components/inspector/FileHistoryView.test.tsx`

**Interfaces:**
- Produces from `features/history`: `useCommitFileDiff(repoPath, commitId, filePath, ignoreWhitespace)`, `useFileBlame(repoPath, filePath, commitId)`, `useFileHistory(repoPath, filePath)` — each returns the `useQuery` result unchanged; `cherryPickCommit(repoPath, commitId, autoCommit?)`, `revertCommit(repoPath, commitId, autoCommit?)` returning `Promise<CommitActionResult>`.

- [ ] **Step 1: Characterization tests for the three untested viewers**

For each of `FileDiffViewer`, `BlameView`, `FileHistoryView`: mock `ipc/client`, render with minimal props (read the props interface), and assert (a) the IPC method is called with exactly the arguments the current `queryFn` passes (e.g. `getFileHistory(repoPath, filePath, 0, 100)`), and (b) one piece of returned data is rendered (a line of the diff, a blame author, a history commit summary). Run each on the original code → PASS; break the argument list → FAIL; restore.

- [ ] **Step 2: Move the three queries**

Cut each `useQuery({...})` block out of the component into `useFileInspection.ts` as a named hook following the query-hook convention. Keep every option. In the component replace the block with the hook call, keeping the same destructuring (`const { data: diff, isLoading } = useCommitFileDiff(...)`). Remove now-unused imports (`useQuery`, `invokeCommand`, possibly `qk`).

- [ ] **Step 3: Wrap cherry-pick and revert**

Create `commitActionsApi.ts` with `cherryPickCommit` (the example in the wrapper convention) and `revertCommit` (same shape). Export all five names from `features/history/index.ts`. In `CherryPickModal.tsx` / `RevertModal.tsx` replace `invokeCommand.cherryPickCommit(` / `invokeCommand.revertCommit(` with the imported function and delete the `invokeCommand` import.

- [ ] **Step 4: Verify**

Run: `pnpm vitest run src/components src/features/history src/test` → PASS, no assertion edits.
Run: `pnpm lint 2>&1 | grep -c "no-restricted-imports"` → **17**. `pnpm build` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/history src/components/diff src/components/inspector src/components/modals
git commit -m "♻️ move commit file reads and commit actions into history api"
```

---

### Task 3: New `compare` feature (2 files)

**Files:**
- Create: `src/features/compare/api/useCompare.ts`, `src/features/compare/index.ts`
- Modify: `src/components/compare/CompareModal.tsx:3-4,60-63`, `src/components/compare/CompareDiffViewer.tsx:3,5,106-120`
- Create: `src/components/compare/CompareDiffViewer.test.tsx`

**Interfaces:**
- Produces from `features/compare`: `useCompareSummary(repoPath, baseRev, targetRev, mode)` (moved from `CompareModal`) and `useCompareFileDiff(repoPath, options)` (moved from `CompareDiffViewer`; `options` is the same object shape `qk.compareFileDiff` takes since commit `3089f28`, so the hook passes it to both `qk.compareFileDiff` and `invokeCommand.getCompareFileDiff` exactly as the component does now).

- [ ] **Step 1: Characterization test for `CompareDiffViewer`** — mock `ipc/client`, render with one `CompareFileItem`, assert `getCompareFileDiff` receives the current arguments (including the `ignoreWhitespace` value — this is the GĐ3 bug `d2c3710` fixed; pin it again) and a hunk line renders. Break-restore as in Task 2.
- [ ] **Step 2: Move both queries** into `useCompare.ts`; `index.ts` exports only the two hooks. Replace the blocks in the components; drop unused imports.
- [ ] **Step 3: Verify** — `pnpm vitest run src/components/compare src/test` PASS; rule count **15**; `pnpm build` exit 0.
- [ ] **Step 4: Commit** — `git add src/features/compare src/components/compare && git commit -m "✨ add compare feature api for commit comparison queries"`

---

### Task 4: Interactive rebase into `merge` (1 file)

**Files:**
- Create: `src/features/merge/api/interactiveRebaseApi.ts`
- Modify: `src/features/merge/index.ts`
- Modify: `src/components/rebase/InteractiveRebaseModal.tsx:3-4,54-57,208,223`

**Interfaces:**
- Consumes: `undoCommit` from `features/undo` (Task 1).
- Produces from `features/merge`: `useRebaseCommits(repoPath, baseCommitId)` (moved query) and `executeInteractiveRebase(...)` (wrapper; copy the parameter list from `src/ipc/rebase.ts`).

- [ ] **Step 1: Move and wrap.** Move the `useQuery` at line 54 verbatim (it has a `data = EMPTY_COMMITS` default in the destructuring — that stays at the call site, not in the hook). Wrap `executeInteractiveRebase`. Replace `invokeCommand.undoCommit(` with `undoCommit(` imported from `"../../features/undo"`.
- [ ] **Step 2: Verify** — `pnpm vitest run src/components/rebase src/features/merge src/test` PASS without assertion changes (the backdrop-during-submit tests from GĐ2 must stay green); rule count **14**; build exit 0.
- [ ] **Step 3: Commit** — `git commit -m "♻️ move interactive rebase ipc calls into merge api"`

---

### Task 5: New `changes` feature (3 files)

`ChangesScreen` has the most calls (12). All are imperative calls followed by an `invalidateQueries` in the component. Wrap the calls; leave each `invalidateQueries` exactly where it is (see Architecture).

**Files:**
- Create: `src/features/changes/api/stagingApi.ts` — wrappers `stageFile`, `unstageFile`, `stageAll`, `unstageAll`, `discardFileChanges`, `restoreDiscard`, `stageHunk`, `stageLines`, `createCommit` (copy signatures from `src/ipc/staging.ts` / wherever `createCommit` lives)
- Create: `src/features/changes/api/useWorkingFileDiff.ts`
- Create: `src/features/changes/index.ts`
- Modify: `src/components/changes/ChangesScreen.tsx`, `src/components/changes/CommitBox.tsx`, `src/components/changes/InteractiveDiffViewer.tsx`

**Interfaces:**
- Consumes: `useRepoStatus` from `features/history`; `undoCommit` from `features/undo`.
- Produces from `features/changes`: the nine wrappers above and `useWorkingFileDiff(repoPath, filePath, isStaged, ignoreWhitespace)`.

- [ ] **Step 1: Repo status query.** `ChangesScreen.tsx:31` has `useQuery({ queryKey: qk.repo.status(currentRepo?.path ?? ""), queryFn: () => invokeCommand.getRepoStatus(currentRepo!.path), … })`. Compare its options with `features/history/api/useRepoStatus.ts` (`enabled: Boolean(repoPath)`). If equivalent, replace with `useRepoStatus(currentRepo?.path ?? "")`; if the component has extra options (e.g. `refetchInterval`), add them as a new hook in `features/changes/api` instead of changing `useRepoStatus`.
- [ ] **Step 2: Wrappers and diff hook.** Create the api files, export from `index.ts`, replace every `invokeCommand.x(` in the three files with the imported function, move the `InteractiveDiffViewer` query into `useWorkingFileDiff`. `CommitBox`'s `undoCommit` comes from `features/undo`.
- [ ] **Step 3: Verify** — `pnpm vitest run src/components/changes src/test` PASS without assertion changes; rule count **11**; build exit 0.
- [ ] **Step 4: Commit** — `git commit -m "✨ add changes feature api for staging and commit calls"`

---

### Task 6: New `conflict` feature (ConflictResolverScreen, App.tsx in-progress calls)

**Files:**
- Create: `src/features/conflict/api/conflictApi.ts` — hooks `useConflictFile(repoPath, filePath)` (from `ConflictResolverScreen.tsx:34`), `useRepoState(repoPath)` (from `App.tsx:59`); wrappers `abortInProgress`, `continueInProgress`, `resolveConflictFile` (signatures from `src/ipc/conflict.ts` / `src/ipc/merge.ts`)
- Create: `src/features/conflict/index.ts`
- Modify: `src/components/conflict/ConflictResolverScreen.tsx:3,9,34-37`, `src/App.tsx:59-62,66,72,95`

- [ ] **Step 1: Move and wrap.** Same mechanics as Task 2/5. `App.tsx` keeps its `listenToRepoChanged` import for now — Task 7 removes it — so `App.tsx` still warns after this task.
- [ ] **Step 2: Verify** — `pnpm vitest run src/components/conflict src/App.test.tsx src/test` PASS; rule count **10**; build exit 0.
- [ ] **Step 3: Commit** — `git commit -m "✨ add conflict feature api for in-progress operations"`

---

### Task 7: New `repo` feature (useTabStore, RepoHeader, ControlsBar, App.tsx events)

`features/repo` is imported by `store/useTabStore.ts`, so it must not import `store/` (or any feature that does). It holds plain functions only, plus one query hook.

**Files:**
- Create: `src/features/repo/api/repoLifecycleApi.ts` — `openRepository(path)`, `closeRepository(tabId)`, `listenToRepoChanged(handler)` (forward to `ipc/client`'s `listenToRepoChanged`)
- Create: `src/features/repo/api/useRepoHeadInfo.ts` — moved from `RepoHeader.tsx:42`
- Create: `src/features/repo/api/diagnosticsApi.ts` — `ping(message)`, `getSystemInfo()`, `simulateRepoChange(path)` (dev-only `ControlsBar`)
- Create: `src/features/repo/index.ts`
- Create: `src/components/ControlsBar.test.tsx`
- Modify: `src/store/useTabStore.ts:4,137,193`, `src/components/header/RepoHeader.tsx:17,36-45`, `src/components/ControlsBar.tsx:18,38,41,53`, `src/App.tsx:9,278`

**Interfaces:**
- Consumes: `useRepoStatus` from `features/history` (for `RepoHeader.tsx:36`, after the same option comparison as Task 5 Step 1).
- Produces from `features/repo`: the six functions and `useRepoHeadInfo(repoPath)`.

- [ ] **Step 1: Characterization test for `ControlsBar`** — mock `ipc/client`; click the ping, system-info and simulate buttons; assert each IPC method receives today's arguments (`"Chào Rust backend từ React!"` is user-facing text shown in the app log; keep it verbatim). Break-restore.
- [ ] **Step 2: Move and wrap** as in earlier tasks. `useTabStore` imports from `"../features/repo"`. `ControlsBar` keeps `type RepoChangedPayload, type SystemInfo` as a separate `import type` from `ipc/client` (allowed).
- [ ] **Step 3: Check the new edge** — `pnpm vitest run src/test/architectureBoundaries.test.ts` PASS; also confirm `grep -rn "store/" src/features/repo` prints nothing.
- [ ] **Step 4: Verify** — `pnpm vitest run src/store src/components/header src/components/ControlsBar.test.tsx src/App.test.tsx src/test` PASS; rule count **6**; build exit 0.
- [ ] **Step 5: Commit** — `git commit -m "✨ add repo feature api for repository lifecycle and events"`

---

### Task 8: New `github` feature (4 files)

Three files repeat the same two queries (`qk.github.repoInfo`, `qk.githubToken`) and the same checkout-PR call. Read all three `useQuery` blocks side by side. If their options are identical, move one copy into a shared hook; if they differ (e.g. one has `staleTime`, another not), **keep separate hooks or add an options parameter** so each call site keeps its current options — do not unify behaviour here.

**Files:**
- Create: `src/features/github/api/githubApi.ts` — hooks `useGitHubRepoInfo(repoPath)`, `useGitHubToken()`; wrappers `getGitHubToken()`, `saveGitHubToken(token)`, `removeGitHubToken()`, `checkoutPullRequest(repoPath, prNumber)` (signatures from `src/ipc/github.ts`)
- Create: `src/features/github/index.ts`
- Create: `src/components/sidebar/PullRequestsSection.test.tsx`
- Modify: `src/components/pullrequests/PullRequestDetailDrawer.tsx`, `src/components/pullrequests/CreatePullRequestModal.tsx`, `src/components/sidebar/PullRequestsSection.tsx`, `src/components/settings/tabs/GitHubSettingsTab.tsx`

**Non-github calls in `CreatePullRequestModal`:**
- `getBranches` query (`:64`) — compare with `features/branch`'s `useBranches` (`enabled: Boolean(repoPath)`). The call site destructures `refetch`; `useBranches` returns the full query result, so `refetch` is available. Reuse if options match; else move verbatim into `features/github/api`.
- `pushRepo(repoPath, undefined, compareBranch, !hasUpstream, false)` (`:130`) — add a `pushRepo` wrapper to `features/remote/api` (next to `useRemoteTask`) and export it from `features/remote/index.ts`. Copy the signature from `src/ipc/remote.ts`.

- [ ] **Step 1: Characterization test for `PullRequestsSection`** — mock `ipc/client` and `services/githubService` (PR list comes from there); assert repo-info and token queries fire and a PR title renders, and that the checkout button calls `checkoutPullRequest(repoPath, pr.number)`. Break-restore.
- [ ] **Step 2: Move and wrap**, then switch the four files. `src/ipc/githubApi.ts` type imports stay (type-only, allowed).
- [ ] **Step 3: Verify** — `pnpm vitest run src/components/pullrequests src/components/sidebar src/components/settings src/features src/test` PASS; rule count **2**; build exit 0.
- [ ] **Step 4: Commit** — `git commit -m "✨ add github feature api for pull request and token calls"`

---

### Task 9: GitProfileTab and CloneModal into existing features

**Files:**
- Modify: `src/features/settings/index.ts` — export `getGitConfig`, `setGitConfig` from `./api` (they already exist)
- Modify: `src/features/welcome/api/index.ts` — add `cloneRepo(url, targetDir, taskId)`, `cancelRemoteTask(taskId)`, `listenToTaskProgress(handler)`; `openRepository` and `selectRepoFolder` already exist
- Modify: `src/features/welcome/index.ts` — export the five functions `CloneModal` needs
- Modify: `src/components/settings/tabs/GitProfileTab.tsx:4`, `src/components/welcome/CloneModal.tsx:3`
- Create: `src/components/settings/tabs/GitProfileTab.test.tsx`

- [ ] **Step 1: Characterization test for `GitProfileTab`** — mock `ipc/client` with `getGitConfig` returning a global and a local config; assert both are read on mount (`getGitConfig(null)`, `getGitConfig(repoPath)`), and that saving in global mode writes `user.name` / `user.email` via `setGitConfig(null, "global", …)` with trimmed values. Break-restore.
- [ ] **Step 2: Switch imports.** `GitProfileTab` keeps `type GitConfigDto` as `import type` from `ipc/client`; every `invokeCommand.getGitConfig(` / `invokeCommand.setGitConfig(` becomes the imported function. `CloneModal` imports its five functions from `"../../features/welcome"`.
- [ ] **Step 3: Verify** — `pnpm vitest run src/components/settings src/components/welcome src/features src/test` PASS; rule count **0**; build exit 0.
- [ ] **Step 4: Commit** — `git commit -m "♻️ route git profile and clone calls through feature api"`

---

### Task 10: Raise `no-restricted-imports` to `error`, extend the boundary test, update docs

**Files:**
- Modify: `.oxlintrc.json` (top-level `no-restricted-imports`: `"warn"` → `"error"`)
- Modify: `src/test/architectureBoundaries.test.ts`
- Modify: `docs/superpowers/REFACTOR_STATUS.md`, `src/features/README.md`

- [ ] **Step 1: Extend the runtime-ipc test to all of `src/`**

The existing test only scans `src/features/**`. Add a sibling test that scans every non-test source file under `src/` except `src/ipc/**` and `src/features/*/api/**`, reusing `collectSourceFiles` and `importsIpcAtRuntime`:

```ts
  it("outside ipc/ and features/*/api, nothing imports ipc/ at runtime", () => {
    const files = collectSourceFiles(SRC);
    expect(files.length).toBeGreaterThan(0);
    const violations: string[] = [];

    for (const file of files) {
      const rel = relative(SRC, file).replace(/\\/g, "/");
      if (rel.startsWith("ipc/")) continue;
      if (/^features\/[^/]+\/api\//.test(rel)) continue;
      if (rel.startsWith("test/")) continue;
      if (rel in IPC_IMPORT_EXCEPTIONS) continue;
      if (importsIpcAtRuntime(readFileSync(file, "utf8"))) violations.push(rel);
    }

    expect(violations).toEqual([]);
  });
```

Break experiment: add `import { invokeCommand } from "../ipc/client"; void invokeCommand;` to `src/store/useTabStore.ts` → the new test FAILS listing `store/useTabStore.ts`; restore.

- [ ] **Step 2: Raise the rule** — change the severity to `"error"`. Ratchet probe: add the same import to `src/components/ControlsBar.tsx` → `pnpm lint` exits **1** with `error eslint(no-restricted-imports)`; restore → exit **0**.

- [ ] **Step 3: Full verification**

| Command | Expected |
| --- | --- |
| `pnpm lint` | exit 0, **128 warnings** (90 `max-lines-per-function`, 28 `complexity`, 10 `max-lines`), 0 `no-restricted-imports` — function/line counts may shift by a few because hooks moved out; record the real numbers |
| `pnpm build` | exit 0 |
| `pnpm test` | PASS, record file/test counts (baseline 113 / 772 plus new tests) |
| `pnpm check-comment-language` | PASS |
| `pnpm check-query-keys` | PASS |

- [ ] **Step 4: Docs** — in `REFACTOR_STATUS.md`: header progress line, a "Giai đoạn 7b" subsection in §3 (commit table, warnings before/after, new features `compare`/`changes`/`conflict`/`repo`/`github`, the characterization tests added, the §11.4 StashDiffView gap now closed), §4 row 7b ✅, and "Số liệu hiện tại". In `src/features/README.md` note that rule 4 is now enforced for all of `src/` by both lint (`error`) and the boundary test. Status doc stays in Vietnamese, like the rest of it.

- [ ] **Step 5: Commit**

```bash
git add .oxlintrc.json src/test/architectureBoundaries.test.ts docs/superpowers/REFACTOR_STATUS.md src/features/README.md
git commit -m "🔧 raise no-restricted-imports to error"
```
