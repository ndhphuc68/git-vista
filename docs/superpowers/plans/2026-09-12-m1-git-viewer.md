# M1: Visual Git Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Milestone M1 of Visual Git Client: open repositories, recent repositories list, branch sidebar, virtualized commit graph with pre-computed lane layout SVG, and commit details with file diff viewer.

**Architecture:** Rust backend (`read/` & `repo/`) uses `libgit2` to parse branches, run topological commit revwalk, compute SVG lane layout and parse diff trees with in-memory diff caching; React frontend (`@tanstack/react-query`, `@tanstack/react-virtual`, Zustand) renders a 3-column macOS native-ish desktop UI with virtualized commit rows (< 30 DOM nodes) and design-token styled diff hunks.

**Tech Stack:** Tauri 2, Rust (`git2 = "0.20"`, `rfd = "0.15"`, `serde`, `tauri-specta`), React 19, TypeScript, `@tanstack/react-query`, `@tanstack/react-virtual`, Zustand, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md` (specifically Sections 4, 5.1, 5.3, 5.5, 6.1, 6.2, 7.2, 9, 10 - M1).

## Global Constraints

- Backend reads are strictly read-only: `read/` module never writes to repositories (Spec 4.2).
- Commit graph lane layout is calculated completely inside Rust; frontend renders SVG purely from pre-calculated nodes & edges (Spec 5.1).
- DOM virtualization must render at most ~30 commit rows in DOM regardless of repository history length (Spec 5.1, 5.5).
- Diff computation is on-demand for selected files only, immutable and cached by `(commit_hash, file_path)` (Spec 5.2, 5.3).
- UI follows macOS native-ish tokens: 13px base font, cubic-bezier(0.32, 0.72, 0, 1) easing, `--diff-add-*` and `--diff-remove-*` CSS tokens with >= 4.5:1 contrast (Spec 7.2, 7.4, 7.5).
- Performance budgets measured in CI: Open repo < 800ms, First graph frame < 200ms, 60fps scrolling (Spec 5.5).
- Every Git operation is typed through Specta IPC commands; no raw Git CLI strings or untyped JSON in UI (Spec 4.3).

---

### Task 1: Add Dependencies for M1 (React Virtualizer & Native Folder Dialog)

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/Cargo.toml`
- Test: `src/test/setup.ts`

**Interfaces:**
- Consumes: Existing project dependencies.
- Produces: `@tanstack/react-virtual` in frontend, `rfd` crate in backend.

- [x] **Step 1: Write failing test verifying @tanstack/react-virtual and rfd availability**

In `src/test/setup.ts`, verify `@tanstack/react-virtual` import can be resolved:
```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

describe("Task 1 Dependencies", () => {
  it("should have @tanstack/react-virtual available", () => {
    expect(typeof useVirtualizer).toBe("function");
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/setup.ts`
Expected: FAIL with "Cannot find module '@tanstack/react-virtual'"

- [x] **Step 3: Add dependencies to package.json and Cargo.toml**

In `package.json` dependencies:
Add `"@tanstack/react-virtual": "^3.13.2"`

In `src-tauri/Cargo.toml` dependencies:
Add `rfd = "0.15"`

Run package installation:
```bash
pnpm install
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/setup.ts`
Expected: PASS

Run `cargo check` in `src-tauri`:
```bash
cargo check --manifest-path src-tauri/Cargo.toml
```
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src-tauri/Cargo.toml src-tauri/Cargo.lock src/test/setup.ts
git commit -m "chore(m1): add @tanstack/react-virtual and rfd dependencies"
```

---

### Task 2: Backend Repository Management & Recent Repos

**Files:**
- Create: `src-tauri/src/repo/recent.rs`
- Modify: `src-tauri/src/repo/mod.rs`
- Modify: `src-tauri/src/commands/repo.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Test: `src-tauri/tests/m1_repo_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `std::fs`, `std::path::PathBuf`.
- Produces:
  - `pub struct RepoSummary { pub path: String, pub name: String, pub is_bare: bool, pub head_branch: Option<String>, pub head_commit_id: Option<String> }`
  - `pub struct RecentRepoEntry { pub path: String, pub name: String, pub last_opened_at_ms: u64 }`
  - Command: `open_repository(path: String) -> Result<RepoSummary, AppError>`
  - Command: `get_recent_repos() -> Result<Vec<RecentRepoEntry>, AppError>`
  - Command: `select_repo_folder() -> Result<Option<String>, AppError>`

- [x] **Step 1: Write the failing integration test**

Create `src-tauri/tests/m1_repo_test.rs`:
```rust
mod common;

use common::fixtures::create_clean_repo;
use visual_git_lib::commands::{get_recent_repos, open_repository};

#[test]
fn test_open_repository_and_recent_tracking() {
    let (dir, _repo) = create_clean_repo().expect("Failed to create fixture repo");
    let path_str = dir.path().to_str().unwrap().to_string();

    let summary = open_repository(path_str.clone()).expect("Failed to open repo");
    assert_eq!(summary.head_branch.as_deref(), Some("master"));
    assert!(!summary.is_bare);
    assert!(summary.head_commit_id.is_some());

    let recents = get_recent_repos().expect("Failed to read recent repos");
    assert!(recents.iter().any(|r| r.path == summary.path));
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `cargo test --test m1_repo_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL with "open_repository not found in commands"

- [x] **Step 3: Implement recent repo storage and open_repository commands**

Create `src-tauri/src/repo/recent.rs`:
```rust
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RecentRepoEntry {
    pub path: String,
    pub name: String,
    pub last_opened_at_ms: u64,
}

pub struct RecentRepoStore {
    storage_file: PathBuf,
}

impl RecentRepoStore {
    pub fn new() -> Self {
        let dir = dirs_fallback();
        let _ = fs::create_dir_all(&dir);
        Self {
            storage_file: dir.join("recent_repos.json"),
        }
    }

    pub fn list(&self) -> Vec<RecentRepoEntry> {
        if !self.storage_file.exists() {
            return Vec::new();
        }
        fs::read_to_string(&self.storage_file)
            .ok()
            .and_then(|s| serde_json::from_str::<Vec<RecentRepoEntry>>(&s).ok())
            .unwrap_or_default()
    }

    pub fn record_open(&self, path: &Path, name: &str) -> Result<(), AppError> {
        let mut list = self.list();
        let path_str = path.to_string_lossy().to_string();
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        list.retain(|item| item.path != path_str);
        list.insert(
            0,
            RecentRepoEntry {
                path: path_str,
                name: name.to_string(),
                last_opened_at_ms: now,
            },
        );
        if list.len() > 20 {
            list.truncate(20);
        }

        let json = serde_json::to_string_pretty(&list)
            .map_err(|e| AppError::Io(e.to_string()))?;
        fs::write(&self.storage_file, json).map_err(AppError::from)?;
        Ok(())
    }
}

fn dirs_fallback() -> PathBuf {
    std::env::temp_dir().join("visual_git_client_data")
}
```

In `src-tauri/src/repo/mod.rs`, implement `RepoSummary` and `open`:
```rust
pub mod recent;

use crate::error::AppError;
use recent::{RecentRepoEntry, RecentRepoStore};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RepoSummary {
    pub path: String,
    pub name: String,
    pub is_bare: bool,
    pub head_branch: Option<String>,
    pub head_commit_id: Option<String>,
}

#[derive(Default)]
pub struct RepoManager {
    current_path: Option<PathBuf>,
    recent_store: RecentRepoStore,
}

impl RepoManager {
    pub fn new() -> Self {
        Self {
            current_path: None,
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
                head_branch = head.shorthand().map(|s| s.to_string());
            }
            head_commit_id = head.target().map(|oid| oid.to_string());
        }

        self.recent_store.record_open(&canonical, &name)?;
        self.current_path = Some(canonical.clone());

        Ok(RepoSummary {
            path: canonical.to_string_lossy().to_string(),
            name,
            is_bare: repo.is_bare(),
            head_branch,
            head_commit_id,
        })
    }

    pub fn list_recent(&self) -> Vec<RecentRepoEntry> {
        self.recent_store.list()
    }
}
```

Create `src-tauri/src/commands/repo.rs`:
```rust
use crate::error::AppError;
use crate::repo::{RecentRepoEntry, RepoManager, RepoSummary};
use std::sync::Mutex;

