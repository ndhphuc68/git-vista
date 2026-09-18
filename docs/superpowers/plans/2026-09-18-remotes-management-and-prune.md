# Remotes Management & Prune Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full Remote Repository Management (List, Add, Edit/Rename, Set URLs, Delete) and Remote Pruning ("Dọn dẹp nhánh mồ côi" via `git remote prune`) with detailed reporting and reactive UI updates.

**Architecture:** Rust backend leverages `git2::Repository` for remote CRUD and streaming git CLI for prune execution. Frontend provides a modern `ManageRemotesModal` with sub-modals for Add/Edit, Prune confirmation, and Delete confirmation, integrated seamlessly into `BranchSidebar.tsx` and the Command Palette.

**Tech Stack:** Rust (`git2`, `specta`, `tauri`), React 19, TypeScript, Tailwind CSS, `@tanstack/react-query`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-18-remotes-management-and-prune-design.md`

## Global Constraints

- Gitmoji commit format strictly enforced: `<emoji> <short description>` (e.g. `✨ add remote management backend`). No prefixes like `feat:` or scopes like `(sidebar)`.
- 100% bilingual parity between `src/i18n/vi.ts` and `src/i18n/en.ts`.
- Zero compiler or lint errors (`pnpm build`, `cargo test`).

---

### Task 1: Backend Rust Remote Read & Write Modules + Tests

**Files:**
- Create: `src-tauri/src/read/remote.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Create: `src-tauri/src/write/remote.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Modify: `src-tauri/src/exec/remote.rs`
- Modify: `src-tauri/src/commands/remote.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/tests/remote_management_test.rs`

**Interfaces:**
- Produces:
  - `RemoteItem { name: String, fetch_url: Option<String>, push_url: Option<String>, branch_count: u32, is_default: bool }`
  - `PruneResult { remote: String, pruned_branches: Vec<String>, message: String }`
  - `commands::remote::get_remotes(repo_path: String) -> Result<Vec<RemoteItem>, AppError>`
  - `commands::remote::add_remote(app: AppHandle, repo_path: String, name: String, url: String) -> Result<RemoteItem, AppError>`
  - `commands::remote::rename_remote(app: AppHandle, repo_path: String, old_name: String, new_name: String) -> Result<(), AppError>`
  - `commands::remote::remove_remote(app: AppHandle, repo_path: String, name: String) -> Result<(), AppError>`
  - `commands::remote::set_remote_url(app: AppHandle, repo_path: String, name: String, fetch_url: String, push_url: Option<String>) -> Result<(), AppError>`
  - `commands::remote::prune_remote(app: AppHandle, repo_path: String, remote: String, task_id: Option<String>) -> Result<PruneResult, AppError>`

- [ ] **Step 1: Write integration test in `src-tauri/tests/remote_management_test.rs`**
- [ ] **Step 2: Implement `src-tauri/src/read/remote.rs` and expose in `read/mod.rs`**
- [ ] **Step 3: Implement `src-tauri/src/write/remote.rs` and expose in `write/mod.rs`**
- [ ] **Step 4: Implement `prune_remote` in `src-tauri/src/exec/remote.rs`**
- [ ] **Step 5: Expose IPC commands in `src-tauri/src/commands/remote.rs` and register in `src-tauri/src/lib.rs`**
- [ ] **Step 6: Run `cargo test --test remote_management_test` and verify it passes**
- [ ] **Step 7: Commit with Gitmoji: `✨ add remote management backend and prune command`**

---

### Task 2: Frontend IPC Client, Bindings & Bilingual i18n + Tests

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Test: `src/test/ipcRemoteManagement.test.ts`

**Interfaces:**
- Consumes: Backend IPC command signatures
- Produces: `invokeCommand.getRemotes`, `addRemote`, `renameRemote`, `removeRemote`, `setRemoteUrl`, `pruneRemote`

- [ ] **Step 1: Add `RemoteItem` and `PruneResult` interfaces to `src/ipc/bindings.ts`**
- [ ] **Step 2: Add client functions with browser mock fallbacks in `src/ipc/client.ts`**
- [ ] **Step 3: Add comprehensive i18n dictionaries to `src/i18n/vi.ts` and `src/i18n/en.ts`**
- [ ] **Step 4: Write unit test in `src/test/ipcRemoteManagement.test.ts`**
- [ ] **Step 5: Run `pnpm vitest run src/test/ipcRemoteManagement.test.ts` and verify it passes**
- [ ] **Step 6: Commit with Gitmoji: `✨ add remote management ipc client and i18n support`**

---

### Task 3: Frontend UI Modals (ManageRemotesModal, AddEditRemoteModal, PruneConfirmModal)

**Files:**
- Create: `src/components/remote/ManageRemotesModal.tsx`
- Create: `src/components/remote/AddEditRemoteModal.tsx`
- Create: `src/components/remote/PruneConfirmModal.tsx`
- Create: `src/components/remote/DeleteRemoteModal.tsx`
- Create: `src/components/remote/index.ts`
- Test: `src/test/ManageRemotesModal.test.tsx`

**Interfaces:**
- Consumes: `useRepoStore`, `useQuery(["remotes", repoPath])`, `useMutation`, `useToastStore`, `t.remotes`
- Produces: Exported modal components ready to be mounted or opened

- [ ] **Step 1: Create `AddEditRemoteModal.tsx` with validation and loading states**
- [ ] **Step 2: Create `PruneConfirmModal.tsx` and `DeleteRemoteModal.tsx`**
- [ ] **Step 3: Create `ManageRemotesModal.tsx` listing remotes with action buttons**
- [ ] **Step 4: Create `src/components/remote/index.ts` re-exporting modals**
- [ ] **Step 5: Write unit tests in `src/test/ManageRemotesModal.test.tsx`**
- [ ] **Step 6: Run `pnpm vitest run src/test/ManageRemotesModal.test.tsx` and verify it passes**
- [ ] **Step 7: Commit with Gitmoji: `💄 add remotes management and prune modals`**

---

### Task 4: Integration with BranchSidebar, Context Menus & Command Palette

**Files:**
- Modify: `src/components/sidebar/BranchSidebar.tsx`
- Modify: `src/components/command-palette/CommandPalette.tsx`
- Modify: `src/App.tsx` (mount `ManageRemotesModal`)

**Interfaces:**
- Connects sidebar REMOTES header and remote tree folder context menus to opening `ManageRemotesModal` or direct `PruneConfirmModal` / `AddEditRemoteModal`.

- [ ] **Step 1: In `BranchSidebar.tsx`, add manage button and add button in REMOTES section header**
- [ ] **Step 2: In `BranchSidebar.tsx`, add context menu actions on remote folders (Prune, Edit, Delete)**
- [ ] **Step 3: Add Command Palette actions for "Manage Remotes" and "Prune Remotes"**
- [ ] **Step 4: Run full frontend test suite: `pnpm vitest run`**
- [ ] **Step 5: Run production build: `pnpm build`**
- [ ] **Step 6: Commit with Gitmoji: `✨ integrate remotes management in sidebar and command palette`**

---

### Task 5: End-to-End Verification & Roadmap Status Update

**Files:**
- Modify: `docs/ROADMAP_STATUS.md`

- [ ] **Step 1: Run all Rust backend tests: `cargo test`**
- [ ] **Step 2: Run all frontend tests: `pnpm vitest run`**
- [ ] **Step 3: Run frontend build: `pnpm build`**
- [ ] **Step 4: Update `docs/ROADMAP_STATUS.md` marking Phase 1.2.3 completed and Phase 1.2 at 100%**
- [ ] **Step 5: Commit with Gitmoji: `📝 update roadmap status to mark remotes management and prune complete`**
