# Tag Management Technical Specification (Phase 1.1.2)

## 1. Overview & Goals

The Tag Management subsystem enables users to mark release milestones (such as semantic versions `v1.0.0`, release candidates) and navigate repository history via tags. It bridges the gap between commit graphs, sidebar navigation, and Git ref lifecycle operations.

### Key Goals:
- Support viewing detailed tag information (tag name, target commit SHA, commit summary, annotated vs lightweight classification, annotation message, tagger signature, and timestamp).
- Fix ref-badge mapping on the commit graph: properly peel annotated tags to their target commits so tag badges appear at the correct commit nodes.
- Provide tag creation workflows for both lightweight tags and annotated tags with release messages.
- Allow checking out tags into detached HEAD state safely, with helpful UI guidance and one-click branch creation from the tag.
- Provide safe deletion of tags locally, with an optional remote deletion checkbox (`push --delete refs/tags/<name>`).
- Enable seamless navigation and context-menu operations directly from the `BranchSidebar` tags accordion and from any commit row in the `CommitGraph`.

---

## 2. Scope & Non-Goals

### In Scope:
- **Backend (Rust & git2)**:
  - Reading detailed tag metadata in `src-tauri/src/read/tags.rs`.
  - Creating lightweight and annotated tags in `src-tauri/src/write/tags.rs`.
  - Peeling annotated tags to target commit OIDs in `src-tauri/src/read/graph.rs`.
  - Checking out a tag into detached HEAD safely with working tree safety checks in `src-tauri/src/write/tags.rs`.
  - Deleting local tags and pushing remote deletion in `src-tauri/src/write/tags.rs`.
  - Pushing an individual tag to a remote repository in `src-tauri/src/write/tags.rs`.
  - Exposing Tauri IPC commands in `src-tauri/src/commands/tag.rs` registered via Specta.
- **Frontend (React 19 & TypeScript)**:
  - Strongly typed `TagItem` in `src/ipc/bindings.ts` and client methods with browser mock fallbacks in `src/ipc/client.ts`.
  - `CreateTagModal.tsx`: modal to create lightweight or annotated tags, with target commit display, name auto-sanitization, and message field.
  - `DeleteTagModal.tsx`: confirmation modal with tag name, commit hash, and remote deletion checkbox when a remote exists.
  - Sidebar integration in `BranchSidebar.tsx`: tag count badge, quick create button `(+)`, commit hash badge, tag context menu (Checkout, Create branch from tag, Push tag, Delete tag).
  - Graph integration in `CommitGraph.tsx`: row context menu offering "Create Tag here...", "Create Branch here...", "Copy SHA".
  - Bilingual localization in Vietnamese (`vi.ts`) and English (`en.ts`).
- **Testing**:
  - Integration tests in `src-tauri/tests/m5_tag_test.rs`.
  - Component and unit tests in Vitest.

### Non-Goals:
- GPG/SSH cryptographic signing of tags (deferred to a dedicated security release).
- Interactive tag editing or re-tagging (tags in Git are designed to be immutable pointers).
- Batch deletion or multi-selection of tags.

---

## 3. Data Model

### `TagItem` (Rust & TypeScript)

```rust
// Rust: src-tauri/src/read/tags.rs
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
```

```typescript
// TypeScript: src/ipc/bindings.ts
export interface TagItem {
  name: string;
  target_commit_id: string;
  short_commit_id: string;
  commit_summary: string;
  is_annotated: boolean;
  message?: string | null;
  tagger_name?: string | null;
  tagger_email?: string | null;
  timestamp_sec?: number | null;
}
```

---

## 4. Architecture & Technical Details