static REPO_MANAGER: Mutex<Option<RepoManager>> = Mutex::new(None);

fn with_manager<F, R>(f: F) -> R
where
    F: FnOnce(&mut RepoManager) -> R,
{
    let mut lock = REPO_MANAGER.lock().unwrap();
    if lock.is_none() {
        *lock = Some(RepoManager::new());
    }
    f(lock.as_mut().unwrap())
}

#[tauri::command]
#[specta::specta]
pub fn open_repository(path: String) -> Result<RepoSummary, AppError> {
    with_manager(|m| m.open(path))
}

#[tauri::command]
#[specta::specta]
pub fn get_recent_repos() -> Result<Vec<RecentRepoEntry>, AppError> {
    Ok(with_manager(|m| m.list_recent()))
}

#[tauri::command]
#[specta::specta]
pub fn select_repo_folder() -> Result<Option<String>, AppError> {
    let picked = rfd::FileDialog::new()
        .set_title("Chọn thư mục Git Repository")
        .pick_folder();
    Ok(picked.map(|p| p.to_string_lossy().to_string()))
}
```

Update `src-tauri/src/commands/mod.rs` to expose `repo`:
```rust
pub mod app;
pub mod repo;

pub use app::*;
pub use repo::*;
```

- [x] **Step 4: Run test to verify it passes**

Run: `cargo test --test m1_repo_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src-tauri/src/repo src-tauri/src/commands src-tauri/tests/m1_repo_test.rs
git commit -m "feat(m1): implement open_repository, get_recent_repos and select_repo_folder commands"
```

---

### Task 3: Backend Branch Listing (`read/branches.rs`)

**Files:**
- Create: `src-tauri/src/read/branches.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Test: `src-tauri/tests/m1_branch_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `git2::BranchType`.
- Produces:
  - `pub struct BranchItem { pub name: String, pub is_head: bool, pub target_commit_id: String, pub upstream: Option<String> }`
  - `pub struct BranchListResult { pub current_branch: Option<String>, pub is_detached: bool, pub local: Vec<BranchItem>, pub remote: Vec<BranchItem>, pub tags: Vec<String> }`
  - Command: `get_branches(repo_path: String) -> Result<BranchListResult, AppError>`

- [x] **Step 1: Write the failing integration test**

Create `src-tauri/tests/m1_branch_test.rs`:
```rust
mod common;

use common::fixtures::create_conflict_repo;
use visual_git_lib::commands::get_branches;

