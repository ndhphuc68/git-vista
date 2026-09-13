# Milestone M3: Remote Operations (Fetch, Pull, Push, Clone, Progress & Cancel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Milestone M3 by implementing full Git remote operations (fetch, pull, push, clone) executing asynchronously via Git CLI with real-time progress streaming, cancellation support, Ahead/Behind calculation via libgit2, and non-blocking frontend UI controls.

**Architecture:** Rust backend (`src-tauri/src/exec/` & `src-tauri/src/commands/remote.rs`) spawns `git` CLI processes with progress streaming parsed from `stderr` into `task-progress` events, while `src-tauri/src/read/branches.rs` calculates commit ahead/behind in-process with `libgit2::graph_ahead_behind`; React frontend provides remote controls in `RepoHeader`, floating `RemoteProgressBanner` with Cancel button, and `CloneModal` on `WelcomeScreen`.

**Tech Stack:** Tauri 2, Rust (`git2 = "0.20"`, `tokio`, `tauri-specta`), React 19, TypeScript, `@tanstack/react-query`, Zustand, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-13-m3-remote-operations-design.md` & `docs/superpowers/specs/2026-09-12-visual-git-client-design.md`.

## Global Constraints

- Strictly read-only in `src-tauri/src/read/`.
- All remote/network operations in `src-tauri/src/exec/` execute 100% via `git` CLI to inherit SSH agent, credentials, and user config.
- Never use full-screen blocking spinners for remote commands (Mục 5.4).
- All long-running remote operations MUST accept a `task_id` and support cancellation via `cancel_remote_task`.
- Ahead/Behind calculation MUST execute in-process via `libgit2` for fast UI responsiveness.
- All modals, buttons, and banners MUST satisfy WCAG AA $\ge 4.5:1$ contrast ratio.
- 100% tests passing in `cargo test` and `pnpm test`.

---

### Task 1: Ahead / Behind Calculation in Backend (`src-tauri/src/read/branches.rs`, `src-tauri/src/read/mod.rs`)

**Files:**
- Modify: `src-tauri/src/read/branches.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Test: `src-tauri/tests/m3_remote_test.rs`

**Interfaces:**
- Produces:
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct BranchItem {
      pub name: String,
      pub is_head: bool,
      pub target_commit_id: String,
      pub upstream: Option<String>,
      pub ahead: u32,
      pub behind: u32,
  }

  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct RepoHeadInfo {
      pub branch_name: Option<String>,
      pub head_commit_id: Option<String>,
      pub is_detached: bool,
      pub ahead: u32,
      pub behind: u32,
      pub upstream: Option<String>,
  }
  ```

- [ ] **Step 1: Write failing integration test in `src-tauri/tests/m3_remote_test.rs`**
  Write `test_ahead_behind_calculation`:
  - Creates a local repo and a bare remote repo fixture (`origin`).
  - Pushes `master` to `origin` and configures upstream tracking.
  - Creates 2 commits locally on `master` -> verifies `ahead == 2`, `behind == 0`.
  - Creates 1 commit on origin -> after fetch, verifies `ahead == 2`, `behind == 1`.

- [ ] **Step 2: Run test to confirm it fails**
  Run: `cargo test --test m3_remote_test`
  Expected: FAIL (fields `ahead`, `behind` do not exist yet on `BranchItem`)

- [ ] **Step 3: Implement ahead/behind in `src-tauri/src/read/branches.rs` and `src-tauri/src/read/mod.rs`**
  - For each local branch with an upstream tracking branch:
    - Get upstream branch ref: `branch.upstream().ok()`
    - Get local target commit OID and upstream target commit OID.
    - Call `repo.graph_ahead_behind(local_oid, upstream_oid)`.
    - Populate `ahead = ahead as u32` and `behind = behind as u32`.
  - Update `get_repo_head_info` in `src-tauri/src/read/mod.rs` to also populate `ahead`, `behind`, and `upstream`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `cargo test --test m3_remote_test test_ahead_behind_calculation`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/read/branches.rs src-tauri/src/read/mod.rs src-tauri/tests/m3_remote_test.rs
  git commit -m "feat(m3): implement commit ahead and behind calculation in read/branches.rs"
  ```

---

### Task 2: Streaming CLI Process Runner with Progress Parsing & Cancellation (`src-tauri/src/exec/mod.rs`)

