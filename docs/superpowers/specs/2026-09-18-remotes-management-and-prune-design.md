# Design Specification: Remotes Management & Prune (Phase 1.2.3)

- **Date:** 2026-09-18
- **Phase:** 1.2.3 (Deep Git Workflows)
- **Status:** Approved for Implementation Planning

---

## 1. Overview & Goals

As projects grow and collaborate with multiple upstream repositories, forks, or origin servers, developers need:
1. **Remote Repository Management:** Viewing, adding, renaming, updating URLs (fetch/push), and safely removing remote configurations.
2. **Remote Pruning ("Dọn dẹp nhánh mồ côi"):** Cleaning up stale remote-tracking branches (`refs/remotes/<remote>/*`) that have been deleted on the remote server, keeping the branch tree clutter-free.
3. **Feedback & Safety:** Detailed confirmation before pruning or deleting, accompanied by granular reporting of pruned branch names and real-time tree cache invalidation.

---

## 2. Architecture & Component Interaction

```
┌────────────────────────────────────────────────────────────────────────┐
│                             React Frontend                             │
│                                                                        │
│  [BranchSidebar.tsx]                                [CommandPalette]   │
│   ├── REMOTES Header ⚙️ (Manage) / + (Add)                   │          │
│   └── Per-remote folder (origin) 3-dots:                    │          │
│        ├── Prune Stale Branches                             │          │
│        ├── Edit Remote                                      │          │
│        └── Delete Remote                                    │          │
│                    │                                        │          │
│                    ▼                                        ▼          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    ManageRemotesModal.tsx                        │  │
│  │  - Lists all remotes (Badge, Fetch/Push URLs, Branch count)       │  │
│  │  - Actions per remote: [Prune] [Edit] [Delete]                   │  │
│  │  - Top Action: [+ Add Remote]                                    │  │
│  │                                                                  │  │
│  │  Sub-modals:                                                     │  │
│  │  - AddEditRemoteModal: Name, Fetch URL, Push URL                 │  │
│  │  - PruneConfirmModal: Explanatory warning & confirmation         │  │
│  │  - DeleteRemoteModal: Confirmation before removal                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [useRepoStore / React Query] ── auto invalidated on "repo-changed"    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Rust Backend                              │
│                                                                        │
│  commands::remote                                                      │
│   ├── get_remotes()           ──> read::remote::get_remotes            │
│   ├── add_remote()            ──> write::remote::add_remote            │
│   ├── rename_remote()         ──> write::remote::rename_remote         │
│   ├── remove_remote()         ──> write::remote::remove_remote         │
│   ├── set_remote_url()        ──> write::remote::set_remote_url        │
│   └── prune_remote()          ──> exec::remote::prune_remote           │
│                                   (runs `git remote prune <name>`,     │
│                                    parses pruned refs, emits progress  │
│                                    and repo-changed)                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models & Rust Backend Design

### 3.1 Data Structures (`src-tauri/src/read/remote.rs` & `bindings.ts`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemoteItem {
    pub name: String,
    pub fetch_url: Option<String>,
    pub push_url: Option<String>,
    pub branch_count: u32,
    pub is_default: bool, // true if name == "origin" or is only remote
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PruneResult {
    pub remote: String,
    pub pruned_branches: Vec<String>,
    pub message: String,
}
```

### 3.2 Reading Remotes (`src-tauri/src/read/remote.rs`)
- Uses `git2::Repository::remotes()`.
- For each remote name:
  - Calls `repo.find_remote(&name)`.
  - Extracts `remote.url()` and `remote.pushurl()`.
  - Computes `branch_count` by scanning `repo.branches(Some(BranchType::Remote))` where branch shorthand starts with `<name>/`.
  - Flags `is_default` if `name == "origin"` or it is the only remote.

### 3.3 Writing Remotes (`src-tauri/src/write/remote.rs`)
- **`add_remote(repo_path, name, url)`**:
  - Validates operand (`validate_git_operand(name, "remote")`).
  - Calls `repo.remote(name, url)`.
- **`rename_remote(repo_path, old_name, new_name)`**:
  - Validates operands.
  - Calls `repo.remote_rename(old_name, new_name)`.
- **`remove_remote(repo_path, name)`**:
  - Validates operand.
  - Calls `repo.remote_delete(name)`.
- **`set_remote_url(repo_path, name, fetch_url, push_url)`**:
  - Validates operand.
  - Calls `repo.remote_set_url(name, fetch_url)`.
  - If `push_url` is provided: `repo.remote_set_pushurl(name, push_url.as_deref())`.

