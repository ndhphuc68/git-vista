# Visual Interactive Rebase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 2.0.1: Visual Interactive Rebase, providing a clean, 2-column modal with drag-and-drop/up-down commit reordering, Pick/Reword/Squash/Fixup/Drop actions, inline commit message editor, real-time live preview of resulting commits, and 3-layer safety (autoStash, safety backup ref with 1-click Undo, and conflict handling).

**Architecture:** A hybrid execution engine. Backend uses `git2::Repository::revwalk` to read commits between base and HEAD in chronological order, and executes `git rebase -i` via `GIT_SEQUENCE_EDITOR` pointing to a prepared custom todo list with `exec git commit --amend` for rewords/squashes. Frontend features a focused 2-column modal with live timeline preview, keyboard/drag controls, and entry points on CommitGraph context menu and Command Palette.

**Tech Stack:** Rust (libgit2 0.21, tauri 2, tauri-specta), React 19, TypeScript, Tailwind CSS, Lucide Icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-18-visual-interactive-rebase-design.md`

## Global Constraints
- Gitmoji commit format: `<emoji> <short description>` without Conventional Commit prefixes.
- 100% bilingual parity between Vietnamese (`vi.ts`) and English (`en.ts`).
- Verification gate: `cargo test`, `pnpm vitest run`, and `pnpm build` must pass with 0 errors.
- Never use unsupported props on `<Transition>` (use only `show`, `children`, `duration`, `enterClass`, `exitClass`).

---

### Task 1: Backend Rust Read, Exec & IPC Commands + Integration Tests

**Files:**
- Create: `src-tauri/src/read/rebase.rs`
- Create: `src-tauri/src/exec/rebase.rs`
- Create: `src-tauri/src/commands/rebase.rs`
- Create: `src-tauri/tests/interactive_rebase_test.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Modify: `src-tauri/src/exec/mod.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces:
  - `pub struct RebaseCommitItem`
  - `pub enum RebaseActionKind` (`Pick`, `Reword`, `Squash`, `Fixup`, `Drop`)
  - `pub struct RebasePlanStep`
  - `pub struct InteractiveRebaseResult`
  - `pub fn get_rebase_commits(repo: &Repository, base_commit_id: &str) -> Result<Vec<RebaseCommitItem>, AppError>`
  - `pub fn execute_interactive_rebase(repo_path: &Path, base_commit_id: &str, steps: Vec<RebasePlanStep>, auto_stash: bool) -> Result<InteractiveRebaseResult, AppError>`
  - Tauri commands: `get_rebase_commits`, `execute_interactive_rebase`

- [ ] **Step 1: Write integration tests in `src-tauri/tests/interactive_rebase_test.rs`**
  Cover:
  1. `test_get_rebase_commits_ordering`
  2. `test_interactive_rebase_reorder_and_drop`
  3. `test_interactive_rebase_reword`
  4. `test_interactive_rebase_squash_fixup`
  5. `test_interactive_rebase_safety_backup_and_undo`

- [ ] **Step 2: Implement `src-tauri/src/read/rebase.rs` and export in `read/mod.rs`**
  Implement `RebaseCommitItem`, `RebaseActionKind`, `RebasePlanStep`, `InteractiveRebaseResult`, and `get_rebase_commits` using `revwalk(base..HEAD)` with `Sort::TOPOLOGICAL | Sort::TIME | Sort::REVERSE`.

- [ ] **Step 3: Implement `src-tauri/src/exec/rebase.rs` and export in `exec/mod.rs`**
  Implement `execute_interactive_rebase`:
  - Working tree dirtiness check against `auto_stash`.
  - Safety backup ref creation (`refs/gitui-backup/interactive-rebase-...`) and `create_undo_token`.
  - Generate customized `git-rebase-todo` into temporary file using POSIX path.
  - Spawn `git rebase -i <base>` with `GIT_SEQUENCE_EDITOR="cp '<todo_file>'"` and `GIT_EDITOR="true"`.
  - Parse exit code and output for `Success`, `Conflict`, and `Error`.

- [ ] **Step 4: Expose IPC commands in `src-tauri/src/commands/rebase.rs` and register in `src-tauri/src/lib.rs`**
  Register commands with Specta builder and emit `repo-changed` event upon execution.

- [ ] **Step 5: Run cargo test to verify**
  Run: `cargo test --test interactive_rebase_test`
  Expected: All 5 tests PASS.

- [ ] **Step 6: Commit Task 1**
  Run:
  `git add src-tauri/src/read/rebase.rs src-tauri/src/read/mod.rs src-tauri/src/exec/rebase.rs src-tauri/src/exec/mod.rs src-tauri/src/commands/rebase.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs src-tauri/tests/interactive_rebase_test.rs`
  `git commit -m "✨ add visual interactive rebase backend and tests"`

---

### Task 2: Frontend IPC Client, Bindings & Bilingual i18n + Tests

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Create: `src/test/ipcInteractiveRebase.test.ts`

**Interfaces:**
- Produces:
  - TypeScript types: `RebaseCommitItem`, `RebaseActionKind`, `RebasePlanStep`, `InteractiveRebaseResult`
  - Client functions: `getRebaseCommits(baseCommitId: string): Promise<RebaseCommitItem[]>`, `executeInteractiveRebase(baseCommitId: string, steps: RebasePlanStep[], autoStash?: boolean): Promise<InteractiveRebaseResult>`
  - i18n keys: `modals.interactiveRebase.*` and `graph.interactiveRebaseHere`

- [ ] **Step 1: Update `src/ipc/bindings.ts`**
  Add TypeScript interfaces corresponding to Rust structs.

- [ ] **Step 2: Update `src/ipc/client.ts`**
  Implement `getRebaseCommits` and `executeInteractiveRebase` with realistic browser mock implementations and reset helpers.

- [ ] **Step 3: Update `src/i18n/vi.ts` and `src/i18n/en.ts`**
  Add 100% bilingual keys for:
  - Modal title, subtitle with base commit info
  - Action labels & descriptions (`Pick`, `Reword`, `Squash`, `Fixup`, `Drop`)
  - Live Preview labels (projected commits, squashed count, dropped count, timeline preview)
  - Footer actions (autostash checkbox, reset button, cancel, start rebase)
  - Success/Conflict/Error toast messages and Undo button label
  - Context menu item `t.graph.interactiveRebaseHere`

- [ ] **Step 4: Write unit test in `src/test/ipcInteractiveRebase.test.ts`**
  Test `getRebaseCommits` and `executeInteractiveRebase` browser mocks, error cases, and payload shapes.

- [ ] **Step 5: Run vitest to verify**
  Run: `pnpm vitest run src/test/ipcInteractiveRebase.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit Task 2**
  Run:
  `git add src/ipc/bindings.ts src/ipc/client.ts src/i18n/vi.ts src/i18n/en.ts src/test/ipcInteractiveRebase.test.ts`
  `git commit -m "✨ add interactive rebase ipc client and i18n support"`

