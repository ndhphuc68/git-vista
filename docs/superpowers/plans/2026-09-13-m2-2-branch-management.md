# Milestone M2.2: Branch Management & Global Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Milestone M2.2 by implementing full in-process Git branch management (create, safe checkout, rename, delete with safety backup refs and merge verification) and global keyboard navigation shortcuts.

**Architecture:** Rust backend (`src-tauri/src/write/branch.rs`) executes all branch mutations in-process via `libgit2` with backup refs under `refs/gitui-backup/` and safe checkout conflict detection; React frontend (`BranchSidebar`, dedicated modals, `useGlobalShortcuts`) provides context menus, modals, and hotkeys (`Cmd/Ctrl+1..2`, `Cmd/Ctrl+B`) with zero Git state stored in frontend.

**Tech Stack:** Tauri 2, Rust (`git2 = "0.20"`, `tauri-specta`), React 19, TypeScript, `@tanstack/react-query`, Zustand, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-13-m2-2-branch-management-design.md` & `docs/superpowers/specs/2026-09-12-visual-git-client-design.md`.

## Global Constraints

- Strictly read-only in `src-tauri/src/read/`.
- All writes in `src-tauri/src/write/` execute 100% in-process via `libgit2`.
- Deleting a branch MUST create a backup reference in `refs/gitui-backup/delete-branch-<name>-<timestamp>` before deleting.
- Deleting HEAD branch MUST be rejected.
- Deleting unmerged branch MUST require explicit confirmation (`force = true`).
- Checkout MUST use `CheckoutBuilder::safe()` to protect uncommitted files from being overwritten.
- All modals and buttons MUST satisfy WCAG AA $\ge 4.5:1$ contrast ratio.
- 100% tests passing in `cargo test` and `pnpm test`.

---

### Task 1: Rust Backend Branch Operations: Create & Safe Checkout (`src-tauri/src/write/branch.rs`)

**Files:**
- Create: `src-tauri/src/write/branch.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Test: `src-tauri/tests/m2_branch_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn create_branch<P: AsRef<Path>>(
      repo_path: P,
      name: &str,
      target_commit_id: Option<&str>,
      checkout: bool,
  ) -> Result<(), AppError>;

  pub fn checkout_branch<P: AsRef<Path>>(
      repo_path: P,
      branch_name: &str,
  ) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write failing integration tests in `src-tauri/tests/m2_branch_test.rs`**
  Create `src-tauri/tests/m2_branch_test.rs` with:
  - `test_create_branch_without_checkout`: Creates new branch, confirms it exists in `repo.branches()`, confirms HEAD is still old branch.
  - `test_create_branch_with_checkout`: Creates new branch with `checkout = true`, confirms HEAD points to new branch.
  - `test_safe_checkout_clean_and_conflict`:
    - Clean checkout between branches succeeds.
    - Dirty file without conflict: file modified on branch A, switches to branch B where file wasn't modified, checkout succeeds with file intact.
    - Dirty file with conflict: file modified on disk, branch B modified same file, checkout fails with `CHECKOUT_CONFLICT`.

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m2_branch_test`
  Expected: FAIL with "unresolved import `visual_git_lib::write::branch`"

- [ ] **Step 3: Implement `create_branch` and `checkout_branch` in `src-tauri/src/write/branch.rs`**
  - Implement branch name validation: `git2::Reference::is_valid_name(&format!("refs/heads/{}", name))` and non-empty check.
  - `create_branch`: Resolve target commit (either `target_commit_id` OID or `repo.head()?.peel_to_commit()?`). Call `repo.branch(name, &commit, false)?`. If `checkout == true`, call `checkout_branch`.
  - `checkout_branch`:
    - Find branch: `repo.find_branch(branch_name, git2::BranchType::Local)?`.
    - Peel to tree: `let tree = branch.get().peel_to_tree()?;`.
    - Run `let mut opts = git2::build::CheckoutBuilder::new(); opts.safe();`.
    - Run `repo.checkout_tree(tree.as_object(), Some(&mut opts))`. If it returns conflict error, format error message as `CHECKOUT_CONFLICT: [details]`.
    - Update HEAD: `repo.set_head(&format!("refs/heads/{}", branch_name))?`.
  - Export `pub mod branch;` in `src-tauri/src/write/mod.rs`.

- [ ] **Step 4: Run test to confirm it passes**
  Run: `cargo test --test m2_branch_test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/write/branch.rs src-tauri/src/write/mod.rs src-tauri/tests/m2_branch_test.rs
  git commit -m "feat(m2.2): implement create_branch and safe checkout_branch in Rust backend"
  ```

