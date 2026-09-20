# Phase 5b Large Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the five remaining oversized UI modules into feature-owned, testable modules while preserving all UI behaviour, IPC calls, query keys, and invalidation scope.

**Architecture:** Complete missing owner hooks before removing direct IPC from `BranchSidebar`. Introduce feature entry modules for history, settings, and welcome; each entry component composes focused internal hooks, models, and display modules. Existing application layout remains in `Shell` and existing stores remain the source of shared state.

**Tech Stack:** React, TypeScript, TanStack Query, Zustand, Vitest, Testing Library, Tauri IPC facade.

**Spec:** `docs/superpowers/specs/2026-09-20-refactor-phase5b-large-modules-design.md`

## Global Constraints

- Preserve current user-visible Vietnamese and English copy, IPC contracts, query keys, and invalidation scope.
- Keep code, comments, test descriptions, fixtures, and commit messages in English.
- Use `qk` for every React Query key; do not add query-key literals.
- Write a focused failing test for every extracted hook or model, prove it fails by breaking the implementation, then restore it.
- Do not add IPC or cross-feature exceptions; shrink `architectureBoundaries.test.ts` exceptions as hooks replace direct IPC use.
- Keep each target entry module below 300 lines, except for an explicitly measured and documented exception approved in `REFACTOR_STATUS.md`.

---

### Task 1: Complete owner hooks needed by the branch sidebar

**Files:**
- Create: `src/features/tag/api/useTagActions.ts`
- Create: `src/features/tag/api/useTagActions.test.ts`
- Create: `src/features/merge/api/useMergeMutations.ts`
- Create: `src/features/merge/api/useMergeMutations.test.ts`
- Create: `src/features/undo/api/useUndoActions.ts`
- Create: `src/features/undo/api/useUndoActions.test.ts`
- Modify: `src/features/tag/api/index.ts`
- Modify: `src/features/tag/index.ts`
- Modify: `src/features/merge/index.ts`
- Modify: `src/features/undo/index.ts`

**Interfaces:**
- Produces `useCheckoutTag(repoPath)`, `usePushTag(repoPath)`, `useMergeBranch(repoPath)`, `useRebaseBranch(repoPath)`, and `useUndoDropStash(repoPath)`.
- Each hook returns a TanStack mutation whose `mutateAsync` arguments match the command arguments other than `repoPath`.

- [ ] **Step 1: Write failing hook tests.** Assert checkout/push tag invalidate `qk.repo.all(repoPath)` only after success, merge/rebase invalidate the existing branch/status/graph/head scope, and undo-drop invalidates `qk.stashes(repoPath)` after success. Assert rejected commands invalidate nothing and each mutation returns the command result where callers need it.

- [ ] **Step 2: Run the focused hook tests and verify failure.**

Run: `pnpm vitest run src/features/tag/api/useTagActions.test.ts src/features/merge/api/useMergeMutations.test.ts src/features/undo/api/useUndoActions.test.ts`

Expected: FAIL because the three modules and exports do not exist.

- [ ] **Step 3: Implement the owner hooks.** Use `useMutation`, `invokeCommand`, and `useQueryClient`; keep tag invalidation broad (`qk.repo.all`) and implement the existing branch refresh scope as a shared internal helper in the merge module. Make `useUndoDropStash` accept `{ receipt: string }` and return `Promise<void>`.

- [ ] **Step 4: Prove each new assertion is meaningful.** Temporarily remove one `onSuccess` invalidation and temporarily omit the `return` from one mutation function; rerun the focused test and confirm it fails, then restore the implementation.

- [ ] **Step 5: Run focused verification and commit.**

Run: `pnpm vitest run src/features/tag/api/useTagActions.test.ts src/features/merge/api/useMergeMutations.test.ts src/features/undo/api/useUndoActions.test.ts`

Expected: PASS.

Commit: `✨ add owner hooks for sidebar actions`

### Task 2: Reduce BranchSidebar to branch composition

**Files:**
- Create: `src/features/branch/hooks/useSidebarData.ts`
- Create: `src/features/branch/hooks/useSidebarActions.ts`
- Create: `src/features/branch/hooks/useSidebarActions.test.tsx`
- Create: `src/features/branch/components/BranchSidebarSections.tsx`
- Modify: `src/features/branch/components/BranchSidebar.tsx`
- Modify: `src/features/branch/index.ts`
- Modify: `src/components/Shell.tsx`
- Modify: `src/test/BranchSidebarTags.test.tsx`
- Modify: `src/test/architectureBoundaries.test.ts`

