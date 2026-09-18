# Compare 2 Commits / 2 Branches Implementation Plan

- **Date:** 2026-09-18
- **Spec:** docs/superpowers/specs/2026-09-18-compare-commits-branches-design.md
- **Status:** In Progress

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a comprehensive visual comparison interface to compare any pair of commits, branches, or tags with both Merge-Base (`A...B`) and Direct (`A..B`) diff semantics, commit range log, changed files list, and interactive word-level diff viewer.

**Architecture:** Rust backend using `git2` (`merge_base`, `revwalk`, `diff_tree_to_tree`) exposed via Specta IPC commands; React frontend with a 2-column maximized dialog (`CompareModal`), revision comboboxes with swap (`⇄`), multi-select on `CommitGraph` (Ctrl/Cmd + click), context menus on graph and branch sidebar, and Command Palette integration.

**Tech Stack:** Tauri v2, Rust 1.80+ (`git2`, `specta`, `serde`), React 19, TypeScript, TanStack Query, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-18-compare-commits-branches-design.md`

## Global Constraints
- Commit messages MUST use Gitmoji: `<emoji> <short description>` without scope parentheses or conventional commit prefixes.
- Zero TypeScript errors (`pnpm tsc --noEmit`).
- 100% bilingual parity (Vietnamese & English) across all UI elements and notifications.
- All mockable IPC methods in `src/ipc/client.ts` must have web fallbacks and reset helpers.
- Avoid React infinite render loops: use constant empty collections (`EMPTY_COMMITS = []`, `EMPTY_FILES = []`) outside component scopes.

---

### Task 1: Backend Rust Read, Diff & IPC Commands + Integration Tests

**Files:**
- Create: `src-tauri/src/read/compare.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Create: `src-tauri/src/commands/compare.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/tests/compare_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub enum CompareMode { MergeBase, Direct }
  pub struct CompareCommitItem { pub id: String, pub short_id: String, pub summary: String, pub author_name: String, pub author_email: String, pub timestamp: i64, pub parent_ids: Vec<String> }
  pub struct CompareFileItem { pub path: String, pub old_path: Option<String>, pub status: String, pub additions: usize, pub deletions: usize, pub is_binary: bool }
  pub struct CompareSummary { pub base_rev: String, pub target_rev: String, pub resolved_base_oid: String, pub resolved_target_oid: String, pub effective_base_oid: String, pub merge_base_oid: Option<String>, pub mode: CompareMode, pub ahead_count: usize, pub behind_count: usize, pub commits: Vec<CompareCommitItem>, pub files: Vec<CompareFileItem>, pub total_additions: usize, pub total_deletions: usize }
  pub fn get_compare_summary(repo_path: &str, base_rev: &str, target_rev: &str, mode: CompareMode) -> Result<CompareSummary, GitUiError>;
  pub fn get_compare_file_diff(repo_path: &str, base_rev: &str, target_rev: &str, file_path: &str, mode: CompareMode) -> Result<FileDiffDetail, GitUiError>;
  ```

- [ ] **Step 1: Write integration tests in `src-tauri/tests/compare_test.rs`**
  Cover `test_compare_commits_direct_mode`, `test_compare_commits_merge_base_mode`, `test_compare_identical_revisions`, and `test_compare_file_diff`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `cargo test --test compare_test`
  Expected: FAIL with module not found or missing functions.

- [ ] **Step 3: Implement `src-tauri/src/read/compare.rs` and export in `read/mod.rs`**
  Implement `resolve_rev`, `get_compare_summary`, and `get_compare_file_diff`.

- [ ] **Step 4: Expose IPC commands in `src-tauri/src/commands/compare.rs` and register in `src-tauri/src/lib.rs`**
  Register `compare_commits` and `get_compare_file_diff` with Specta builder.

- [ ] **Step 5: Run integration tests to verify they pass**
  Run: `cargo test --test compare_test`
  Expected: 4/4 tests pass.

- [ ] **Step 6: Commit**
  ```bash
  git add src-tauri/src/read/ src-tauri/src/commands/ src-tauri/src/lib.rs src-tauri/tests/compare_test.rs
  git commit -m "✨ add compare commits and branches backend and tests"
  ```

---

### Task 2: Frontend IPC Client, Bindings & Bilingual i18n + Tests

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Test: `src/test/ipcCompare.test.ts`

**Interfaces:**
- Consumes: `CompareMode`, `CompareCommitItem`, `CompareFileItem`, `CompareSummary` from Rust.
- Produces:
  ```ts
  invokeCommand.compareCommits(repoPath: string, baseRev: string, targetRev: string, mode: CompareMode): Promise<CompareSummary>
  invokeCommand.getCompareFileDiff(repoPath: string, baseRev: string, targetRev: string, filePath: string, mode: CompareMode): Promise<FileDiffDetail>
  ```

