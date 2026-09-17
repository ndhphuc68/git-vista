# Cherry-Pick & Revert Commit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate Cherry-Pick and Revert commit capabilities into GitVista across Rust backend, Specta IPC, React modals, CommitGraph context menu, and conflict resolution routing.

**Architecture:** Hybrid engine (libgit2 pre-flight safety checks and undo backup receipts + Git CLI execution), Specta IPC commands (`cherry_pick_commit`, `revert_commit`), typed frontend bindings and mock fallbacks, `CherryPickModal` and `RevertModal` with auto-commit toggle, toast undo lifecycle (10s countdown), and automatic routing to Changes screen upon conflicts.

**Tech Stack:** Rust 2021 (git2 0.21, tauri v2, specta), React 19, TypeScript, Tailwind CSS, TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-17-cherry-pick-revert-design.md`

## Global Constraints

- Use Gitmoji for all commit messages: `<emoji> <short description>` without Conventional Commit prefixes (`feat:`, `fix:`) and without parenthesized scopes.
- All commands must be validated with `crate::exec::validate_git_operand`.
- Automated tests must accompany every layer (Rust backend integration tests in `tests/commit_actions_test.rs`, frontend tests in Vitest).
- Working tree and index must remain safe: backup receipts created via `create_backup_ref` for undo support.

---

### Task 1: Backend Rust Commit Actions Engine (`src-tauri/src/exec/commit_actions.rs`)

**Files:**
- Create: `src-tauri/src/exec/commit_actions.rs`
- Modify: `src-tauri/src/exec/mod.rs`
- Test: `src-tauri/tests/commit_actions_test.rs`

**Interfaces:**
- Consumes:
  - `crate::error::AppError`
  - `crate::exec::validate_git_operand`
  - `crate::write::backup::create_backup_ref`
- Produces:
  - `pub struct CommitActionResult { pub success: bool, pub status: String, pub new_commit_id: Option<String>, pub undo_token: Option<String>, pub output: String }`
  - `pub fn git_cherry_pick<P: AsRef<Path>>(repo_path: P, commit_id: &str, auto_commit: bool) -> Result<CommitActionResult, AppError>`
  - `pub fn git_revert<P: AsRef<Path>>(repo_path: P, commit_id: &str, auto_commit: bool) -> Result<CommitActionResult, AppError>`

- [ ] **Step 1: Write failing integration tests in `src-tauri/tests/commit_actions_test.rs`**

```rust
use std::fs;
use std::path::Path;
use std::process::Command;
use tempfile::TempDir;
use visual_git_lib::exec::commit_actions::{git_cherry_pick, git_revert};

fn setup_repo() -> (TempDir, String, String) {
    let dir = TempDir::new().unwrap();
    let repo_path = dir.path();

    let run = |args: &[&str]| {
        let output = Command::new("git")
            .current_dir(repo_path)
            .args(args)
            .output()
            .unwrap();
        assert!(output.status.success(), "Git command failed: {:?}", args);
    };

    run(&["init"]);
    run(&["config", "user.name", "Test User"]);
    run(&["config", "user.email", "test@gitvista.dev"]);

    // Initial commit on main
    fs::write(repo_path.join("file1.txt"), "hello\n").unwrap();
    run(&["add", "file1.txt"]);
    run(&["commit", "-m", "initial commit"]);

    // Create feature branch and commit
    run(&["checkout", "-b", "feature"]);
    fs::write(repo_path.join("feature.txt"), "feature data\n").unwrap();
    run(&["add", "feature.txt"]);
    run(&["commit", "-m", "feature commit"]);

    let feature_commit = String::from_utf8(
        Command::new("git")
            .current_dir(repo_path)
            .args(["rev-parse", "HEAD"])
            .output()
            .unwrap()
            .stdout,
    )
    .unwrap()
    .trim()
    .to_string();

    // Switch back to main
    run(&["checkout", "main"]);

    // Create commit on main
    fs::write(repo_path.join("main_extra.txt"), "main data\n").unwrap();
    run(&["add", "main_extra.txt"]);
    run(&["commit", "-m", "main extra"]);

    let main_commit = String::from_utf8(
        Command::new("git")
            .current_dir(repo_path)
            .args(["rev-parse", "HEAD"])
            .output()
            .unwrap()
            .stdout,
    )
    .unwrap()
    .trim()
    .to_string();

    (dir, feature_commit, main_commit)
}

