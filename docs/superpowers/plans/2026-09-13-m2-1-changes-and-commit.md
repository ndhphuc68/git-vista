# Milestone M2.1: Changes Screen, Staging & Commit, Filesystem Watcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Milestone M2.1 of Visual Git Client: realtime filesystem watcher (`notify`), working tree status and diff, flexible staging (file, hunk, line), safe commit & amend with backup refs, and a 2-column Changes screen with keyboard shortcuts.

**Architecture:** Rust backend (`read/status.rs`, `write/staging.rs`, `write/commit.rs`, `repo/watcher.rs`) uses `libgit2` and `notify` to provide reactive filesystem watching, diffing, in-process index staging via `git2::Apply`, and commit creation with `refs/gitui-backup/` safety; React frontend (`@tanstack/react-query`, Zustand, Tailwind CSS) renders a 2-column layout (left: file list & commit box, right: interactive hunk/line diff viewer) with zero Git state stored in frontend.

**Tech Stack:** Tauri 2, Rust (`git2 = "0.20"`, `notify = "8"`, `tokio`, `tauri-specta`), React 19, TypeScript, `@tanstack/react-query`, Zustand, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-13-m2-1-changes-and-commit-design.md` & `docs/superpowers/specs/2026-09-12-visual-git-client-design.md`.

## Global Constraints

- Strictly read-only in `src-tauri/src/read/`.
- All writes in `src-tauri/src/write/` execute 100% in-process via `libgit2`.
- Amend commit operations MUST create a backup reference in `refs/gitui-backup/amend-<timestamp>` before updating HEAD.
- Discard file changes MUST require explicit user confirmation before checkout.
- Watcher MUST debounce 200ms and exclude `.git/objects/**` and `.git/index.lock`.
- No BigInt in Specta/IPC structs (use `u32` for line indices/counts, `f64` for timestamp_ms).
- All diff colors and UI contrast ratios must satisfy WCAG AA $\ge 4.5:1$.
- 100% tests passing in `cargo test` and `pnpm test`.

---

### Task 1: Working Tree Status Models & Status Reader (Backend `read/status.rs`)

**Files:**
- Create: `src-tauri/src/read/status.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Test: `src-tauri/tests/m2_status_test.rs`

**Interfaces:**
- Produces:
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
  pub enum FileStatus {
      Modified,
      New,
      Deleted,
      Renamed,
      Typechange,
  }

  #[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
  pub struct StatusFileItem {
      pub path: String,
      pub status: FileStatus,
      pub is_staged: bool,
      pub old_path: Option<String>,
  }

  #[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
  pub struct RepoStatusResult {
      pub staged: Vec<StatusFileItem>,
      pub unstaged: Vec<StatusFileItem>,
      pub untracked: Vec<StatusFileItem>,
  }

  pub fn get_repo_status<P: AsRef<Path>>(repo_path: P) -> Result<RepoStatusResult, AppError>;
  ```

- [ ] **Step 1: Write failing integration test in `src-tauri/tests/m2_status_test.rs`**
  ```rust
  mod common;
  use common::fixtures::TestRepoFixture;
  use visual_git_lib::read::status::{get_repo_status, FileStatus};
  use std::fs;

  #[test]
  fn test_get_repo_status_classifies_files() {
      let fixture = TestRepoFixture::new();
      let repo_path = fixture.path();

      // Modify existing file
      fs::write(repo_path.join("file1.txt"), "modified content").unwrap();
      // Add untracked file
      fs::write(repo_path.join("untracked.txt"), "new file").unwrap();

      let status = get_repo_status(repo_path).expect("status should succeed");
      assert_eq!(status.unstaged.len(), 1);
      assert_eq!(status.unstaged[0].path, "file1.txt");
      assert_eq!(status.unstaged[0].status, FileStatus::Modified);

      assert_eq!(status.untracked.len(), 1);
      assert_eq!(status.untracked[0].path, "untracked.txt");
      assert_eq!(status.untracked[0].status, FileStatus::New);

      assert_eq!(status.staged.len(), 0);
  }
  ```

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m2_status_test`
  Expected: FAIL with "unresolved import visual_git_lib::read::status"

- [ ] **Step 3: Implement `src-tauri/src/read/status.rs`**
  Implement `get_repo_status` using `git2::Repository::open` and `repo.statuses()` with `include_untracked(true)` and `renames_head_to_index(true)`. Map flags (`git2::Status::INDEX_*` to `staged`, `git2::Status::WT_*` to `unstaged` or `untracked`).
  Export `pub mod status;` in `src-tauri/src/read/mod.rs`.

- [ ] **Step 4: Run test to confirm it passes**
  Run: `cargo test --test m2_status_test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/read/status.rs src-tauri/src/read/mod.rs src-tauri/tests/m2_status_test.rs
  git commit -m "feat(m2.1): implement get_repo_status in read/status.rs"
  ```

---

### Task 2: Working Tree Diff for Staged and Unstaged Files (Backend `read/status.rs`)

**Files:**
- Modify: `src-tauri/src/read/status.rs`
- Modify: `src-tauri/src/read/diff.rs`
- Modify: `src-tauri/tests/m2_status_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn get_working_file_diff<P: AsRef<Path>>(
      repo_path: P,
      file_path: &str,
      is_staged: bool,
  ) -> Result<FileDiffResult, AppError>;
  ```

- [ ] **Step 1: Write failing test in `src-tauri/tests/m2_status_test.rs` for working tree diff**
  ```rust
  #[test]
  fn test_get_working_file_diff_unstaged_and_staged() {
      let fixture = TestRepoFixture::new();
      let repo_path = fixture.path();
      fs::write(repo_path.join("file1.txt"), "line1\nline2\nnew line 3\n").unwrap();

      // Unstaged diff
      let diff = visual_git_lib::read::status::get_working_file_diff(repo_path, "file1.txt", false)
          .expect("unstaged diff should succeed");
      assert_eq!(diff.file_path, "file1.txt");
      assert!(!diff.hunks.is_empty());
      assert!(diff.lines_added > 0 || diff.lines_removed > 0);
  }
  ```

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m2_status_test test_get_working_file_diff_unstaged_and_staged`
  Expected: FAIL with "no function `get_working_file_diff`"

- [ ] **Step 3: Implement `get_working_file_diff` in `src-tauri/src/read/status.rs`**
  - If `is_staged == false`: use `repo.diff_index_to_workdir(Some(&index), Some(&mut diff_opts))` with `pathspec = file_path`.
  - If `is_staged == true`: get HEAD commit tree (or None if unborn HEAD); use `repo.diff_tree_to_index(head_tree.as_ref(), Some(&index), Some(&mut diff_opts))` with `pathspec = file_path`.
  - Convert the `git2::Diff` to `FileDiffResult` using the diff parsing helper from `src-tauri/src/read/diff.rs`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `cargo test --test m2_status_test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/read/status.rs src-tauri/src/read/diff.rs src-tauri/tests/m2_status_test.rs
  git commit -m "feat(m2.1): implement get_working_file_diff for staged and unstaged files"
  ```

---

### Task 3: Staging Operations — File Level & Discard (Backend `write/staging.rs`)

**Files:**
- Create: `src-tauri/src/write/staging.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Test: `src-tauri/tests/m2_staging_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn stage_file<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError>;
  pub fn unstage_file<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError>;
  pub fn stage_all<P: AsRef<Path>>(repo_path: P) -> Result<(), AppError>;
  pub fn unstage_all<P: AsRef<Path>>(repo_path: P) -> Result<(), AppError>;
  pub fn discard_file_changes<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write failing test in `src-tauri/tests/m2_staging_test.rs`**
  ```rust
  mod common;
  use common::fixtures::TestRepoFixture;
  use std::fs;
  use visual_git_lib::read::status::get_repo_status;
  use visual_git_lib::write::staging::{stage_file, unstage_file, stage_all, unstage_all, discard_file_changes};

  #[test]
  fn test_stage_and_unstage_file() {
      let fixture = TestRepoFixture::new();
      let repo_path = fixture.path();
      fs::write(repo_path.join("file1.txt"), "changed content").unwrap();

      // Stage
      stage_file(repo_path, "file1.txt").expect("stage should succeed");
      let status = get_repo_status(repo_path).unwrap();
      assert_eq!(status.staged.len(), 1);
      assert_eq!(status.unstaged.len(), 0);

      // Unstage
      unstage_file(repo_path, "file1.txt").expect("unstage should succeed");
      let status2 = get_repo_status(repo_path).unwrap();
      assert_eq!(status2.staged.len(), 0);
      assert_eq!(status2.unstaged.len(), 1);
  }
  ```

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m2_staging_test`
  Expected: FAIL with "unresolved import `visual_git_lib::write::staging`"

- [ ] **Step 3: Implement `src-tauri/src/write/staging.rs`**
  - `stage_file`: check if file exists on disk. If exists, `index.add_path(path)?`; if removed, `index.remove_path(path)?`. Then `index.write()?`.
  - `unstage_file`: if HEAD exists, `repo.reset_default(Some(&head_obj), &[path])?`; if unborn HEAD, `index.remove_path(path)?` and `index.write()?`.
  - `stage_all`: `index.add_all(["*"], git2::IndexAddOption::DEFAULT, None)?` and `index.write()?`.
  - `unstage_all`: `repo.reset_default(Some(&head_obj), &["*"])?`.
  - `discard_file_changes`: checkout the single file from HEAD: `repo.checkout_head(Some(git2::build::CheckoutBuilder::new().path(file_path).force()))?`.
  - Export `pub mod staging;` in `src-tauri/src/write/mod.rs`.

- [ ] **Step 4: Run test to confirm it passes**
  Run: `cargo test --test m2_staging_test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/write/staging.rs src-tauri/src/write/mod.rs src-tauri/tests/m2_staging_test.rs
  git commit -m "feat(m2.1): implement file-level stage, unstage, and discard"
  ```

---

### Task 4: Hunk and Line Staging via libgit2 Apply (Backend `write/staging.rs`)

**Files:**
- Modify: `src-tauri/src/write/staging.rs`
- Modify: `src-tauri/tests/m2_staging_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn stage_hunk<P: AsRef<Path>>(
      repo_path: P,
      file_path: &str,
      hunk_index: u32,
      is_staged: bool,
  ) -> Result<(), AppError>;

  pub fn stage_lines<P: AsRef<Path>>(
      repo_path: P,
      file_path: &str,
      hunk_index: u32,
      line_indices: &[u32],
      is_staged: bool,
  ) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write failing test in `src-tauri/tests/m2_staging_test.rs` for hunk staging**
  ```rust
  #[test]
  fn test_stage_single_hunk() {
      let fixture = TestRepoFixture::new();
      let repo_path = fixture.path();
      // Create a file with two distinct hunks separated by 20 lines of context
      let mut content = String::from("top hunk line 1\n");
      for i in 0..20 {
          content.push_str(&format!("context line {}\n", i));
      }
      content.push_str("bottom hunk line 1\n");
      fs::write(repo_path.join("file1.txt"), &content).unwrap();

      // Commit initial state
      let mut index = git2::Repository::open(repo_path).unwrap().index().unwrap();
      index.add_path(std::path::Path::new("file1.txt")).unwrap();
      index.write().unwrap();

      // Modify both hunks
      let modified = content.replace("top hunk line 1", "TOP MODIFIED")
                            .replace("bottom hunk line 1", "BOTTOM MODIFIED");
      fs::write(repo_path.join("file1.txt"), modified).unwrap();

      // Stage only hunk 0
      visual_git_lib::write::staging::stage_hunk(repo_path, "file1.txt", 0, false).expect("stage hunk 0");

      let status = get_repo_status(repo_path).unwrap();
      assert_eq!(status.staged.len(), 1);
      assert_eq!(status.unstaged.len(), 1); // still has hunk 1 unstaged!
  }
  ```

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m2_staging_test test_stage_single_hunk`
  Expected: FAIL with "no function `stage_hunk`"

- [ ] **Step 3: Implement `stage_hunk` and `stage_lines` in `src-tauri/src/write/staging.rs`**
  - Use `git2::Diff::from_buffer` or construct a synthetic diff patch string for the target hunk / lines.
  - Apply the diff directly to the index using `repo.apply(&diff, git2::ApplyLocation::Index, None)`.
  - For `is_staged == true` (unstage hunk/lines), apply with reverse option:
    `let mut apply_opts = git2::ApplyOptions::new(); apply_opts.reverse(true); repo.apply(&diff, git2::ApplyLocation::Index, Some(&mut apply_opts))`.

- [ ] **Step 4: Run test to confirm it passes**
  Run: `cargo test --test m2_staging_test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/write/staging.rs src-tauri/tests/m2_staging_test.rs
  git commit -m "feat(m2.1): implement stage_hunk and stage_lines using git2 Apply"
  ```

---

### Task 5: Commit and Amend with Backup Reference (Backend `write/commit.rs`)

**Files:**
- Create: `src-tauri/src/write/commit.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Test: `src-tauri/tests/m2_commit_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn create_commit<P: AsRef<Path>>(
      repo_path: P,
      summary: &str,
      description: Option<&str>,
      amend: bool,
  ) -> Result<crate::read::CommitDetails, AppError>;
  ```

- [ ] **Step 1: Write failing test in `src-tauri/tests/m2_commit_test.rs`**
  ```rust
  mod common;
  use common::fixtures::TestRepoFixture;
  use std::fs;
  use visual_git_lib::write::staging::stage_file;
  use visual_git_lib::write::commit::create_commit;
  use visual_git_lib::read::status::get_repo_status;

  #[test]
  fn test_create_commit_and_amend_with_backup_ref() {
      let fixture = TestRepoFixture::new();
      let repo_path = fixture.path();
      fs::write(repo_path.join("file1.txt"), "new commit content").unwrap();
      stage_file(repo_path, "file1.txt").unwrap();

      // Normal commit
      let commit = create_commit(repo_path, "feat: test new commit", None, false).expect("commit success");
      assert_eq!(commit.summary, "feat: test new commit");
      let status = get_repo_status(repo_path).unwrap();
      assert_eq!(status.staged.len(), 0);

      // Amend commit
      fs::write(repo_path.join("file1.txt"), "amended content").unwrap();
      stage_file(repo_path, "file1.txt").unwrap();
      let amended = create_commit(repo_path, "feat: amended commit", Some("more details"), true).expect("amend success");
      assert_eq!(amended.summary, "feat: amended commit");

      // Verify backup ref exists in refs/gitui-backup/
      let repo = git2::Repository::open(repo_path).unwrap();
      let mut backup_refs = Vec::new();
      for r in repo.references_glob("refs/gitui-backup/amend-*").unwrap() {
          backup_refs.push(r.unwrap().name().unwrap().to_string());
      }
      assert!(!backup_refs.is_empty(), "backup ref should be created before amend");
  }
  ```

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m2_commit_test`
  Expected: FAIL with "unresolved import `visual_git_lib::write::commit`"

- [ ] **Step 3: Implement `src-tauri/src/write/commit.rs`**
  - Open repo, check index: `let mut index = repo.index()?; let tree_oid = index.write_tree()?; let tree = repo.find_tree(tree_oid)?;`.
  - Resolve signature: try `repo.signature()`. If missing, inspect `git2::Config` or return `AppError::InvalidOperation("Git author not configured. Please configure user.name and user.email.")`.
  - Format commit message: `let message = match description { Some(d) if !d.trim().is_empty() => format!("{}\n\n{}", summary.trim(), d.trim()), _ => summary.trim().to_string() };`.
  - If `amend == true`:
    - Call `create_backup_ref(repo_path, "amend")?`.
    - Head commit = `repo.head()?.peel_to_commit()?`.
    - Parents = `head_commit.parents().collect::<Vec<_>>()`.
    - Create commit replacing HEAD or using `head_commit.amend(Some("HEAD"), Some(&sig), Some(&sig), None, Some(&message), Some(&tree))?`.
  - If `amend == false`:
    - If HEAD exists: parents = `[&head_commit]`.
    - `repo.commit(Some("HEAD"), &sig, &sig, &message, &tree, &parents)?`.
  - Return `crate::read::get_commit_info(repo_path, &new_commit_id.to_string())?`.
  - Export in `src-tauri/src/write/mod.rs`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `cargo test --test m2_commit_test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/write/commit.rs src-tauri/src/write/mod.rs src-tauri/tests/m2_commit_test.rs
  git commit -m "feat(m2.1): implement create_commit and amend with backup ref"
  ```

---

### Task 6: Filesystem Watcher with Debounce & Filtering (Backend `repo/watcher.rs`)

**Files:**
- Create: `src-tauri/src/repo/watcher.rs`
- Modify: `src-tauri/src/repo/mod.rs`
- Test: `src-tauri/tests/m2_watcher_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub struct RepoWatcher {
      // Background cancellation sender / handle
  }
  impl RepoWatcher {
      pub fn start<F>(repo_path: PathBuf, on_changed: F) -> Result<Self, AppError>
      where F: Fn(String) + Send + Sync + 'static;
      pub fn stop(&mut self);
  }
  ```

- [ ] **Step 1: Write failing test in `src-tauri/tests/m2_watcher_test.rs`**
  ```rust
  mod common;
  use common::fixtures::TestRepoFixture;
  use std::fs;
  use std::sync::{Arc, Mutex};
  use std::time::Duration;
  use visual_git_lib::repo::watcher::RepoWatcher;

  #[test]
  fn test_repo_watcher_detects_changes_with_debounce() {
      let fixture = TestRepoFixture::new();
      let repo_path = fixture.path().to_path_buf();
      let triggered = Arc::new(Mutex::new(0));
      let triggered_clone = triggered.clone();

      let mut watcher = RepoWatcher::start(repo_path.clone(), move |_reason| {
          let mut count = triggered_clone.lock().unwrap();
          *count += 1;
      }).expect("watcher start should succeed");

      // Write file
      fs::write(repo_path.join("file_watch_test.txt"), "hello").unwrap();
      std::thread::sleep(Duration::from_millis(400));

      let count = *triggered.lock().unwrap();
      assert!(count >= 1, "Watcher should have triggered on file change");
      watcher.stop();
  }
  ```

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m2_watcher_test`
  Expected: FAIL with "unresolved import `visual_git_lib::repo::watcher`"

- [ ] **Step 3: Implement `src-tauri/src/repo/watcher.rs`**
  - Use `notify::RecommendedWatcher` with a 200ms debounce loop.
  - In event callback, ignore events where paths contain `.git/objects`, `.git/index.lock`, `.git/FETCH_HEAD`, `.git/ORIG_HEAD`.
  - On filtered valid change, call `on_changed("fs_watch")`.
  - Integrate `RepoWatcher` into `RepoManager` in `src-tauri/src/repo/mod.rs`:
    - When `RepoManager::open` is called, stop any previous watcher and start a new `RepoWatcher` on `repo_path`.

- [ ] **Step 4: Run test to confirm it passes**
  Run: `cargo test --test m2_watcher_test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/repo/watcher.rs src-tauri/src/repo/mod.rs src-tauri/tests/m2_watcher_test.rs
  git commit -m "feat(m2.1): implement RepoWatcher with debounce and event filtering"
  ```

---

### Task 7: Wire IPC Commands and Update Specta Bindings (Backend & Frontend Boundary)

**Files:**
- Modify: `src-tauri/src/commands/repo.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`

**Interfaces:**
- Produces: Specta IPC bindings for `get_repo_status`, `get_working_file_diff`, `stage_file`, `unstage_file`, `stage_all`, `unstage_all`, `discard_file_changes`, `stage_hunk`, `stage_lines`, `create_commit`.

- [ ] **Step 1: Expose Specta commands in `src-tauri/src/commands/repo.rs`**
  Add typed Tauri commands calling `read::status` and `write::staging` and `write::commit`.
  Emit `RepoChangedPayload` on staging and commit actions so UI updates immediately.

- [ ] **Step 2: Register commands in `src-tauri/src/lib.rs` builder**
  Add commands to `collect_commands![...]`.

- [ ] **Step 3: Update `src/ipc/bindings.ts` and `src/ipc/client.ts`**
  Add wrapper functions with type safety:
  - `getRepoStatus(repoPath: string)`
  - `getWorkingFileDiff(repoPath: string, filePath: string, isStaged: boolean)`
  - `stageFile(repoPath: string, filePath: string)`
  - `unstageFile(repoPath: string, filePath: string)`
  - `stageAll(repoPath: string)`
  - `unstageAll(repoPath: string)`
  - `discardFileChanges(repoPath: string, filePath: string)`
  - `stageHunk(repoPath: string, filePath: string, hunkIndex: number, isStaged: boolean)`
  - `stageLines(repoPath: string, filePath: string, hunkIndex: number, lineIndices: number[], isStaged: boolean)`
  - `createCommit(repoPath: string, summary: string, description?: string, amend?: boolean)`

- [ ] **Step 4: Verify compilation & frontend tests**
  Run: `cargo test`
  Run: `pnpm test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/commands/repo.rs src-tauri/src/lib.rs src/ipc/bindings.ts src/ipc/client.ts
  git commit -m "feat(m2.1): expose M2.1 IPC commands and export client bindings"
  ```

---

### Task 8: Screen Switcher & View Store (Frontend `useViewStore.ts` & `RepoHeader.tsx`)

**Files:**
- Create: `src/store/useViewStore.ts`
- Modify: `src/components/header/RepoHeader.tsx`
- Test: `src/test/useViewStore.test.ts`
- Test: `src/test/RepoHeader.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export type ActiveScreen = 'history' | 'changes';
  export interface ViewState {
      activeScreen: ActiveScreen;
      setActiveScreen: (screen: ActiveScreen) => void;
  }
  ```

- [ ] **Step 1: Write failing test in `src/test/useViewStore.test.ts`**
  ```typescript
  import { describe, it, expect } from "vitest";
  import { useViewStore } from "../store/useViewStore";

  describe("useViewStore", () => {
    it("defaults to history and toggles to changes", () => {
      expect(useViewStore.getState().activeScreen).toBe("history");
      useViewStore.getState().setActiveScreen("changes");
      expect(useViewStore.getState().activeScreen).toBe("changes");
    });
  });
  ```

- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm test src/test/useViewStore.test.ts`
  Expected: FAIL with "Cannot find module '../store/useViewStore'"

- [ ] **Step 3: Implement `useViewStore.ts` and update `RepoHeader.tsx`**
  - Implement Zustand store `useViewStore`.
  - In `RepoHeader.tsx`, add tab buttons:
    - `History (Cmd+1)`
    - `Changes (Cmd+2)` with badge count (from `useRepoStatusQuery`).
  - Add global keyboard shortcuts `Cmd/Ctrl+1` and `Cmd/Ctrl+2`.

- [ ] **Step 4: Run frontend tests to confirm they pass**
  Run: `pnpm test src/test/useViewStore.test.ts src/test/RepoHeader.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/store/useViewStore.ts src/components/header/RepoHeader.tsx src/test/useViewStore.test.ts src/test/RepoHeader.test.tsx
  git commit -m "feat(m2.1): add useViewStore and screen switcher tabs in RepoHeader"
  ```

---

### Task 9: Staging File List & Discard Confirmation Modal (Frontend `StagingFileList.tsx`)

**Files:**
- Create: `src/components/changes/StagingFileList.tsx`
- Create: `src/components/changes/DiscardConfirmModal.tsx`
- Test: `src/test/StagingFileList.test.tsx`

**Interfaces:**
- Produces: `StagingFileList` component accepting `repoPath`, `selectedFile`, `onSelectFile`.
- Discard confirmation modal adhering to Spec 6.4.

- [ ] **Step 1: Write failing test in `src/test/StagingFileList.test.tsx`**
  ```typescript
  import React from "react";
  import { render, screen, fireEvent } from "@testing-library/react";
  import { describe, it, expect, vi } from "vitest";
  import { StagingFileList } from "../components/changes/StagingFileList";

  describe("StagingFileList", () => {
    it("renders staged and unstaged file lists with action buttons", () => {
      const mockSelect = vi.fn();
      render(
        <StagingFileList
          repoPath="/test/repo"
          status={{
            staged: [{ path: "file1.ts", status: "Modified", is_staged: true, old_path: null }],
            unstaged: [{ path: "file2.ts", status: "Modified", is_staged: false, old_path: null }],
            untracked: [{ path: "file3.ts", status: "New", is_staged: false, old_path: null }],
          }}
          selectedFile={null}
          onSelectFile={mockSelect}
          onStageFile={vi.fn()}
          onUnstageFile={vi.fn()}
          onStageAll={vi.fn()}
          onUnstageAll={vi.fn()}
          onDiscardFile={vi.fn()}
        />
      );
      expect(screen.getByText("STAGED (1)")).toBeInTheDocument();
      expect(screen.getByText("CHANGES (2)")).toBeInTheDocument();
      expect(screen.getByText("file1.ts")).toBeInTheDocument();
      expect(screen.getByText("file2.ts")).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm test src/test/StagingFileList.test.tsx`
  Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement `StagingFileList.tsx` and `DiscardConfirmModal.tsx`**
  - Section headers: "STAGED (N)" with Unstage All; "CHANGES (N)" with Stage All.
  - Rows: file status badge (M/A/D), file path, stage `+` / unstage `−` buttons, discard `🗑️` button.
  - Clicking discard opens `DiscardConfirmModal` with warning: *"Các thay đổi trong file này sẽ bị huỷ vĩnh viễn"*.

- [ ] **Step 4: Run test to confirm it passes**
  Run: `pnpm test src/test/StagingFileList.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/changes/StagingFileList.tsx src/components/changes/DiscardConfirmModal.tsx src/test/StagingFileList.test.tsx
  git commit -m "feat(m2.1): implement StagingFileList and DiscardConfirmModal"
  ```

---

### Task 10: Commit Box with 72-char Warning & Amend (Frontend `CommitBox.tsx`)

**Files:**
- Create: `src/components/changes/CommitBox.tsx`
- Test: `src/test/CommitBox.test.tsx`

**Interfaces:**
- Produces: `CommitBox` component accepting `repoPath`, `stagedCount`, `headCommitSummary`, `onCommitSuccess`.

- [ ] **Step 1: Write failing test in `src/test/CommitBox.test.tsx`**
  ```typescript
  import React from "react";
  import { render, screen, fireEvent } from "@testing-library/react";
  import { describe, it, expect, vi } from "vitest";
  import { CommitBox } from "../components/changes/CommitBox";

  describe("CommitBox", () => {
    it("disables commit button when no files are staged", () => {
      render(
        <CommitBox
          repoPath="/test"
          stagedCount={0}
          onCommit={vi.fn()}
        />
      );
      const commitBtn = screen.getByRole("button", { name: /commit/i });
      expect(commitBtn).toBeDisabled();
    });

    it("displays character count and enables commit button when summary is entered and files are staged", () => {
      const onCommit = vi.fn();
      render(
        <CommitBox
          repoPath="/test"
          stagedCount={2}
          onCommit={onCommit}
        />
      );
      const input = screen.getByPlaceholderText(/summary/i);
      fireEvent.change(input, { target: { value: "feat: add login" } });
      expect(screen.getByText("15/72")).toBeInTheDocument();
      const commitBtn = screen.getByRole("button", { name: /commit \(2 files\)/i });
      expect(commitBtn).toBeEnabled();
    });
  });
  ```

- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm test src/test/CommitBox.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement `CommitBox.tsx`**
  - Title/Summary input with character count `xx/72` (text turns yellow when > 72).
  - Description textarea.
  - Amend checkbox: when checked, pre-populates `headCommitSummary` and enables commit even if staged count is 0.
  - Commit button with label "Commit (N files)" or "Amend Commit".
  - Shortcut listener for `Cmd/Ctrl+Enter`.

- [ ] **Step 4: Run test to confirm it passes**
  Run: `pnpm test src/test/CommitBox.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/changes/CommitBox.tsx src/test/CommitBox.test.tsx
  git commit -m "feat(m2.1): implement CommitBox with 72-char warning and amend support"
  ```

---

### Task 11: Interactive Diff Viewer with Hunk & Line Actions (Frontend `InteractiveDiffViewer.tsx`)

**Files:**
- Create: `src/components/changes/InteractiveDiffViewer.tsx`
- Test: `src/test/InteractiveDiffViewer.test.tsx`

**Interfaces:**
- Produces: `InteractiveDiffViewer` component rendering file diff with Stage/Unstage File, Stage/Unstage Hunk, and Stage/Unstage Line actions.

- [ ] **Step 1: Write failing test in `src/test/InteractiveDiffViewer.test.tsx`**
  ```typescript
  import React from "react";
  import { render, screen, fireEvent } from "@testing-library/react";
  import { describe, it, expect, vi } from "vitest";
  import { InteractiveDiffViewer } from "../components/changes/InteractiveDiffViewer";

  describe("InteractiveDiffViewer", () => {
    it("renders hunk with Stage Hunk button for unstaged file", () => {
      const onStageHunk = vi.fn();
      const mockDiff = {
        file_path: "src/main.rs",
        old_file_path: null,
        status: "Modified",
        lines_added: 2,
        lines_removed: 0,
        hunks: [
          {
            header: "@@ -1,3 +1,5 @@",
            old_start: 1,
            old_lines: 3,
            new_start: 1,
            new_lines: 5,
            lines: [
              { origin: " ", content: "fn main() {", old_lineno: 1, new_lineno: 1 },
              { origin: "+", content: "    let x = 1;", old_lineno: null, new_lineno: 2 },
            ],
          },
        ],
      };

      render(
        <InteractiveDiffViewer
          diff={mockDiff}
          isStaged={false}
          onStageFile={vi.fn()}
          onStageHunk={onStageHunk}
          onStageLine={vi.fn()}
        />
      );
      expect(screen.getByText("Stage Hunk")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Stage Hunk"));
      expect(onStageHunk).toHaveBeenCalledWith(0);
    });
  });
  ```

- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm test src/test/InteractiveDiffViewer.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement `InteractiveDiffViewer.tsx`**
  - File header with file path, lines added/removed, and button "Stage Entire File" / "Unstage Entire File".
  - Hunk header banner with hunk summary and button "Stage Hunk" / "Unstage Hunk".
  - Monospace diff lines with gutter line numbers.
  - Hovering line shows "Stage Line" / "Unstage Line" button.
  - Styled with CSS variables (`--diff-add-bg`, `--diff-add-text`, `--diff-remove-bg`, `--diff-remove-text`).
  - Empty state when `diff == null`: "Chọn một file để xem thay đổi".

- [ ] **Step 4: Run test to confirm it passes**
  Run: `pnpm test src/test/InteractiveDiffViewer.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/changes/InteractiveDiffViewer.tsx src/test/InteractiveDiffViewer.test.tsx
  git commit -m "feat(m2.1): implement InteractiveDiffViewer with hunk and line actions"
  ```

---

### Task 12: Assemble ChangesScreen, Wire into App Shell, and Verification Pass

**Files:**
- Create: `src/components/changes/ChangesScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Shell.tsx`
- Test: `src/test/ChangesScreen.test.tsx`

**Interfaces:**
- Produces: 2-column `ChangesScreen` (Left: `StagingFileList` + `CommitBox`, Right: `InteractiveDiffViewer`).
- Wires screen switching into `App.tsx` so `activeScreen === 'history'` shows `Shell` (3-column graph) and `activeScreen === 'changes'` shows `ChangesScreen` (2-column changes).

- [ ] **Step 1: Implement `ChangesScreen.tsx`**
  Fetch status via TanStack Query `useQuery(["repo_status", repoPath])`.
  Maintain `selectedFile: { path: string, isStaged: boolean } | null`.
  Fetch working diff via `useQuery(["working_diff", repoPath, selectedFile?.path, selectedFile?.isStaged])`.
  Wire staging, commit, discard actions with query invalidation.

- [ ] **Step 2: Conditionally render `Shell` or `ChangesScreen` in `App.tsx`**
  In `App.tsx`, read `const { activeScreen } = useViewStore();`.
  Render `<Shell />` when `activeScreen === 'history'`; render `<ChangesScreen />` when `activeScreen === 'changes'`.

- [ ] **Step 3: Run comprehensive verification pass**
  Run: `cargo test`
  Expected: All Rust unit & integration tests pass (100%).
  Run: `pnpm test`
  Expected: All Vitest frontend tests pass (100%).
  Run: `pnpm build`
  Expected: TypeScript build succeeds without errors.
  Run: `pnpm check-contrast`
  Expected: All color contrast ratios satisfy WCAG AA $\ge 4.5:1$.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/changes/ChangesScreen.tsx src/App.tsx src/components/Shell.tsx src/test/ChangesScreen.test.tsx
  git commit -m "feat(m2.1): assemble ChangesScreen and wire into App shell with full verification"
  ```
