# Cherry-Pick & Revert Commit Technical Specification (Phase 1.1.3)

## 1. Overview & Goals

The Cherry-Pick & Revert Commit subsystem introduces deep Git commit management into GitVista. It enables users to cleanly copy specific changes from any commit into the current branch (Cherry-Pick) or create safe inverse commits to undo erroneous changes without rewriting repository history (Revert).

### Key Goals:
- **Cherry-Pick Commit**: Apply changes of a selected commit onto the currently checked-out branch.
- **Revert Commit**: Apply inverse diff of a selected commit onto the current branch to cancel its changes cleanly.
- **Interactive Modals with Commit Info**: Display target commit hash, summary, author, relative time, and target branch.
- **Flexible Commit Strategy**: Provide an auto-commit checkbox (enabled by default) allowing users to commit immediately or stage changes without committing (`--no-commit`) for manual review in the Changes screen.
- **Undo Toast Lifecycle**: On successful auto-commit, generate safety backup receipts and display a 10-second undo toast allowing one-click rollback (`undo_commit`).
- **Conflict Handling Integration**: If conflicts occur, transition repository state to `cherry_pick` or `revert`, automatically navigate to the Changes screen, display the `InProgressOperationBanner`, and support Conflict Resolver (3-way merge) with Continue/Abort operations.
- **Context Menu Integration**: Add "Cherry-pick into current branch" and "Revert this commit" directly to commit rows in `CommitGraph`.

---

## 2. Scope & Non-Goals

### In Scope:
- **Backend (Rust & Git CLI Hybrid)**:
  - `src-tauri/src/exec/commit_actions.rs`: Core engine for `git_cherry_pick` and `git_revert` with pre-flight checks, backup ref generation, Git CLI subprocess invocation, and undo receipt generation.
  - `src-tauri/src/read/state.rs`: Enhanced `get_repo_state` to populate `target_name` when repository is in `cherry_pick` or `revert` state by reading `.git/CHERRY_PICK_HEAD`, `.git/REVERT_HEAD`, or `.git/MERGE_MSG`.
  - `src-tauri/src/commands/commit_actions.rs`: Specta-annotated IPC commands `cherry_pick_commit` and `revert_commit`.
  - Registration in `src-tauri/src/lib.rs` specta builder and export.
- **Frontend (React 19 & TypeScript)**:
  - Strongly typed IPC definitions in `src/ipc/bindings.ts` and implementation with browser mocks in `src/ipc/client.ts`.
  - `CherryPickModal.tsx`: Confirmation modal with target commit details, destination branch, auto-commit toggle, and execution trigger.
  - `RevertModal.tsx`: Confirmation modal with explanation of inverse commit, target details, auto-commit toggle, and execution trigger.
  - Context menu options in `CommitGraph.tsx` for cherry-pick and revert actions.
  - Navigation & Toast handling: Auto-navigate to Changes screen on conflict or staged mode; trigger 10-second Undo Toast on successful commit.
  - Bilingual localization in Vietnamese (`vi.ts`) and English (`en.ts`).
- **Testing**:
  - Rust integration tests in `src-tauri/tests/commit_actions_test.rs`.
  - Component tests for `CherryPickModal` and `RevertModal` in Vitest.
  - Context menu and banner integration tests in Vitest.

### Non-Goals:
- Batch cherry-picking across commit ranges (`git cherry-pick A..B` deferred to Phase 2.0).
- Automatic conflict resolution without user intervention.
- Interactive reword of commit messages during initial cherry-pick (users can amend post-commit).

---

## 3. Data Model

### 3.1 `CommitActionResult` (Rust & TypeScript)

```rust
// Rust: src-tauri/src/exec/commit_actions.rs
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct CommitActionResult {
    pub success: bool,
    pub status: String, // "Committed" | "Staged" | "Conflict" | "Error"
    pub new_commit_id: Option<String>,
    pub undo_token: Option<String>,
    pub output: String,
}
```

