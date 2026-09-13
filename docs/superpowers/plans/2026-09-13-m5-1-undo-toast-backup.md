# Milestone M5.1: Hệ Thống Undo, Toast, Ref Backup An Toàn & Ánh Xạ Lỗi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống hoàn tác (Undo) an toàn kèm Toast thông báo có đồng hồ đếm lùi 10 giây, cơ chế tự động tạo ref backup (`refs/gitui-backup/`) bảo vệ dữ liệu, và công cụ ánh xạ thông điệp lỗi Git sang ngôn ngữ đời thường thân thiện.

**Architecture:** Backend sử dụng `libgit2` in-process để quản lý references backup và thực thi các thao tác undo (soft reset cho commit, restore branch từ commit OID cũ, restore file từ backup). Frontend xây dựng `useToastStore` và `ToastContainer` hiển thị các toast tương tác kèm nút Hoàn tác và mở rộng xem raw error.

**Tech Stack:** Tauri 2 (Rust + libgit2), React 19, TypeScript 5.8, Zustand 5, TanStack Query 5, Vitest, Testing Library, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-09-13-m5-1-undo-toast-backup-design.md`

## Global Constraints

- Backend: Không spawn git CLI trong `write/backup.rs` hoặc `write/undo.rs`; sử dụng `libgit2` in-process.
- Mọi thao tác undo phát event `repo-changed` để tự động làm mới TanStack Query cache.
- Toast đếm lùi 10 giây; khi bấm "Hoàn tác", toast chuyển trạng thái loading và tự đóng sau khi undo thành công.
- Không hiển thị raw stderr cho người dùng; ánh xạ sang thông điệp tiếng Việt dễ hiểu kèm nút "Xem chi tiết kỹ thuật".
- Tuân thủ nghiêm ngặt quy trình Test-Driven Development (TDD): Viết test trước, kiểm tra test fail, viết code tối thiểu, kiểm tra test pass, commit.

---

### Task 1: Backend Safety Backup Ref Engine (`src-tauri/src/write/backup.rs`)

**Files:**
- Create: `src-tauri/src/write/backup.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Test: `src-tauri/tests/m5_backup_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `git2::Oid`
- Produces:
  ```rust
  pub fn create_backup_ref(repo: &git2::Repository, action: &str, target_oid: git2::Oid) -> Result<String, crate::error::AppError>;
  pub fn prune_expired_backups(repo: &git2::Repository, max_age_days: u64) -> Result<usize, crate::error::AppError>;
  ```

- [ ] **Step 1: Write the failing integration test in `src-tauri/tests/m5_backup_test.rs`**

```rust
use visual_git_lib::write::backup::{create_backup_ref, prune_expired_backups};

fn create_test_repo() -> (tempfile::TempDir, git2::Repository, git2::Oid) {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let sig = git2::Signature::now("Tester", "test@test.com").unwrap();
    let mut index = repo.index().unwrap();
    let tree_id = index.write_tree().unwrap();
    let tree = repo.find_tree(tree_id).unwrap();
    let commit_id = repo.commit(Some("HEAD"), &sig, &sig, "init", &tree, &[]).unwrap();
    (dir, repo, commit_id)
}