#[test]
fn test_get_branches_lists_local_and_head() {
    let (dir, _repo) = create_conflict_repo().expect("Failed to create conflict repo");
    let path_str = dir.path().to_str().unwrap().to_string();

    let result = get_branches(path_str).expect("Failed to get branches");
    assert!(!result.local.is_empty());
    assert!(result.local.iter().any(|b| b.name == "master" || b.name == "main"));
    assert!(result.local.iter().any(|b| b.name == "feature-branch"));

    let head_branch = result.local.iter().find(|b| b.is_head);
    assert!(head_branch.is_some());
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `cargo test --test m1_branch_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL with "get_branches not found"

- [x] **Step 3: Implement get_branches in read module and command**

Create `src-tauri/src/read/branches.rs`:
```rust
use crate::error::AppError;
use git2::{BranchType, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BranchItem {
    pub name: String,
    pub is_head: bool,
    pub target_commit_id: String,
    pub upstream: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BranchListResult {
    pub current_branch: Option<String>,
    pub is_detached: bool,
    pub local: Vec<BranchItem>,
    pub remote: Vec<BranchItem>,
    pub tags: Vec<String>,
}

pub fn list_repo_branches<P: AsRef<Path>>(repo_path: P) -> Result<BranchListResult, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    let is_detached = repo.head_detached().unwrap_or(false);
    let current_branch = if is_detached {
        None
    } else {
        repo.head().ok().and_then(|h| h.shorthand().map(|s| s.to_string()))
    };

    let mut local = Vec::new();
    if let Ok(branches) = repo.branches(Some(BranchType::Local)) {
        for branch_res in branches {
            if let Ok((branch, _)) = branch_res {
                if let Ok(Some(name)) = branch.name() {
                    let is_head = branch.is_head();
                    let target = branch.get().target().map(|o| o.to_string()).unwrap_or_default();
                    let upstream = branch
                        .upstream()
                        .ok()
                        .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));

                    local.push(BranchItem {
                        name: name.to_string(),
                        is_head,
                        target_commit_id: target,
                        upstream,
                    });
                }
            }
        }
    }

    let mut remote = Vec::new();
    if let Ok(branches) = repo.branches(Some(BranchType::Remote)) {
        for branch_res in branches {
            if let Ok((branch, _)) = branch_res {
                if let Ok(Some(name)) = branch.name() {
                    let target = branch.get().target().map(|o| o.to_string()).unwrap_or_default();
                    remote.push(BranchItem {
                        name: name.to_string(),
                        is_head: false,
                        target_commit_id: target,
                        upstream: None,
                    });
                }
            }
        }
    }

    let mut tags = Vec::new();
    if let Ok(tag_names) = repo.tag_names(None) {
        for t in tag_names.iter().flatten() {
            tags.push(t.to_string());
        }
    }

    Ok(BranchListResult {
        current_branch,
        is_detached,
        local,
        remote,
        tags,
    })
}
```

In `src-tauri/src/read/mod.rs`, export `branches`:
```rust
pub mod branches;
pub use branches::*;
```

Add command in `src-tauri/src/commands/repo.rs`:
```rust
#[tauri::command]
#[specta::specta]
pub fn get_branches(repo_path: String) -> Result<crate::read::BranchListResult, AppError> {
    crate::read::list_repo_branches(repo_path)
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `cargo test --test m1_branch_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src-tauri/src/read/branches.rs src-tauri/src/read/mod.rs src-tauri/src/commands/repo.rs src-tauri/tests/m1_branch_test.rs
git commit -m "feat(m1): implement branch and tag listing backend"
```

---

### Task 4: Backend Commit Graph & Lane Layout Engine (`read/graph.rs`)

**Files:**
- Create: `src-tauri/src/read/graph.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Modify: `src-tauri/src/commands/repo.rs`
- Test: `src-tauri/tests/m1_graph_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `git2::Revwalk`, `git2::Sort`.
- Produces:
  - `pub struct GraphEdge { pub from_col: usize, pub to_col: usize, pub edge_type: String, pub color_index: usize }`
  - `pub struct RefBadge { pub name: String, pub ref_type: String }`
  - `pub struct GraphCommitNode { pub id: String, pub short_id: String, pub summary: String, pub author_name: String, pub author_email: String, pub timestamp_sec: i64, pub parent_ids: Vec<String>, pub col: usize, pub color_index: usize, pub lines: Vec<GraphEdge>, pub refs: Vec<RefBadge> }`
  - `pub struct CommitGraphPage { pub commits: Vec<GraphCommitNode>, pub has_more: bool, pub total_count: usize }`
  - Command: `get_commit_graph(repo_path: String, offset: usize, limit: usize) -> Result<CommitGraphPage, AppError>`

- [x] **Step 1: Write failing test for graph layout**

Create `src-tauri/tests/m1_graph_test.rs`:
```rust
mod common;

use common::fixtures::create_repo_with_commits;
use visual_git_lib::commands::get_commit_graph;

#[test]
fn test_get_commit_graph_layout_and_pagination() {
    let (dir, _repo) = create_repo_with_commits(25).expect("Failed to create repo with 25 commits");
    let path_str = dir.path().to_str().unwrap().to_string();

    let page1 = get_commit_graph(path_str.clone(), 0, 10).expect("Failed to fetch graph page 1");
    assert_eq!(page1.commits.len(), 10);
    assert!(page1.has_more);
    assert_eq!(page1.total_count, 25);

    // Each node has short_id of 7 characters and a column assigned
    for node in &page1.commits {
        assert_eq!(node.short_id.len(), 7);
        assert!(!node.summary.is_empty());
        assert!(!node.author_name.is_empty());
    }

    let page3 = get_commit_graph(path_str, 20, 10).expect("Failed to fetch graph page 3");
    assert_eq!(page3.commits.len(), 5);
    assert!(!page3.has_more);
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `cargo test --test m1_graph_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL with "get_commit_graph not found"

- [x] **Step 3: Implement lane layout algorithm in graph.rs**

Create `src-tauri/src/read/graph.rs`:
```rust
use crate::error::AppError;
use git2::{Oid, Repository, Sort};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::{HashMap, HashSet};
use std::path::Path;

const NUM_COLORS: usize = 6;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphEdge {
    pub from_col: usize,
    pub to_col: usize,
    pub edge_type: String, // "straight", "fork", "merge"
    pub color_index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RefBadge {
    pub name: String,
    pub ref_type: String, // "head", "local", "remote", "tag"
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphCommitNode {
    pub id: String,
    pub short_id: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp_sec: i64,
    pub parent_ids: Vec<String>,
    pub col: usize,
    pub color_index: usize,
    pub lines: Vec<GraphEdge>,
    pub refs: Vec<RefBadge>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommitGraphPage {
    pub commits: Vec<GraphCommitNode>,
    pub has_more: bool,
    pub total_count: usize,
}

pub fn get_repo_commit_graph<P: AsRef<Path>>(
    repo_path: P,
    offset: usize,
    limit: usize,
) -> Result<CommitGraphPage, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.is_empty()? {
        return Ok(CommitGraphPage {
            commits: Vec::new(),
            has_more: false,
            total_count: 0,
        });
    }

    // Collect references for badge display
    let mut ref_map: HashMap<Oid, Vec<RefBadge>> = HashMap::new();
    if let Ok(references) = repo.references() {
        for r_res in references.flatten() {
            if let Some(target) = r_res.target() {
                let shorthand = r_res.shorthand().unwrap_or("").to_string();
                let ref_type = if r_res.is_tag() {
                    "tag"
                } else if r_res.is_remote() {
                    "remote"
                } else {
                    "local"
                };
                ref_map.entry(target).or_default().push(RefBadge {
                    name: shorthand,
                    ref_type: ref_type.to_string(),
                });
            }
        }
    }

    let mut revwalk = repo.revwalk()?;
    revwalk.set_sorting(Sort::TOPOLOGICAL | Sort::TIME)?;
    revwalk.push_glob("refs/heads/*").or_else(|_| revwalk.push_head())?;

    let all_oids: Vec<Oid> = revwalk.filter_map(|r| r.ok()).collect();
    let total_count = all_oids.len();

    let mut active_lanes: Vec<Option<Oid>> = Vec::new();
    let mut all_nodes = Vec::with_capacity(total_count);

    for oid in &all_oids {
        let commit = repo.find_commit(*oid)?;
        let parent_oids: Vec<Oid> = commit.parent_ids().collect();

        // 1. Assign column for this commit
        let col = match active_lanes.iter().position(|slot| slot.as_ref() == Some(oid)) {
            Some(idx) => idx,
            None => match active_lanes.iter().position(|slot| slot.is_none()) {
                Some(idx) => {
                    active_lanes[idx] = Some(*oid);
                    idx
                }
                None => {
                    active_lanes.push(Some(*oid));
                    active_lanes.len() - 1
                }
            },
        };

        let color_index = col % NUM_COLORS;
        let mut edges = Vec::new();

        // Pass-through lines from earlier lanes
        for (i, slot) in active_lanes.iter().enumerate() {
            if i != col && slot.is_some() {
                edges.push(GraphEdge {
                    from_col: i,
                    to_col: i,
                    edge_type: "straight".to_string(),
                    color_index: i % NUM_COLORS,
                });
            }
        }

        // Connect to parents
        if let Some(first_parent) = parent_oids.first() {
            active_lanes[col] = Some(*first_parent);
            edges.push(GraphEdge {
                from_col: col,
                to_col: col,
                edge_type: "straight".to_string(),
                color_index,
            });

            // Extra merge parents
            for extra_parent in parent_oids.iter().skip(1) {
                let to_col = match active_lanes.iter().position(|s| s.as_ref() == Some(extra_parent)) {
                    Some(idx) => idx,
                    None => match active_lanes.iter().position(|s| s.is_none()) {
                        Some(idx) => {
                            active_lanes[idx] = Some(*extra_parent);
                            idx
                        }
                        None => {
                            active_lanes.push(Some(*extra_parent));
                            active_lanes.len() - 1
                        }
                    },
                };
                edges.push(GraphEdge {
                    from_col: col,
                    to_col,
                    edge_type: "fork".to_string(),
                    color_index: to_col % NUM_COLORS,
                });
            }
        } else {
            // Root commit (no parents)
            active_lanes[col] = None;
        }

        // Clean trailing Nones
        while let Some(None) = active_lanes.last() {
            active_lanes.pop();
        }

        let summary = commit.summary().unwrap_or("No message").to_string();
        let author = commit.author();
        let author_name = author.name().unwrap_or("Unknown").to_string();
        let author_email = author.email().unwrap_or("").to_string();
        let timestamp_sec = commit.time().seconds();
        let parent_ids: Vec<String> = parent_oids.iter().map(|p| p.to_string()).collect();

        let badges = ref_map.remove(oid).unwrap_or_default();
        let hex = oid.to_string();
        let short_id = hex.chars().take(7).collect();

        all_nodes.push(GraphCommitNode {
            id: hex,
            short_id,
            summary,
            author_name,
            author_email,
            timestamp_sec,
            parent_ids,
            col,
            color_index,
            lines: edges,
            refs: badges,
        });
    }

    let end = (offset + limit).min(total_count);
    let commits = if offset < total_count {
        all_nodes[offset..end].to_vec()
    } else {
        Vec::new()
    };
    let has_more = end < total_count;

    Ok(CommitGraphPage {
        commits,
        has_more,
        total_count,
    })
}
```

In `src-tauri/src/read/mod.rs`:
```rust
pub mod branches;
pub mod graph;

pub use branches::*;
pub use graph::*;
```

Add command in `src-tauri/src/commands/repo.rs`:
```rust
#[tauri::command]
#[specta::specta]
pub fn get_commit_graph(
    repo_path: String,
    offset: usize,
    limit: usize,
) -> Result<crate::read::CommitGraphPage, AppError> {
    crate::read::get_repo_commit_graph(repo_path, offset, limit)
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `cargo test --test m1_graph_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src-tauri/src/read/graph.rs src-tauri/src/read/mod.rs src-tauri/src/commands/repo.rs src-tauri/tests/m1_graph_test.rs
git commit -m "feat(m1): implement topological commit graph with SVG lane allocation"
```

---

### Task 5: Backend Commit Details & Diff Inspection with Caching (`read/diff.rs`)

**Files:**
- Create: `src-tauri/src/read/diff.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Modify: `src-tauri/src/commands/repo.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/tests/m1_diff_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `git2::Diff`, `git2::DiffOptions`.
- Produces:
  - `pub struct CommitChangedFile { pub path: String, pub status: String, pub additions: usize, pub deletions: usize }`
  - `pub struct CommitDetails { pub id: String, pub full_message: String, pub author_name: String, pub author_email: String, pub author_timestamp_sec: i64, pub parent_ids: Vec<String>, pub files: Vec<CommitChangedFile>, pub total_additions: usize, pub total_deletions: usize }`
  - `pub struct DiffLine { pub line_type: String, pub content: String, pub old_lineno: Option<u32>, pub new_lineno: Option<u32> }`
  - `pub struct DiffHunk { pub header: String, pub old_start: u32, pub old_lines: u32, pub new_start: u32, pub new_lines: u32, pub lines: Vec<DiffLine> }`
  - `pub struct FileDiffResult { pub file_path: String, pub status: String, pub hunks: Vec<DiffHunk>, pub additions: usize, pub deletions: usize }`
  - Command: `get_commit_details(repo_path: String, commit_id: String) -> Result<CommitDetails, AppError>`
  - Command: `get_commit_file_diff(repo_path: String, commit_id: String, file_path: String) -> Result<FileDiffResult, AppError>`

- [x] **Step 1: Write failing integration test for details and diff**

Create `src-tauri/tests/m1_diff_test.rs`:
```rust
mod common;

use common::fixtures::create_repo_with_commits;
use visual_git_lib::commands::{get_commit_details, get_commit_file_diff, get_commit_graph};

#[test]
fn test_commit_details_and_file_diff() {
    let (dir, _repo) = create_repo_with_commits(3).expect("Failed to create repo");
    let path_str = dir.path().to_str().unwrap().to_string();

    let page = get_commit_graph(path_str.clone(), 0, 1).expect("Failed to fetch head commit");
    let head_commit_id = page.commits[0].id.clone();

    let details = get_commit_details(path_str.clone(), head_commit_id.clone())
        .expect("Failed to get commit details");
    assert_eq!(details.id, head_commit_id);
    assert!(!details.files.is_empty());

    let changed_file = &details.files[0];
    assert!(changed_file.additions > 0);

    let diff = get_commit_file_diff(path_str, head_commit_id, changed_file.path.clone())
        .expect("Failed to get file diff");
    assert_eq!(diff.file_path, changed_file.path);
    assert!(!diff.hunks.is_empty());
    assert!(diff.hunks[0].lines.iter().any(|l| l.line_type == "add"));
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `cargo test --test m1_diff_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL with "get_commit_details not found"

- [x] **Step 3: Implement diff parsing and caching in diff.rs**

Create `src-tauri/src/read/diff.rs`:
```rust
use crate::error::AppError;
use git2::{Delta, DiffFormat, DiffOptions, Oid, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommitChangedFile {
    pub path: String,
    pub status: String, // "added", "modified", "deleted", "renamed"
    pub additions: usize,
    pub deletions: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommitDetails {
    pub id: String,
    pub full_message: String,
    pub author_name: String,
    pub author_email: String,
    pub author_timestamp_sec: i64,
    pub parent_ids: Vec<String>,
    pub files: Vec<CommitChangedFile>,
    pub total_additions: usize,
    pub total_deletions: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DiffLine {
    pub line_type: String, // "add", "delete", "context"
    pub content: String,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DiffHunk {
    pub header: String,
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileDiffResult {
    pub file_path: String,
    pub status: String,
    pub hunks: Vec<DiffHunk>,
    pub additions: usize,
    pub deletions: usize,
}

// Immutable cache for diffs: (commit_id, file_path) -> FileDiffResult
static DIFF_CACHE: Mutex<Option<HashMap<(String, String), FileDiffResult>>> = Mutex::new(None);

fn get_cached_diff(key: &(String, String)) -> Option<FileDiffResult> {
    let lock = DIFF_CACHE.lock().unwrap();
    lock.as_ref().and_then(|map| map.get(key).cloned())
}

fn set_cached_diff(key: (String, String), result: FileDiffResult) {
    let mut lock = DIFF_CACHE.lock().unwrap();
    if lock.is_none() {
        *lock = Some(HashMap::new());
    }
    lock.as_mut().unwrap().insert(key, result);
}

pub fn get_commit_info<P: AsRef<Path>>(
    repo_path: P,
    commit_id_str: &str,
) -> Result<CommitDetails, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let oid = Oid::from_str(commit_id_str).map_err(|e| AppError::Git(e.to_string()))?;
    let commit = repo.find_commit(oid)?;

    let commit_tree = commit.tree()?;
    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let mut diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), None)?;
    let mut files = Vec::new();
    let mut total_additions = 0;
    let mut total_deletions = 0;

    let stats = diff.stats()?;
    let _ = stats; // stats available

    let deltas: Vec<_> = diff.deltas().collect();
    for (idx, delta) in deltas.into_iter().enumerate() {
        let path = delta
            .new_file()
            .path()
            .or_else(|| delta.old_file().path())
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let status = match delta.status() {
            Delta::Added => "added",
            Delta::Deleted => "deleted",
            Delta::Renamed => "renamed",
            _ => "modified",
        };

        // Count per-delta stats
        let mut patch = git2::Patch::from_diff(&diff, idx)?;
        let mut additions = 0;
        let mut deletions = 0;
        if let Some(ref mut p) = patch {
            let (_, adds, dels) = p.line_stats()?;
            additions = adds;
            deletions = dels;
        }

        total_additions += additions;
        total_deletions += deletions;

        files.push(CommitChangedFile {
            path,
            status: status.to_string(),
            additions,
            deletions,
        });
    }

    let parent_ids = commit.parents().map(|p| p.id().to_string()).collect();

    Ok(CommitDetails {
        id: commit_id_str.to_string(),
        full_message: commit.message().unwrap_or("").to_string(),
        author_name: commit.author().name().unwrap_or("Unknown").to_string(),
        author_email: commit.author().email().unwrap_or("").to_string(),
        author_timestamp_sec: commit.time().seconds(),
        parent_ids,
        files,
        total_additions,
        total_deletions,
    })
}

pub fn get_file_diff<P: AsRef<Path>>(
    repo_path: P,
    commit_id_str: &str,
    target_path: &str,
) -> Result<FileDiffResult, AppError> {
    let cache_key = (commit_id_str.to_string(), target_path.to_string());
    if let Some(cached) = get_cached_diff(&cache_key) {
        return Ok(cached);
    }

    let repo = Repository::open(repo_path.as_ref())?;
    let oid = Oid::from_str(commit_id_str).map_err(|e| AppError::Git(e.to_string()))?;
    let commit = repo.find_commit(oid)?;

    let commit_tree = commit.tree()?;
    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let mut opts = DiffOptions::new();
    opts.pathspec(target_path);

    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), Some(&mut opts))?;

    let mut hunks = Vec::new();
    let mut current_hunk: Option<DiffHunk> = None;
    let mut additions = 0;
    let mut deletions = 0;
    let mut status = "modified".to_string();

    if let Some(delta) = diff.deltas().next() {
        status = match delta.status() {
            Delta::Added => "added",
            Delta::Deleted => "deleted",
            Delta::Renamed => "renamed",
            _ => "modified",
        }
        .to_string();
    }

    diff.print(DiffFormat::Patch, |_delta, hunk, line| {
        if let Some(h) = hunk {
            if let Some(prev) = current_hunk.take() {
                if prev.header != String::from_utf8_lossy(h.header()).trim() {
                    hunks.push(prev);
                } else {
                    current_hunk = Some(prev);
                }
            }
            if current_hunk.is_none() {
                current_hunk = Some(DiffHunk {
                    header: String::from_utf8_lossy(h.header()).trim().to_string(),
                    old_start: h.old_start(),
                    old_lines: h.old_lines(),
                    new_start: h.new_start(),
                    new_lines: h.new_lines(),
                    lines: Vec::new(),
                });
            }
        }

        let origin = line.origin();
        let (line_type, is_counted) = match origin {
            '+' => {
                additions += 1;
                ("add", true)
            }
            '-' => {
                deletions += 1;
                ("delete", true)
            }
            _ => ("context", false),
        };
        let _ = is_counted;

        let content = String::from_utf8_lossy(line.content()).to_string();
        if let Some(ref mut h) = current_hunk {
            h.lines.push(DiffLine {
                line_type: line_type.to_string(),
                content,
                old_lineno: line.old_lineno(),
                new_lineno: line.new_lineno(),
            });
        }
        true
    })?;

    if let Some(h) = current_hunk {
        hunks.push(h);
    }

    let result = FileDiffResult {
        file_path: target_path.to_string(),
        status,
        hunks,
        additions,
        deletions,
    };

    set_cached_diff(cache_key, result.clone());
    Ok(result)
}
```

Update `src-tauri/src/read/mod.rs` to export `diff`:
```rust
pub mod branches;
pub mod diff;
pub mod graph;

pub use branches::*;
pub use diff::*;
pub use graph::*;
```

Add commands in `src-tauri/src/commands/repo.rs`:
```rust
#[tauri::command]
#[specta::specta]
pub fn get_commit_details(
    repo_path: String,
    commit_id: String,
) -> Result<crate::read::CommitDetails, AppError> {
    crate::read::get_commit_info(repo_path, &commit_id)
}

#[tauri::command]
#[specta::specta]
pub fn get_commit_file_diff(
    repo_path: String,
    commit_id: String,
    file_path: String,
) -> Result<crate::read::FileDiffResult, AppError> {
    crate::read::get_file_diff(repo_path, &commit_id, &file_path)
}
```

Update `src-tauri/src/lib.rs` to register all M1 commands in `create_specta_builder`:
```rust
pub fn create_specta_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        ping,
        get_system_info,
        get_repo_head_info,
        simulate_repo_change,
        open_repository,
        get_recent_repos,
        select_repo_folder,
        get_branches,
        get_commit_graph,
        get_commit_details,
        get_commit_file_diff
    ])
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `cargo test --test m1_diff_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src-tauri/src/read/diff.rs src-tauri/src/read/mod.rs src-tauri/src/commands/repo.rs src-tauri/src/lib.rs src-tauri/tests/m1_diff_test.rs
git commit -m "feat(m1): implement commit details, file diff with in-memory caching and register specta commands"
```