**Interfaces:**
- `useSidebarData(repoPath)` returns branch, remote, status, stash, and tag query results by composing owner query hooks.
- `useSidebarActions({ repoPath, stashes, closeStashPanel })` returns tag, stash, merge, rebase, and undo action callbacks without exposing `invokeCommand`.
- `BranchSidebarSections` receives display data and callbacks; it does not import IPC, stores, or another feature.

- [ ] **Step 1: Write failing tests for action ownership.** Extend the stash-panel coverage first: render `StashDiffView` through the sidebar/Shell seam and assert apply, pop, and drop invoke the supplied handler exactly once; assert drop's undo callback invokes the undo hook and refreshes stashes. Add a hook test that checkout/push tag now use tag hooks rather than direct IPC in `BranchSidebar`.

- [ ] **Step 2: Run focused tests and verify failure.**

Run: `pnpm vitest run src/test/BranchSidebarTags.test.tsx src/features/branch/hooks/useSidebarActions.test.tsx`

Expected: FAIL because the extracted sidebar hooks and handler coverage do not exist.

- [ ] **Step 3: Extract data and action orchestration.** Replace the four inline `useQuery` calls with `useRemotes`, `useStashes`, `useTags`, and a repository-status hook in the owning feature. Replace direct tag, merge, rebase, and undo commands with Task 1 hooks. Keep confirmation text, error mapping, toast content, selected stash lifecycle, and dialog payloads unchanged.

- [ ] **Step 4: Extract sections without widening props.** Move the local/remote/tag/stash markup to `BranchSidebarSections`; retain the union dialog render guards in `BranchSidebar`; have `Shell` place `StashDiffView` without receiving a bundle of sidebar-owned action callbacks.

- [ ] **Step 5: Remove stale architecture exceptions.** Delete the `BranchSidebar` IPC exception. Remove its stash cross-feature exception only if the final file has no stash import; otherwise preserve it with its existing explicit exit condition. Update the staleness assertions to match the actual imports.

- [ ] **Step 6: Prove and verify.** Temporarily call `checkoutTag` directly in `BranchSidebar` and remove the undo refresh; confirm the boundary and focused tests fail, restore the code, then run:

Run: `pnpm vitest run src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx src/test/architectureBoundaries.test.ts`

Expected: PASS.

Commit: `♻️ split branch sidebar responsibilities`

### Task 3: Create the history feature and move CommitGraph

**Files:**
- Create: `src/features/history/api/useCommitGraph.ts`
- Create: `src/features/history/api/useRepoStatus.ts`
- Create: `src/features/history/model/graphPresentation.ts`
- Create: `src/features/history/model/graphDialog.ts`
- Create: `src/features/history/model/graphPresentation.test.ts`
- Create: `src/features/history/components/CommitGraph.tsx`
- Create: `src/features/history/components/CommitGraphHeader.tsx`
- Create: `src/features/history/components/CommitGraphRows.tsx`
- Create: `src/features/history/index.ts`
- Modify: `src/components/Shell.tsx`
- Modify: `src/test/CommitGraph.test.tsx`
- Modify: `src/test/CommitGraphContextMenu.test.tsx`

**Interfaces:**
- `useCommitGraph(repoPath)` owns the existing infinite query with `PAGE_SIZE = 50` and the same next-page calculation.
- `getBranchPillStyle(name, isHead, isTag)` and `getMaxGraphColumns(commits)` are pure model functions.
- `GraphDialog` is a discriminated union for create-tag, create-branch, cherry-pick, revert, interactive-rebase, compare, and closed states.

- [ ] **Step 1: Write failing model tests.** Test deterministic branch palette selection, HEAD/tag precedence, and maximum-column calculation with both commit columns and line columns. Test graph dialog transitions so opening one action replaces the previous action.

- [ ] **Step 2: Run model tests and verify failure.**

Run: `pnpm vitest run src/features/history/model/graphPresentation.test.ts`

Expected: FAIL because the history models do not exist.

- [ ] **Step 3: Move graph query and pure models.** Implement the two query hooks with existing `qk` keys and enabled conditions. Move only pure style/derivation code into `model/`; do not alter graph row sizing, virtualizer configuration, selection behaviour, or toast behaviour.

- [ ] **Step 4: Split the graph entry component.** Move the existing graph to `features/history/components/CommitGraph.tsx`, extract its header and virtualized rows, and replace independent modal flags with `GraphDialog`. Keep modal components and their input values unchanged. Re-export `CommitGraph` from the feature index and update `Shell` and existing tests to import the public entry.