#[test]
fn test_create_and_prune_backup_refs() {
    let (_dir, repo, commit_id) = create_test_repo();

    let ref_name = create_backup_ref(&repo, "delete_branch", commit_id).unwrap();
    assert!(ref_name.starts_with("refs/gitui-backup/delete_branch-"));

    let reference = repo.find_reference(&ref_name).unwrap();
    assert_eq!(reference.target().unwrap(), commit_id);

    // Prune với max_age_days = 0 (xoá tất cả)
    let pruned = prune_expired_backups(&repo, 0).unwrap();
    assert_eq!(pruned, 1);
    assert!(repo.find_reference(&ref_name).is_err());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test m5_backup_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (`backup` module not found)

- [ ] **Step 3: Implement `src-tauri/src/write/backup.rs`**

Implement `create_backup_ref` and `prune_expired_backups`.
Register `pub mod backup;` and `pub use backup::*;` in `src-tauri/src/write/mod.rs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test m5_backup_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/write/backup.rs src-tauri/src/write/mod.rs src-tauri/tests/m5_backup_test.rs
git commit -m "feat(m5): implement gitui safety backup ref engine"
```

---

### Task 2: Backend Undo Engine (`src-tauri/src/write/undo.rs`)

**Files:**
- Create: `src-tauri/src/write/undo.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Test: `src-tauri/tests/m5_undo_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`
- Produces:
  ```rust
  pub fn undo_commit<P: AsRef<std::path::Path>>(repo_path: P) -> Result<(), crate::error::AppError>;
  pub fn undo_delete_branch<P: AsRef<std::path::Path>>(repo_path: P, branch_name: &str, commit_id: &str) -> Result<(), crate::error::AppError>;
  pub fn undo_discard_file<P: AsRef<std::path::Path>>(repo_path: P, file_path: &str, backup_content: &str) -> Result<(), crate::error::AppError>;
  pub fn undo_drop_stash<P: AsRef<std::path::Path>>(repo_path: P, stash_commit_id: &str, message: &str) -> Result<(), crate::error::AppError>;
  ```

- [ ] **Step 1: Write the failing integration test in `src-tauri/tests/m5_undo_test.rs`**

```rust
use std::fs;
use std::process::Command;
use visual_git_lib::write::undo::{undo_commit, undo_delete_branch, undo_discard_file};

fn create_repo() -> (tempfile::TempDir, String) {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
    };

    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);

    fs::write(p.join("file.txt"), "v1\n").unwrap();
    run(&["add", "file.txt"]);
    run(&["commit", "-m", "commit 1"]);
    run(&["branch", "-M", "main"]);

    let path_str = dir.path().to_str().unwrap().to_string();
    (dir, path_str)
}