---

### Task 6: Frontend IPC Client & State Store for M1

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Create: `src/store/useRepoStore.ts`
- Test: `src/test/useRepoStore.test.ts`

**Interfaces:**
- Consumes: Specta generated types.
- Produces:
  - `useRepoStore` hook: `currentRepo: RepoSummary | null`, `selectedCommitId: string | null`, `selectedFilePath: string | null`, `selectedBranch: string | null`, `setRepo`, `setSelectedCommit`, `setSelectedFile`, `setSelectedBranch`, `clearRepo`.
  - Typed IPC methods in `invokeCommand`: `openRepository`, `getRecentRepos`, `selectRepoFolder`, `getBranches`, `getCommitGraph`, `getCommitDetails`, `getCommitFileDiff`.

- [x] **Step 1: Write failing test for useRepoStore**

Create `src/test/useRepoStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useRepoStore } from "../store/useRepoStore";

describe("useRepoStore", () => {
  beforeEach(() => {
    useRepoStore.getState().clearRepo();
  });

  it("should initialize with null state", () => {
    const state = useRepoStore.getState();
    expect(state.currentRepo).toBeNull();
    expect(state.selectedCommitId).toBeNull();
    expect(state.selectedFilePath).toBeNull();
  });

  it("should update repo and reset selections", () => {
    useRepoStore.getState().setRepo({
      path: "/test/repo",
      name: "repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc1234",
    });

    useRepoStore.getState().setSelectedCommit("c1");
    useRepoStore.getState().setSelectedFile("file.txt");

    expect(useRepoStore.getState().selectedCommitId).toBe("c1");
    expect(useRepoStore.getState().selectedFilePath).toBe("file.txt");

    useRepoStore.getState().clearRepo();
    expect(useRepoStore.getState().currentRepo).toBeNull();
    expect(useRepoStore.getState().selectedCommitId).toBeNull();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/useRepoStore.test.ts`
