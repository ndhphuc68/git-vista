# Create Commit Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create lightweight or annotated Git tags at the commit selected in the history detail drawer.

**Architecture:** A focused Rust write module validates and creates tags. A Tauri command adapts it to IPC and emits the standard repository-change event. The React drawer opens a focused modal which calls the typed client and relies on that event to refresh visible refs.

**Tech Stack:** Rust, git2, Tauri v2, tauri-specta, React 19, TypeScript, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-16-create-commit-tags-design.md`

## Global Constraints

- Do not modify the pre-existing `src-tauri/Cargo.toml` change.
- Validate with `git2::Reference::is_valid_name` under `refs/tags/`.
- Do not add dependencies.
- Emit `repo-changed` only after Git reports successful tag creation.

---

### Task 1: Tag write boundary and Tauri command

**Files:**
- Create: `src-tauri/src/write/tag.rs`
- Modify: `src-tauri/src/write/mod.rs`
- Modify: `src-tauri/src/commands/repo.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/tests/m5_tag_test.rs`

**Interfaces:**
- Produces: `write::tag::create_tag(repo_path, name, target_commit_id, message) -> Result<(), AppError>`.
- Produces: `commands::repo::create_tag(app, repo_path, name, target_commit, message) -> Result<(), AppError>`.

- [ ] **Step 1: Write failing Rust tests**

```rust
#[test]
fn creates_a_lightweight_tag_at_the_requested_commit() {
    create_tag(repo.path(), "v1.0.0", &commit_id, None).unwrap();
    assert_eq!(repo.revparse_single("refs/tags/v1.0.0").unwrap().id(), commit_id);
}

#[test]
fn creates_an_annotated_tag_with_its_message() {
    create_tag(repo.path(), "v1.1.0", &commit_id, Some("Release 1.1.0")).unwrap();
    assert_eq!(repo.find_tag(repo.refname_to_id("refs/tags/v1.1.0").unwrap()).unwrap().message(), Some("Release 1.1.0"));
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test m5_tag_test`

Expected: compilation failure because `write::tag::create_tag` does not exist.

- [ ] **Step 3: Implement the smallest write boundary and command**

```rust
pub fn create_tag<P: AsRef<Path>>(repo_path: P, name: &str, target_commit_id: &str, message: Option<&str>) -> Result<(), AppError> {
    let ref_name = format!("refs/tags/{}", name.trim());
    // reject empty, option-like, and invalid names before resolving target
    let repo = Repository::open(repo_path)?;
    let target = repo.find_commit(Oid::from_str(target_commit_id.trim())?)?;
    if let Some(message) = message.filter(|value| !value.trim().is_empty()) {
        repo.tag(name.trim(), target.as_object(), &signature(&repo)?, message, false)?;
    } else {
        repo.tag_lightweight(name.trim(), target.as_object(), false)?;
    }
    Ok(())
}
```

Register `create_tag` in `collect_commands!` and emit `repo-changed` after it succeeds.

- [ ] **Step 4: Run the Rust tests to verify they pass**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test m5_tag_test`

Expected: all tag tests pass.

### Task 2: IPC client and create-tag modal

**Files:**
- Create: `src/components/tag/CreateTagModal.tsx`
- Modify: `src/ipc/client.ts`
- Modify: `src/components/diff/CommitDetailPanel.tsx`
- Test: `src/test/CreateTagModal.test.tsx`

**Interfaces:**
- Consumes: `invokeCommand.createTag(repoPath, name, targetCommit, message?) -> Promise<void>`.
- Produces: `CreateTagModal` with `isOpen`, `repoPath`, `targetCommit`, `onClose`, and `onSuccess` props.

- [ ] **Step 1: Write a failing frontend test**

```tsx
it("creates an annotated tag at the supplied commit", async () => {
  render(<CreateTagModal isOpen repoPath="/repo" targetCommit="abc123" onClose={vi.fn()} onSuccess={vi.fn()} />);
  await user.type(screen.getByLabelText(/tag name/i), "v1.0.0");
  await user.click(screen.getByLabelText(/annotated/i));
  await user.type(screen.getByLabelText(/message/i), "First release");
  await user.click(screen.getByRole("button", { name: /create tag/i }));
  expect(invokeCommand.createTag).toHaveBeenCalledWith("/repo", "v1.0.0", "abc123", "First release");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/test/CreateTagModal.test.tsx`

Expected: module-not-found failure for `CreateTagModal`.

- [ ] **Step 3: Implement client wrapper and modal**

```ts
createTag: async (repoPath, name, targetCommit, message) =>
  invoke("create_tag", { repoPath, name, targetCommit, message }),
```

The modal trims input, disables submit until a name exists (and message exists when annotated), displays errors, and calls `onSuccess` only after the IPC promise resolves.

- [ ] **Step 4: Wire the detail drawer action**

Add a tag icon action beside the selected commit SHA. On success, close the modal and invalidate React Query so tag refs update without reopening the repository.

- [ ] **Step 5: Run frontend tests to verify they pass**

Run: `pnpm vitest run src/test/CreateTagModal.test.tsx src/test/CommitDetailPanel.test.tsx`

Expected: both tests pass.

### Task 3: End-to-end verification

**Files:**
- Modify: only files created or changed by Tasks 1–2 when a verification failure requires it.

**Interfaces:**
- Verifies the Rust command, TypeScript code, and full test suites integrate without changes to existing Cargo configuration.

- [ ] **Step 1: Run targeted suites**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test m5_tag_test` and `pnpm vitest run src/test/CreateTagModal.test.tsx`.

Expected: exit code 0 for both commands.

- [ ] **Step 2: Run full verification**

Run: `pnpm test --run`, `pnpm build`, and `cargo test --manifest-path src-tauri/Cargo.toml`.

Expected: all commands exit 0.