- [ ] **Step 5: Prove and verify.** Change `PAGE_SIZE` to `51` and remove the HEAD branch-style branch; confirm the new/affected tests fail, restore the implementation, then run:

Run: `pnpm vitest run src/features/history/model/graphPresentation.test.ts src/test/CommitGraph.test.tsx src/test/CommitGraphContextMenu.test.tsx`

Expected: PASS.

Commit: `♻️ move commit graph into history feature`

### Task 4: Move CommitDetailPanel into history

**Files:**
- Create: `src/features/history/api/useCommitDetails.ts`
- Create: `src/features/history/model/commitDetails.ts`
- Create: `src/features/history/model/commitDetails.test.ts`
- Create: `src/features/history/hooks/useCommitFileNavigation.ts`
- Create: `src/features/history/hooks/useCommitFileNavigation.test.tsx`
- Create: `src/features/history/components/CommitDetailPanel.tsx`
- Create: `src/features/history/components/CommitFileList.tsx`
- Create: `src/features/history/components/CommitMetadata.tsx`
- Modify: `src/features/history/index.ts`
- Modify: `src/components/Shell.tsx`
- Modify: `src/components/inspector/FileHistoryView.tsx`
- Modify: `src/components/inspector/BlameView.tsx`
- Modify: `src/test/CommitDetailPanel.test.tsx`

**Interfaces:**
- `useCommitDetails(repoPath, commitId)` preserves `qk.commitDetails(repoPath, commitId)` and returns the existing details query.
- `parseCommitMessage`, `getAuthorAvatarStyle`, `getAuthorInitials`, `formatExactDateTime`, `splitFilePath`, and `getFileStatusMeta` remain exported model functions for inspector callers.
- `useCommitFileNavigation(files, selectedFilePath, setSelectedFile)` returns `filteredFiles`, `selectedFile`, `hasPrev`, `hasNext`, `selectPrevious`, and `selectNext`.

- [ ] **Step 1: Write failing model and navigation tests.** Cover conventional and non-conventional messages, every file-status category, filter matching, the first-file selection, and disabled previous/next navigation at either end.

- [ ] **Step 2: Run focused tests and verify failure.**

Run: `pnpm vitest run src/features/history/model/commitDetails.test.ts src/features/history/hooks/useCommitFileNavigation.test.tsx`

Expected: FAIL because the extracted modules do not exist.

- [ ] **Step 3: Extract the details query, models, and navigation hook.** Keep exact fallback strings and date formatting. Preserve the selected-file store update when details arrive and keep the persisted width key `git-vista:commit-detail-files-width` unchanged.

- [ ] **Step 4: Split and migrate the entry component.** Move the panel to history, extract file-list and metadata displays, re-export all existing inspector-consumed model functions through the history feature, and change `Shell`, `FileHistoryView`, `BlameView`, and tests to use the new public seam.

- [ ] **Step 5: Prove and verify.** Temporarily reverse next-file navigation and remove renamed-file metadata; confirm focused tests fail, restore the implementation, then run:

Run: `pnpm vitest run src/features/history/model/commitDetails.test.ts src/features/history/hooks/useCommitFileNavigation.test.tsx src/test/CommitDetailPanel.test.tsx`

Expected: PASS.

Commit: `♻️ move commit detail into history feature`

### Task 5: Extract Git behavior state from Settings UI

**Files:**
- Create: `src/features/settings/hooks/useGitBehaviorSettings.ts`
- Create: `src/features/settings/hooks/useGitBehaviorSettings.test.tsx`
- Create: `src/features/settings/components/GitBehaviorTab.tsx`
- Create: `src/features/settings/components/GitBehaviorScopeBanner.tsx`
- Create: `src/features/settings/components/GitBehaviorOptions.tsx`
- Create: `src/features/settings/index.ts`
- Modify: `src/components/settings/SettingsModal.tsx`
- Modify: `src/test/SettingsTabs.test.tsx`

**Interfaces:**
- `useGitBehaviorSettings({ currentRepoPath, scope })` returns the existing config values, `loading`, `saving`, and handlers for global pull strategy, repository pull strategy, fetch prune, rebase autostash, and auto-fetch interval.
- The hook retains `gitvista_autofetch_interval`, the current global/local config commands, and current toast/error behaviour.

- [ ] **Step 1: Write failing hook tests.** Mock global and local config results; assert repository values override globals when present, inherit clears `pull.rebase`, saving resets after both success and failure, and auto-fetch persists the selected interval.

- [ ] **Step 2: Run the hook test and verify failure.**

