# Tag Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full Git tag management: listing detailed tags, creating lightweight/annotated tags, peeling graph badges to commits, checking out tags into detached HEAD, deleting local/remote tags, pushing tags, and context menus for sidebar and graph.

**Architecture:** Dedicated Rust read/write/command modules exposing Specta IPC, strongly-typed TypeScript client with browser mocks, accessible React modals (`CreateTagModal`, `DeleteTagModal`), enhanced sidebar tags accordion and commit graph context menu.

**Tech Stack:** Rust 2021, git2, Tauri v2, tauri-specta, React 19, TypeScript, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-17-tag-management-design.md`

## Global Constraints
- Use Gitmoji for commit messages: `<emoji> <short description>`. No Conventional Commit prefixes, no parenthesized scopes.
- Do not add or bump dependencies in `Cargo.toml` or `package.json`.
- Validate tag names with `git2::Reference::is_valid_name` under `refs/tags/`. Reject empty or `-` prefixed names.
- Emit `repo-changed` event after all mutating tag operations.
- Maintain 100% test coverage across Rust (`cargo test`) and Frontend (`pnpm test --run`).

---

### Task 1: Rust Backend Tag Read, Peeling & Data Structures

**Files:**
- Create: `src-tauri/src/read/tags.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Modify: `src-tauri/src/read/graph.rs`
- Create: `src-tauri/tests/m5_tag_test.rs`

**Interfaces:**
- Produces:
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct TagItem {
      pub name: String,
      pub target_commit_id: String,
      pub short_commit_id: String,
      pub commit_summary: String,
      pub is_annotated: bool,
      pub message: Option<String>,
      pub tagger_name: Option<String>,
      pub tagger_email: Option<String>,
      pub timestamp_sec: Option<f64>,
  }
  pub fn list_repo_tags<P: AsRef<Path>>(repo_path: P) -> Result<Vec<TagItem>, AppError>;
  ```

- [ ] **Step 1: Write the failing Rust integration test for reading tags and peeling**

```rust
// src-tauri/tests/m5_tag_test.rs
use std::fs;
use std::path::Path;
use tempfile::TempDir;
use visual_git_lib::read::list_repo_tags;
use visual_git_lib::read::get_repo_commit_graph;

fn setup_test_repo() -> (TempDir, git2::Repository, git2::Oid) {
    let dir = TempDir::new().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Test Tagger").unwrap();
    config.set_str("user.email", "tagger@test.com").unwrap();

    let file_path = dir.path().join("file.txt");
    fs::write(&file_path, "initial content").unwrap();

    let mut index = repo.index().unwrap();
    index.add_path(Path::new("file.txt")).unwrap();
    let tree_id = index.write_tree().unwrap();
    let tree = repo.find_tree(tree_id).unwrap();
    let sig = repo.signature().unwrap();
    let commit_id = repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[]).unwrap();

    (dir, repo, commit_id)
}

#[test]
fn test_list_repo_tags_lightweight_and_annotated() {
    let (dir, repo, commit_id) = setup_test_repo();
    let obj = repo.find_object(commit_id, None).unwrap();

    // 1. Lightweight tag
    repo.tag_lightweight("v1.0.0", &obj, false).unwrap();

    // 2. Annotated tag
    let sig = repo.signature().unwrap();
    repo.tag("v1.1.0", &obj, &sig, "Release 1.1.0 message", false).unwrap();

    let tags = list_repo_tags(dir.path()).unwrap();
    assert_eq!(tags.len(), 2);

    let v10 = tags.iter().find(|t| t.name == "v1.0.0").unwrap();
    assert_eq!(v10.target_commit_id, commit_id.to_string());
    assert!(!v10.is_annotated);
    assert_eq!(v10.commit_summary, "Initial commit");

    let v11 = tags.iter().find(|t| t.name == "v1.1.0").unwrap();
    assert_eq!(v11.target_commit_id, commit_id.to_string());
    assert!(v11.is_annotated);
    assert_eq!(v11.message.as_deref(), Some("Release 1.1.0 message"));
    assert_eq!(v11.tagger_name.as_deref(), Some("Test Tagger"));
}