---

### Task 3: Frontend UI Components (RebaseCommitRow, RebaseLivePreview, InteractiveRebaseModal)

**Files:**
- Create: `src/components/rebase/RebaseCommitRow.tsx`
- Create: `src/components/rebase/RebaseLivePreview.tsx`
- Create: `src/components/rebase/InteractiveRebaseModal.tsx`
- Create: `src/components/rebase/index.ts`
- Create: `src/test/InteractiveRebaseModal.test.tsx`

**Interfaces:**
- Produces:
  - `<InteractiveRebaseModal isOpen={boolean} baseCommitId={string} baseCommitSummary={string} onClose={() => void} onRebaseSuccess={() => void} />`
  - Re-exported from `src/components/rebase/index.ts`

- [ ] **Step 1: Create `RebaseCommitRow.tsx`**
  Renders drag handle, up/down arrow buttons, index number, author avatar, SHA badge, original summary. Action selector dropdown/pill group (`Pick`, `Reword`, `Squash`, `Fixup`, `Drop`). Validation: disables `Squash` & `Fixup` if index === 0. Accordion textarea for new commit message when `action === "Reword" || action === "Squash"`.

- [ ] **Step 2: Create `RebaseLivePreview.tsx`**
  Renders live preview: summary badges (resulting commits, squashes, drops), and projected linear timeline of commits with updated summaries and crossed-out dropped commits.