### 4.1 Backend Read Architecture (`src-tauri/src/read/tags.rs`)
- Function `list_repo_tags<P: AsRef<Path>>(repo_path: P) -> Result<Vec<TagItem>, AppError>`:
  - Iterates over all tags using `repo.references_glob("refs/tags/*")`.
  - Resolves target object:
    - If the reference target is an annotated tag object (`git2::ObjectType::Tag`), parses the `git2::Tag`:
      - Extracts annotation message, tagger name, email, and timestamp.
      - Calls `tag.target()` to peel down to the underlying `git2::Commit`.
    - If the reference target is directly a commit (`git2::ObjectType::Commit`), marks `is_annotated: false`.
  - Extracts target commit `short_commit_id` (first 7 chars) and commit summary.
  - Sorts tag list by timestamp descending (newest first).

### 4.2 Commit Graph Ref Badge Peeling (`src-tauri/src/read/graph.rs`)
- In `get_repo_commit_graph`:
  - When collecting references:
    ```rust
    if r_res.is_tag() {
        if let Ok(peeled_commit) = r_res.peel_to_commit() {
            ref_map.entry(peeled_commit.id()).or_default().push(RefBadge {
                name: shorthand,
                ref_type: "tag".to_string(),
            });
        }
    } else if let Some(target) = r_res.target() {
        // existing branch/remote logic
    }
    ```
  - This ensures that annotated tags (which point to Tag objects) attach their badge to the commit node in the graph visualization.

### 4.3 Backend Write Architecture (`src-tauri/src/write/tags.rs`)
- `create_tag<P: AsRef<Path>>(repo_path: P, name: &str, target_commit_id: &str, message: Option<&str>) -> Result<(), AppError>`:
  - Validates `name`:
    - Cannot be empty or start with `-`.
    - Must satisfy `git2::Reference::is_valid_name(&format!("refs/tags/{}", name))`.
  - Resolves commit by `Oid::from_str(target_commit_id)`.
  - If `message` is non-empty, creates annotated tag via `repo.tag(name, &target_obj, &sig, message, false)`.
  - Otherwise, creates lightweight tag via `repo.tag_lightweight(name, &target_obj, false)`.
- `delete_tag<P: AsRef<Path>>(repo_path: P, name: &str, delete_remote: bool) -> Result<(), AppError>`:
  - Deletes local tag via `repo.tag_delete(name)`.
  - If `delete_remote` is true and remote `origin` exists:
    - Uses Git CLI execution (`git push origin --delete refs/tags/<name>`) to remove the ref from the remote server.
- `checkout_tag<P: AsRef<Path>>(repo_path: P, name: &str) -> Result<(), AppError>`:
  - Checks if working directory is clean or has conflicts.
  - Finds the tag and peels to commit.
  - Calls `repo.set_head_detached(commit.id())` and `repo.checkout_head(Some(CheckoutBuilder::new().safe()))`.
- `push_tag<P: AsRef<Path>>(repo_path: P, name: &str, remote_name: Option<&str>) -> Result<(), AppError>`:
  - Executes `git push <remote> refs/tags/<name>` using standard command runner.

### 4.4 Tauri IPC Commands (`src-tauri/src/commands/tag.rs`)
- Commands:
  - `get_tags(repo_path: String) -> Result<Vec<TagItem>, AppError>`
  - `create_tag(app: AppHandle, repo_path: String, name: String, target_commit: String, message: Option<String>) -> Result<(), AppError>`
  - `delete_tag(app: AppHandle, repo_path: String, name: String, delete_remote: Option<bool>) -> Result<(), AppError>`
  - `checkout_tag(app: AppHandle, repo_path: String, name: String) -> Result<(), AppError>`
  - `push_tag(app: AppHandle, repo_path: String, name: String, remote_name: Option<String>) -> Result<(), AppError>`
- Emits `repo-changed` on all mutating operations to trigger automatic UI refreshes.

---

## 5. Frontend UI & UX Specification

### 5.1 Create Tag Modal (`src/components/tag/CreateTagModal.tsx`)
- Props: `isOpen`, `repoPath`, `targetCommitId`, `targetCommitSummary`, `onClose`, `onSuccess`.
- Input fields:
  - Target commit info banner: displays short SHA and summary.
  - Tag name input: auto-sanitizes spaces to hyphens `-`, autofocuses on open.
  - Toggle / Checkbox: "Annotated Tag" (Thẻ có chú thích).
  - Annotation message textarea: rendered only when "Annotated Tag" is active.
