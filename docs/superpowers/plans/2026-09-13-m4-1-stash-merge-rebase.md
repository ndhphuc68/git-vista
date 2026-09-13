# Milestone M4.1: Quản Lý Stash, Thao Tác Merge / Rebase Cơ Bản & Phát Hiện Trạng Thái Dở Dang Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng tính năng quản lý Stash (lưu, xem diff, apply, pop, drop), thao tác Merge & Rebase có kiểm tra an toàn, và banner kiểm soát trạng thái dở dang (Abort / Continue) cho Visual Git Client.

**Architecture:** Sử dụng `libgit2` cho Stash (`write/stash.rs`) và State Detection (`read/state.rs`) in-process; sử dụng `git CLI` trong module `exec/merge.rs` cho Merge, Rebase, Abort, Continue. Frontend tích hợp Stash và Branch Actions vào Sidebar, Changes screen, và InProgressOperationBanner cố định dưới Header.

**Tech Stack:** Tauri 2 (Rust + libgit2 0.20 + git CLI), React 19, TypeScript 5.8, TanStack Query 5, Vitest, Testing Library, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-09-13-m4-1-stash-merge-rebase-design.md`

## Global Constraints

- Backend: Không spawn git CLI trong `write/` hoặc `read/`; chỉ spawn trong `exec/`.
- Mọi thao tác ghi/mạng phát event `repo-changed` để TanStack Query tự động invalidate cache.
- Tái sử dụng `get_commit_diff` cho Stash Diff (vì Stash trong Git thực chất là commit object).
- Phím tắt Esc đóng các modal, focus trap và ARIA label chuẩn desktop a11y.
- Test-driven development (TDD): Viết test trước, kiểm tra test fail, viết code, kiểm tra test pass, commit.

---

### Task 1: Backend Stash Operations with libgit2 (`src-tauri/src/write/stash.rs`)

**Files:**
- Create: `src-tauri/src/write/stash.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Test: `src-tauri/tests/m4_stash_test.rs`

**Interfaces:**
- Consumes: `crate::error::AppError`, `git2::Repository`
- Produces:
  ```rust
  #[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type, PartialEq, Eq)]
  pub struct StashItem {
      pub index: usize,
      pub message: String,
      pub commit_id: String,
      pub created_at: i64,
  }
  pub fn get_stashes<P: AsRef<std::path::Path>>(repo_path: P) -> Result<Vec<StashItem>, AppError>;
  pub fn save_stash<P: AsRef<std::path::Path>>(repo_path: P, message: Option<&str>, include_untracked: bool) -> Result<String, AppError>;
  pub fn apply_stash<P: AsRef<std::path::Path>>(repo_path: P, index: usize) -> Result<(), AppError>;
  pub fn pop_stash<P: AsRef<std::path::Path>>(repo_path: P, index: usize) -> Result<(), AppError>;
  pub fn drop_stash<P: AsRef<std::path::Path>>(repo_path: P, index: usize) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write the failing integration test in `src-tauri/tests/m4_stash_test.rs`**

```rust
use std::fs;
use std::path::Path;
use visual_git_lib::write::stash::{apply_stash, drop_stash, get_stashes, pop_stash, save_stash};