#[test]
fn test_cherry_pick_clean_auto_commit() {
    let (dir, feature_commit, _) = setup_repo();
    let res = git_cherry_pick(dir.path(), &feature_commit, true).unwrap();
    assert!(res.success);
    assert_eq!(res.status, "Committed");
    assert!(res.new_commit_id.is_some());
    assert!(res.undo_token.is_some());
    assert!(dir.path().join("feature.txt").exists());
}

#[test]
fn test_cherry_pick_no_commit() {
    let (dir, feature_commit, _) = setup_repo();
    let res = git_cherry_pick(dir.path(), &feature_commit, false).unwrap();
    assert!(res.success);
    assert_eq!(res.status, "Staged");
    assert!(dir.path().join("feature.txt").exists());
}

#[test]
fn test_revert_clean_auto_commit() {
    let (dir, _, main_commit) = setup_repo();
    let res = git_revert(dir.path(), &main_commit, true).unwrap();
    assert!(res.success);
    assert_eq!(res.status, "Committed");
    assert!(res.new_commit_id.is_some());
    assert!(res.undo_token.is_some());
    assert!(!dir.path().join("main_extra.txt").exists());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test commit_actions_test`
Expected: FAIL with "cannot find module or function `commit_actions`"

- [ ] **Step 3: Implement `src-tauri/src/exec/commit_actions.rs` and expose in `src-tauri/src/exec/mod.rs`**

```rust
// src-tauri/src/exec/commit_actions.rs
use crate::error::AppError;
use crate::write::create_backup_ref;
use git2::{Oid, Repository, RepositoryState};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct CommitActionResult {
    pub success: bool,
    pub status: String, // "Committed" | "Staged" | "Conflict" | "Error"
    pub new_commit_id: Option<String>,
    pub undo_token: Option<String>,
    pub output: String,
}

#[derive(Serialize, Deserialize)]
struct CommitRecovery {
    head_ref: String,
    before: Option<String>,
    after: String,
}

fn head_ref_name(repo: &Repository) -> Result<String, AppError> {
    let head = repo.find_reference("HEAD")?;
    Ok(head.symbolic_target()?.unwrap_or("HEAD").to_string())
}

fn create_undo_token(repo: &Repository, head_ref: &str, before_oid: Option<Oid>, after_oid: Oid) -> Result<String, AppError> {
    let sig = repo.signature().map_err(|_| {
        AppError::InvalidOperation("Git user.name or user.email not configured".to_string())
    })?;
    let recovery = CommitRecovery {
        head_ref: head_ref.to_string(),
        before: before_oid.map(|o| o.to_string()),
        after: after_oid.to_string(),
    };
    let message = serde_json::to_string(&recovery).map_err(|e| AppError::Io(e.to_string()))?;
    let after_commit = repo.find_commit(after_oid)?;
    let tree = after_commit.tree()?;
    let mut parents = vec![&after_commit];
    let before_commit_holder;
    if let Some(b) = before_oid {
        if let Ok(bc) = repo.find_commit(b) {
            before_commit_holder = bc;
            parents.push(&before_commit_holder);
        }
    }
    let receipt = repo.commit(None, &sig, &sig, &message, &tree, &parents)?;
    static NEXT: AtomicU64 = AtomicU64::new(0);
    let unique = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
    let action = format!("commit-undo-{}-{}-{}", std::process::id(), unique, NEXT.fetch_add(1, Ordering::Relaxed));
    create_backup_ref(repo, &action, receipt)
}

pub fn git_cherry_pick<P: AsRef<Path>>(
    repo_path: P,
    commit_id: &str,
    auto_commit: bool,
) -> Result<CommitActionResult, AppError> {
    crate::exec::validate_git_operand(commit_id, "commit_id")?;
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.state() != RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "Repository has unfinished operations. Please resolve or abort them first.".into(),
        ));
    }

    let target_oid = Oid::from_str(commit_id.trim())?;
    let _ = repo.find_commit(target_oid)?;

    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let before_oid = head_commit.as_ref().map(|c| c.id());
    let head_ref = head_ref_name(&repo)?;

    create_backup_ref(&repo, "cherry-pick", target_oid)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref()).arg("cherry-pick");

    if !auto_commit {
        cmd.arg("--no-commit");
    }
    cmd.arg(commit_id.trim());

    let output = cmd.output().map_err(|e| AppError::Io(e.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    if output.status.success() {
        if auto_commit {
            let fresh_repo = Repository::open(repo_path.as_ref())?;
            let new_head = fresh_repo.head()?.peel_to_commit()?.id();
            let undo_token = create_undo_token(&fresh_repo, &head_ref, before_oid, new_head).ok();
            Ok(CommitActionResult {
                success: true,
                status: "Committed".into(),
                new_commit_id: Some(new_head.to_string()),
                undo_token,
                output: combined,
            })
        } else {
            Ok(CommitActionResult {
                success: true,
                status: "Staged".into(),
                new_commit_id: None,
                undo_token: None,
                output: combined,
            })
        }
    } else {
        let is_conflict = combined.contains("CONFLICT")
            || combined.contains("could not apply")
            || combined.contains("Automatic cherry-pick failed");
        let status = if is_conflict { "Conflict" } else { "Error" };
        Ok(CommitActionResult {
            success: false,
            status: status.into(),
            new_commit_id: None,
            undo_token: None,
            output: combined,
        })
    }
}

pub fn git_revert<P: AsRef<Path>>(
    repo_path: P,
    commit_id: &str,
    auto_commit: bool,
) -> Result<CommitActionResult, AppError> {
    crate::exec::validate_git_operand(commit_id, "commit_id")?;
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.state() != RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "Repository has unfinished operations. Please resolve or abort them first.".into(),
        ));
    }

    let target_oid = Oid::from_str(commit_id.trim())?;
    let _ = repo.find_commit(target_oid)?;

    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let before_oid = head_commit.as_ref().map(|c| c.id());
    let head_ref = head_ref_name(&repo)?;

    create_backup_ref(&repo, "revert", target_oid)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref()).arg("revert");

    if !auto_commit {
        cmd.arg("--no-commit");
    } else {
        cmd.arg("--no-edit");
    }
    cmd.arg(commit_id.trim());

    let output = cmd.output().map_err(|e| AppError::Io(e.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    if output.status.success() {
        if auto_commit {
            let fresh_repo = Repository::open(repo_path.as_ref())?;
            let new_head = fresh_repo.head()?.peel_to_commit()?.id();
            let undo_token = create_undo_token(&fresh_repo, &head_ref, before_oid, new_head).ok();
            Ok(CommitActionResult {
                success: true,
                status: "Committed".into(),
                new_commit_id: Some(new_head.to_string()),
                undo_token,
                output: combined,
            })
        } else {
            Ok(CommitActionResult {
                success: true,
                status: "Staged".into(),
                new_commit_id: None,
                undo_token: None,
                output: combined,
            })
        }
    } else {
        let is_conflict = combined.contains("CONFLICT")
            || combined.contains("could not revert")
            || combined.contains("Automatic revert failed");
        let status = if is_conflict { "Conflict" } else { "Error" };
        Ok(CommitActionResult {
            success: false,
            status: status.into(),
            new_commit_id: None,
            undo_token: None,
            output: combined,
        })
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test commit_actions_test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/exec/commit_actions.rs src-tauri/src/exec/mod.rs src-tauri/tests/commit_actions_test.rs
git commit -m "✨ add cherry-pick and revert backend engine"
```

---

### Task 2: Backend State Extraction & Specta Commands (`src-tauri/src/commands/commit_actions.rs`)

**Files:**
- Modify: `src-tauri/src/read/state.rs:38-57`
- Create: `src-tauri/src/commands/commit_actions.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes:
  - `visual_git_lib::exec::commit_actions::{git_cherry_pick, git_revert, CommitActionResult}`
- Produces:
  - `pub fn cherry_pick_commit(app: tauri::AppHandle, repo_path: String, commit_id: String, auto_commit: Option<bool>) -> Result<CommitActionResult, AppError>`
  - `pub fn revert_commit(app: tauri::AppHandle, repo_path: String, commit_id: String, auto_commit: Option<bool>) -> Result<CommitActionResult, AppError>`

- [ ] **Step 1: Write failing unit test in `src-tauri/tests/commit_actions_test.rs` testing conflict & abort**

```rust
#[test]
fn test_cherry_pick_conflict_and_abort() {
    let (dir, feature_commit, _) = setup_repo();
    // Intentionally write conflicting content in main
    fs::write(dir.path().join("feature.txt"), "conflicting main data\n").unwrap();
    let run = |args: &[&str]| {
        let output = Command::new("git")
            .current_dir(dir.path())
            .args(args)
            .output()
            .unwrap();
        assert!(output.status.success());
    };
    run(&["add", "feature.txt"]);
    run(&["commit", "-m", "conflict setup"]);

    let res = git_cherry_pick(dir.path(), &feature_commit, true).unwrap();
    assert!(!res.success);
    assert_eq!(res.status, "Conflict");

    let state = visual_git_lib::read::state::get_repo_state(dir.path()).unwrap();
    assert_eq!(state.state, "cherry_pick");
    assert!(state.is_in_progress);

    // Test aborting the in-progress cherry-pick
    visual_git_lib::exec::merge::git_abort_operation(dir.path(), "cherry_pick").unwrap();
    let clean_state = visual_git_lib::read::state::get_repo_state(dir.path()).unwrap();
    assert_eq!(clean_state.state, "clean");
}
```

- [ ] **Step 2: Run test to verify it passes with state detection**

Run: `cargo test --test commit_actions_test test_cherry_pick_conflict_and_abort`
Expected: PASS

- [ ] **Step 3: Update `src-tauri/src/read/state.rs` to extract `target_name` for cherry_pick and revert**

```rust
    if state_str == "merge" {
        if let Ok(msg) = fs::read_to_string(git_dir.join("MERGE_MSG")) {
            if let Some(line) = msg.lines().next() {
                target_name = Some(
                    line.trim_start_matches("Merge branch ")
                        .replace('\'', "")
                        .to_string(),
                );
            }
        }
    } else if state_str == "rebase" {
        if let Ok(onto) = fs::read_to_string(git_dir.join("rebase-merge").join("onto_name")) {
            target_name = Some(onto.trim().to_string());
        } else if let Ok(onto) = fs::read_to_string(git_dir.join("rebase-apply").join("onto")) {
            target_name = Some(onto.trim().to_string());
        }
    } else if state_str == "cherry_pick" {
        if let Ok(msg) = fs::read_to_string(git_dir.join("MERGE_MSG")) {
            if let Some(line) = msg.lines().next() {
                target_name = Some(line.trim().to_string());
            }
        } else if let Ok(head) = fs::read_to_string(git_dir.join("CHERRY_PICK_HEAD")) {
            target_name = Some(head.trim().chars().take(7).collect());
        }
    } else if state_str == "revert" {
        if let Ok(msg) = fs::read_to_string(git_dir.join("MERGE_MSG")) {
            if let Some(line) = msg.lines().next() {
                target_name = Some(line.trim().to_string());
            }
        } else if let Ok(head) = fs::read_to_string(git_dir.join("REVERT_HEAD")) {
            target_name = Some(head.trim().chars().take(7).collect());
        }
    }
```

- [ ] **Step 4: Create `src-tauri/src/commands/commit_actions.rs` and register in `commands/mod.rs` & `lib.rs`**

```rust
// src-tauri/src/commands/commit_actions.rs
use crate::error::AppError;
use crate::exec::commit_actions::{self, CommitActionResult};
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
pub fn cherry_pick_commit(
    app: tauri::AppHandle,
    repo_path: String,
    commit_id: String,
    auto_commit: Option<bool>,
) -> Result<CommitActionResult, AppError> {
    let res = commit_actions::git_cherry_pick(&repo_path, &commit_id, auto_commit.unwrap_or(true))?;
    emit_repo_changed(&app, &repo_path, "cherry_pick_commit");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub fn revert_commit(
    app: tauri::AppHandle,
    repo_path: String,
    commit_id: String,
    auto_commit: Option<bool>,
) -> Result<CommitActionResult, AppError> {
    let res = commit_actions::git_revert(&repo_path, &commit_id, auto_commit.unwrap_or(true))?;
    emit_repo_changed(&app, &repo_path, "revert_commit");
    Ok(res)
}
```

Register `cherry_pick_commit` and `revert_commit` in `src-tauri/src/lib.rs` under `create_specta_builder()`.

- [ ] **Step 5: Run tests across backend**

Run: `cargo test`
Expected: 100% PASS

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/read/state.rs src-tauri/src/commands/commit_actions.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "✨ add cherry-pick and revert IPC commands"
```

---

### Task 3: Frontend IPC Bindings & Client (`src/ipc/bindings.ts` & `src/ipc/client.ts`)

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Test: `src/test/ipcCommitActions.test.ts`

**Interfaces:**
- Consumes: Backend IPC commands `cherry_pick_commit` and `revert_commit`.
- Produces:
  - `export interface CommitActionResult { success: boolean; status: string; new_commit_id?: string | null; undo_token?: string | null; output: string; }`
  - `invokeCommand.cherryPickCommit(repoPath: string, commitId: string, autoCommit?: boolean): Promise<CommitActionResult>`
  - `invokeCommand.revertCommit(repoPath: string, commitId: string, autoCommit?: boolean): Promise<CommitActionResult>`

- [ ] **Step 1: Write unit test in `src/test/ipcCommitActions.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC Commit Actions (Mock Client)", () => {
  it("cherryPickCommit returns Committed status with mock data when autoCommit is true", async () => {
    const res = await invokeCommand.cherryPickCommit("test-repo", "abc1234", true);
    expect(res.success).toBe(true);
    expect(res.status).toBe("Committed");
    expect(res.new_commit_id).toBeDefined();
    expect(res.undo_token).toBeDefined();
  });

  it("cherryPickCommit returns Staged status when autoCommit is false", async () => {
    const res = await invokeCommand.cherryPickCommit("test-repo", "abc1234", false);
    expect(res.success).toBe(true);
    expect(res.status).toBe("Staged");
  });

  it("revertCommit returns Committed status with mock data", async () => {
    const res = await invokeCommand.revertCommit("test-repo", "abc1234", true);
    expect(res.success).toBe(true);
    expect(res.status).toBe("Committed");
    expect(res.new_commit_id).toBeDefined();
    expect(res.undo_token).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/ipcCommitActions.test.ts`
Expected: FAIL with `invokeCommand.cherryPickCommit is not a function`

- [ ] **Step 3: Update `src/ipc/bindings.ts` and `src/ipc/client.ts`**

Add `CommitActionResult` interface to `src/ipc/bindings.ts`:
```typescript
export interface CommitActionResult {
  success: boolean;
  status: "Committed" | "Staged" | "Conflict" | "Error" | string;
  new_commit_id?: string | null;
  undo_token?: string | null;
  output: string;
}
```

Implement `cherryPickCommit` and `revertCommit` in `invokeCommand` (`src/ipc/client.ts`) with mock fallbacks:
```typescript
  cherryPickCommit: async (
    repoPath: string,
    commitId: string,
    autoCommit: boolean = true
  ): Promise<CommitActionResult> => {
    if (!isTauri()) {
      return {
        success: true,
        status: autoCommit ? "Committed" : "Staged",
        new_commit_id: autoCommit ? "mock_cherry_pick_" + commitId.slice(0, 7) : null,
        undo_token: autoCommit ? "refs/gitui-backup/commit-undo-mock" : null,
        output: "Mock cherry-pick output",
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<CommitActionResult>("cherry_pick_commit", {
      repoPath,
      commitId,
      autoCommit,
    });
  },

  revertCommit: async (
    repoPath: string,
    commitId: string,
    autoCommit: boolean = true
  ): Promise<CommitActionResult> => {
    if (!isTauri()) {
      return {
        success: true,
        status: autoCommit ? "Committed" : "Staged",
        new_commit_id: autoCommit ? "mock_revert_" + commitId.slice(0, 7) : null,
        undo_token: autoCommit ? "refs/gitui-backup/commit-undo-mock" : null,
        output: "Mock revert output",
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<CommitActionResult>("revert_commit", {
      repoPath,
      commitId,
      autoCommit,
    });
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/ipcCommitActions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ipc/bindings.ts src/ipc/client.ts src/test/ipcCommitActions.test.ts
git commit -m "✨ add IPC bindings and client for cherry-pick and revert"
```

---

### Task 4: Translations & Modals (`CherryPickModal.tsx`, `RevertModal.tsx`)

**Files:**
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Create: `src/components/modals/CherryPickModal.tsx`
- Create: `src/components/modals/RevertModal.tsx`
- Test: `src/test/CherryPickModal.test.tsx`
- Test: `src/test/RevertModal.test.tsx`

**Interfaces:**
- `CherryPickModalProps`: `{ isOpen: boolean; onClose: () => void; repoPath: string; targetCommit: { id: string; short_id: string; summary: string; author: string; time?: string }; currentBranch: string; onSuccess: (result: CommitActionResult) => void; }`
- `RevertModalProps`: `{ isOpen: boolean; onClose: () => void; repoPath: string; targetCommit: { id: string; short_id: string; summary: string; author: string }; onSuccess: (result: CommitActionResult) => void; }`

- [ ] **Step 1: Add i18n keys in `vi.ts` and `en.ts`**

Add keys under `t.modals.cherryPick` and `t.modals.revert`, as well as `t.graph.cherryPickHere` and `t.graph.revertHere`.

- [ ] **Step 2: Write tests in `src/test/CherryPickModal.test.tsx` and `src/test/RevertModal.test.tsx`**

Test rendering of commit SHA, summary, author, destination branch, auto-commit toggle, and submission.

- [ ] **Step 3: Implement `CherryPickModal.tsx` and `RevertModal.tsx`**

Create accessible, Tailwind-styled modals matching existing `CreateTagModal` design patterns with loading spinners and error display.

- [ ] **Step 4: Run component tests**

Run: `pnpm test src/test/CherryPickModal.test.tsx src/test/RevertModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/i18n/vi.ts src/i18n/en.ts src/components/modals/CherryPickModal.tsx src/components/modals/RevertModal.tsx src/test/CherryPickModal.test.tsx src/test/RevertModal.test.tsx
git commit -m "✨ create CherryPickModal and RevertModal with i18n support"
```

---

### Task 5: Context Menu Integration in `CommitGraph.tsx` & Conflict Navigation

**Files:**
- Modify: `src/components/graph/CommitGraph.tsx`
- Test: `src/test/CommitGraphContextMenu.test.tsx`

**Interfaces:**
- Consumes:
  - `CherryPickModal`
  - `RevertModal`
  - `useNavigationStore` (`setActiveScreen`)
  - `useToastStore` (`addToast`)
- Produces: Context menu items for Cherry-Pick and Revert; triggers toast with Undo action on commit success; navigates to Changes on conflict/staged.

- [ ] **Step 1: Write integration tests in `src/test/CommitGraphContextMenu.test.tsx`**

Add tests verifying:
- Right-clicking commit row shows "Cherry-pick vào nhánh hiện tại" and "Hoàn tác (Revert) commit này".
- Clicking them opens `CherryPickModal` and `RevertModal`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/CommitGraphContextMenu.test.tsx`
Expected: FAIL (menu items not found)

- [ ] **Step 3: Implement context menu items and modal handlers in `src/components/graph/CommitGraph.tsx`**

1. Add state: `cherryPickCommit: GraphCommitNode | null` and `revertCommit: GraphCommitNode | null`.
2. In context menu JSX, add buttons for Cherry-pick and Revert.
3. Render `CherryPickModal` and `RevertModal`.
4. In `onSuccess`:
   - If `status === "Committed"`: Invalidate queries, trigger Toast with `undo_token` action.
   - If `status === "Staged"`: Invalidate queries, dispatch info toast, call `setActiveScreen("changes")`.
   - If `status === "Conflict"`: Invalidate queries, dispatch warning toast, call `setActiveScreen("changes")`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/test/CommitGraphContextMenu.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/graph/CommitGraph.tsx src/test/CommitGraphContextMenu.test.tsx
git commit -m "✨ integrate cherry-pick and revert context menus in CommitGraph"
```

---

### Task 6: Comprehensive Verification & Roadmap Update

**Files:**
- Modify: `docs/ROADMAP_STATUS.md`

- [ ] **Step 1: Run Rust test suite**

Run: `cargo test`
Expected: All suites pass 100%.

- [ ] **Step 2: Run Frontend Vitest suite**

Run: `pnpm test`
Expected: All test suites pass 100%.

- [ ] **Step 3: Run Product packaging build**

Run: `pnpm build`
Expected: Clean build, 0 errors, 0 warnings.

- [ ] **Step 4: Update `docs/ROADMAP_STATUS.md`**

Update Phase 1.1 status to 100% completed, mark 1.1.3 (Cherry-pick & Revert Commit) as ✅ Đã hoàn thành.

- [ ] **Step 5: Commit**

```bash
git add docs/ROADMAP_STATUS.md
git commit -m "📝 update roadmap status to mark cherry-pick and revert complete"
```
