# Multi-Tab Multi-Repo Architecture & 2-Tier Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade GitVista to support multi-tab multi-repository workflows (like GitKraken) with session restore and a 2-tier hierarchical settings system (Global App Settings vs Per-Repository Settings).

**Architecture:**
- Backend (Rust): Update `RepoManager` to maintain a map of active repositories and independent filesystem watchers (`HashMap<PathBuf, RepoWatcher>`), providing lifecycle commands `open_repository` and `close_repository`.
- Frontend (React + Zustand): Implement `useTabStore` managing `TabItem[]` with per-tab view states (`activeScreen`, `selectedCommitId`, `selectedFilePath`, `selectedBranch`) and `localStorage` session persistence.
- UI: Implement `WindowTabBar` atop the application window with shortcut support (`Ctrl+T`, `Ctrl+W`, `Ctrl+Tab`, `Ctrl+1..9`), and a 2-tier Scope Switcher in `SettingsModal` supporting Inherit/Override semantics.
- Caching: Use TanStack React Query partitioned by `repoPath` so tab switching is instantaneous (0ms) and `repo-changed` events only invalidate the relevant repo.

**Tech Stack:** Rust (git2, notify, tauri v2), React 19, TypeScript, Zustand, TanStack React Query, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-17-multi-tab-multi-repo-and-tiered-settings-design.md`

## Global Constraints
- Follow Gitmoji for commit messages (`<emoji> <short description>`).
- Preserve Deep Module principle: hide internal OS file watcher details inside `RepoManager`.
- Instant tab switching: do not refetch all git logs when switching between already opened tabs.
- Backward compatibility: existing commands and tests must continue to pass.

---

### Task 1: Backend Multi-Repo & Multi-Watcher Management in Rust

**Files:**
- Modify: `src-tauri/src/repo/mod.rs`
- Modify: `src-tauri/src/commands/repo.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `RepoWatcher`, `RecentRepoStore`
- Produces:
  - `RepoManager::close_repository(&mut self, path: &Path) -> Result<(), AppError>`
  - `RepoManager::get_open_repositories(&self) -> Vec<RepoSummary>`
  - Tauri command `close_repository(path: String) -> Result<(), AppError>`
  - Tauri command `get_open_repositories() -> Result<Vec<RepoSummary>, AppError>`