Run: `pnpm vitest run src/features/settings/hooks/useGitBehaviorSettings.test.tsx`

Expected: FAIL because the feature hook does not exist.

- [ ] **Step 3: Implement the hook and display modules.** Move the asynchronous loading/saving implementation intact, then move the scope banner and options markup to focused components. Do not move scope ownership out of `SettingsModal`; it still supplies `scope` and `currentRepoPath`.

- [ ] **Step 4: Migrate the SettingsModal import.** Replace its direct tab import with `GitBehaviorTab` from `features/settings`; delete the old tab only after all callers and tests use the public feature entry.

- [ ] **Step 5: Prove and verify.** Temporarily skip the local override assignment and remove the `finally` saving reset; confirm tests fail, restore the code, then run:

Run: `pnpm vitest run src/features/settings/hooks/useGitBehaviorSettings.test.tsx src/test/SettingsTabs.test.tsx`

Expected: PASS.

Commit: `♻️ move git behavior settings into feature`

### Task 6: Extract the welcome repository flow

**Files:**
- Create: `src/features/welcome/hooks/useRecentRepositories.ts`
- Create: `src/features/welcome/hooks/useWelcomeShortcuts.ts`
- Create: `src/features/welcome/model/recentRepositories.ts`
- Create: `src/features/welcome/model/recentRepositories.test.ts`
- Create: `src/features/welcome/components/WelcomeScreen.tsx`
- Create: `src/features/welcome/components/RecentRepositoryList.tsx`
- Create: `src/features/welcome/components/WelcomeActions.tsx`
- Create: `src/features/welcome/index.ts`
- Modify: `src/App.tsx`
- Modify: `src/test/WelcomeScreen.test.tsx`

**Interfaces:**
- `sortRecentRepositories(repositories, pinnedPaths, searchQuery)` returns the existing filtered, pinned-first, most-recent-first list without mutating input.
- `useRecentRepositories(onSelectRepo)` owns opening, clearing, removing, pinning, copying, and invalidating recent repositories.
- `useWelcomeShortcuts({ openFolder, openClone, focusSearch, clearSearch })` owns the existing Ctrl/Cmd shortcuts and input Escape behaviour.

- [ ] **Step 1: Write failing model tests.** Assert case-insensitive name/path search, pinned entries before unpinned entries, descending `last_opened_at_ms`, and input-array immutability.

- [ ] **Step 2: Run model tests and verify failure.**

Run: `pnpm vitest run src/features/welcome/model/recentRepositories.test.ts`

Expected: FAIL because the welcome model does not exist.

- [ ] **Step 3: Extract welcome hooks and displays.** Preserve the `gitvista_pinned_repos` persistence key, error messages, recent-repository query key, clone modal flow, keyboard shortcuts, and dropped-folder behaviour. Make the public `WelcomeScreen` retain the existing `onSelectRepo: (repo: RepoSummary) => void` interface.

- [ ] **Step 4: Migrate App and tests.** Import `WelcomeScreen` from `features/welcome`, delete the old entry only when no source import remains, and keep existing component assertions unchanged.

- [ ] **Step 5: Prove and verify.** Temporarily sort pinned items last and remove recent-query invalidation after a delete; confirm the model/component tests fail, restore code, then run:

Run: `pnpm vitest run src/features/welcome/model/recentRepositories.test.ts src/test/WelcomeScreen.test.tsx src/test/App.test.tsx`

Expected: PASS.

Commit: `♻️ move welcome flow into feature`

### Task 7: Close the phase and record measured outcomes

**Files:**
- Modify: `src/test/architectureBoundaries.test.ts`
- Modify: `docs/superpowers/REFACTOR_STATUS.md`

- [ ] **Step 1: Measure target entry modules.** Run `Get-Content <file> | Measure-Object -Line` for the five target entries and record the exact values in the status handover.

- [ ] **Step 2: Reconcile architecture guards.** Assert no removed exception remains, no new exception was introduced, and every remaining exception names a real runtime import with an explicit removal condition.

- [ ] **Step 3: Run focused architecture verification.**

Run: `pnpm vitest run src/test/architectureBoundaries.test.ts && pnpm check-query-keys && pnpm check-comment-language`

Expected: PASS.

- [ ] **Step 4: Run full verification.**

Run: `pnpm lint && pnpm build && pnpm test && cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings && cargo test --manifest-path src-tauri/Cargo.toml`

Expected: all commands exit 0.

- [ ] **Step 5: Commit the status handover.**

Commit: `📝 record Phase 5b refactor status`