- Validation:
  - Submit disabled if tag name is empty, starts with `-`, or contains invalid ref characters.
  - Submit disabled if annotated tag is selected and message is empty.
  - Shows friendly error message if tag creation fails (e.g. tag already exists).

### 5.2 Delete Tag Modal (`src/components/tag/DeleteTagModal.tsx`)
- Props: `isOpen`, `repoPath`, `tagItem`, `hasRemote`, `onClose`, `onSuccess`.
- Dialog content:
  - Destructive warning banner with tag name and commit SHA.
  - Checkbox: "Delete this tag from remote 'origin'" (enabled only if `hasRemote` is true).
  - Actions: "Cancel" and red "Delete Tag".

### 5.3 BranchSidebar Tags Accordion (`src/components/sidebar/BranchSidebar.tsx`)
- Section Header:
  - Label: `Tags ({tags.length})`.
  - Plus icon button `(+)` to create a new tag at current HEAD.
- Tag Items:
  - Amber `Tag` icon.
  - Tag name (truncated if long).
  - Commit short SHA badge (e.g. `e4f1a2b`).
  - Right-click or 3-dots action menu:
    - 🏷️ **Checkout Tag**: checks out detached HEAD, displays Toast notification with "Create Branch" shortcut.
    - 🌿 **Create Branch from Tag**: opens `CreateBranchModal` with `targetCommit` set to the tag's commit.
    - 🚀 **Push Tag to Remote**: pushes tag and displays Toast.
    - 🗑️ **Delete Tag**: opens `DeleteTagModal`.

### 5.4 Commit Graph Context Menu (`src/components/graph/CommitGraph.tsx`)
- `onContextMenu` handler attached to commit row:
  - 🏷️ **Create Tag here...**: opens `CreateTagModal` targeting that specific commit.
  - 🌿 **Create Branch here...**: opens `CreateBranchModal` targeting that specific commit.
  - 📋 **Copy Commit SHA**: copies 40-char hash to clipboard and fires Toast.

---

## 6. Error Handling & Safety
- **Invalid ref names**: Git ref naming rules enforced before any Git write.
- **Unclean working directory**: When checking out a tag, safe checkout prevents overwriting uncommitted changes.
- **Remote deletion safety**: Requires explicit user confirmation via the DeleteTagModal checkbox.
- **Network errors**: Push operations capture stderr and display formatted toast error messages.

---

## 7. Testing & Verification

### 7.1 Rust Backend Tests (`src-tauri/tests/m5_tag_test.rs`)
- `test_create_lightweight_tag`: creates tag, asserts ref exists and matches commit SHA.
- `test_create_annotated_tag`: creates annotated tag with message, asserts tag object properties.
- `test_list_repo_tags`: asserts tags are listed with correct commit summaries and sorted by timestamp.
- `test_checkout_tag_detached_head`: asserts repo HEAD is detached at tag commit.
- `test_delete_tag`: asserts tag is removed from repo.
- `test_graph_peels_annotated_tags`: asserts `get_repo_commit_graph` contains tag badge for annotated tags.
- `test_tag_name_validation`: asserts rejection of invalid tag names.

### 7.2 Frontend Tests (Vitest)
- `CreateTagModal.test.tsx`: validates form states, lightweight/annotated toggle, IPC call arguments.
- `DeleteTagModal.test.tsx`: validates warning dialog, remote checkbox toggle, IPC call arguments.
- `BranchSidebarTags.test.tsx`: validates tag listing, `(+)` button, and context menu options.
- `CommitGraphContextMenu.test.tsx`: validates right-click context menu on graph rows.

### 7.3 Full Regression Suite
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `pnpm test --run`
- `pnpm build`