#[test]
fn test_graph_peels_annotated_tags() {
    let (dir, repo, commit_id) = setup_test_repo();
    let obj = repo.find_object(commit_id, None).unwrap();
    let sig = repo.signature().unwrap();
    repo.tag("v2.0.0", &obj, &sig, "Annotated tag on graph", false).unwrap();

    let graph = get_repo_commit_graph(dir.path(), 0, 10).unwrap();
    let commit_node = graph.commits.iter().find(|c| c.id == commit_id.to_string()).unwrap();
    let has_tag_badge = commit_node.refs.iter().any(|r| r.name == "v2.0.0" && r.ref_type == "tag");
    assert!(has_tag_badge, "Annotated tag badge must peel to commit node");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test m5_tag_test`
Expected: FAIL with missing module `read::tags`.

- [ ] **Step 3: Implement `src-tauri/src/read/tags.rs` and update `read/graph.rs`**

- Create `src-tauri/src/read/tags.rs` implementing `TagItem` and `list_repo_tags`.
- Export `pub mod tags; pub use tags::*;` in `src-tauri/src/read/mod.rs`.
- In `src-tauri/src/read/graph.rs`, when processing tag references, call `r_res.peel_to_commit()` to resolve the target commit OID for both annotated and lightweight tags.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test m5_tag_test`
Expected: PASS (2 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/read/tags.rs src-tauri/src/read/mod.rs src-tauri/src/read/graph.rs src-tauri/tests/m5_tag_test.rs
git commit -m "✨ add tag reading and peel annotated tags in commit graph"
```

---

### Task 2: Rust Backend Tag Write Operations (Create, Delete, Checkout, Push)

**Files:**
- Create: `src-tauri/src/write/tags.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Modify: `src-tauri/tests/m5_tag_test.rs`

**Interfaces:**
- Produces:
  ```rust
  pub fn create_tag<P: AsRef<Path>>(repo_path: P, name: &str, target_commit_id: &str, message: Option<&str>) -> Result<(), AppError>;
  pub fn delete_tag<P: AsRef<Path>>(repo_path: P, name: &str, delete_remote: bool) -> Result<(), AppError>;
  pub fn checkout_tag<P: AsRef<Path>>(repo_path: P, name: &str) -> Result<(), AppError>;
  pub fn push_tag<P: AsRef<Path>>(repo_path: P, name: &str, remote_name: Option<&str>) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Add failing tests for tag write operations in `src-tauri/tests/m5_tag_test.rs`**

```rust
use visual_git_lib::write::tags::{create_tag, delete_tag, checkout_tag};

#[test]
fn test_create_tag_lightweight_and_annotated_validation() {
    let (dir, repo, commit_id) = setup_test_repo();
    let cid_str = commit_id.to_string();

    // Rejects empty or invalid names
    assert!(create_tag(dir.path(), "", &cid_str, None).is_err());
    assert!(create_tag(dir.path(), "-invalid", &cid_str, None).is_err());
    assert!(create_tag(dir.path(), "bad name with spaces", &cid_str, None).is_err());

    // Successfully creates lightweight tag
    create_tag(dir.path(), "v1.0.0", &cid_str, None).unwrap();
    assert!(repo.revparse_single("refs/tags/v1.0.0").is_ok());

    // Successfully creates annotated tag
    create_tag(dir.path(), "v1.1.0", &cid_str, Some("Release notes")).unwrap();
    let tag_obj = repo.revparse_single("refs/tags/v1.1.0").unwrap();
    assert!(tag_obj.as_tag().is_some());
}

#[test]
fn test_checkout_tag_detached_head() {
    let (dir, repo, commit_id) = setup_test_repo();
    let cid_str = commit_id.to_string();
    create_tag(dir.path(), "v1.0.0", &cid_str, None).unwrap();

    checkout_tag(dir.path(), "v1.0.0").unwrap();
    assert!(repo.head_detached().unwrap());
    assert_eq!(repo.head().unwrap().target().unwrap(), commit_id);
}

#[test]
fn test_delete_tag_local() {
    let (dir, repo, commit_id) = setup_test_repo();
    let cid_str = commit_id.to_string();
    create_tag(dir.path(), "v1.0.0", &cid_str, None).unwrap();

    delete_tag(dir.path(), "v1.0.0", false).unwrap();
    assert!(repo.revparse_single("refs/tags/v1.0.0").is_err());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test m5_tag_test`
Expected: FAIL with unresolved `write::tags`.

- [ ] **Step 3: Implement `src-tauri/src/write/tags.rs`**

- Validate tag name via `git2::Reference::is_valid_name`.
- Implement `create_tag`, `delete_tag`, `checkout_tag`, and `push_tag`.
- Export `pub mod tags; pub use tags::*;` in `src-tauri/src/write/mod.rs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test m5_tag_test`
Expected: PASS (all 5 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/write/tags.rs src-tauri/src/write/mod.rs src-tauri/tests/m5_tag_test.rs
git commit -m "✨ add tag write operations for create, delete, checkout, and push"
```

---

### Task 3: Tauri IPC Commands for Tags & Specta Registration

**Files:**
- Create: `src-tauri/src/commands/tag.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces Tauri commands:
  `get_tags`, `create_tag`, `delete_tag`, `checkout_tag`, `push_tag`.

- [ ] **Step 1: Implement `src-tauri/src/commands/tag.rs`**

```rust
use crate::error::AppError;
use crate::read::TagItem;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

fn emit_repo_changed(app: &tauri::AppHandle, repo_path: String, reason: String) {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;
    let payload = crate::events::RepoChangedPayload {
        repo_path,
        reason,
        timestamp_ms: now,
    };
    let _ = app.emit("repo-changed", payload);
}

#[tauri::command]
#[specta::specta]
pub fn get_tags(repo_path: String) -> Result<Vec<TagItem>, AppError> {
    crate::read::tags::list_repo_tags(repo_path)
}

#[tauri::command]
#[specta::specta]
pub fn create_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
    target_commit: String,
    message: Option<String>,
) -> Result<(), AppError> {
    crate::write::tags::create_tag(&repo_path, &name, &target_commit, message.as_deref())?;
    emit_repo_changed(&app, repo_path, "create_tag".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn delete_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
    delete_remote: Option<bool>,
) -> Result<(), AppError> {
    crate::write::tags::delete_tag(&repo_path, &name, delete_remote.unwrap_or(false))?;
    emit_repo_changed(&app, repo_path, "delete_tag".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn checkout_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
) -> Result<(), AppError> {
    crate::write::tags::checkout_tag(&repo_path, &name)?;
    emit_repo_changed(&app, repo_path, "checkout_tag".to_string());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn push_tag(
    app: tauri::AppHandle,
    repo_path: String,
    name: String,
    remote_name: Option<String>,
) -> Result<(), AppError> {
    crate::write::tags::push_tag(&repo_path, &name, remote_name.as_deref())?;
    emit_repo_changed(&app, repo_path, "push_tag".to_string());
    Ok(())
}
```

- [ ] **Step 2: Register in `commands/mod.rs` and `src-tauri/src/lib.rs`**

- Add `pub mod tag; pub use tag::*;` to `commands/mod.rs`.
- Add `get_tags`, `create_tag`, `delete_tag`, `checkout_tag`, `push_tag` to `collect_commands!` in `src-tauri/src/lib.rs`.

- [ ] **Step 3: Run full Rust test suite to verify clean build and pass**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (all tests pass).

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/commands/tag.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "✨ expose tag management commands via Tauri specta builder"
```

---

### Task 4: Frontend Types & IPC Client Methods with Browser Mocks

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Modify: `src/test/ipcClient.test.ts`

**Interfaces:**
- Produces: `TagItem` in `bindings.ts`
- Produces:
  ```typescript
  getTags(repoPath: string): Promise<TagItem[]>;
  createTag(repoPath: string, name: string, targetCommit: string, message?: string): Promise<void>;
  deleteTag(repoPath: string, name: string, deleteRemote?: boolean): Promise<void>;
  checkoutTag(repoPath: string, name: string): Promise<void>;
  pushTag(repoPath: string, name: string, remoteName?: string): Promise<void>;
  ```

- [ ] **Step 1: Write failing unit test in `src/test/ipcClient.test.ts`**

```typescript
it("invokes tag IPC methods with proper payloads and mock responses", async () => {
  const tags = await invokeCommand.getTags("/fake/repo");
  expect(Array.isArray(tags)).toBe(true);

  await expect(invokeCommand.createTag("/fake/repo", "v1.0.0", "abc1234")).resolves.toBeUndefined();
  await expect(invokeCommand.checkoutTag("/fake/repo", "v1.0.0")).resolves.toBeUndefined();
  await expect(invokeCommand.pushTag("/fake/repo", "v1.0.0")).resolves.toBeUndefined();
  await expect(invokeCommand.deleteTag("/fake/repo", "v1.0.0", false)).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/ipcClient.test.ts`
Expected: FAIL with `invokeCommand.getTags is not a function`.

- [ ] **Step 3: Implement `TagItem` in `bindings.ts` and client methods in `client.ts`**

- Add `TagItem` definition to `src/ipc/bindings.ts`.
- Implement `getTags`, `createTag`, `deleteTag`, `checkoutTag`, `pushTag` in `src/ipc/client.ts`.
- Include mock tag dataset when running in non-Tauri browser environments.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/test/ipcClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ipc/bindings.ts src/ipc/client.ts src/test/ipcClient.test.ts
git commit -m "✨ add tag management IPC bindings and client methods"
```

---

### Task 5: CreateTagModal and DeleteTagModal Components & Translations

**Files:**
- Create: `src/components/tag/CreateTagModal.tsx`
- Create: `src/components/tag/DeleteTagModal.tsx`
- Modify: `src/locales/vi.ts`
- Modify: `src/locales/en.ts`
- Create: `src/test/CreateTagModal.test.tsx`
- Create: `src/test/DeleteTagModal.test.tsx`

**Interfaces:**
- Produces: `CreateTagModal` component
- Produces: `DeleteTagModal` component

- [ ] **Step 1: Write failing frontend component tests**

Create `src/test/CreateTagModal.test.tsx` and `src/test/DeleteTagModal.test.tsx`.
Verify tests assert input validation, lightweight vs annotated toggle, remote deletion checkbox, and submit IPC calls.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/test/CreateTagModal.test.tsx src/test/DeleteTagModal.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `CreateTagModal.tsx`, `DeleteTagModal.tsx`, and add translation strings**

- Add tag translation keys to `src/locales/vi.ts` and `src/locales/en.ts`.
- Build `CreateTagModal.tsx` with commit SHA summary, tag name sanitizer, annotated checkbox, and message input.
- Build `DeleteTagModal.tsx` with confirmation warning and remote deletion checkbox.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/test/CreateTagModal.test.tsx src/test/DeleteTagModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/tag/ src/locales/vi.ts src/locales/en.ts src/test/CreateTagModal.test.tsx src/test/DeleteTagModal.test.tsx
git commit -m "✨ create CreateTagModal and DeleteTagModal with i18n support"
```

---

### Task 6: BranchSidebar Tags Section Enhancement & Context Menu

**Files:**
- Modify: `src/components/sidebar/BranchSidebar.tsx`
- Create: `src/test/BranchSidebarTags.test.tsx`

**Interfaces:**
- Updates `BranchSidebar.tsx` to fetch `getTags`, display tags with short commit SHA, `(+)` create tag button, and context menu (Checkout, Create branch from tag, Push tag, Delete tag).

- [ ] **Step 1: Write failing test in `src/test/BranchSidebarTags.test.tsx`**

Test that tags section renders tag list with commit badges, `(+)` opens `CreateTagModal`, and right-click context menu displays actions.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/BranchSidebarTags.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Enhance `BranchSidebar.tsx`**

- Use `useQuery` with `invokeCommand.getTags`.
- Render `(+)` icon button on TAGS header to open `CreateTagModal`.
- Display tag name and short commit ID badge.
- Implement tag context menu with Checkout, Create Branch, Push, and Delete actions.
- Connect to `CreateTagModal` and `DeleteTagModal`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/test/BranchSidebarTags.test.tsx src/test/BranchSidebar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/BranchSidebar.tsx src/test/BranchSidebarTags.test.tsx
git commit -m "✨ enhance tags accordion in branch sidebar with context menu and quick create"
```

---

### Task 7: CommitGraph Row Context Menu Integration

**Files:**
- Modify: `src/components/graph/CommitGraph.tsx`
- Create: `src/test/CommitGraphContextMenu.test.tsx`

**Interfaces:**
- Adds right-click context menu on commit rows with "Create Tag here...", "Create Branch here...", "Copy SHA".

- [ ] **Step 1: Write failing test in `src/test/CommitGraphContextMenu.test.tsx`**

Verify that right-clicking a commit row opens the context menu and clicking "Create Tag here..." triggers tag creation modal with that commit ID.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/CommitGraphContextMenu.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement context menu in `CommitGraph.tsx`**

- Add `onContextMenu` handler to virtual commit rows.
- Render floating context menu with:
  - 🏷️ Create Tag here... -> opens `CreateTagModal`.
  - 🌿 Create Branch here... -> opens `CreateBranchModal`.
  - 📋 Copy SHA -> copies full commit hash to clipboard with Toast.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/test/CommitGraphContextMenu.test.tsx src/test/CommitGraph.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/graph/CommitGraph.tsx src/test/CommitGraphContextMenu.test.tsx
git commit -m "✨ add right-click context menu to commit graph rows"
```

---

### Task 8: Full End-to-End Verification & Roadmap Status Update

**Files:**
- Modify: `docs/ROADMAP_STATUS.md`

- [ ] **Step 1: Run full Rust test suite**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All tests pass (0 failures).

- [ ] **Step 2: Run full Frontend test suite**

Run: `pnpm test --run`
Expected: All test files pass (0 failures).

- [ ] **Step 3: Run production build**

Run: `pnpm build`
Expected: Exit code 0, clean Vite build.

- [ ] **Step 4: Update `docs/ROADMAP_STATUS.md`**

Update status of 1.1.2 from `⏳ Kế tiếp (Sẵn sàng)` to `✅ Đã hoàn thành (100%)`.
Update progress percentage and summary.

- [ ] **Step 5: Commit**

```bash
git add docs/ROADMAP_STATUS.md
git commit -m "📝 update roadmap status to mark tag management 1.1.2 complete"
```