```typescript
// TypeScript: src/ipc/bindings.ts
export interface CommitActionResult {
  success: boolean;
  status: "Committed" | "Staged" | "Conflict" | "Error" | string;
  new_commit_id?: string | null;
  undo_token?: string | null;
  output: string;
}
```

---

## 4. Architecture & Technical Details

### 4.1 Backend Engine (`src-tauri/src/exec/commit_actions.rs`)
1. **Pre-flight Checks**:
   - Verify working repository is in a clean state: `repo.state() == git2::RepositoryState::Clean`. If dirty or in an unfinished merge/rebase, reject with `AppError::InvalidOperation`.
   - Validate target commit exists in repository using `repo.find_commit(Oid::from_str(commit_id)?)`.
   - Validate operand safety using `crate::exec::validate_git_operand(commit_id, "commit_id")`.
   - Create safety backup ref before operation: `refs/gitui-backup/cherry-pick-<timestamp>-<target_oid>` or `refs/gitui-backup/revert-<timestamp>-<target_oid>`.
2. **Git Subprocess Execution**:
   - For cherry-pick: `git cherry-pick <commit_id>` (if `auto_commit == true`) or `git cherry-pick --no-commit <commit_id>` (if `auto_commit == false`).
   - For revert: `git revert <commit_id>` (if `auto_commit == true`) or `git revert --no-commit <commit_id>` (if `auto_commit == false`).
3. **Post-execution Result Parsing**:
   - If output status is success:
     - If `auto_commit == true`:
       - Query new HEAD OID: `repo.head()?.peel_to_commit()?.id()`.
       - Create `CommitRecovery` receipt ref using `create_backup_ref` (same mechanism as `write/commit.rs`).
       - Return `CommitActionResult { success: true, status: "Committed".into(), new_commit_id: Some(id), undo_token: Some(token), output }`.
     - If `auto_commit == false`:
       - Return `CommitActionResult { success: true, status: "Staged".into(), new_commit_id: None, undo_token: None, output }`.
   - If output status is non-zero:
     - Check if output contains `CONFLICT` or `Automatic cherry-pick failed` / `could not apply`:
       - Return `CommitActionResult { success: false, status: "Conflict".into(), new_commit_id: None, undo_token: None, output }`.
     - Otherwise:
       - Return `CommitActionResult { success: false, status: "Error".into(), new_commit_id: None, undo_token: None, output }`.

### 4.2 In-Progress State Extraction (`src-tauri/src/read/state.rs`)
- Expand `get_repo_state`:
  - When `state_str == "cherry_pick"`:
    - Attempt reading `.git/CHERRY_PICK_HEAD` to resolve short commit hash, or inspect `.git/MERGE_MSG` to extract commit summary.
    - Set `target_name = Some(extracted_target)`.
  - When `state_str == "revert"`:
    - Attempt reading `.git/REVERT_HEAD` or `.git/MERGE_MSG`.
    - Set `target_name = Some(extracted_target)`.

### 4.3 Specta IPC Commands (`src-tauri/src/commands/commit_actions.rs`)
- `cherry_pick_commit(app: tauri::AppHandle, repo_path: String, commit_id: String, auto_commit: Option<bool>) -> Result<CommitActionResult, AppError>`
- `revert_commit(app: tauri::AppHandle, repo_path: String, commit_id: String, auto_commit: Option<bool>) -> Result<CommitActionResult, AppError>`
- Both commands call `emit_repo_changed(&app, &repo_path, "cherry_pick" / "revert")` upon execution.

### 4.4 Frontend Components & Modals

#### `CherryPickModal.tsx`
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `repoPath: string`
  - `targetCommit: { id: string; short_id: string; summary: string; author: string; time: string }`
  - `currentBranch: string`
  - `onSuccess: (result: CommitActionResult) => void`