- [ ] **Step 1: Write the failing tests for `RepoManager` multi-repo handling**
In `src-tauri/src/repo/mod.rs`, add unit tests verifying that multiple repositories can be opened simultaneously and closing one stops its watcher without affecting others:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_multi_repo_open_and_close() {
        let temp1 = TempDir::new().unwrap();
        let temp2 = TempDir::new().unwrap();
        let _r1 = git2::Repository::init(temp1.path()).unwrap();
        let _r2 = git2::Repository::init(temp2.path()).unwrap();

        let mut manager = RepoManager::new();
        let s1 = manager.open(temp1.path()).unwrap();
        let s2 = manager.open(temp2.path()).unwrap();

        assert_eq!(manager.get_open_repositories().len(), 2);
        assert!(manager.is_open(temp1.path()));
        assert!(manager.is_open(temp2.path()));

        manager.close_repository(temp1.path()).unwrap();
        assert_eq!(manager.get_open_repositories().len(), 1);
        assert!(!manager.is_open(temp1.path()));
        assert!(manager.is_open(temp2.path()));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cargo test --manifest-path src-tauri/Cargo.toml test_multi_repo_open_and_close`
Expected: FAIL due to missing methods `get_open_repositories`, `is_open`, `close_repository`.

- [ ] **Step 3: Update `RepoManager` to support multiple active repos and watchers**
Update `src-tauri/src/repo/mod.rs`:
```rust
use std::collections::HashMap;

pub struct RepoManager {
    active_repos: HashMap<PathBuf, RepoSummary>,
    watchers: HashMap<PathBuf, RepoWatcher>,
    recent_store: RecentRepoStore,
}

impl RepoManager {
    pub fn new() -> Self {
        Self {
            active_repos: HashMap::new(),
            watchers: HashMap::new(),
            recent_store: RecentRepoStore::new(),
        }
    }

    pub fn open<P: AsRef<Path>>(&mut self, path: P) -> Result<RepoSummary, AppError> {
        let path_ref = path.as_ref();
        let repo = git2::Repository::open(path_ref)?;
        let canonical = path_ref.canonicalize().map_err(AppError::from)?;
        let name = canonical
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "repository".to_string());

        let mut head_branch = None;
        let mut head_commit_id = None;

        if let Ok(head) = repo.head() {
            if head.is_branch() {
                head_branch = head.shorthand().ok().map(|s| s.to_string());
            }
            head_commit_id = head.target().map(|oid| oid.to_string());
        }

        self.recent_store.record_open(&canonical, &name)?;
        let summary = RepoSummary {
            path: canonical.to_string_lossy().to_string(),
            name,
            is_bare: repo.is_bare(),
            head_branch,
            head_commit_id,
        };

        self.active_repos.insert(canonical, summary.clone());
        Ok(summary)
    }

    pub fn start_watcher<P: AsRef<Path>, F>(&mut self, path: P, on_changed: F) -> Result<(), AppError>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        let canonical = path.as_ref().canonicalize().map_err(AppError::from)?;
        if let Some(mut old) = self.watchers.remove(&canonical) {
            old.stop();
        }
        let watcher = RepoWatcher::start(&canonical, on_changed)?;
        self.watchers.insert(canonical, watcher);
        Ok(())
    }

    pub fn close_repository<P: AsRef<Path>>(&mut self, path: P) -> Result<(), AppError> {
        let canonical = path.as_ref().canonicalize().unwrap_or_else(|_| path.as_ref().to_path_buf());
        if let Some(mut watcher) = self.watchers.remove(&canonical) {
            watcher.stop();
        }
        self.active_repos.remove(&canonical);
        Ok(())
    }

    pub fn is_open<P: AsRef<Path>>(&self, path: P) -> bool {
        let canonical = path.as_ref().canonicalize().unwrap_or_else(|_| path.as_ref().to_path_buf());
        self.active_repos.contains_key(&canonical)
    }

    pub fn get_open_repositories(&self) -> Vec<RepoSummary> {
        self.active_repos.values().cloned().collect()
    }
}
```

- [ ] **Step 4: Expose commands in `src-tauri/src/commands/repo.rs` & `src-tauri/src/lib.rs`**
Add commands `close_repository` and `get_open_repositories`, updating `open_repository` to pass the repo path to `start_watcher`. Register both commands in `src-tauri/src/lib.rs`.

- [ ] **Step 5: Run tests to verify they pass**
Run: `cargo test --manifest-path src-tauri/Cargo.toml test_multi_repo_open_and_close`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src-tauri/src/repo/mod.rs src-tauri/src/commands/repo.rs src-tauri/src/lib.rs
git commit -m "✨ add multi-repo management and watcher lifecycle in rust"
```

---

### Task 2: Frontend IPC Bindings & Mock Client Updates

**Files:**
- Modify: `src/ipc/client.ts`

**Interfaces:**
- Consumes: Tauri invoke API
- Produces:
  - `invokeCommand.closeRepository(path: string): Promise<void>`
  - `invokeCommand.getOpenRepositories(): Promise<RepoSummary[]>`

- [ ] **Step 1: Write test for new IPC client methods**
In `src/test/ipcClient.test.ts` (or add to existing tests), test `closeRepository` and `getOpenRepositories` in browser mock mode.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm test src/test/ipcClient.test.ts`

- [ ] **Step 3: Implement `closeRepository` and `getOpenRepositories` in `src/ipc/client.ts`**
Add the methods with browser mock fallbacks when `!isTauri()`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm test src/test/ipcClient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/ipc/client.ts
git commit -m "✨ add closeRepository and getOpenRepositories to ipc client"
```