- [ ] **Step 3: Create `InteractiveRebaseModal.tsx`**
  2-column layout:
  - Left: list of `RebaseCommitRow` components with up/down reordering functions and action handlers.
  - Right: `RebaseLivePreview` with real-time calculated projection.
  - Footer: auto-stash checkbox, Reset button, Cancel button, Start Rebase button with loading spinner.
  - Uses `<Transition show={isOpen} duration={150}>`.

- [ ] **Step 4: Create `src/components/rebase/index.ts`**
  Re-export `InteractiveRebaseModal`.

- [ ] **Step 5: Write unit tests in `src/test/InteractiveRebaseModal.test.tsx`**
  Test:
  1. Renders commits and controls correctly.
  2. Reordering via Up/Down buttons moves items.
  3. Selecting `Reword` opens textarea and updates step state.
  4. First commit has `Squash` disabled.
  5. Live preview metrics update correctly.
  6. Submitting calls `executeInteractiveRebase` and triggers success callback.

- [ ] **Step 6: Run vitest to verify**
  Run: `pnpm vitest run src/test/InteractiveRebaseModal.test.tsx`
  Expected: All tests PASS.

- [ ] **Step 7: Commit Task 3**
  Run:
  `git add src/components/rebase/ src/test/InteractiveRebaseModal.test.tsx`
  `git commit -m "💄 add interactive rebase modal and live preview components"`

---

### Task 4: Integration with CommitGraph, Context Menus & Command Palette

**Files:**
- Modify: `src/components/graph/CommitGraph.tsx`
- Modify: `src/utils/commandRegistry.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: In `CommitGraph.tsx`, add context menu item & mount modal**
  Add *"Interactive Rebase từ commit này..."* (`t.graph.interactiveRebaseHere`) to commit context menu.
  When clicked, set `rebaseBaseCommit` state and open `InteractiveRebaseModal`.
  On success: show toast with 10-second Undo button calling `undoCommitAction`.

- [ ] **Step 2: In `commandRegistry.ts` and `App.tsx`, wire Command Palette**
  Add command `git-interactive-rebase` ("Git: Interactive Rebase") to open modal using current HEAD's parent or upstream base.

- [ ] **Step 3: Run full frontend test suite**
  Run: `pnpm vitest run`
  Expected: 66/66 test files pass, 335+ tests pass.

- [ ] **Step 4: Run production build check**
  Run: `pnpm build`
  Expected: Clean build with 0 TypeScript/bundling errors.

- [ ] **Step 5: Commit Task 4**
  Run:
  `git add src/components/graph/CommitGraph.tsx src/utils/commandRegistry.ts src/App.tsx`
  `git commit -m "✨ integrate visual interactive rebase in graph and command palette"`

---

### Task 5: End-to-End Verification & Roadmap Status Update

**Files:**
- Modify: `docs/ROADMAP_STATUS.md`

- [ ] **Step 1: Run all Rust tests**
  Run: `cargo test` in `src-tauri` (all suites must pass).

- [ ] **Step 2: Run all frontend tests**
  Run: `pnpm vitest run` (all suites must pass).

- [ ] **Step 3: Run production build**
  Run: `pnpm build` (clean 0 errors).

- [ ] **Step 4: Update `docs/ROADMAP_STATUS.md`**
  Mark Phase 2.0.1 as 100% completed, update test counts, and set next step to Phase 2.0.2.

- [ ] **Step 5: Commit Task 5**
  Run:
  `git add docs/ROADMAP_STATUS.md`
  `git commit -m "📝 update roadmap status to mark visual interactive rebase complete"`