#[test]
fn test_undo_commit_soft_resets_to_parent() {
    let (_dir, path) = create_repo();
    let repo = git2::Repository::open(&path).unwrap();
    let first_commit_id = repo.head().unwrap().target().unwrap();

    // Tạo commit 2
    fs::write(repo.workdir().unwrap().join("file.txt"), "v2\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("file.txt")).unwrap();
    index.write().unwrap();
    let tree = repo.find_tree(index.write_tree().unwrap()).unwrap();
    let sig = git2::Signature::now("Tester", "test@test.com").unwrap();
    let parent = repo.find_commit(first_commit_id).unwrap();
    let second_commit_id = repo.commit(Some("HEAD"), &sig, &sig, "commit 2", &tree, &[&parent]).unwrap();

    assert_eq!(repo.head().unwrap().target().unwrap(), second_commit_id);

    // Undo commit 2
    undo_commit(&path).unwrap();

    // HEAD quay về commit 1, và file.txt vẫn còn staged với nội dung v2
    assert_eq!(repo.head().unwrap().target().unwrap(), first_commit_id);
    let statuses = repo.statuses(None).unwrap();
    assert_eq!(statuses.len(), 1);
    assert!(statuses.get(0).unwrap().status().contains(git2::Status::INDEX_MODIFIED));
}

#[test]
fn test_undo_delete_branch_restores_branch() {
    let (_dir, path) = create_repo();
    let repo = git2::Repository::open(&path).unwrap();
    let commit_id = repo.head().unwrap().target().unwrap().to_string();

    // Tạo branch feature rồi xoá
    let mut branch = repo.branch("feature", &repo.find_commit(repo.head().unwrap().target().unwrap()).unwrap(), false).unwrap();
    branch.delete().unwrap();
    assert!(repo.find_branch("feature", git2::BranchType::Local).is_err());

    // Undo delete branch
    undo_delete_branch(&path, "feature", &commit_id).unwrap();
    assert!(repo.find_branch("feature", git2::BranchType::Local).is_ok());
}

#[test]
fn test_undo_discard_file_restores_content() {
    let (_dir, path) = create_repo();
    let file_p = std::path::Path::new(&path).join("file.txt");

    fs::write(&file_p, "discarded changes").unwrap();
    // Simulate discard by writing original
    fs::write(&file_p, "v1\n").unwrap();

    // Undo discard
    undo_discard_file(&path, "file.txt", "discarded changes").unwrap();
    assert_eq!(fs::read_to_string(&file_p).unwrap(), "discarded changes");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test m5_undo_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (`undo` module not found)

- [ ] **Step 3: Implement `src-tauri/src/write/undo.rs`**

Implement `undo_commit`, `undo_delete_branch`, `undo_discard_file`, `undo_drop_stash`.
Register in `src-tauri/src/write/mod.rs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test m5_undo_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (3 tests passed)
Run: `cargo test --manifest-path src-tauri/Cargo.toml` to ensure no regressions.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/write/undo.rs src-tauri/src/write/mod.rs src-tauri/tests/m5_undo_test.rs
git commit -m "feat(m5): implement core undo engine for commit, branch, and file"
```

---

### Task 3: Tauri Undo Commands, Specta Registration & Frontend IPC Client

**Files:**
- Create: `src-tauri/src/commands/undo.rs`
- Modify: `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`, `src/ipc/bindings.ts`, `src/ipc/client.ts`
- Test: `src/test/ipcUndo.test.ts`

**Interfaces:**
- Consumes: `crate::write::undo`
- Produces: Tauri Specta commands `undo_commit`, `undo_delete_branch`, `undo_discard_file`, `undo_drop_stash` and frontend wrappers `invokeCommand.undoCommit`, `invokeCommand.undoDeleteBranch`, `invokeCommand.undoDiscardFile`, `invokeCommand.undoDropStash`.

- [ ] **Step 1: Write the failing test in `src/test/ipcUndo.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC undo commands (browser mock)", () => {
  it("undoCommit completes successfully", async () => {
    await expect(invokeCommand.undoCommit("test-repo")).resolves.not.toThrow();
  });

  it("undoDeleteBranch completes successfully", async () => {
    await expect(invokeCommand.undoDeleteBranch("test-repo", "feature", "oid123")).resolves.not.toThrow();
  });

  it("undoDiscardFile completes successfully", async () => {
    await expect(invokeCommand.undoDiscardFile("test-repo", "file.txt", "content")).resolves.not.toThrow();
  });

  it("undoDropStash completes successfully", async () => {
    await expect(invokeCommand.undoDropStash("test-repo", "oid123", "msg")).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/ipcUndo.test.ts --run`
Expected: FAIL (`invokeCommand.undoCommit is not a function`)

- [ ] **Step 3: Implement Tauri commands and frontend client wrappers**

Create `src-tauri/src/commands/undo.rs`:
- Implements the 4 commands, each emitting `repo-changed` event.
Register in `commands/mod.rs` and `create_specta_builder()` in `lib.rs`.
Update `src/ipc/bindings.ts` and `src/ipc/client.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/ipcUndo.test.ts --run`
Expected: PASS (4 tests passed)
Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Clean check, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/commands/undo.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs src/ipc/bindings.ts src/ipc/client.ts src/test/ipcUndo.test.ts
git commit -m "feat(m5): expose undo commands via specta and client bridge"
```

---

### Task 4: Friendly Error Mapping Engine (`src/utils/errorMapping.ts`)

**Files:**
- Create: `src/utils/errorMapping.ts`
- Test: `src/test/errorMapping.test.ts`

**Interfaces:**
- Produces: `FriendlyError`, `mapGitError(error: unknown): FriendlyError`

- [ ] **Step 1: Write the failing test in `src/test/errorMapping.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { mapGitError } from "../utils/errorMapping";

describe("mapGitError utility", () => {
  it("maps authentication failure", () => {
    const res = mapGitError("fatal: Authentication failed for 'https://github.com/...'");
    expect(res.title).toContain("Lỗi xác thực");
    expect(res.actionHint).toBeDefined();
  });

  it("maps non-fast-forward rejected push", () => {
    const res = mapGitError("error: failed to push some refs ... [rejected] (fetch first)");
    expect(res.title).toContain("commit mới");
    expect(res.actionHint).toContain("Lấy về");
  });

  it("maps checkout conflict / dirty tree", () => {
    const res = mapGitError("CHECKOUT_CONFLICT: local changes would be overwritten");
    expect(res.title).toContain("Xung đột khi chuyển nhánh");
    expect(res.actionHint).toContain("Stash");
  });

  it("maps network connection failure", () => {
    const res = mapGitError("fatal: unable to access: Could not resolve host");
    expect(res.title).toContain("kết nối");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/errorMapping.test.ts --run`
Expected: FAIL (`mapGitError` not found)

- [ ] **Step 3: Implement `src/utils/errorMapping.ts`**

Implement `mapGitError` matching spec Section 3.1.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/errorMapping.test.ts --run`
Expected: PASS (4 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/utils/errorMapping.ts src/test/errorMapping.test.ts
git commit -m "feat(m5): implement friendly Git error mapping engine"
```

---

### Task 5: Frontend Toast System (`useToastStore.ts`, `ToastContainer.tsx`, `ToastItem.tsx`)

**Files:**
- Create: `src/store/useToastStore.ts`, `src/components/toast/ToastContainer.tsx`, `src/components/toast/ToastItem.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/ToastSystem.test.tsx`

**Interfaces:**
- Consumes: `useToastStore`, `mapGitError`
- Produces: Bottom-right interactive toast notifications with countdown progress bar, "Hoàn tác" action, and expandable technical details.

- [ ] **Step 1: Write the failing test in `src/test/ToastSystem.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { ToastContainer } from "../components/toast/ToastContainer";
import { useToastStore } from "../store/useToastStore";

describe("Toast System", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders toast with countdown and handles Undo click", async () => {
    const handleUndo = vi.fn().mockResolvedValue(undefined);

    render(<ToastContainer />);

    useToastStore.getState().showToast({
      message: "Đã tạo commit",
      type: "success",
      durationMs: 10000,
      undoAction: handleUndo,
    });

    expect(screen.getByText("Đã tạo commit")).toBeInTheDocument();
    const undoBtn = screen.getByRole("button", { name: /Hoàn tác/i });
    expect(undoBtn).toBeInTheDocument();

    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(handleUndo).toHaveBeenCalled();
    });
  });

  it("renders friendly error with expandable raw technical details", () => {
    render(<ToastContainer />);

    useToastStore.getState().showError({
      title: "Lỗi xác thực",
      message: "Không thể kết nối",
      rawError: "fatal: Authentication failed",
    });

    expect(screen.getByText("Lỗi xác thực")).toBeInTheDocument();
    const expandBtn = screen.getByRole("button", { name: /Chi tiết kỹ thuật/i });
    fireEvent.click(expandBtn);

    expect(screen.getByText("fatal: Authentication failed")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/ToastSystem.test.tsx --run`
Expected: FAIL (`ToastContainer` or `useToastStore` not found)

- [ ] **Step 3: Implement `useToastStore.ts`, `ToastContainer.tsx`, `ToastItem.tsx`, and mount in `src/App.tsx`**

1. Create `src/store/useToastStore.ts`:
   - State: `toasts: ToastItem[]`
   - Actions: `showToast`, `showSuccess`, `showError`, `removeToast`.
2. Create `src/components/toast/ToastItem.tsx`:
   - 10-second countdown progress bar.
   - Action buttons: "Hoàn tác", "Chi tiết kỹ thuật", and close "✕".
3. Create `src/components/toast/ToastContainer.tsx`:
   - Positioned `fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none`.
4. Mount `<ToastContainer />` at the root of `<App />` in `src/App.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/ToastSystem.test.tsx --run`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/store/useToastStore.ts src/components/toast/ToastContainer.tsx src/components/toast/ToastItem.tsx src/App.tsx src/test/ToastSystem.test.tsx
git commit -m "feat(m5): implement interactive ToastContainer and useToastStore"
```

---

### Task 6: Wire Undo & Toast into Existing Actions & Full Verification

**Files:**
- Modify: `src/components/changes/CommitBox.tsx`, `src/components/sidebar/DeleteBranchModal.tsx`, `src/components/sidebar/BranchSidebar.tsx`, `src/components/changes/ChangesScreen.tsx`
- Test: `src/test/UndoIntegration.test.tsx`

**Interfaces:**
- Consumes: `useToastStore`, `invokeCommand.undoCommit`, `invokeCommand.undoDeleteBranch`, `invokeCommand.undoDropStash`
- Produces: End-to-end integration of Undo toasts on successful writes, and friendly error toasts on failures.

- [ ] **Step 1: Write integration test in `src/test/UndoIntegration.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { CommitBox } from "../components/changes/CommitBox";
import { useToastStore } from "../store/useToastStore";
import { invokeCommand } from "../ipc/client";

describe("CommitBox Undo Integration", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("shows toast with undo action after successful commit", async () => {
    vi.spyOn(invokeCommand, "createCommit").mockResolvedValue("oid123");
    const undoSpy = vi.spyOn(invokeCommand, "undoCommit").mockResolvedValue(undefined);

    render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={2}
        onSuccess={vi.fn()}
      />
    );

    const summaryInput = screen.getByPlaceholderText(/Tóm tắt thay đổi/i);
    fireEvent.change(summaryInput, { target: { value: "feat: new feature" } });

    const commitBtn = screen.getByRole("button", { name: /Commit/i });
    fireEvent.click(commitBtn);

    await waitFor(() => {
      const toast = useToastStore.getState().toasts[0];
      expect(toast).toBeDefined();
      expect(toast.undoAction).toBeDefined();
    });

    // Execute undo callback
    await useToastStore.getState().toasts[0].undoAction!();
    expect(undoSpy).toHaveBeenCalledWith("/test/repo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/UndoIntegration.test.tsx --run`
Expected: FAIL (toast not triggered on commit)

- [ ] **Step 3: Wire `useToastStore` into CommitBox, DeleteBranchModal, and BranchSidebar**

1. In `CommitBox.tsx`:
   - On success: trigger `showToast` with `undoAction: () => invokeCommand.undoCommit(repoPath)`.
   - On failure: map error with `mapGitError` and trigger `showError`.
2. In `DeleteBranchModal.tsx`:
   - Pass `targetCommitId` of the branch being deleted.
   - On delete success: trigger `showToast` with `undoAction: () => invokeCommand.undoDeleteBranch(repoPath, branchName, targetCommitId)`.
3. In `BranchSidebar.tsx`:
   - On drop stash: trigger `showToast` with `undoAction: () => invokeCommand.undoDropStash(currentRepo.path, stash.commit_id, stash.message)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/UndoIntegration.test.tsx --run`
Expected: PASS (1 test passed)

- [ ] **Step 5: Run full verification suite (Rust + Frontend + Build)**

1. `cargo test --manifest-path src-tauri/Cargo.toml`
2. `pnpm test --run`
3. `pnpm run build`

- [ ] **Step 6: Commit**

```bash
git add src/components/changes/CommitBox.tsx src/components/sidebar/DeleteBranchModal.tsx src/components/sidebar/BranchSidebar.tsx src/test/UndoIntegration.test.tsx
git commit -m "feat(m5): wire undo toasts into commit, delete branch, and drop stash"
```