Expected: FAIL with "Cannot find module '../store/useRepoStore'"

- [x] **Step 3: Update IPC bindings, client, and implement useRepoStore**

Update `src/ipc/bindings.ts` with the M1 exported types:
```typescript
export interface RepoSummary {
  path: string;
  name: string;
  is_bare: boolean;
  head_branch: string | null;
  head_commit_id: string | null;
}

export interface RecentRepoEntry {
  path: string;
  name: string;
  last_opened_at_ms: number;
}

export interface BranchItem {
  name: string;
  is_head: boolean;
  target_commit_id: string;
  upstream: string | null;
}

export interface BranchListResult {
  current_branch: string | null;
  is_detached: boolean;
  local: BranchItem[];
  remote: BranchItem[];
  tags: string[];
}

export interface GraphEdge {
  from_col: number;
  to_col: number;
  edge_type: string;
  color_index: number;
}

export interface RefBadge {
  name: string;
  ref_type: string;
}

export interface GraphCommitNode {
  id: string;
  short_id: string;
  summary: string;
  author_name: string;
  author_email: string;
  timestamp_sec: number;
  parent_ids: string[];
  col: number;
  color_index: number;
  lines: GraphEdge[];
  refs: RefBadge[];
}

export interface CommitGraphPage {
  commits: GraphCommitNode[];
  has_more: boolean;
  total_count: number;
}

export interface CommitChangedFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
}

export interface CommitDetails {
  id: string;
  full_message: string;
  author_name: string;
  author_email: string;
  author_timestamp_sec: number;
  parent_ids: string[];
  files: CommitChangedFile[];
  total_additions: number;
  total_deletions: number;
}

export interface DiffLine {
  line_type: string;
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface FileDiffResult {
  file_path: string;
  status: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}
```

In `src/ipc/client.ts`, add methods to `invokeCommand` with browser dev fallbacks for component tests:
```typescript
openRepository: async (path: string): Promise<RepoSummary> => {
  if (!isTauri()) {
    return {
      path,
      name: path.split("/").pop() || "mock-repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "a1b2c3d",
    };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<RepoSummary>("open_repository", { path });
},

getRecentRepos: async (): Promise<RecentRepoEntry[]> => {
  if (!isTauri()) {
    return [
      { path: "d:/project-v3", name: "project-v3", last_opened_at_ms: Date.now() - 3600000 },
    ];
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<RecentRepoEntry[]>("get_recent_repos");
},

selectRepoFolder: async (): Promise<string | null> => {
  if (!isTauri()) return "d:/project-v3";
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<string | null>("select_repo_folder");
},

getBranches: async (repoPath: string): Promise<BranchListResult> => {
  if (!isTauri()) {
    return {
      current_branch: "main",
      is_detached: false,
      local: [{ name: "main", is_head: true, target_commit_id: "c1", upstream: "origin/main" }],
      remote: [{ name: "origin/main", is_head: false, target_commit_id: "c1", upstream: null }],
      tags: ["v0.1.0"],
    };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<BranchListResult>("get_branches", { repoPath });
},

getCommitGraph: async (repoPath: string, offset: number, limit: number): Promise<CommitGraphPage> => {
  if (!isTauri()) {
    return {
      commits: [
        {
          id: "1111111111111111111111111111111111111111",
          short_id: "1111111",
          summary: "feat(m1): visual git viewer",
          author_name: "Visual Git Team",
          author_email: "team@visualgit.dev",
          timestamp_sec: Math.floor(Date.now() / 1000),
          parent_ids: [],
          col: 0,
          color_index: 0,
          lines: [],
          refs: [{ name: "main", ref_type: "head" }],
        },
      ],
      has_more: false,
      total_count: 1,
    };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<CommitGraphPage>("get_commit_graph", { repoPath, offset, limit });
},

getCommitDetails: async (repoPath: string, commitId: string): Promise<CommitDetails> => {
  if (!isTauri()) {
    return {
      id: commitId,
      full_message: "feat(m1): visual git viewer\n\nFull details preview",
      author_name: "Tester",
      author_email: "tester@dev.com",
      author_timestamp_sec: Math.floor(Date.now() / 1000),
      parent_ids: [],
      files: [{ path: "README.md", status: "modified", additions: 10, deletions: 2 }],
      total_additions: 10,
      total_deletions: 2,
    };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<CommitDetails>("get_commit_details", { repoPath, commitId });
},

getCommitFileDiff: async (repoPath: string, commitId: string, filePath: string): Promise<FileDiffResult> => {
  if (!isTauri()) {
    return {
      file_path: filePath,
      status: "modified",
      additions: 1,
      deletions: 1,
      hunks: [
        {
          header: "@@ -1,2 +1,2 @@",
          old_start: 1,
          old_lines: 2,
          new_start: 1,
          new_lines: 2,
          lines: [
            { line_type: "delete", content: "- legacy mock line\n", old_lineno: 1, new_lineno: null },
            { line_type: "add", content: "+ new live line\n", old_lineno: null, new_lineno: 1 },
          ],
        },
      ],
    };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<FileDiffResult>("get_commit_file_diff", { repoPath, commitId, filePath });
},
```

