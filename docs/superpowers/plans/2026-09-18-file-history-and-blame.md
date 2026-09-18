# File History & Git Blame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement line-by-line Git Blame and chronological File History with an interactive slide-over File Inspector Drawer in GitVista.

**Architecture:** The Rust backend (`git2`) provides `get_file_blame` (using `repo.blame_file`, UTF-8 blob lines, and commit lookups) and `get_file_history` (using revwalk with tree entry OID comparisons for fast file mutation detection). The frontend provides a Zustand `useInspectorStore`, a slide-over `FileInspectorDrawer` with tabs for `[Git Blame]` (author avatar, short SHA, commit summary tooltip, line grouping) and `[File History]` (commit list + embedded `FileDiffViewer`), integrated into `FileDiffViewer`, `CommitDetailPanel`, and `StagingFileList`.

**Tech Stack:** Rust (`git2`, `specta`, `serde`), TypeScript, React 19, Zustand, Tailwind CSS v4, Lucide icons, Vitest, React Query.

**Spec:** [2026-09-18-file-history-and-blame-design.md](file:///c:/Users/PhucNDH/Desktop/PhucNDH/git-vista/docs/superpowers/specs/2026-09-18-file-history-and-blame-design.md)

## Global Constraints

- Use Gitmoji for new commit messages: `<emoji> <short description>` without Conventional Commit prefixes (`feat:`, `fix:`) and without parenthesized scopes.
- Maintain 100% bilingual parity between `src/i18n/vi.ts` and `src/i18n/en.ts`.
- All backend tests (`cargo test`) must pass with zero failures.
- All frontend tests (`pnpm vitest run`) must pass with zero failures.
- Zero TypeScript and Vite production build errors (`pnpm build`).

---

## File Structure

- **Backend Rust:**
  - Create: `src-tauri/src/read/blame.rs` (implements `get_file_blame`, `BlameLine`, `FileBlameResult`)
  - Create: `src-tauri/src/read/file_history.rs` (implements `get_file_history`, `FileHistoryItem`, `FileHistoryResult`)
  - Modify: `src-tauri/src/read/mod.rs` (export `blame` and `file_history` modules)
  - Modify: `src-tauri/src/commands/repo.rs` (add `get_file_blame` & `get_file_history` Specta commands)
  - Modify: `src-tauri/src/lib.rs` (register commands in `create_specta_builder`)
  - Create: `src-tauri/tests/blame_and_history_test.rs` (integration tests for blame and history)
- **Frontend IPC & Types:**
  - Modify: `src/ipc/bindings.ts` (export `BlameLine`, `FileBlameResult`, `FileHistoryItem`, `FileHistoryResult`)
  - Modify: `src/ipc/client.ts` (add `getFileBlame`, `getFileHistory`, with mock handlers for dev)
  - Create: `src/test/ipcBlameHistory.test.ts` (client unit tests)
- **Frontend State & Components:**
  - Create: `src/store/useInspectorStore.ts` (Zustand store for inspector state)
  - Create: `src/components/inspector/BlameView.tsx` (renders line-by-line blame with author gutter and hover tooltips)
  - Create: `src/components/inspector/FileHistoryView.tsx` (renders two-pane commit list and diff viewer)
  - Create: `src/components/inspector/FileInspectorDrawer.tsx` (slide-over drawer container with backdrop and tabs)
  - Modify: `src/components/Shell.tsx` (mount `FileInspectorDrawer` in history view)
  - Modify: `src/App.tsx` (mount `FileInspectorDrawer` globally across views)
  - Modify: `src/i18n/vi.ts` & `src/i18n/en.ts` (inspector translations)
  - Create: `src/test/FileInspector.test.tsx` (unit tests for drawer, blame view, and history view)
- **Entry Points:**
  - Modify: `src/components/diff/FileDiffViewer.tsx` (toolbar buttons for Blame and History)
  - Modify: `src/components/diff/CommitDetailPanel.tsx` (file item action buttons for Blame and History)
  - Modify: `src/components/changes/StagingFileList.tsx` (file item action buttons for Blame and History)
  - Create: `src/test/FileInspectorEntryPoints.test.tsx` (integration tests for opening inspector)
- **Roadmap & Documentation:**
  - Modify: `docs/ROADMAP_STATUS.md` (mark Phase 1.2.2 complete)

---

### Task 1: Backend Rust `read/blame.rs` & `read/file_history.rs` Engine

**Files:**
- Create: `src-tauri/src/read/blame.rs`
- Create: `src-tauri/src/read/file_history.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Create: `src-tauri/tests/blame_and_history_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `git2::BlameOptions`, `git2::Sort`, `git2::Oid`
- Produces:
  - `pub fn get_file_blame<P: AsRef<Path>>(repo_path: P, file_path: &str, commit_id: Option<&str>) -> Result<FileBlameResult, AppError>`
  - `pub fn get_file_history<P: AsRef<Path>>(repo_path: P, file_path: &str, offset: Option<u32>, limit: Option<u32>) -> Result<FileHistoryResult, AppError>`

- [ ] **Step 1: Write the failing backend integration tests**
  Create `src-tauri/tests/blame_and_history_test.rs` initializing a temp Git repo, committing multiple files across authors and verifying blame lines and history commit lists.

- [ ] **Step 2: Run test to verify it fails**
  Run `cargo test --test blame_and_history_test`
  Expected: FAIL with missing modules `read::blame` and `read::file_history`.

- [ ] **Step 3: Implement `src-tauri/src/read/blame.rs`**
  Implement `get_file_blame` extracting blame hunks, UTF-8 text lines, author details, `is_hunk_start`, and commit summaries.

- [ ] **Step 4: Implement `src-tauri/src/read/file_history.rs`**
  Implement `get_file_history` using `revwalk`, checking path tree entries against parents, classifying `change_type` (`"added"`, `"modified"`, `"deleted"`), and handling pagination.

- [ ] **Step 5: Export modules in `src-tauri/src/read/mod.rs`**
  Add `pub mod blame;` and `pub mod file_history;` and export their types and functions.

- [ ] **Step 6: Run tests to verify they pass**
  Run `cargo test --test blame_and_history_test`
  Expected: PASS

- [ ] **Step 7: Commit**
  ```bash
  git add src-tauri/src/read/blame.rs src-tauri/src/read/file_history.rs src-tauri/src/read/mod.rs src-tauri/tests/blame_and_history_test.rs
  git commit -m "✨ add blame and file history backend read engine"
  ```

---

### Task 2: Backend IPC Commands & Specta Integration

**Files:**
- Modify: `src-tauri/src/commands/repo.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `read::blame::*`, `read::file_history::*`
- Produces:
  - `#[tauri::command] #[specta::specta] pub fn get_file_blame(...) -> Result<FileBlameResult, AppError>`
  - `#[tauri::command] #[specta::specta] pub fn get_file_history(...) -> Result<FileHistoryResult, AppError>`

- [ ] **Step 1: Add commands to `src-tauri/src/commands/repo.rs`**
  Expose `get_file_blame` and `get_file_history` with proper parameter forwarding and error handling.

- [ ] **Step 2: Register commands in `src-tauri/src/lib.rs`**
  Add `get_file_blame` and `get_file_history` to `collect_commands!` in `create_specta_builder()`.

- [ ] **Step 3: Verify with `cargo test`**
  Run `cargo test` to ensure all 30 test suites compile and pass.

- [ ] **Step 4: Commit**
  ```bash
  git add src-tauri/src/commands/repo.rs src-tauri/src/lib.rs
  git commit -m "✨ expose get_file_blame and get_file_history commands"
  ```

---

### Task 3: Frontend IPC Bindings & Client Mocks

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Create: `src/test/ipcBlameHistory.test.ts`

**Interfaces:**
- Consumes: Tauri invoke and mock state
- Produces:
  - `invokeCommand.getFileBlame(repoPath, filePath, commitId?)`
  - `invokeCommand.getFileHistory(repoPath, filePath, offset?, limit?)`
  - `t.inspector.*` translation keys

- [ ] **Step 1: Write failing client mock test**
  Create `src/test/ipcBlameHistory.test.ts` testing `getFileBlame` and `getFileHistory` calls and fallback responses.

- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm vitest run src/test/ipcBlameHistory.test.ts`
  Expected: FAIL with `getFileBlame` not a function.

- [ ] **Step 3: Define types in `src/ipc/bindings.ts`**
  Add `BlameLine`, `FileBlameResult`, `FileHistoryItem`, `FileHistoryResult`.

- [ ] **Step 4: Implement client methods in `src/ipc/client.ts`**
  Add `getFileBlame` and `getFileHistory` to `invokeCommand` with browser dev mock generators.

- [ ] **Step 5: Add i18n keys to `src/i18n/vi.ts` and `src/i18n/en.ts`**
  Add `t.inspector` namespace with keys for tabs, loading, copy path, and commit history labels.

- [ ] **Step 6: Run test to verify it passes**
  Run `pnpm vitest run src/test/ipcBlameHistory.test.ts`
  Expected: PASS

- [ ] **Step 7: Commit**
  ```bash
  git add src/ipc/bindings.ts src/ipc/client.ts src/i18n/vi.ts src/i18n/en.ts src/test/ipcBlameHistory.test.ts
  git commit -m "✨ add blame and file history ipc bindings client and i18n"
  ```

---

### Task 4: Frontend State & Inspector Components (`useInspectorStore`, `BlameView`, `FileHistoryView`, `FileInspectorDrawer`)

**Files:**
- Create: `src/store/useInspectorStore.ts`
- Create: `src/components/inspector/BlameView.tsx`
- Create: `src/components/inspector/FileHistoryView.tsx`
- Create: `src/components/inspector/FileInspectorDrawer.tsx`
- Modify: `src/App.tsx`
- Create: `src/test/FileInspector.test.tsx`

**Interfaces:**
- Consumes: `useInspectorStore`, `invokeCommand.getFileBlame`, `invokeCommand.getFileHistory`, `FileDiffViewer`
- Produces:
  - `<FileInspectorDrawer />` slide-over component.

- [ ] **Step 1: Write failing component tests in `src/test/FileInspector.test.tsx`**
  Test opening drawer, switching tabs, rendering blame lines with avatars, rendering history list, and clicking commit.

- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm vitest run src/test/FileInspector.test.tsx`
  Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/store/useInspectorStore.ts`**
  Create Zustand store with `isOpen`, `filePath`, `commitId`, `activeTab`, `openInspector`, `closeInspector`, `setActiveTab`.

- [ ] **Step 4: Implement `src/components/inspector/BlameView.tsx`**
  Build table layout with author avatar badge, author name, short SHA, commit summary tooltip, line number gutter, and monospace code view.

- [ ] **Step 5: Implement `src/components/inspector/FileHistoryView.tsx`**
  Build split view with commit history list (search filter, status badge, author info, selection) on the left and `FileDiffViewer` on the right.

- [ ] **Step 6: Implement `src/components/inspector/FileInspectorDrawer.tsx`**
  Build slide-over drawer with backdrop, header tabs, copy path button, escape key listener, and active view switcher.

- [ ] **Step 7: Mount `FileInspectorDrawer` in `src/App.tsx`**
  Ensure the drawer is mounted and visible when `isOpen` is true in `useInspectorStore`.

- [ ] **Step 8: Run test to verify it passes**
  Run `pnpm vitest run src/test/FileInspector.test.tsx`
  Expected: PASS

- [ ] **Step 9: Commit**
  ```bash
  git add src/store/useInspectorStore.ts src/components/inspector/BlameView.tsx src/components/inspector/FileHistoryView.tsx src/components/inspector/FileInspectorDrawer.tsx src/App.tsx src/test/FileInspector.test.tsx
  git commit -m "✨ implement file inspector drawer with git blame and file history"
  ```

---

### Task 5: Entry Points & Triggers Integration

**Files:**
- Modify: `src/components/diff/FileDiffViewer.tsx`
- Modify: `src/components/diff/CommitDetailPanel.tsx`
- Modify: `src/components/changes/StagingFileList.tsx`
- Create: `src/test/FileInspectorEntryPoints.test.tsx`

**Interfaces:**
- Consumes: `useInspectorStore`
- Produces: Interactive buttons launching Git Blame and File History.

- [ ] **Step 1: Write failing entry points test in `src/test/FileInspectorEntryPoints.test.tsx`**
  Verify clicking the Blame and History buttons in `FileDiffViewer` and `CommitDetailPanel` triggers `openInspector` with proper parameters.

- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm vitest run src/test/FileInspectorEntryPoints.test.tsx`
  Expected: FAIL (buttons not present).

- [ ] **Step 3: Update `src/components/diff/FileDiffViewer.tsx`**
  Add `<FileText size={13} />` (Blame) and `<History size={13} />` (File History) buttons to the toolbar with localized tooltips.

- [ ] **Step 4: Update `src/components/diff/CommitDetailPanel.tsx`**
  Add quick action icons next to file items in the changed files list to open Blame and File History.

- [ ] **Step 5: Update `src/components/changes/StagingFileList.tsx`**
  Add quick action icons on hover for tracked files to open Blame and File History.

- [ ] **Step 6: Run test to verify it passes**
  Run `pnpm vitest run src/test/FileInspectorEntryPoints.test.tsx`
  Expected: PASS

- [ ] **Step 7: Commit**
  ```bash
  git add src/components/diff/FileDiffViewer.tsx src/components/diff/CommitDetailPanel.tsx src/components/changes/StagingFileList.tsx src/test/FileInspectorEntryPoints.test.tsx
  git commit -m "✨ add blame and history entry points across diff viewers and file lists"
  ```

---

### Task 6: Verification, Roadmap Documentation & Clean Build

**Files:**
- Modify: `docs/ROADMAP_STATUS.md`

- [ ] **Step 1: Run full backend test suite**
  Run `cargo test` in `src-tauri` and verify 100% tests pass.

- [ ] **Step 2: Run full frontend test suite**
  Run `pnpm vitest run` and verify all test files pass.

- [ ] **Step 3: Run production build check**
  Run `pnpm build` and verify 0 TypeScript errors and 0 build warnings.

- [ ] **Step 4: Update `docs/ROADMAP_STATUS.md`**
  Mark Phase 1.2.2 as 100% complete, update progress statistics, and designate Phase 1.2.3 as next.

- [ ] **Step 5: Commit**
  ```bash
  git add docs/ROADMAP_STATUS.md
  git commit -m "📝 update roadmap status to mark file history and git blame complete"
  ```