**Files:**
- Modify: `src-tauri/src/exec/mod.rs`
- Modify: `src-tauri/tests/m3_remote_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn register_task_process(task_id: &str, pid: u32);
  pub fn unregister_task_process(task_id: &str);
  pub fn cancel_task(task_id: &str) -> bool;
  pub fn parse_git_progress_line(line: &str) -> Option<(u32, String)>;
  pub fn run_git_streaming_command<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
      repo_dir: P,
      args: &[&str],
      task_id: &str,
      on_progress: F,
  ) -> Result<GitCliOutput, AppError>;
  ```

- [ ] **Step 1: Write failing test in `src-tauri/tests/m3_remote_test.rs`**
  Add unit tests:
  - `test_parse_git_progress_line`: Tests parsing `Counting objects:  45% (45/100)`, `Receiving objects: 78% (780/1000)`, `Writing objects: 100%`.
  - `test_cancel_task_terminates_process`: Spawns a long command, calls `cancel_task`, verifies process termination.

- [ ] **Step 2: Run test to confirm failure**
  Run: `cargo test --test m3_remote_test test_parse_git_progress_line`
  Expected: FAIL

- [ ] **Step 3: Implement `TaskManager` and `run_git_streaming_command` in `src-tauri/src/exec/mod.rs`**
  - Implement regex or string splitter for progress: matches percentage `(\d+)%` and stage name.
  - Implement task registry with `Arc<Mutex<HashMap<String, u32>>>` storing process IDs.
  - Implement `cancel_task` using OS process termination (`sysinfo` or `std::process::Command` kill on Windows/Unix).
  - Stream lines from `stderr` (handling both `\r` and `\n`), invoking `on_progress(percent, status_text)`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `cargo test --test m3_remote_test test_parse_git_progress_line`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/exec/mod.rs src-tauri/tests/m3_remote_test.rs
  git commit -m "feat(m3): implement streaming CLI runner with progress parsing and task cancellation"
  ```

---

### Task 3: Remote Operations in Backend: Fetch, Pull, Push, Clone (`src-tauri/src/exec/remote.rs`)

**Files:**
- Create: `src-tauri/src/exec/remote.rs`
- Modify: `src-tauri/src/exec/mod.rs`
- Modify: `src-tauri/tests/m3_remote_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn git_fetch<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
      repo_path: P,
      remote: Option<&str>,
      prune: bool,
      task_id: &str,
      on_progress: F,
  ) -> Result<String, AppError>;

  pub fn git_pull<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
      repo_path: P,
      remote: Option<&str>,
      branch: Option<&str>,
      rebase: Option<bool>,
      task_id: &str,
      on_progress: F,
  ) -> Result<String, AppError>;

  pub fn git_push<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
      repo_path: P,
      remote: Option<&str>,
      branch: Option<&str>,
      set_upstream: bool,
      force: bool,
      task_id: &str,
      on_progress: F,
  ) -> Result<String, AppError>;

  pub fn git_clone<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
      url: &str,
      target_dir: P,
      task_id: &str,
      on_progress: F,
  ) -> Result<String, AppError>;

  pub fn set_repo_pull_rebase<P: AsRef<Path>>(
      repo_path: P,
      rebase: bool,
  ) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write integration tests in `src-tauri/tests/m3_remote_test.rs`**
  Add tests:
  - `test_fetch_command`: Fetches from origin fixture.
  - `test_push_command_with_set_upstream`: Pushes local branch to origin with `set_upstream = true`.
  - `test_pull_command`: Pulls new commit from origin into local repo.
  - `test_clone_command`: Clones origin bare repo into a new directory.

- [ ] **Step 2: Run test to confirm failure**
  Run: `cargo test --test m3_remote_test test_fetch_command`
  Expected: FAIL

- [ ] **Step 3: Implement `src-tauri/src/exec/remote.rs`**
  - Implement `git_fetch`: runs `git fetch [remote] --progress` (+ `--prune` if true).
  - Implement `git_pull`: runs `git pull [remote] [branch] --progress` (+ `--rebase` / `--no-rebase` if specified).
  - Implement `git_push`: runs `git push [remote] [branch] --progress` (+ `-u` if `set_upstream`, `--force-with-lease` if `force`).
  - Implement `git_clone`: runs `git clone --progress <url> <target_dir>`.
  - Implement `set_repo_pull_rebase`: runs `git config pull.rebase [true/false]`.
  - Implement friendly error mapping for stderr (auth failed, rejected non-fast-forward, host timeout).
  - Export `pub mod remote;` in `src-tauri/src/exec/mod.rs`.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `cargo test --test m3_remote_test`
  Expected: PASS (all tests)