---

### Task 2: Rust Backend Branch Operations: Rename & Safe Delete with Backup Ref (`src-tauri/src/write/branch.rs`)

**Files:**
- Modify: `src-tauri/src/write/branch.rs`
- Modify: `src-tauri/tests/m2_branch_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn rename_branch<P: AsRef<Path>>(
      repo_path: P,
      old_name: &str,
      new_name: &str,
  ) -> Result<(), AppError>;

  pub fn delete_branch<P: AsRef<Path>>(
      repo_path: P,
      branch_name: &str,
      force: bool,
  ) -> Result<String, AppError>;
  ```

- [ ] **Step 1: Write failing tests in `src-tauri/tests/m2_branch_test.rs`**
  Add:
  - `test_rename_branch`: Creates a branch, renames it, checks that old branch is gone and new branch exists with same target.
  - `test_delete_head_branch_forbidden`: Attempts to delete current HEAD branch, verifies error `Không thể xoá nhánh đang được chọn (HEAD)`.
  - `test_delete_merged_branch`: Creates branch at HEAD, deletes it with `force = false`, succeeds and returns backup ref name.
  - `test_delete_unmerged_branch_requires_force`: Creates branch, commits to it, switches to master. Deleting with `force = false` fails with `UNMERGED_BRANCH`. Deleting with `force = true` succeeds, returns backup ref, and backup ref can be resolved to the commit.

- [ ] **Step 2: Run test to confirm failure**
  Run: `cargo test --test m2_branch_test test_rename_branch`
  Expected: FAIL with "no function `rename_branch`"

- [ ] **Step 3: Implement `rename_branch` and `delete_branch`**
  - `rename_branch`: Validate `new_name`. Find local branch `old_name`. Call `branch.rename(new_name, false)?`.
  - `delete_branch`:
    - Check if `branch_name` matches current HEAD shorthand: return `AppError::InvalidOperation("Không thể xoá nhánh đang được chọn (HEAD)".into())`.
    - Find branch: `let mut branch = repo.find_branch(branch_name, git2::BranchType::Local)?;`.
    - Check if merged:
      `let head_commit = repo.head()?.peel_to_commit()?;`
      `let branch_commit = branch.get().peel_to_commit()?;`
      `let is_merged = head_commit.id() == branch_commit.id() || repo.graph_descendant_of(head_commit.id(), branch_commit.id()).unwrap_or(false);`
      If `!is_merged && !force`, return `AppError::InvalidOperation("UNMERGED_BRANCH".into())`.
    - Create backup ref before deleting:
      `let backup_ref = create_backup_ref(&repo_path, &format!("delete-branch-{}", branch_name))?;`
    - Delete branch: `branch.delete()?;`.
    - Return `Ok(backup_ref)`.

- [ ] **Step 4: Run tests to confirm they pass**
  Run: `cargo test --test m2_branch_test`
  Expected: PASS (all 6 integration tests)

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/write/branch.rs src-tauri/tests/m2_branch_test.rs
  git commit -m "feat(m2.2): implement rename_branch and delete_branch with backup ref in Rust"
  ```

---

### Task 3: Tauri IPC Commands & Specta Registration (`src-tauri/src/commands/repo.rs`, `src-tauri/src/lib.rs`)

**Files:**
- Modify: `src-tauri/src/commands/repo.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces:
  - `create_branch(app, repo_path, name, target_commit, checkout) -> Result<(), AppError>`
  - `checkout_branch(app, repo_path, branch_name) -> Result<(), AppError>`
  - `rename_branch(app, repo_path, old_name, new_name) -> Result<(), AppError>`
  - `delete_branch(app, repo_path, branch_name, force) -> Result<String, AppError>`

- [ ] **Step 1: Implement commands in `src-tauri/src/commands/repo.rs`**
  Each command calls the corresponding `src-tauri/src/write/branch.rs` function, then calls `emit_repo_changed(&app, repo_path, action_name)`, and returns the result.

- [ ] **Step 2: Register commands in `src-tauri/src/lib.rs`**
  Add `create_branch`, `checkout_branch`, `rename_branch`, `delete_branch` to `collect_commands!`.

- [ ] **Step 3: Run `cargo check` and `cargo test` to verify compilation and tests**
  Run: `cargo test`
  Expected: PASS (100% of all Rust tests)

- [ ] **Step 4: Commit**
  ```bash
  git add src-tauri/src/commands/repo.rs src-tauri/src/lib.rs
  git commit -m "feat(m2.2): register branch IPC commands in Tauri and Specta"
  ```

