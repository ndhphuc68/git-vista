# Create Commit Tags Design

## Goal

Let a user create a Git tag for the commit currently open in the history detail drawer.

## Scope

- A `Create tag` action lives in `CommitDetailPanel` and is available only while a commit is selected.
- The modal accepts a tag name and lets the user opt into an annotated tag. An annotation message is required only for the annotated variant.
- The Rust write layer validates names using Git's ref-name rules, resolves the selected SHA as a commit, and creates either a lightweight or annotated tag.
- A Tauri command emits the existing `repo-changed` event so the graph and sidebar refresh automatically.

## Non-goals

- Deleting, checking out, or pushing tags.
- Signing tags or choosing a custom tagger identity.
- Creating tags from the sidebar or command palette.

## Architecture

`write/tag.rs` owns Git validation and tag creation through `git2::Repository`. `commands/repo.rs` exposes that operation as `create_tag`, following `create_branch`'s command/event pattern. `ipc/client.ts` wraps the command. The detail drawer owns modal visibility because it already has both the repository path and selected commit SHA.

## Error Handling

- Empty, option-like (`-...`), malformed, duplicate, and unknown-commit tag requests return `AppError`; the modal displays the mapped message and remains open.
- Annotated tags use the repository signature, falling back to the same Visual Git Client signature pattern used for branch recovery when repository identity is unavailable.
- No backup ref is necessary: creating a new tag does not rewrite commits or existing refs.

## Tests

- Rust integration tests verify lightweight and annotated tags point to the requested commit, and invalid names are rejected.
- A React test verifies the detail drawer opens the modal and that a valid submission calls `invokeCommand.createTag` with the selected SHA and annotated fields.