### 3.4 Executing Prune (`src-tauri/src/exec/remote.rs`)
- Validates remote operand.
- Executes `git remote prune <remote>` via `run_git_streaming_command` or CLI execution.
- Parses stdout/stderr:
  - Looks for lines matching `* [pruned] <remote>/<branch_name>`.
  - Collects pruned branch names into `pruned_branches: Vec<String>`.
- Emits `repo-changed` with reason `"prune"` so frontend React Query caches immediately refresh.

---

## 4. Frontend Architecture

### 4.1 IPC Client & Bindings (`src/ipc/`)
- Export `RemoteItem` and `PruneResult` interfaces in `bindings.ts`.
- Implement client wrapper functions in `src/ipc/client.ts`:
  - `getRemotes(repoPath: string): Promise<RemoteItem[]>`
  - `addRemote(repoPath: string, name: string, url: string): Promise<RemoteItem>`
  - `renameRemote(repoPath: string, oldName: string, newName: string): Promise<void>`
  - `removeRemote(repoPath: string, name: string): Promise<void>`
  - `setRemoteUrl(repoPath: string, name: string, fetchUrl: string, pushUrl?: string): Promise<void>`
  - `pruneRemote(repoPath: string, remote: string): Promise<PruneResult>`
- Include comprehensive web mock handlers for all methods.

### 4.2 UI Components
1. **`ManageRemotesModal.tsx`**:
   - Modern Windows 11 Fluent styled modal (`max-w-2xl`).
   - Header with title, close button, and "+ Thêm Remote" button.
   - List of remotes:
     - Remote Name with `Cloud` icon and `origin` default tag.
     - Fetch URL & Push URL with copy-to-clipboard icons.
     - Branch count tag (e.g., `8 branches`).
     - Action toolbar per remote:
       - **Dọn dẹp (Prune)**: Primary prune trigger.
       - **Sửa (Edit)**: Opens edit modal.
       - **Xoá (Delete)**: Opens delete confirmation.
   - Empty state when no remotes are configured.
2. **`AddEditRemoteModal.tsx`**:
   - Modal for adding or editing a remote.
   - Inputs:
     - Remote name (e.g. `origin`, `upstream`).
     - Fetch URL (e.g. `https://github.com/org/repo.git` or SSH `git@github.com:...`).
     - Push URL (optional checkbox "Sử dụng URL khác cho Push", defaults to same as Fetch URL).
   - Real-time validation (non-empty, valid name format, URL format).
3. **`PruneConfirmModal.tsx`**:
   - Explanatory modal describing that stale remote tracking branches will be pruned without touching local branch commits.
   - "Dọn dẹp ngay" action button with spinner.
4. **Integration in `BranchSidebar.tsx`**:
   - In "REMOTES" header:
     - Add Settings icon button (`Settings2` or `Sliders`) with tooltip "Quản lý máy chủ từ xa..." (Manage Remotes).
     - Add `+` button with tooltip "Thêm máy chủ từ xa..." (Add Remote).
   - In Remote folder tree node:
     - Context menu / 3-dots dropdown:
       - "Dọn dẹp nhánh mồ côi (Prune)..."
       - "Chỉnh sửa Remote..."
       - "Xoá Remote..."

### 4.3 Bilingual i18n (`src/i18n/vi.ts` & `src/i18n/en.ts`)
- 100% bilingual parity for:
  - `sidebar.manageRemotes`, `sidebar.addRemote`, `sidebar.pruneRemote`
  - `remotes.title`, `remotes.addTitle`, `remotes.editTitle`, `remotes.deleteTitle`, `remotes.pruneTitle`
  - Form field labels: `remotes.name`, `remotes.fetchUrl`, `remotes.pushUrl`, `remotes.useSeparatePushUrl`
  - Confirmation messages, warnings, success toasts, and prune summary toasts.

---

## 5. Verification & Testing Strategy

1. **Rust Integration Tests (`tests/remote_management_test.rs`):**
   - Test adding, renaming, setting URLs, and deleting remotes.
   - Test pruning: create bare remote, create branch, delete branch on remote, run prune, verify tracking branch is removed and reported.
2. **Frontend Unit Tests (`src/test/ipcRemoteManagement.test.ts`):**
   - Verify IPC client calls, mock returns, error handling.
3. **End-to-End Build & Lint Verification:**
   - Run `cargo test`.
   - Run `pnpm vitest run`.
   - Run `pnpm build`.