Create `src/store/useRepoStore.ts`:
```typescript
import { create } from "zustand";
import { RepoSummary } from "../ipc/bindings";

interface RepoState {
  currentRepo: RepoSummary | null;
  selectedCommitId: string | null;
  selectedFilePath: string | null;
  selectedBranch: string | null;

  setRepo: (repo: RepoSummary) => void;
  setSelectedCommit: (commitId: string | null) => void;
  setSelectedFile: (filePath: string | null) => void;
  setSelectedBranch: (branch: string | null) => void;
  clearRepo: () => void;
}

export const useRepoStore = create<RepoState>((set) => ({
  currentRepo: null,
  selectedCommitId: null,
  selectedFilePath: null,
  selectedBranch: null,

  setRepo: (repo) =>
    set({
      currentRepo: repo,
      selectedCommitId: null,
      selectedFilePath: null,
      selectedBranch: repo.head_branch,
    }),

  setSelectedCommit: (commitId) =>
    set({
      selectedCommitId: commitId,
      selectedFilePath: null,
    }),

  setSelectedFile: (filePath) => set({ selectedFilePath: filePath }),
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  clearRepo: () =>
    set({
      currentRepo: null,
      selectedCommitId: null,
      selectedFilePath: null,
      selectedBranch: null,
    }),
}));
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/useRepoStore.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/ipc/bindings.ts src/ipc/client.ts src/store/useRepoStore.ts src/test/useRepoStore.test.ts
git commit -m "feat(m1): add M1 types, client invocation fallbacks and useRepoStore"
```

---

### Task 7: Frontend Welcome Screen & Repo Header

**Files:**
- Create: `src/components/welcome/WelcomeScreen.tsx`
- Create: `src/components/header/RepoHeader.tsx`
- Test: `src/test/WelcomeScreen.test.tsx`

**Interfaces:**
- Consumes: `useRepoStore`, `invokeCommand.getRecentRepos`, `invokeCommand.openRepository`, `invokeCommand.selectRepoFolder`.
- Produces: `<WelcomeScreen onOpenRepo={...} />`, `<RepoHeader onSwitchRepo={...} />`.

- [ ] **Step 1: Write failing test for WelcomeScreen**

Create `src/test/WelcomeScreen.test.tsx`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WelcomeScreen } from "../components/welcome/WelcomeScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("WelcomeScreen", () => {
  it("renders open button and recent repos list", async () => {
    const onSelect = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={onSelect} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Visual Git Client")).toBeInTheDocument();
    expect(screen.getByText("Mở thư mục...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("project-v3"));
    expect(onSelect).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/WelcomeScreen.test.tsx`
Expected: FAIL with "Cannot find module '../components/welcome/WelcomeScreen'"

- [ ] **Step 3: Implement WelcomeScreen and RepoHeader**

Create `src/components/welcome/WelcomeScreen.tsx`:
```tsx
import React from "react";
import { FolderGit2, FolderOpen, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRepo }) => {
  const { data: recents = [], isLoading } = useQuery({
    queryKey: ["recent-repos"],
    queryFn: () => invokeCommand.getRecentRepos(),
  });

  const handleOpenFolder = async () => {
    const path = await invokeCommand.selectRepoFolder();
    if (path) {
      const summary = await invokeCommand.openRepository(path);
      onSelectRepo(summary);
    }
  };

  const handleOpenRecent = async (path: string) => {
    const summary = await invokeCommand.openRepository(path);
    onSelectRepo(summary);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-window)",
        padding: "var(--space-6)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FolderGit2 size={48} color="var(--accent)" style={{ marginBottom: "var(--space-3)" }} />
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>Visual Git Client</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "4px" }}>
            Trực quan hoá lịch sử Git nhanh và mượt mà
          </p>
        </div>

        <button
          onClick={handleOpenFolder}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-2)",
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--accent)",
            color: "var(--accent-contrast)",
            borderRadius: "var(--radius-lg)",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
            border: "none",
            boxShadow: "var(--shadow-md)",
            minHeight: "40px",
          }}
        >
          <FolderOpen size={18} />
          <span>Mở thư mục...</span>
        </button>

        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)", fontWeight: 600, textTransform: "uppercase" }}>
            <Clock size={13} />
            <span>Repository gần đây</span>
          </div>

          {isLoading ? (
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>Đang tải...</p>
          ) : recents.length === 0 ? (
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>Chưa có repository nào gần đây.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              {recents.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleOpenRecent(item.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) var(--space-3)",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{item.name}</span>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>{item.path}</span>
                  </div>
                  <ArrowRight size={14} color="var(--text-secondary)" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

Create `src/components/header/RepoHeader.tsx`:
```tsx
import React from "react";
import { FolderGit2, GitBranch, ArrowLeft, RefreshCw } from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useQueryClient } from "@tanstack/react-query";

interface RepoHeaderProps {
  onBackToWelcome: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onBackToWelcome }) => {
  const { currentRepo } = useRepoStore();
  const queryClient = useQueryClient();

  if (!currentRepo) return null;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-2) var(--space-4)",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        height: "44px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <button
          onClick={onBackToWelcome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            backgroundColor: "transparent",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-xs)",
            cursor: "pointer",
          }}
          title="Đổi repository"
        >
          <ArrowLeft size={13} />
          <span>Kho</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FolderGit2 size={16} color="var(--accent)" />
          <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{currentRepo.name}</span>
        </div>

        {currentRepo.head_branch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
            }}
          >
            <GitBranch size={12} />
            <span>{currentRepo.head_branch}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <button
          onClick={() => queryClient.invalidateQueries()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-xs)",
            cursor: "pointer",
          }}
          title="Tải lại dữ liệu repo"
        >
          <RefreshCw size={13} />
          <span>Làm mới</span>
        </button>
      </div>
    </header>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/WelcomeScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/welcome/WelcomeScreen.tsx src/components/header/RepoHeader.tsx src/test/WelcomeScreen.test.tsx
git commit -m "feat(m1): implement WelcomeScreen and RepoHeader components"
```

---

### Task 8: Frontend Branch Sidebar (`BranchSidebar.tsx`)

**Files:**
- Create: `src/components/sidebar/BranchSidebar.tsx`
- Test: `src/test/BranchSidebar.test.tsx`

**Interfaces:**
- Consumes: `useRepoStore`, `invokeCommand.getBranches`.
- Produces: `<BranchSidebar />`.

- [ ] **Step 1: Write failing test for BranchSidebar**

Create `src/test/BranchSidebar.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BranchSidebar } from "../components/sidebar/BranchSidebar";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("BranchSidebar", () => {
  it("renders local branches with active HEAD indicator", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("main")).toBeInTheDocument();
      expect(screen.getByText("origin/main")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/BranchSidebar.test.tsx`
Expected: FAIL with "Cannot find module '../components/sidebar/BranchSidebar'"

- [ ] **Step 3: Implement BranchSidebar component**

Create `src/components/sidebar/BranchSidebar.tsx`:
```tsx
import React, { useState } from "react";
import { GitBranch, Globe, Tag, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { invokeCommand } from "../../ipc/client";

export const BranchSidebar: React.FC = () => {
  const { currentRepo, selectedBranch, setSelectedBranch } = useRepoStore();
  const [search, setSearch] = useState("");
  const [localOpen, setLocalOpen] = useState(true);
  const [remoteOpen, setRemoteOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  const { data: branchData } = useQuery({
    queryKey: ["branches", currentRepo?.path],
    queryFn: () => invokeCommand.getBranches(currentRepo!.path),
    enabled: Boolean(currentRepo),
  });

  if (!currentRepo) return null;

  const localBranches = (branchData?.local || []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );
  const remoteBranches = (branchData?.remote || []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );
  const tags = (branchData?.tags || []).filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        width: "240px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Search Branch Input */}
      <div style={{ padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "var(--bg-window)",
            borderRadius: "var(--radius-sm)",
            padding: "4px 8px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Search size={12} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Tìm nhánh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "var(--font-size-xs)",
              color: "var(--text-primary)",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div style={{ padding: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {/* Local Branches Section */}
        <div>
          <button
            onClick={() => setLocalOpen(!localOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "100%",
              padding: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {localOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <GitBranch size={13} />
            <span>NHÁNH CỤC BỘ ({localBranches.length})</span>
          </button>

          {localOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
              {localBranches.map((branch) => {
                const isSelected = selectedBranch === branch.name;
                return (
                  <button
                    key={branch.name}
                    onClick={() => setSelectedBranch(branch.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: isSelected ? "var(--accent-subtle)" : "transparent",
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                      fontWeight: branch.is_head || isSelected ? 600 : 400,
                      fontSize: "var(--font-size-xs)",
                      cursor: "pointer",
                      textAlign: "left",
                      minHeight: "26px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: branch.is_head ? "var(--accent)" : "transparent",
                        border: branch.is_head ? "none" : "1px solid var(--text-tertiary)",
                      }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {branch.name}
                    </span>
                    {branch.is_head && (
                      <span style={{ fontSize: "10px", color: "var(--accent)", marginLeft: "auto" }}>HEAD</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Remote Branches Section */}
        <div>
          <button
            onClick={() => setRemoteOpen(!remoteOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "100%",
              padding: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {remoteOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Globe size={13} />
            <span>NHÁNH MÁY CHỦ ({remoteBranches.length})</span>
          </button>

          {remoteOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
              {remoteBranches.map((branch) => (
                <div
                  key={branch.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    fontSize: "var(--font-size-xs)",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {branch.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "100%",
              padding: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {tagsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Tag size={13} />
            <span>TAGS ({tags.length})</span>
          </button>

          {tagsOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
              {tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: "4px 8px",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/BranchSidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/BranchSidebar.tsx src/test/BranchSidebar.test.tsx
git commit -m "feat(m1): implement BranchSidebar with local, remote and tag trees"
```

---

### Task 9: Frontend Commit Graph with Virtualization & SVG Rendering

**Files:**
- Create: `src/components/graph/CommitGraph.tsx`
- Create: `src/components/graph/GraphSvgLane.tsx`
- Test: `src/test/CommitGraph.test.tsx`

**Interfaces:**
- Consumes: `@tanstack/react-virtual`, `useRepoStore`, `invokeCommand.getCommitGraph`.
- Produces: `<CommitGraph />` rendering virtualized rows with SVG lanes and commit selection.

- [ ] **Step 1: Write failing test for CommitGraph**

Create `src/test/CommitGraph.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CommitGraph } from "../components/graph/CommitGraph";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("CommitGraph", () => {
  it("renders virtualized commit items with summary and author", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "1111111",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("feat(m1): visual git viewer")).toBeInTheDocument();
      expect(screen.getByText("1111111")).toBeInTheDocument();
      expect(screen.getByText("Visual Git Team")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/CommitGraph.test.tsx`
Expected: FAIL with "Cannot find module '../components/graph/CommitGraph'"

- [ ] **Step 3: Implement GraphSvgLane and CommitGraph**

Create `src/components/graph/GraphSvgLane.tsx`:
```tsx
import React from "react";
import { GraphEdge } from "../../ipc/bindings";

const LANE_COLORS = [
  "#2F6FEB", // Blue
  "#8E44AD", // Purple
  "#27AE60", // Green
  "#E67E22", // Orange
  "#E74C3C", // Red
  "#16A085", // Teal
];

const COL_WIDTH = 14;
const ROW_HEIGHT = 28;

interface GraphSvgLaneProps {
  col: number;
  colorIndex: number;
  lines: GraphEdge[];
}

export const GraphSvgLane: React.FC<GraphSvgLaneProps> = ({ col, colorIndex, lines }) => {
  const nodeX = col * COL_WIDTH + COL_WIDTH / 2;
  const nodeY = ROW_HEIGHT / 2;
  const nodeColor = LANE_COLORS[colorIndex % LANE_COLORS.length];

  return (
    <svg
      style={{
        width: `${Math.max(col + 2, 3) * COL_WIDTH}px`,
        height: `${ROW_HEIGHT}px`,
        flexShrink: 0,
        overflow: "visible",
      }}
    >
      {/* Edges */}
      {lines.map((edge, idx) => {
        const x1 = edge.from_col * COL_WIDTH + COL_WIDTH / 2;
        const x2 = edge.to_col * COL_WIDTH + COL_WIDTH / 2;
        const strokeColor = LANE_COLORS[edge.color_index % LANE_COLORS.length];

        if (edge.edge_type === "straight") {
          return (
            <line
              key={idx}
              x1={x1}
              y1={0}
              x2={x2}
              y2={ROW_HEIGHT}
              stroke={strokeColor}
              strokeWidth={2}
            />
          );
        }

        // Fork or merge curve
        return (
          <path
            key={idx}
            d={`M ${x1} ${nodeY} C ${x1} ${ROW_HEIGHT}, ${x2} 0, ${x2} ${ROW_HEIGHT}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
          />
        );
      })}

      {/* Commit Node Circle */}
      <circle cx={nodeX} cy={nodeY} r={4.5} fill={nodeColor} />
      <circle cx={nodeX} cy={nodeY} r={2} fill="var(--bg-surface)" />
    </svg>
  );
};
```

Create `src/components/graph/CommitGraph.tsx`:
```tsx
import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { invokeCommand } from "../../ipc/client";
import { GraphSvgLane } from "./GraphSvgLane";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 28;