---

### Task 4: Frontend IPC Client & TypeScript Bindings (`src/ipc/bindings.ts`, `src/ipc/client.ts`)

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`

**Interfaces:**
- Produces:
  ```typescript
  invokeCommand.createBranch(repoPath: string, name: string, targetCommit?: string | null, checkout?: boolean): Promise<void>;
  invokeCommand.checkoutBranch(repoPath: string, branchName: string): Promise<void>;
  invokeCommand.renameBranch(repoPath: string, oldName: string, newName: string): Promise<void>;
  invokeCommand.deleteBranch(repoPath: string, branchName: string, force?: boolean): Promise<string>;
  ```

- [ ] **Step 1: Update `src/ipc/bindings.ts` and `src/ipc/client.ts`**
  - Add typed method signatures and browser mock fallbacks with state updates in `src/ipc/client.ts`.
  - Browser mock updates simulated branch list and emits `mock-repo-changed` event.

- [ ] **Step 2: Run frontend test to verify bindings compile**
  Run: `pnpm build`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/ipc/bindings.ts src/ipc/client.ts
  git commit -m "feat(m2.2): add typed IPC client functions for branch operations"
  ```

---

### Task 5: CreateBranchModal & RenameBranchModal Components (`src/components/sidebar/`)

**Files:**
- Create: `src/components/sidebar/CreateBranchModal.tsx`
- Create: `src/components/sidebar/RenameBranchModal.tsx`
- Create: `src/test/CreateBranchModal.test.tsx`

**Interfaces:**
- Produces:
  - `<CreateBranchModal isOpen={boolean} onClose={() => void} targetCommit?: string />`
  - `<RenameBranchModal isOpen={boolean} onClose={() => void} branchName: string />`

- [ ] **Step 1: Write failing test in `src/test/CreateBranchModal.test.tsx`**
  Test validation:
  - Renders input field with default focus.
  - Automatically replaces spaces with `-`.
  - Disables submit when branch name is empty or invalid.
  - Submits valid name with `invokeCommand.createBranch`.

- [ ] **Step 2: Run test to confirm it fails**
  Run: `pnpm test src/test/CreateBranchModal.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement `CreateBranchModal.tsx` and `RenameBranchModal.tsx`**
  - Modal overlay with backdrop blur and accessible dialog roles.
  - Branch name input with slugify sanitization.
  - `CreateBranchModal` has checkbox `[x] Chuyển sang nhánh mới sau khi tạo`.
  - ESC closes modal, Enter submits.
  - Styled with CSS variables (`--bg-surface`, `--text-primary`, `--border-subtle`, `--accent`).

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test src/test/CreateBranchModal.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/sidebar/CreateBranchModal.tsx src/components/sidebar/RenameBranchModal.tsx src/test/CreateBranchModal.test.tsx
  git commit -m "feat(m2.2): implement CreateBranchModal and RenameBranchModal"
  ```

---

### Task 6: DeleteBranchModal & CheckoutConflictModal Components (`src/components/sidebar/`)

**Files:**
- Create: `src/components/sidebar/DeleteBranchModal.tsx`
- Create: `src/components/sidebar/CheckoutConflictModal.tsx`
- Create: `src/test/DeleteBranchModal.test.tsx`

**Interfaces:**
- Produces:
  - `<DeleteBranchModal isOpen={boolean} onClose={() => void} branchName: string isMerged?: boolean />`
  - `<CheckoutConflictModal isOpen={boolean} onClose={() => void} conflictingFiles: string[] onNavigateToChanges: () => void />`

- [ ] **Step 1: Write failing test in `src/test/DeleteBranchModal.test.tsx`**
  Test delete confirmation:
  - Renders branch name to delete.
  - Shows warning and backup ref notice.
  - Clicking "Xoá" calls `invokeCommand.deleteBranch`.
  - If unmerged, shows warning banner and requires force confirmation.

- [ ] **Step 2: Run test to confirm it fails**
  Run: `pnpm test src/test/DeleteBranchModal.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement `DeleteBranchModal.tsx` and `CheckoutConflictModal.tsx`**
  - `DeleteBranchModal`: warning text, backup ref assurance message, force confirmation button when unmerged.
  - `CheckoutConflictModal`: lists conflicting files, has "Chuyển sang màn hình Thay đổi" button which switches activeScreen to `changes` and closes modal.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test src/test/DeleteBranchModal.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/sidebar/DeleteBranchModal.tsx src/components/sidebar/CheckoutConflictModal.tsx src/test/DeleteBranchModal.test.tsx
  git commit -m "feat(m2.2): implement DeleteBranchModal and CheckoutConflictModal"
  ```