- **UI Structure**:
  - Header: Aperture icon + Title "Cherry-pick Commit"
  - Commit Card: Short SHA pill, commit summary, author, and formatted date
  - Target Destination: Pill displaying `currentBranch`
  - Checkbox: "Tự động commit thay đổi (Auto-commit)" checked by default with helper description
  - Actions: Cancel button + Primary submit button with spinner state during execution

#### `RevertModal.tsx`
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `repoPath: string`
  - `targetCommit: { id: string; short_id: string; summary: string; author: string }`
  - `onSuccess: (result: CommitActionResult) => void`
- **UI Structure**:
  - Header: Alert / RotateCcw icon + Title "Hoàn tác Commit (Revert)"
  - Warning banner: Clarifying that this creates an inverse commit without modifying history
  - Commit Card: Short SHA pill, summary, author
  - Checkbox: "Tự động commit thay đổi (Auto-commit)" checked by default
  - Actions: Cancel button + Primary Revert button with spinner state

#### `CommitGraph.tsx` Context Menu Integration
- Right-click row menu additions:
  - "Cherry-pick vào nhánh <currentBranch>..." with `GitPullRequest` icon
  - "Hoàn tác (Revert) commit này..." with `RotateCcw` icon
- Clicking opens `CherryPickModal` or `RevertModal` respectively.

### 4.5 Post-Action Result Flow in Frontend
1. **If `status === "Committed"`**:
   - Invalidate React Query keys: `["commit-graph"]`, `["repo_head"]`, `["repo_status"]`, `["branches"]`.
   - Dispatch toast notification with:
     - Message: "Đã cherry-pick / revert commit <short_id> thành công."
     - Action button: "Hoàn tác (Undo)" (duration 10s).
     - Clicking "Hoàn tác" invokes `undoCommit(repoPath, undo_token)`.
2. **If `status === "Staged"`**:
   - Invalidate `["repo_status"]`.
   - Dispatch info toast: "Đã đưa thay đổi vào Staging. Hãy kiểm tra và tạo commit khi sẵn sàng."
   - Automatically navigate to Changes screen (`setActiveScreen("changes")`).
3. **If `status === "Conflict"`**:
   - Invalidate `["repo_state"]`, `["repo_status"]`.
   - Dispatch warning toast: "Phát hiện xung đột khi cherry-pick/revert. Vui lòng giải quyết các file xung đột."
   - Automatically navigate to Changes screen (`setActiveScreen("changes")`).
   - `InProgressOperationBanner` displays operation state ("Cherry-Pick" or "Revert") with Abort and Continue actions.

---

## 5. Testing & Verification Strategy

### 5.1 Backend Tests (`src-tauri/tests/commit_actions_test.rs`)
- `test_cherry_pick_auto_commit_clean`: Verifies commit created, new commit hash returned, backup ref and undo token generated.
- `test_cherry_pick_no_commit_staged`: Verifies changes placed in index/working tree without advancing HEAD.
- `test_cherry_pick_conflict_and_abort`: Verifies conflict status, in-progress state, and successful abort via `git_abort_operation`.
- `test_revert_auto_commit_clean`: Verifies inverse commit created with `Revert` summary and changes reversed.
- `test_revert_conflict`: Verifies revert conflict detection and abort clean up.

### 5.2 Frontend Unit Tests (Vitest)
- `CherryPickModal.test.tsx`: Modal renders commit details, handles auto-commit checkbox toggle, triggers IPC client, and dispatches undo toast.
- `RevertModal.test.tsx`: Modal renders target commit details, triggers revert IPC client.
- `CommitGraphContextMenu.test.tsx`: Context menu includes cherry-pick and revert actions, opening respective modals.
- `InProgressOperationBanner.test.tsx`: Validates cherry-pick and revert states, abort action, and continue action disabled while conflicted.

### 5.3 Quality Gate
- `cargo test`: 100% tests pass.
- `pnpm test`: 100% vitest pass.
- `pnpm build`: TypeScript check & Vite build clean with 0 errors.