- [ ] **Step 5: Commit**
  ```bash
  git add src-tauri/src/exec/remote.rs src-tauri/src/exec/mod.rs src-tauri/tests/m3_remote_test.rs
  git commit -m "feat(m3): implement git fetch, pull, push, clone, and pull.rebase setting"
  ```

---

### Task 4: Tauri IPC Commands & Specta Registration (`src-tauri/src/commands/remote.rs`, `src-tauri/src/lib.rs`)

**Files:**
- Create: `src-tauri/src/commands/remote.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces:
  - `fetch_repo(app, repo_path, remote, prune, task_id) -> Result<String, AppError>`
  - `pull_repo(app, repo_path, remote, branch, rebase, task_id) -> Result<String, AppError>`
  - `push_repo(app, repo_path, remote, branch, set_upstream, force, task_id) -> Result<String, AppError>`
  - `clone_repo(app, url, target_dir, task_id) -> Result<String, AppError>`
  - `cancel_remote_task(task_id) -> Result<(), AppError>`
  - `set_repo_pull_rebase(repo_path, rebase) -> Result<(), AppError>`

- [ ] **Step 1: Implement commands in `src-tauri/src/commands/remote.rs`**
  Each command connects the progress callback to `TaskProgressPayload::emit_all(&app, payload)` and emits `repo-changed` upon completion.

- [ ] **Step 2: Register commands in `src-tauri/src/lib.rs`**
  Add all 6 commands to `collect_commands!`.

- [ ] **Step 3: Run `cargo test` to verify backend passes**
  Run: `cargo test`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src-tauri/src/commands/remote.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
  git commit -m "feat(m3): register remote IPC commands and event streaming in Tauri and Specta"
  ```

---

### Task 5: Frontend IPC Client & TypeScript Bindings (`src/ipc/bindings.ts`, `src/ipc/client.ts`)

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Test: `src/test/ipcClient.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  invokeCommand.fetchRepo(repoPath: string, remote?: string, prune?: boolean, taskId?: string): Promise<string>;
  invokeCommand.pullRepo(repoPath: string, remote?: string, branch?: string, rebase?: boolean, taskId?: string): Promise<string>;
  invokeCommand.pushRepo(repoPath: string, remote?: string, branch?: string, setUpstream?: boolean, force?: boolean, taskId?: string): Promise<string>;
  invokeCommand.cloneRepo(url: string, targetDir: string, taskId?: string): Promise<string>;
  invokeCommand.cancelRemoteTask(taskId: string): Promise<void>;
  invokeCommand.setRepoPullRebase(repoPath: string, rebase: boolean): Promise<void>;
  listenToTaskProgress(handler: (payload: TaskProgressPayload) => void): Promise<() => void>;
  ```

- [ ] **Step 1: Update bindings and client**
  - Add `ahead: number`, `behind: number` to `BranchItem` and `RepoHeadInfo` in `bindings.ts`.
  - Implement IPC methods in `src/ipc/client.ts` with browser mock fallbacks.
  - Implement `listenToTaskProgress`.

- [ ] **Step 2: Run `pnpm build` to verify types**
  Run: `pnpm build`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/ipc/bindings.ts src/ipc/client.ts
  git commit -m "feat(m3): update IPC client with remote commands and task progress listener"
  ```

---

### Task 6: Remote Progress Banner Component (`src/components/common/RemoteProgressBanner.tsx`)

**Files:**
- Create: `src/components/common/RemoteProgressBanner.tsx`
- Create: `src/test/RemoteProgressBanner.test.tsx`

**Interfaces:**
- Produces:
  - `<RemoteProgressBanner task={RemoteTaskState | null} onCancel={(taskId) => void} />`

- [ ] **Step 1: Write failing test in `src/test/RemoteProgressBanner.test.tsx`**
  - Renders progress percentage and status text.
  - Clicking "Huỷ" calls `onCancel(taskId)`.
  - Disappears when task is null.

- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm test src/test/RemoteProgressBanner.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement `RemoteProgressBanner.tsx`**
  - Floating badge at bottom-right corner with glassmorphism / surface styling.
  - Animated progress bar (`progress_percent %`).
  - Status text and Cancel button.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test src/test/RemoteProgressBanner.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/common/RemoteProgressBanner.tsx src/test/RemoteProgressBanner.test.tsx
  git commit -m "feat(m3): implement RemoteProgressBanner with cancel button and tests"
  ```