fn create_temp_repo(name: &str) -> (tempfile::TempDir, git2::Repository) {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Test User").unwrap();
    config.set_str("user.email", "test@example.com").unwrap();

    let file_path = dir.path().join("file.txt");
    fs::write(&file_path, "initial content\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("file.txt")).unwrap();
    index.write().unwrap();
    let tree_id = index.write_tree().unwrap();
    let tree = repo.find_tree(tree_id).unwrap();
    let sig = repo.signature().unwrap();
    repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
        .unwrap();

    (dir, repo)
}

#[test]
fn test_stash_lifecycle_save_get_apply_pop_drop() {
    let (dir, repo) = create_temp_repo("stash_test");
    let repo_path = dir.path().to_str().unwrap();

    // 1. Tạo thay đổi file và file mới untracked
    fs::write(dir.path().join("file.txt"), "modified content\n").unwrap();
    fs::write(dir.path().join("untracked.txt"), "untracked content\n").unwrap();

    // 2. Save stash (include_untracked = true)
    let commit_id = save_stash(repo_path, Some("Test my stash"), true).unwrap();
    assert!(!commit_id.is_empty());

    // Working tree phải sạch sau khi stash
    let mut status_opts = git2::StatusOptions::new();
    status_opts.include_untracked(true);
    let statuses = repo.statuses(Some(&mut status_opts)).unwrap();
    assert_eq!(statuses.len(), 0);

    // 3. Get stashes
    let stashes = get_stashes(repo_path).unwrap();
    assert_eq!(stashes.len(), 1);
    assert_eq!(stashes[0].index, 0);
    assert!(stashes[0].message.contains("Test my stash"));

    // 4. Apply stash (áp dụng lại nhưng vẫn giữ stash)
    apply_stash(repo_path, 0).unwrap();
    assert_eq!(fs::read_to_string(dir.path().join("file.txt")).unwrap(), "modified content\n");
    let stashes_after_apply = get_stashes(repo_path).unwrap();
    assert_eq!(stashes_after_apply.len(), 1);

    // 5. Drop stash
    drop_stash(repo_path, 0).unwrap();
    let stashes_after_drop = get_stashes(repo_path).unwrap();
    assert_eq!(stashes_after_drop.len(), 0);

    // 6. Test Pop stash
    fs::write(dir.path().join("file.txt"), "second modification\n").unwrap();
    save_stash(repo_path, Some("Pop me"), false).unwrap();
    assert_eq!(get_stashes(repo_path).unwrap().len(), 1);

    pop_stash(repo_path, 0).unwrap();
    assert_eq!(get_stashes(repo_path).unwrap().len(), 0);
    assert_eq!(fs::read_to_string(dir.path().join("file.txt")).unwrap(), "second modification\n");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test m4_stash_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (module `stash` not found in `visual_git_lib::write`)

- [ ] **Step 3: Implement `src-tauri/src/write/stash.rs` and update `src-tauri/src/write/mod.rs`**

```rust
// src-tauri/src/write/stash.rs
use crate::error::AppError;
use git2::{Repository, StashFlags};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct StashItem {
    pub index: usize,
    pub message: String,
    pub commit_id: String,
    pub created_at: i64,
}

pub fn get_stashes<P: AsRef<Path>>(repo_path: P) -> Result<Vec<StashItem>, AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let mut stashes = Vec::new();

    repo.stash_foreach(|index, name, oid| {
        let commit = repo.find_commit(*oid).ok();
        let created_at = commit.as_ref().map(|c| c.time().seconds()).unwrap_or(0);
        stashes.push(StashItem {
            index,
            message: name.to_string(),
            commit_id: oid.to_string(),
            created_at,
        });
        true
    })?;

    Ok(stashes)
}

pub fn save_stash<P: AsRef<Path>>(
    repo_path: P,
    message: Option<&str>,
    include_untracked: bool,
) -> Result<String, AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let signature = repo.signature().unwrap_or_else(|_| {
        git2::Signature::now("Visual Git Client", "app@visualgit.local")
            .unwrap_or_else(|_| git2::Signature::now("Unknown", "unknown@local").unwrap())
    });

    let mut flags = StashFlags::DEFAULT;
    if include_untracked {
        flags |= StashFlags::INCLUDE_UNTRACKED;
    }

    let default_msg = "WIP on current branch";
    let msg = message.filter(|m| !m.trim().is_empty()).unwrap_or(default_msg);

    let oid = repo.stash_save2(&signature, Some(msg), Some(flags))?;
    Ok(oid.to_string())
}

pub fn apply_stash<P: AsRef<Path>>(repo_path: P, index: usize) -> Result<(), AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let mut options = git2::StashApplyOptions::new();
    repo.stash_apply(index, Some(&mut options))
        .map_err(|e| AppError::InvalidOperation(format!("Không thể áp dụng Stash: {}", e)))?;
    Ok(())
}

pub fn pop_stash<P: AsRef<Path>>(repo_path: P, index: usize) -> Result<(), AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    let mut options = git2::StashApplyOptions::new();
    repo.stash_pop(index, Some(&mut options))
        .map_err(|e| AppError::InvalidOperation(format!("Không thể Pop Stash: {}", e)))?;
    Ok(())
}

pub fn drop_stash<P: AsRef<Path>>(repo_path: P, index: usize) -> Result<(), AppError> {
    let mut repo = Repository::open(repo_path.as_ref())?;
    repo.stash_drop(index)
        .map_err(|e| AppError::InvalidOperation(format!("Không thể xoá Stash: {}", e)))?;
    Ok(())
}
```

Update `src-tauri/src/write/mod.rs`:
Add `pub mod stash;`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test m4_stash_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/write/stash.rs src-tauri/src/write/mod.rs src-tauri/tests/m4_stash_test.rs
git commit -m "feat(m4): implement libgit2 stash save, get, apply, pop, and drop"
```

---

### Task 2: Backend Repo State Detection with libgit2 (`src-tauri/src/read/state.rs`)

**Files:**
- Create: `src-tauri/src/read/state.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Test: `src-tauri/tests/m4_state_test.rs`

**Interfaces:**
- Consumes: `crate::error::AppError`, `git2::Repository`, `git2::RepositoryState`
- Produces:
  ```rust
  #[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type, PartialEq, Eq)]
  pub struct RepoStateInfo {
      pub state: String,              // "clean", "merge", "rebase", "cherry_pick", "revert"
      pub is_in_progress: bool,       // state != "clean"
      pub head_name: String,
      pub target_name: Option<String>,
      pub conflict_count: usize,
  }
  pub fn get_repo_state<P: AsRef<std::path::Path>>(repo_path: P) -> Result<RepoStateInfo, AppError>;
  ```

- [ ] **Step 1: Write the failing integration test in `src-tauri/tests/m4_state_test.rs`**

```rust
use std::fs;
use std::path::Path;
use visual_git_lib::read::state::get_repo_state;

fn create_temp_repo() -> (tempfile::TempDir, git2::Repository) {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Test User").unwrap();
    config.set_str("user.email", "test@example.com").unwrap();

    let file_path = dir.path().join("base.txt");
    fs::write(&file_path, "base\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("base.txt")).unwrap();
    index.write().unwrap();
    let tree_id = index.write_tree().unwrap();
    let tree = repo.find_tree(tree_id).unwrap();
    let sig = repo.signature().unwrap();
    repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[]).unwrap();

    (dir, repo)
}

#[test]
fn test_get_repo_state_clean_and_simulated_merge() {
    let (dir, _repo) = create_temp_repo();
    let repo_path = dir.path().to_str().unwrap();

    // 1. Repo vừa tạo phải là clean
    let clean_state = get_repo_state(repo_path).unwrap();
    assert_eq!(clean_state.state, "clean");
    assert!(!clean_state.is_in_progress);
    assert_eq!(clean_state.conflict_count, 0);

    // 2. Tạo file MERGE_HEAD để mô phỏng trạng thái Merge dở dang
    let git_dir = dir.path().join(".git");
    fs::write(git_dir.join("MERGE_HEAD"), "0123456789abcdef0123456789abcdef01234567\n").unwrap();
    fs::write(git_dir.join("MERGE_MSG"), "Merge branch 'feature'\n").unwrap();

    let merge_state = get_repo_state(repo_path).unwrap();
    assert_eq!(merge_state.state, "merge");
    assert!(merge_state.is_in_progress);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test m4_state_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (module `state` not found)

- [ ] **Step 3: Implement `src-tauri/src/read/state.rs` and update `src-tauri/src/read/mod.rs`**

```rust
// src-tauri/src/read/state.rs
use crate::error::AppError;
use git2::{Repository, RepositoryState, StatusOptions};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RepoStateInfo {
    pub state: String,
    pub is_in_progress: bool,
    pub head_name: String,
    pub target_name: Option<String>,
    pub conflict_count: usize,
}

pub fn get_repo_state<P: AsRef<Path>>(repo_path: P) -> Result<RepoStateInfo, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    let state_str = match repo.state() {
        RepositoryState::Clean => "clean",
        RepositoryState::Merge => "merge",
        RepositoryState::Rebase | RepositoryState::RebaseInteractive | RepositoryState::RebaseMerge => "rebase",
        RepositoryState::CherryPick | RepositoryState::CherryPickSequence => "cherry_pick",
        RepositoryState::Revert | RepositoryState::RevertSequence => "revert",
        _ => "other",
    };

    let is_in_progress = state_str != "clean";

    let head_name = match repo.head() {
        Ok(head) => head.shorthand().unwrap_or("HEAD").to_string(),
        Err(_) => "HEAD".to_string(),
    };

    let mut target_name = None;
    let git_dir = repo.path();
    if state_str == "merge" {
        if let Ok(msg) = fs::read_to_string(git_dir.join("MERGE_MSG")) {
            if let Some(line) = msg.lines().next() {
                target_name = Some(line.trim_start_matches("Merge branch ").replace('\'', "").to_string());
            }
        }
    } else if state_str == "rebase" {
        if let Ok(onto) = fs::read_to_string(git_dir.join("rebase-merge").join("onto_name")) {
            target_name = Some(onto.trim().to_string());
        } else if let Ok(onto) = fs::read_to_string(git_dir.join("rebase-apply").join("onto")) {
            target_name = Some(onto.trim().to_string());
        }
    }

    let mut status_opts = StatusOptions::new();
    status_opts.include_untracked(false);
    let statuses = repo.statuses(Some(&mut status_opts))?;
    let conflict_count = statuses
        .iter()
        .filter(|s| s.status().is_conflicted())
        .count();

    Ok(RepoStateInfo {
        state: state_str.to_string(),
        is_in_progress,
        head_name,
        target_name,
        conflict_count,
    })
}
```

Update `src-tauri/src/read/mod.rs`:
Add `pub mod state;` and re-export `pub use state::*;`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test m4_state_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/read/state.rs src-tauri/src/read/mod.rs src-tauri/tests/m4_state_test.rs
git commit -m "feat(m4): implement libgit2 repository state and in-progress detection"
```

---

### Task 3: Backend Merge, Rebase, Abort & Continue via CLI (`src-tauri/src/exec/merge.rs`)

**Files:**
- Create: `src-tauri/src/exec/merge.rs`
- Modify: `src-tauri/src/exec/mod.rs`
- Test: `src-tauri/tests/m4_merge_rebase_test.rs`

**Interfaces:**
- Consumes: `crate::error::AppError`
- Produces:
  ```rust
  #[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type, PartialEq, Eq)]
  pub struct MergeResult {
      pub success: bool,
      pub status: String, // "Merged", "FastForward", "Conflict", "AlreadyUpToDate"
      pub output: String,
  }
  #[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type, PartialEq, Eq)]
  pub struct RebaseResult {
      pub success: bool,
      pub status: String, // "Success", "Conflict", "AlreadyUpToDate"
      pub output: String,
  }
  pub fn git_merge<P: AsRef<std::path::Path>>(repo_path: P, target_branch: &str, no_ff: bool) -> Result<MergeResult, AppError>;
  pub fn git_rebase<P: AsRef<std::path::Path>>(repo_path: P, upstream_branch: &str) -> Result<RebaseResult, AppError>;
  pub fn git_abort_operation<P: AsRef<std::path::Path>>(repo_path: P, operation: &str) -> Result<(), AppError>;
  pub fn git_continue_operation<P: AsRef<std::path::Path>>(repo_path: P, operation: &str) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write the failing integration test in `src-tauri/tests/m4_merge_rebase_test.rs`**

```rust
use std::fs;
use std::process::Command;
use visual_git_lib::exec::merge::{git_abort_operation, git_merge, git_rebase};
use visual_git_lib::read::state::get_repo_state;

fn create_repo_with_branch(conflict: bool) -> tempfile::TempDir {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
    };

    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);

    fs::write(p.join("shared.txt"), "line 1\n").unwrap();
    run(&["add", "shared.txt"]);
    run(&["commit", "-m", "initial commit"]);
    run(&["branch", "-M", "main"]);

    // Tạo nhánh feature
    run(&["checkout", "-b", "feature"]);
    fs::write(p.join("shared.txt"), if conflict { "feature edit\n" } else { "line 1\nfeature add\n" }).unwrap();
    run(&["commit", "-am", "feature commit"]);

    // Quay lại main và sửa đổi
    run(&["checkout", "main"]);
    if conflict {
        fs::write(p.join("shared.txt"), "main edit\n").unwrap();
        run(&["commit", "-am", "main commit"]);
    }

    dir
}