---

### Task 3: Frontend Multi-Tab Store & Session Persistence (`useTabStore`)

**Files:**
- Create: `src/types/tab.ts`
- Create: `src/store/useTabStore.ts`
- Create: `src/test/useTabStore.test.ts`

**Interfaces:**
- Consumes: `RepoSummary` from `src/ipc/bindings.ts`
- Produces:
  - `useTabStore`: Zustand store with `tabs`, `activeTabId`, `openRepoTab`, `openHomeTab`, `closeTab`, `setActiveTab`, `updateTabState`, `restoreSession`.

- [ ] **Step 1: Write unit tests for `useTabStore`**
In `src/test/useTabStore.test.ts`:
- Test initial state has `Home` tab and `activeTabId === 'home'`.
- Test `openRepoTab` creates a repo tab and switches active tab to it.
- Test `openRepoTab` for an already-opened repo path does NOT duplicate tab, only focuses it.
- Test `closeTab` on active tab switches to neighbor tab or `home`.
- Test `updateTabState` preserves per-tab screens (`history` vs `changes`), commit selection, and file selection.
- Test `restoreSession` and `localStorage` persistence.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm test src/test/useTabStore.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/types/tab.ts` and `src/store/useTabStore.ts`**
Implement data structures and Zustand store with `localStorage` key `gitvista_session_tabs_v1`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm test src/test/useTabStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/types/tab.ts src/store/useTabStore.ts src/test/useTabStore.test.ts
git commit -m "✨ add useTabStore with multi-tab lifecycle and session persistence"
```

---

### Task 4: Window Top Tab Bar UI & Global Keyboard Shortcuts

**Files:**
- Create: `src/components/header/WindowTabBar.tsx`
- Modify: `src/hooks/useGlobalShortcuts.ts`
- Create: `src/test/WindowTabBar.test.tsx`

**Interfaces:**
- Consumes: `useTabStore`, `useSettingsStore`
- Produces:
  - `<WindowTabBar onSelectFolder={...} />` component.
  - Tab navigation shortcuts: `Ctrl+T`, `Ctrl+W`, `Ctrl+Tab`, `Ctrl+Shift+Tab`, `Ctrl+1..9`.

- [ ] **Step 1: Write unit tests for `WindowTabBar`**
In `src/test/WindowTabBar.test.tsx`:
- Render with 1 Home tab and 2 Repo tabs.
- Test click on Repo tab switches active tab.
- Test click on `✕` calls `closeTab`.
- Test click on `+` calls folder picker / opens new tab.
- Test click on `Home` switches to home tab.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm test src/test/WindowTabBar.test.tsx`
Expected: FAIL with component not found.

- [ ] **Step 3: Implement `WindowTabBar.tsx`**
Build the tab bar adhering to Option A (GitKraken-style top bar):
- Traffic lights spacer on macOS / app title.
- Scrollable tab bar with active tab highlights, hover close buttons, branch name pills.
- `+` new tab button.
- Global settings button and shortcut hint.

- [ ] **Step 4: Update `useGlobalShortcuts.ts` with tab shortcuts**
Add key listeners for `Ctrl+T` / `Cmd+T`, `Ctrl+W` / `Cmd+W`, `Ctrl+Tab`, and number keys `Ctrl+1..9`.

- [ ] **Step 5: Run tests to verify they pass**
Run: `pnpm test src/test/WindowTabBar.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/components/header/WindowTabBar.tsx src/hooks/useGlobalShortcuts.ts src/test/WindowTabBar.test.tsx
git commit -m "🎨 add WindowTabBar component and tab keyboard shortcuts"
```

---

### Task 5: App Workspace Integration & Targeted Query Invalidation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/header/RepoHeader.tsx`
- Modify: `src/test/App.test.tsx`

**Interfaces:**
- Consumes: `WindowTabBar`, `useTabStore`, `listenToRepoChanged`
- Produces: Integrated Multi-Tab application shell.