---

### Task 7: RepoHeader Integration: Fetch, Pull, Push Controls & Ahead/Behind Badges (`src/components/header/RepoHeader.tsx`)

**Files:**
- Modify: `src/components/header/RepoHeader.tsx`
- Modify: `src/test/RepoHeader.test.tsx`

**Interfaces:**
- Produces:
  - Fetch button (`⟳ Fetch`) triggering `fetchRepo`.
  - Pull button (`↓ Pull {behind > 0 ? behind : ""}`) triggering `pullRepo`.
  - Push button (`↑ Push {ahead > 0 ? ahead : ""}`) triggering `pushRepo` (with auto-upstream).
  - Invalidation of queries on success.

- [ ] **Step 1: Write tests in `src/test/RepoHeader.test.tsx`**
  - Verifies Fetch, Pull, Push buttons are rendered.
  - Verifies Ahead badge is shown on Push when ahead > 0.
  - Verifies Behind badge is shown on Pull when behind > 0.
  - Verifies clicking Fetch triggers `fetchRepo`.

- [ ] **Step 2: Run test to verify failure**
  Run: `pnpm test src/test/RepoHeader.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement remote buttons in `RepoHeader.tsx`**
  - Add Fetch, Pull, Push buttons into Header right after repo info or center section.
  - Wire TanStack Query mutation with progress banner and query invalidation.
  - Auto-set upstream when current branch has `upstream == null`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test src/test/RepoHeader.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/header/RepoHeader.tsx src/test/RepoHeader.test.tsx
  git commit -m "feat(m3): add Fetch, Pull, Push controls and Ahead/Behind badges to RepoHeader"
  ```

---

### Task 8: Clone Repository Modal & WelcomeScreen Integration (`src/components/welcome/CloneModal.tsx`, `src/components/welcome/WelcomeScreen.tsx`)

**Files:**
- Create: `src/components/welcome/CloneModal.tsx`
- Modify: `src/components/welcome/WelcomeScreen.tsx`
- Create: `src/test/CloneModal.test.tsx`

**Interfaces:**
- Produces:
  - `<CloneModal isOpen={boolean} onClose={() => void} onCloneSuccess={(clonedPath) => void} />`
  - Wires "Clone kho chứa" button in `WelcomeScreen.tsx`.

- [ ] **Step 1: Write failing test in `src/test/CloneModal.test.tsx`**
  - Renders input for URL and target directory.
  - Auto-extracts repo name from URL (e.g. `https://github.com/facebook/react.git` -> `react`).
  - Submits clone request with `cloneRepo`.

- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm test src/test/CloneModal.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement `CloneModal.tsx` and wire into `WelcomeScreen.tsx`**
  - Form validation: URL required, target directory required.
  - Directory picker button.
  - Shows progress during clone.
  - Calls `onSelectRepo` on clone success.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test src/test/CloneModal.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/welcome/CloneModal.tsx src/components/welcome/WelcomeScreen.tsx src/test/CloneModal.test.tsx
  git commit -m "feat(m3): implement CloneModal and wire into WelcomeScreen"
  ```

---

### Task 9: Comprehensive Milestone Verification Pass

**Files:**
- Full verification pass across backend, frontend, build, and accessibility.

- [ ] **Step 1: Run Rust test suite**
  Run: `cargo test`
  Expected: 100% PASS across all unit and integration tests.

- [ ] **Step 2: Run Frontend test suite**
  Run: `pnpm test`
  Expected: 100% PASS across all Vitest test suites.

- [ ] **Step 3: Run TypeScript compiler build check**
  Run: `pnpm build`
  Expected: Clean build without errors.

- [ ] **Step 4: Run Color Contrast Check**
  Run: `pnpm check-contrast`
  Expected: All UI components satisfy WCAG AA $\ge 4.5:1$.

- [ ] **Step 5: Final Milestone Commit & Walkthrough**
  ```bash
  git commit --allow-empty -m "chore(m3): complete milestone M3 verification pass"
  ```