---

### Task 7: Enhance BranchSidebar with Context Menu, Actions Menu & Modals Wiring (`src/components/sidebar/BranchSidebar.tsx`)

**Files:**
- Modify: `src/components/sidebar/BranchSidebar.tsx`
- Modify: `src/test/BranchSidebar.test.tsx`

**Interfaces:**
- Produces: Enhanced `BranchSidebar` with:
  - `+` button in local branch header to open `CreateBranchModal`.
  - Three-dots hover button & right-click context menu on each local branch item.
  - Checkout, Rename, and Delete actions wired to IPC mutations.
  - Catch `CHECKOUT_CONFLICT` and open `CheckoutConflictModal`.

- [ ] **Step 1: Write tests in `src/test/BranchSidebar.test.tsx`**
  - Verifies `+` button opens `CreateBranchModal`.
  - Verifies action menu shows Checkout, Rename, Delete.
  - Verifies Checkout action calls `checkoutBranch`.
  - Verifies Delete action opens `DeleteBranchModal`.

- [ ] **Step 2: Run test to verify failure**
  Run: `pnpm test src/test/BranchSidebar.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement enhanced `BranchSidebar.tsx`**
  - Add state for open modals: `createOpen`, `renameTarget: string | null`, `deleteTarget: { name: string, isMerged?: boolean } | null`, `conflictFiles: string[] | null`.
  - Add right-click handler (`onContextMenu`) and hover action menu button.
  - Wire TanStack Query invalidation on successful mutations.
  - Catch checkout conflict error to set `conflictFiles`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test src/test/BranchSidebar.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/sidebar/BranchSidebar.tsx src/test/BranchSidebar.test.tsx
  git commit -m "feat(m2.2): enhance BranchSidebar with context menu, actions, and modals"
  ```

---

### Task 8: Global Keyboard Shortcuts Hook & App Shell Integration (`src/hooks/useGlobalShortcuts.ts`, `src/App.tsx`)

**Files:**
- Create: `src/hooks/useGlobalShortcuts.ts`
- Modify: `src/App.tsx`
- Create: `src/test/useGlobalShortcuts.test.ts`

**Interfaces:**
- Produces:
  - `useGlobalShortcuts({ onOpenCreateBranch: () => void, onCloseModals: () => void })`
  - Wires `Cmd/Ctrl+1` (History), `Cmd/Ctrl+2` (Changes), `Cmd/Ctrl+B` (New Branch), `Escape` (Close modals).

- [ ] **Step 1: Write unit test in `src/test/useGlobalShortcuts.test.ts`**
  - Pressing `Ctrl+1` or `Cmd+1` sets screen to `history`.
  - Pressing `Ctrl+2` or `Cmd+2` sets screen to `changes`.
  - Pressing `Ctrl+B` or `Cmd+B` triggers `onOpenCreateBranch`.
  - Ignored when typing inside `input` or `textarea`.

- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm test src/test/useGlobalShortcuts.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement `useGlobalShortcuts.ts` and wire into `App.tsx`**
  - Listener on `keydown` with check for target `input`/`textarea` (except Esc which always triggers).
  - Wire into `App.tsx` so global shortcuts work seamlessly across screens.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test src/test/useGlobalShortcuts.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/hooks/useGlobalShortcuts.ts src/App.tsx src/test/useGlobalShortcuts.test.ts
  git commit -m "feat(m2.2): implement global keyboard shortcuts navigation"
  ```

---

### Task 9: Comprehensive Milestone Verification Pass

**Files:**
- Verify all codebase integrity and test coverage.

- [ ] **Step 1: Run Rust test suite**
  Run: `cargo test`
  Expected: All Rust unit and integration tests pass (100%).

- [ ] **Step 2: Run Frontend test suite**
  Run: `pnpm test`
  Expected: All Vitest frontend tests pass (100%).

- [ ] **Step 3: Run TypeScript compiler build check**
  Run: `pnpm build`
  Expected: Clean build without errors or warnings.

- [ ] **Step 4: Run Color Contrast Check**
  Run: `pnpm check-contrast`
  Expected: All UI components satisfy WCAG AA $\ge 4.5:1$.

- [ ] **Step 5: Final Milestone Commit & Summary**
  ```bash
  git commit --allow-empty -m "chore(m2.2): complete milestone M2.2 verification pass"
  ```