- [ ] **Step 1: Write tests in `src/test/App.test.tsx` for multi-tab workspace**
Verify that:
- When on Home tab, `WelcomeScreen` renders.
- When opening a repo, `WindowTabBar` shows the tab and `RepoContent` renders.
- Switching between tabs switches active repository context.

- [ ] **Step 2: Run test to verify expectations**
Run: `pnpm test src/test/App.test.tsx`

- [ ] **Step 3: Integrate `WindowTabBar` and `useTabStore` in `src/App.tsx`**
- Mount `WindowTabBar` at the top of `App.tsx`.
- Connect `activeTab`:
  - If `activeTab.type === 'home'`, render `WelcomeScreen` (selecting a repo opens it as a tab).
  - If `activeTab.type === 'repo'`, render `RepoContent` with `activeTab.repo`.
- Update `listenToRepoChanged` event listener to selectively invalidate queries for `payload.repo_path`.
- Call `restoreSession()` on startup to restore previously opened tabs.

- [ ] **Step 4: Update `RepoHeader.tsx` for multi-tab ergonomics**
Ensure back-to-welcome or tab switching buttons work seamlessly with `useTabStore`.

- [ ] **Step 5: Run all App tests to verify pass**
Run: `pnpm test src/test/App.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/App.tsx src/components/header/RepoHeader.tsx src/test/App.test.tsx
git commit -m "✨ integrate WindowTabBar and targeted multi-repo cache invalidation into App"
```

---

### Task 6: 2-Tier Settings Architecture (Global App Settings vs Per-Repo Settings)

**Files:**
- Modify: `src/components/settings/SettingsModal.tsx`
- Modify: `src/components/settings/tabs/GitProfileTab.tsx`
- Modify: `src/components/settings/tabs/GitBehaviorTab.tsx`
- Modify: `src/test/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `useTabStore`, `invokeCommand.getGitConfig`, `invokeCommand.setGitConfig`
- Produces:
  - 2-Tier Scope Switcher: `[🌐 Toàn ứng dụng (Global)]` | `[📁 Repository: <name> ▼]`
  - Inherit vs Override toggling and display.

- [ ] **Step 1: Write tests for 2-tier SettingsModal in `src/test/SettingsModal.test.tsx`**
Test that:
- Scope Switcher renders Global and Repository buttons.
- Clicking Repository scope displays repo-specific options and "Inherit from Global" toggle.
- When on Home tab, Repository scope prompts user or defaults to Global.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm test src/test/SettingsModal.test.tsx`

- [ ] **Step 3: Implement Scope Switcher in `SettingsModal.tsx`**
Add the top segmented control allowing switching between `global` and `repo` scope, with an open repo dropdown selector when in `repo` scope.

- [ ] **Step 4: Update `GitProfileTab.tsx` and `GitBehaviorTab.tsx`**
- Show clear badge `[Kế thừa từ Global]` when local value is not overridden.
- Provide toggle to override `user.name`, `user.email`, and `pull.rebase` for the repository.
- Provide "Khôi phục về Global" button to clear local overrides.

- [ ] **Step 5: Run tests to verify they pass**
Run: `pnpm test src/test/SettingsModal.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/components/settings/SettingsModal.tsx src/components/settings/tabs/GitProfileTab.tsx src/components/settings/tabs/GitBehaviorTab.tsx src/test/SettingsModal.test.tsx
git commit -m "✨ implement 2-tier settings scope switcher with inherit and override support"
```

---

### Task 7: Full Test Suite & Build Verification

**Files:**
- Existing test suite files

- [ ] **Step 1: Run full frontend test suite**
Run: `pnpm test`
Expected: All tests PASS.

- [ ] **Step 2: Run frontend build check**
Run: `pnpm build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Run backend Rust test suite**
Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All Rust tests PASS.

- [ ] **Step 4: Commit any test adjustments or polish**
```bash
git commit -am "✅ verify all frontend and rust backend tests for multi-tab and tiered settings"
```