export const CommitGraph: React.FC = () => {
  const { currentRepo, selectedCommitId, setSelectedCommit } = useRepoStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["commit-graph", currentRepo?.path],
    queryFn: ({ pageParam = 0 }) =>
      invokeCommand.getCommitGraph(currentRepo!.path, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: Boolean(currentRepo),
  });

  const commits = data ? data.pages.flatMap((page) => page.commits) : [];

  const rowVirtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        backgroundColor: "var(--bg-surface)",
        position: "relative",
      }}
      onScroll={(e) => {
        const target = e.currentTarget;
        if (
          target.scrollHeight - target.scrollTop - target.clientHeight < 200 &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const commit = commits[virtualRow.index];
          const isSelected = selectedCommitId === commit.id;

          return (
            <div
              key={commit.id}
              onClick={() => setSelectedCommit(commit.id)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "0 var(--space-3)",
                backgroundColor: isSelected ? "var(--accent-subtle)" : "transparent",
                borderBottom: "1px solid var(--border-subtle)",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {/* Lane SVG */}
              <GraphSvgLane col={commit.col} colorIndex={commit.color_index} lines={commit.lines} />

              {/* Ref Badges */}
              {commit.refs.map((r, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: r.ref_type === "head" ? "var(--accent)" : "var(--border-strong)",
                    color: r.ref_type === "head" ? "var(--accent-contrast)" : "var(--text-primary)",
                    padding: "1px 5px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {r.name}
                </span>
              ))}

              {/* Commit Summary */}
              <span
                style={{
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
              >
                {commit.summary}
              </span>

              {/* Author */}
              <span style={{ color: "var(--text-secondary)", fontSize: "11px", whiteSpace: "nowrap" }}>
                {commit.author_name}
              </span>

              {/* Hash */}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-tertiary)",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                }}
              >
                {commit.short_id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/CommitGraph.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/graph/CommitGraph.tsx src/components/graph/GraphSvgLane.tsx src/test/CommitGraph.test.tsx
git commit -m "feat(m1): implement virtualized commit graph with lane SVG rendering"
```

---

### Task 10: Frontend Commit Detail & Diff Viewer (`CommitDetailPanel.tsx`)

**Files:**
- Create: `src/components/diff/CommitDetailPanel.tsx`
- Create: `src/components/diff/FileDiffViewer.tsx`
- Test: `src/test/CommitDetailPanel.test.tsx`

**Interfaces:**
- Consumes: `useRepoStore`, `invokeCommand.getCommitDetails`, `invokeCommand.getCommitFileDiff`.
- Produces: `<CommitDetailPanel />` showing commit metadata, files list, and line-by-line diff.

- [ ] **Step 1: Write failing test for CommitDetailPanel**

Create `src/test/CommitDetailPanel.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CommitDetailPanel } from "../components/diff/CommitDetailPanel";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("CommitDetailPanel", () => {
  it("renders commit author, message, and files list with additions/deletions", async () => {
    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1",
    });
    useRepoStore.getState().setSelectedCommit("c1");

    render(
      <QueryClientProvider client={queryClient}>
        <CommitDetailPanel />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("README.md")).toBeInTheDocument();
      expect(screen.getByText("+10")).toBeInTheDocument();
      expect(screen.getByText("-2")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/CommitDetailPanel.test.tsx`
Expected: FAIL with "Cannot find module '../components/diff/CommitDetailPanel'"

- [ ] **Step 3: Implement FileDiffViewer and CommitDetailPanel**

Create `src/components/diff/FileDiffViewer.tsx`:
```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";

interface FileDiffViewerProps {
  repoPath: string;
  commitId: string;
  filePath: string;
}

export const FileDiffViewer: React.FC<FileDiffViewerProps> = ({ repoPath, commitId, filePath }) => {
  const { data: diff, isLoading } = useQuery({
    queryKey: ["file-diff", repoPath, commitId, filePath],
    queryFn: () => invokeCommand.getCommitFileDiff(repoPath, commitId, filePath),
  });

  if (isLoading) {
    return <div style={{ padding: "var(--space-3)", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>Đang đọc diff...</div>;
  }

  if (!diff || diff.hunks.length === 0) {
    return <div style={{ padding: "var(--space-3)", color: "var(--text-tertiary)", fontSize: "var(--font-size-xs)" }}>Không có thay đổi văn bản cho file này.</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        overflowX: "auto",
      }}
    >
      {diff.hunks.map((hunk, hIdx) => (
        <div key={hIdx} style={{ marginBottom: "var(--space-2)" }}>
          {/* Hunk Header */}
          <div
            style={{
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent)",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {hunk.header}
          </div>

          {/* Hunk Lines */}
          {hunk.lines.map((line, lIdx) => {
            const isAdd = line.line_type === "add";
            const isDel = line.line_type === "delete";

            return (
              <div
                key={lIdx}
                style={{
                  display: "flex",
                  backgroundColor: isAdd
                    ? "var(--diff-add-bg)"
                    : isDel
                    ? "var(--diff-remove-bg)"
                    : "transparent",
                  color: isAdd
                    ? "var(--diff-add-text)"
                    : isDel
                    ? "var(--diff-remove-text)"
                    : "var(--text-primary)",
                  padding: "1px 4px",
                  lineHeight: "18px",
                  whiteSpace: "pre",
                }}
              >
                <span
                  style={{
                    width: "36px",
                    color: "var(--text-tertiary)",
                    userSelect: "none",
                    textAlign: "right",
                    paddingRight: "8px",
                  }}
                >
                  {line.old_lineno ?? ""}
                </span>
                <span
                  style={{
                    width: "36px",
                    color: "var(--text-tertiary)",
                    userSelect: "none",
                    textAlign: "right",
                    paddingRight: "8px",
                  }}
                >
                  {line.new_lineno ?? ""}
                </span>
                <span style={{ width: "16px", userSelect: "none", textAlign: "center" }}>
                  {isAdd ? "+" : isDel ? "-" : " "}
                </span>
                <span>{line.content}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
```

Create `src/components/diff/CommitDetailPanel.tsx`:
```tsx
import React, { useEffect } from "react";
import { User, Calendar, GitCommit, FileText, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { invokeCommand } from "../../ipc/client";
import { FileDiffViewer } from "./FileDiffViewer";

export const CommitDetailPanel: React.FC = () => {
  const { currentRepo, selectedCommitId, selectedFilePath, setSelectedFile } = useRepoStore();

  const { data: details, isLoading } = useQuery({
    queryKey: ["commit-details", currentRepo?.path, selectedCommitId],
    queryFn: () => invokeCommand.getCommitDetails(currentRepo!.path, selectedCommitId!),
    enabled: Boolean(currentRepo && selectedCommitId),
  });

  // Auto-select first file when details load
  useEffect(() => {
    if (details && details.files.length > 0 && !selectedFilePath) {
      setSelectedFile(details.files[0].path);
    }
  }, [details, selectedFilePath, setSelectedFile]);

  if (!selectedCommitId) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-tertiary)",
          fontSize: "var(--font-size-xs)",
        }}
      >
        Chọn một commit để xem chi tiết và diff
      </div>
    );
  }

  if (isLoading || !details) {
    return (
      <div style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>
        Đang tải thông tin commit...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-surface)",
        overflowY: "auto",
      }}
    >
      {/* Header Info */}
      <div
        style={{
          padding: "var(--space-4)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)", color: "var(--accent)" }}>
            <GitCommit size={14} />
            <span>{details.id}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
            <span style={{ color: "var(--diff-add-text)" }}>+{details.total_additions}</span>
            <span style={{ color: "var(--diff-remove-text)" }}>-{details.total_deletions}</span>
          </div>
        </div>

        <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
          {details.full_message}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <User size={12} />
            <span>{details.author_name} &lt;{details.author_email}&gt;</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={12} />
            <span>{new Date(details.author_timestamp_sec * 1000).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Changed Files Strip */}
      <div
        style={{
          padding: "var(--space-2) var(--space-4)",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-window)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-1)",
        }}
      >
        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)" }}>
          CÁC TỆP THAY ĐỔI ({details.files.length})
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
          {details.files.map((file) => {
            const isSelected = selectedFilePath === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                  backgroundColor: isSelected ? "var(--accent-subtle)" : "var(--bg-surface)",
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  fontSize: "var(--font-size-xs)",
                  cursor: "pointer",
                }}
              >
                <FileText size={11} />
                <span>{file.path}</span>
                <span style={{ color: "var(--diff-add-text)", fontSize: "10px" }}>+{file.additions}</span>
                <span style={{ color: "var(--diff-remove-text)", fontSize: "10px" }}>-{file.deletions}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diff Content View */}
      <div style={{ flex: 1, padding: "var(--space-3)", overflowY: "auto" }}>
        {selectedFilePath && currentRepo && (
          <FileDiffViewer
            repoPath={currentRepo.path}
            commitId={selectedCommitId}
            filePath={selectedFilePath}
          />
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/CommitDetailPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/diff/CommitDetailPanel.tsx src/components/diff/FileDiffViewer.tsx src/test/CommitDetailPanel.test.tsx
git commit -m "feat(m1): implement CommitDetailPanel and FileDiffViewer"
```

---

### Task 11: End-to-End M1 Integration & Verification

**Files:**
- Modify: `src/components/Shell.tsx`
- Modify: `src/App.tsx`
- Modify: `src/test/App.test.tsx`

**Interfaces:**
- Consumes: `WelcomeScreen`, `RepoHeader`, `BranchSidebar`, `CommitGraph`, `CommitDetailPanel`, `useRepoStore`.
- Produces: Complete working Visual Git Viewer UI for Milestone M1.

- [ ] **Step 1: Write integration tests for M1 app shell**

Update `src/test/App.test.tsx` to verify:
- Welcome screen is rendered initially when no repo is selected.
- Selecting a repo displays RepoHeader, BranchSidebar, CommitGraph, and CommitDetailPanel.
- Clicking a commit displays its details and diff.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/App.test.tsx`
Expected: FAIL (shell does not yet mount M1 components)

- [ ] **Step 3: Wire components into Shell.tsx and App.tsx**

In `src/components/Shell.tsx`:
Mount `BranchSidebar`, `CommitGraph`, and `CommitDetailPanel` in a responsive 3-column layout.

In `src/App.tsx`:
Check `currentRepo`. If `null`, render `<WelcomeScreen onSelectRepo={setRepo} />`.
If `currentRepo` exists, render `<RepoHeader onBackToWelcome={clearRepo} />` and `<Shell />`.

- [ ] **Step 4: Run test to verify all tests pass**

Run frontend tests:
`pnpm test`
Expected: All tests PASS.

Run backend tests:
`cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Shell.tsx src/App.tsx src/test/App.test.tsx
git commit -m "feat(m1): wire M1 components into App and Shell with full test verification"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-12-m1-git-viewer.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