#[test]
fn test_merge_fast_forward_success() {
    let dir = create_repo_with_branch(false);
    let res = git_merge(dir.path(), "feature", false).unwrap();
    assert!(res.success);
    let state = get_repo_state(dir.path()).unwrap();
    assert_eq!(state.state, "clean");
}

#[test]
fn test_merge_conflict_and_abort() {
    let dir = create_repo_with_branch(true);
    let res = git_merge(dir.path(), "feature", false).unwrap();
    assert!(!res.success);
    assert_eq!(res.status, "Conflict");

    let state = get_repo_state(dir.path()).unwrap();
    assert_eq!(state.state, "merge");
    assert!(state.conflict_count > 0);

    // Abort
    git_abort_operation(dir.path(), "merge").unwrap();
    let after_abort = get_repo_state(dir.path()).unwrap();
    assert_eq!(after_abort.state, "clean");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test m4_merge_rebase_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (module `merge` not found in `visual_git_lib::exec`)

- [ ] **Step 3: Implement `src-tauri/src/exec/merge.rs` and update `src-tauri/src/exec/mod.rs`**

```rust
// src-tauri/src/exec/merge.rs
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct MergeResult {
    pub success: bool,
    pub status: String,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RebaseResult {
    pub success: bool,
    pub status: String,
    pub output: String,
}

pub fn git_merge<P: AsRef<Path>>(
    repo_path: P,
    target_branch: &str,
    no_ff: bool,
) -> Result<MergeResult, AppError> {
    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref()).arg("merge");

    if no_ff {
        cmd.arg("--no-ff");
    }
    cmd.arg(target_branch);

    let output = cmd.output().map_err(|e| AppError::Io(e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr);

    if output.status.success() {
        let status = if combined.contains("Already up to date") {
            "AlreadyUpToDate".to_string()
        } else if combined.contains("Fast-forward") {
            "FastForward".to_string()
        } else {
            "Merged".to_string()
        };
        Ok(MergeResult {
            success: true,
            status,
            output: combined.trim().to_string(),
        })
    } else {
        let status = if combined.contains("CONFLICT") || combined.contains("Automatic merge failed") {
            "Conflict".to_string()
        } else {
            "Error".to_string()
        };
        Ok(MergeResult {
            success: false,
            status,
            output: combined.trim().to_string(),
        })
    }
}

pub fn git_rebase<P: AsRef<Path>>(
    repo_path: P,
    upstream_branch: &str,
) -> Result<RebaseResult, AppError> {
    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref())
        .args(&["rebase", upstream_branch]);

    let output = cmd.output().map_err(|e| AppError::Io(e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr);

    if output.status.success() {
        let status = if combined.contains("Current branch is up to date") || combined.contains("is up to date") {
            "AlreadyUpToDate".to_string()
        } else {
            "Success".to_string()
        };
        Ok(RebaseResult {
            success: true,
            status,
            output: combined.trim().to_string(),
        })
    } else {
        let status = if combined.contains("CONFLICT") || combined.contains("could not apply") {
            "Conflict".to_string()
        } else {
            "Error".to_string()
        };
        Ok(RebaseResult {
            success: false,
            status,
            output: combined.trim().to_string(),
        })
    }
}

pub fn git_abort_operation<P: AsRef<Path>>(repo_path: P, operation: &str) -> Result<(), AppError> {
    let op = if operation.to_lowercase().contains("rebase") {
        "rebase"
    } else {
        "merge"
    };

    let output = Command::new("git")
        .current_dir(repo_path.as_ref())
        .args(&[op, "--abort"])
        .output()
        .map_err(|e| AppError::Io(e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::InvalidOperation(format!("Không thể huỷ bỏ {}: {}", op, stderr)));
    }
    Ok(())
}

pub fn git_continue_operation<P: AsRef<Path>>(repo_path: P, operation: &str) -> Result<(), AppError> {
    let op = if operation.to_lowercase().contains("rebase") {
        "rebase"
    } else {
        "merge"
    };

    let output = Command::new("git")
        .current_dir(repo_path.as_ref())
        .args(&[op, "--continue"])
        .output()
        .map_err(|e| AppError::Io(e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::InvalidOperation(format!("Không thể tiếp tục {}: {}", op, stderr)));
    }
    Ok(())
}
```

Update `src-tauri/src/exec/mod.rs`:
Add `pub mod merge;`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test m4_merge_rebase_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/exec/merge.rs src-tauri/src/exec/mod.rs src-tauri/tests/m4_merge_rebase_test.rs
git commit -m "feat(m4): implement git CLI merge, rebase, abort and continue"
```

---

### Task 4: Tauri Commands & Specta Registration and Frontend IPC Client (`src-tauri/src/commands/stash.rs`, `merge.rs`, `src/ipc/`)

**Files:**
- Create: `src-tauri/src/commands/stash.rs`, `src-tauri/src/commands/merge.rs`
- Modify: `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`, `src/ipc/bindings.ts`, `src/ipc/client.ts`
- Test: `src/test/ipcStashMerge.test.ts`

**Interfaces:**
- Consumes: `crate::write::stash`, `crate::read::state`, `crate::exec::merge`
- Produces: Tauri Specta commands and frontend `invokeCommand` wrappers:
  `getStashes`, `saveStash`, `applyStash`, `popStash`, `dropStash`, `getRepoState`, `mergeBranch`, `rebaseBranch`, `abortInProgress`, `continueInProgress`.

- [ ] **Step 1: Write the failing test in `src/test/ipcStashMerge.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC client stash and merge commands (browser mock)", () => {
  it("getStashes returns mock stash array", async () => {
    const stashes = await invokeCommand.getStashes("test-repo");
    expect(Array.isArray(stashes)).toBe(true);
  });

  it("saveStash returns commit hash and updates stashes", async () => {
    const commitId = await invokeCommand.saveStash("test-repo", "WIP test", true);
    expect(commitId).toBeDefined();
    expect(typeof commitId).toBe("string");
  });

  it("getRepoState returns clean state by default in mock", async () => {
    const state = await invokeCommand.getRepoState("test-repo");
    expect(state.state).toBe("clean");
    expect(state.is_in_progress).toBe(false);
  });

  it("mergeBranch returns mock MergeResult", async () => {
    const res = await invokeCommand.mergeBranch("test-repo", "feature", false);
    expect(res.success).toBe(true);
    expect(res.status).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/ipcStashMerge.test.ts`
Expected: FAIL (`invokeCommand.getStashes` is not a function)

- [ ] **Step 3: Implement commands and update IPC bridge**

Create `src-tauri/src/commands/stash.rs`:
```rust
use crate::error::AppError;
use crate::write::stash::{self, StashItem};
use tauri::Emitter;

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: &str, reason: &str) {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let _ = app.emit("repo-changed", crate::events::RepoChangedPayload {
        repo_path: repo_path.to_string(),
        reason: reason.to_string(),
        timestamp_ms: now,
    });
}

#[tauri::command]
#[specta::specta]
pub fn get_stashes(repo_path: String) -> Result<Vec<StashItem>, AppError> {
    stash::get_stashes(&repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn save_stash(
    app: tauri::AppHandle,
    repo_path: String,
    message: Option<String>,
    include_untracked: Option<bool>,
) -> Result<String, AppError> {
    let commit_id = stash::save_stash(&repo_path, message.as_deref(), include_untracked.unwrap_or(false))?;
    emit_repo_changed(&app, &repo_path, "save_stash");
    Ok(commit_id)
}

#[tauri::command]
#[specta::specta]
pub fn apply_stash(app: tauri::AppHandle, repo_path: String, index: usize) -> Result<(), AppError> {
    stash::apply_stash(&repo_path, index)?;
    emit_repo_changed(&app, &repo_path, "apply_stash");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn pop_stash(app: tauri::AppHandle, repo_path: String, index: usize) -> Result<(), AppError> {
    stash::pop_stash(&repo_path, index)?;
    emit_repo_changed(&app, &repo_path, "pop_stash");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn drop_stash(app: tauri::AppHandle, repo_path: String, index: usize) -> Result<(), AppError> {
    stash::drop_stash(&repo_path, index)?;
    emit_repo_changed(&app, &repo_path, "drop_stash");
    Ok(())
}
```

Create `src-tauri/src/commands/merge.rs`:
```rust
use crate::error::AppError;
use crate::exec::merge::{self, MergeResult, RebaseResult};
use crate::read::state::{self, RepoStateInfo};
use tauri::Emitter;

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: &str, reason: &str) {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let _ = app.emit("repo-changed", crate::events::RepoChangedPayload {
        repo_path: repo_path.to_string(),
        reason: reason.to_string(),
        timestamp_ms: now,
    });
}

#[tauri::command]
#[specta::specta]
pub fn get_repo_state(repo_path: String) -> Result<RepoStateInfo, AppError> {
    state::get_repo_state(&repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn merge_branch(
    app: tauri::AppHandle,
    repo_path: String,
    target_branch: String,
    no_ff: Option<bool>,
) -> Result<MergeResult, AppError> {
    let res = merge::git_merge(&repo_path, &target_branch, no_ff.unwrap_or(false))?;
    emit_repo_changed(&app, &repo_path, "merge_branch");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn rebase_branch(
    app: tauri::AppHandle,
    repo_path: String,
    upstream_branch: String,
) -> Result<RebaseResult, AppError> {
    let res = merge::git_rebase(&repo_path, &upstream_branch)?;
    emit_repo_changed(&app, &repo_path, "rebase_branch");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn abort_in_progress(
    app: tauri::AppHandle,
    repo_path: String,
    operation: String,
) -> Result<(), AppError> {
    merge::git_abort_operation(&repo_path, &operation)?;
    emit_repo_changed(&app, &repo_path, "abort_in_progress");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn continue_in_progress(
    app: tauri::AppHandle,
    repo_path: String,
    operation: String,
) -> Result<(), AppError> {
    merge::git_continue_operation(&repo_path, &operation)?;
    emit_repo_changed(&app, &repo_path, "continue_in_progress");
    Ok(())
}
```

Update `src-tauri/src/commands/mod.rs` to include `pub mod stash;` and `pub mod merge;`, and re-export.
Update `src-tauri/src/lib.rs` in `create_specta_builder`: add `get_stashes, save_stash, apply_stash, pop_stash, drop_stash, get_repo_state, merge_branch, rebase_branch, abort_in_progress, continue_in_progress`.
Update `src/ipc/bindings.ts`: Add `StashItem`, `RepoStateInfo`, `MergeResult`, `RebaseResult`.
Update `src/ipc/client.ts`: Add invoke wrapper functions with browser-mock fallbacks.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/ipcStashMerge.test.ts`
Expected: PASS (4 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/commands/stash.rs src-tauri/src/commands/merge.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs src/ipc/bindings.ts src/ipc/client.ts src/test/ipcStashMerge.test.ts
git commit -m "feat(m4): register stash, merge, and state IPC commands and update frontend client"
```

---

### Task 5: Frontend Stash UI (Sidebar STASH, CreateStashModal & Stash Diff Preview)

**Files:**
- Create: `src/components/stash/CreateStashModal.tsx`, `src/components/stash/StashDiffView.tsx`
- Modify: `src/components/sidebar/BranchSidebar.tsx`, `src/components/changes/ChangesScreen.tsx`
- Test: `src/test/StashUI.test.tsx`

**Interfaces:**
- Consumes: `invokeCommand.getStashes`, `saveStash`, `applyStash`, `popStash`, `dropStash`, `getCommitDetails`, `getCommitFileDiff`
- Produces: Sidebar collapsible `STASH (N)` view, `CreateStashModal`, and stash diff inspect view.

- [ ] **Step 1: Write the failing component test in `src/test/StashUI.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateStashModal } from "../components/stash/CreateStashModal";

describe("CreateStashModal Component", () => {
  it("renders input, untracked checkbox, and calls onSaveStash", async () => {
    const handleSave = vi.fn().mockResolvedValue("oid123");
    const handleClose = vi.fn();

    render(
      <CreateStashModal
        isOpen={true}
        onClose={handleClose}
        repoPath="/test/repo"
        onSaveStash={handleSave}
      />
    );

    expect(screen.getByText("Lưu tạm thay đổi (Stash)")).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Mô tả nội dung stash/i);
    fireEvent.change(input, { target: { value: "My temp changes" } });

    const checkbox = screen.getByLabelText(/Bao gồm cả các file chưa theo dõi/i);
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: "Lưu Stash" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("My temp changes", true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/StashUI.test.tsx`
Expected: FAIL (Cannot find module `CreateStashModal`)

- [ ] **Step 3: Implement `CreateStashModal.tsx`, `StashDiffView.tsx`, and integrate into Sidebar & ChangesScreen**

1. Create `src/components/stash/CreateStashModal.tsx`:
   - Inputs: message, includeUntracked checkbox.
   - Buttons: Huỷ, Lưu Stash.
   - Escape key & backdrop click to close.

2. Create `src/components/stash/StashDiffView.tsx`:
   - Reuses commit diff viewer for selected stash item (`stash.commit_id`).
   - Top banner with 3 buttons: **Áp dụng (Apply)**, **Áp dụng & Xoá (Pop)**, **Xoá Stash (Drop)**.

3. Update `src/components/sidebar/BranchSidebar.tsx`:
   - Query `["stashes", currentRepo?.path]` using `invokeCommand.getStashes`.
   - Add collapsible `STASH (N)` section with stash rows: `stash@{index}: message`.
   - Selecting a stash updates active screen or selected stash in store.
   - Actions: Pop, Apply, Drop (with confirmation modal for Drop).

4. Update `src/components/changes/ChangesScreen.tsx`:
   - Add button "Lưu Stash" next to Commit button or top of file list.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/StashUI.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/stash/CreateStashModal.tsx src/components/stash/StashDiffView.tsx src/components/sidebar/BranchSidebar.tsx src/components/changes/ChangesScreen.tsx src/test/StashUI.test.tsx
git commit -m "feat(m4): implement Stash UI in Sidebar, CreateStashModal, and StashDiffView"
```

---

### Task 6: Frontend Merge & Rebase Modals and Checkout Conflict Integration

**Files:**
- Create: `src/components/merge/MergeBranchModal.tsx`, `src/components/merge/RebaseBranchModal.tsx`
- Modify: `src/components/sidebar/BranchSidebar.tsx`, `src/components/sidebar/CheckoutConflictModal.tsx`
- Test: `src/test/MergeRebaseModals.test.tsx`

**Interfaces:**
- Consumes: `invokeCommand.mergeBranch`, `invokeCommand.rebaseBranch`, `invokeCommand.saveStash`, `invokeCommand.checkoutBranch`
- Produces: User-friendly confirmation modals for Merge and Rebase, and 1-click "Stash & Checkout" button.

- [ ] **Step 1: Write the failing component test in `src/test/MergeRebaseModals.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { MergeBranchModal } from "../components/merge/MergeBranchModal";

describe("MergeBranchModal Component", () => {
  it("renders source and target branch and calls onMerge", async () => {
    const handleMerge = vi.fn().mockResolvedValue({ success: true, status: "Merged", output: "" });
    const handleClose = vi.fn();

    render(
      <MergeBranchModal
        isOpen={true}
        onClose={handleClose}
        currentBranch="main"
        targetBranch="feature/login"
        hasUncommittedChanges={false}
        onMerge={handleMerge}
      />
    );

    expect(screen.getByText(/Gộp nhánh/i)).toBeInTheDocument();
    expect(screen.getByText("feature/login")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();

    const mergeBtn = screen.getByRole("button", { name: /Gộp nhánh/i });
    fireEvent.click(mergeBtn);

    await waitFor(() => {
      expect(handleMerge).toHaveBeenCalledWith(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/MergeRebaseModals.test.tsx`
Expected: FAIL (Cannot find module `MergeBranchModal`)

- [ ] **Step 3: Implement `MergeBranchModal.tsx`, `RebaseBranchModal.tsx`, and update `CheckoutConflictModal.tsx`**

1. Create `src/components/merge/MergeBranchModal.tsx`:
   - Visual branch direction: `targetBranch` $\rightarrow$ `currentBranch`.
   - Fast-forward vs `--no-ff` toggle checkbox.
   - Warning banner if working tree is dirty (`hasUncommittedChanges === true`).

2. Create `src/components/merge/RebaseBranchModal.tsx`:
   - Clear warning: *"Các commit của [currentBranch] sẽ được viết lại trên đỉnh [targetBranch]."*
   - Requires clean working tree.

3. Update `src/components/sidebar/BranchSidebar.tsx`:
   - In branch context/more menu (`MoreVertical`): Add **"Gộp vào nhánh hiện tại..."** and **"Rebase nhánh hiện tại lên đây..."**.
   - Wire up `MergeBranchModal` and `RebaseBranchModal`.

4. Update `src/components/sidebar/CheckoutConflictModal.tsx`:
   - Add button: **"Lưu tạm (Stash) rồi chuyển nhánh"**.
   - Handler: calls `invokeCommand.saveStash(repoPath, "Tự động lưu trước khi chuyển sang " + targetBranch, true)` then calls `checkoutBranch(targetBranch)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/MergeRebaseModals.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/merge/MergeBranchModal.tsx src/components/merge/RebaseBranchModal.tsx src/components/sidebar/BranchSidebar.tsx src/components/sidebar/CheckoutConflictModal.tsx src/test/MergeRebaseModals.test.tsx
git commit -m "feat(m4): add Merge and Rebase modals and Stash-and-checkout action"
```

---

### Task 7: Frontend In-Progress Operation Banner & End-to-End Verification

**Files:**
- Create: `src/components/banner/InProgressOperationBanner.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/InProgressOperationBanner.test.tsx`

**Interfaces:**
- Consumes: `invokeCommand.getRepoState`, `invokeCommand.abortInProgress`, `invokeCommand.continueInProgress`
- Produces: Persistent warning banner at top of UI with Abort and Continue actions.

- [ ] **Step 1: Write the failing component test in `src/test/InProgressOperationBanner.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { InProgressOperationBanner } from "../components/banner/InProgressOperationBanner";
import { RepoStateInfo } from "../ipc/bindings";

describe("InProgressOperationBanner Component", () => {
  const mockState: RepoStateInfo = {
    state: "merge",
    is_in_progress: true,
    head_name: "main",
    target_name: "feature",
    conflict_count: 2,
  };

  it("renders banner when operation is in progress with abort button", async () => {
    const handleAbort = vi.fn().mockResolvedValue(undefined);
    const handleContinue = vi.fn().mockResolvedValue(undefined);

    render(
      <InProgressOperationBanner
        repoState={mockState}
        onAbort={handleAbort}
        onContinue={handleContinue}
        onNavigateToChanges={vi.fn()}
      />
    );

    expect(screen.getByText(/Đang trong quá trình Merge/i)).toBeInTheDocument();
    expect(screen.getByText(/2 file bị xung đột/i)).toBeInTheDocument();

    const abortBtn = screen.getByRole("button", { name: /Huỷ bỏ/i });
    fireEvent.click(abortBtn);

    await waitFor(() => {
      expect(handleAbort).toHaveBeenCalledWith("merge");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/InProgressOperationBanner.test.tsx`
Expected: FAIL (Cannot find module `InProgressOperationBanner`)

- [ ] **Step 3: Implement `InProgressOperationBanner.tsx` and wire into `src/App.tsx`**

1. Create `src/components/banner/InProgressOperationBanner.tsx`:
   - Show only if `repoState?.is_in_progress`.
   - Alert styling (warm warning background `#FEF3C7` / `#78350F` in dark).
   - Show operation name (Merge / Rebase).
   - Conflict count badge.
   - Nút **Huỷ bỏ (Abort)**.
   - Nút **Xem file xung đột** (chuyển sang `ChangesScreen`).
   - Nút **Tiếp tục (Continue)** (disabled nếu `conflict_count > 0`).

2. Update `src/App.tsx`:
   - Query `["repo_state", currentRepo?.path]` using `invokeCommand.getRepoState`.
   - Place `<InProgressOperationBanner />` under `RepoHeader`.
   - On Abort/Continue: invalidate `queryClient`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/InProgressOperationBanner.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full verification suite (Rust + Frontend)**

Run:
1. `cargo test --manifest-path src-tauri/Cargo.toml` (all backend unit & integration tests)
2. `pnpm test` (all Vitest frontend tests)
3. `pnpm run build` (TypeScript compiler & Vite production bundle check)

Expected: All tests PASS, build succeeds with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/banner/InProgressOperationBanner.tsx src/App.tsx src/test/InProgressOperationBanner.test.tsx
git commit -m "feat(m4): mount InProgressOperationBanner and complete M4.1 verification"
```