- [ ] **Step 1: Write unit tests in `src/test/ipcCompare.test.ts`**
  Verify mock fallback for `compareCommits` and `getCompareFileDiff`, check bilingual dictionary keys (`vi.compare` and `en.compare`).

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm vitest run src/test/ipcCompare.test.ts`
  Expected: FAIL with `compareCommits` undefined.

- [ ] **Step 3: Update `src/ipc/bindings.ts` and `src/ipc/client.ts`**
  Export types and add mock implementations with reset helper.

- [ ] **Step 4: Add bilingual translations to `src/i18n/vi.ts` and `src/i18n/en.ts`**
  Add keys for `compare.*`, `graph.compareWith`, `branch.compareWithCurrent`, `palette.commands.gitCompare*`.

- [ ] **Step 5: Run test to verify it passes**
  Run: `pnpm vitest run src/test/ipcCompare.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/ipc/ src/i18n/ src/test/ipcCompare.test.ts
  git commit -m "✨ add compare commits ipc client and i18n support"
  ```

---

### Task 3: Frontend UI Components (`CompareModal`, `CompareHeader`, `CompareCommitList`, `CompareFileList`) + Tests

**Files:**
- Create: `src/components/compare/CompareHeader.tsx`
- Create: `src/components/compare/CompareCommitList.tsx`
- Create: `src/components/compare/CompareFileList.tsx`
- Create: `src/components/compare/CompareModal.tsx`
- Create: `src/components/compare/index.ts`
- Test: `src/test/CompareModal.test.tsx`

**Interfaces:**
- Produces:
  ```tsx
  export interface CompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    repoPath?: string;
    initialBaseRev?: string;
    initialTargetRev?: string;
    initialMode?: CompareMode;
  }
  export const CompareModal: React.FC<CompareModalProps>;
  ```

- [ ] **Step 1: Create `CompareHeader.tsx`**
  Renders base combobox, target combobox, swap button (`⇄`), and mode switch (`MergeBase` vs `Direct`).

- [ ] **Step 2: Create `CompareCommitList.tsx`**
  Renders list of commits in range with author, timestamp, short SHA, and commit message.

- [ ] **Step 3: Create `CompareFileList.tsx`**
  Renders list of changed files with search input, status badge (`A`, `M`, `D`, `R`), and addition/deletion numbers.

- [ ] **Step 4: Create `CompareModal.tsx` and `index.ts`**
  Assembles 2-column layout with split diff viewer using static empty array references to prevent any infinite loops.

- [ ] **Step 5: Write unit tests in `src/test/CompareModal.test.tsx`**
  Test initial render, switching between Commits and Files tabs, swapping base and target, and mode toggling.

- [ ] **Step 6: Run test to verify it passes quickly**
  Run: `pnpm vitest run src/test/CompareModal.test.tsx`
  Expected: PASS in < 1.5s.

- [ ] **Step 7: Commit**
  ```bash
  git add src/components/compare/ src/test/CompareModal.test.tsx
  git commit -m "💄 add compare modal and comparison subcomponents"
  ```

---

### Task 4: Integration with CommitGraph, BranchSidebar, and Command Palette

**Files:**
- Modify: `src/components/graph/CommitGraph.tsx`
- Modify: `src/components/sidebar/BranchSidebar.tsx`
- Modify: `src/utils/commandRegistry.ts`
- Modify: `src/App.tsx`
- Test: `src/test/commandRegistry.test.ts`

- [ ] **Step 1: Add multi-select (Ctrl/Cmd + click) and context menu item in `CommitGraph.tsx`**
  - Track selected commit pair (`compareBase`, `compareTarget`).
  - Add context menu item: *"So sánh với..."* (`t.graph.compareWith`).
  - Mount `<CompareModal />`.

- [ ] **Step 2: Add branch context menu item in `BranchSidebar.tsx`**
  - Add *"So sánh với nhánh hiện tại ({head})..."* (`t.branch.compareWithCurrent`).
  - Open `CompareModal` with `initialBase = head`, `initialTarget = selectedBranch`.

- [ ] **Step 3: Register Command Palette item in `commandRegistry.ts` & wire `App.tsx`**
  - Add `git-compare` command.
  - Update `commandRegistry.test.ts`.

- [ ] **Step 4: Verify type safety and build**
  Run: `pnpm tsc --noEmit && pnpm build`
  Expected: 0 errors.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/graph/CommitGraph.tsx src/components/sidebar/BranchSidebar.tsx src/utils/commandRegistry.ts src/App.tsx src/test/commandRegistry.test.ts
  git commit -m "✨ integrate compare modal in graph, branch sidebar, and command palette"
  ```

---

### Task 5: End-to-End Verification & Roadmap Status Update

**Files:**
- Modify: `docs/ROADMAP_STATUS.md`

- [ ] **Step 1: Run all Rust tests**
  Run: `cargo test`
  Expected: All test suites pass.

- [ ] **Step 2: Run all frontend tests**
  Run: `pnpm vitest run`
  Expected: 100% test files pass.

- [ ] **Step 3: Run production build check**
  Run: `pnpm build`
  Expected: Clean build.

- [ ] **Step 4: Update `docs/ROADMAP_STATUS.md`**
  Mark Phase 2.0.2 as 100% complete and update test statistics.

- [ ] **Step 5: Commit**
  ```bash
  git add docs/ROADMAP_STATUS.md
  git commit -m "📝 update roadmap status to mark compare commits and branches complete"
  ```
