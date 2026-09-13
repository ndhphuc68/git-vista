# Milestone M1.1: Code Audit Remediation & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate Critical (C1, C2, C3) and Important (I1-I7) findings from the M0/M1 code review audit, ensuring robust graph topology rendering, zero duplicate diff headers, safe caching, and keyboard accessibility.

**Architecture:** Maintain clear layer separation between libgit2 read module, Tauri IPC boundary, and React UI components. Zero git state in frontend. Fully tested with Rust and Vitest.

**Tech Stack:** Tauri 2, Rust (libgit2), React 19, TypeScript, Vitest, @tanstack/react-virtual, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md`

## Global Constraints
- Strictly read-only in `src-tauri/src/read/`.
- No BigInt in Specta/IPC structs (use `u32` for counts/indices, `f64` for timestamps).
- All contrast ratios must satisfy WCAG AA $\ge 4.5:1$.
- 100% tests passing in `cargo test` and `pnpm test`.

---

### Task 1: Fix Commit Graph Lane Convergence on Merges & Add Topology Test (C1 & I7)

**Files:**
- Modify: `src-tauri/src/read/graph.rs`
- Modify: `src-tauri/tests/m1_graph_test.rs`
- Modify: `src/components/graph/GraphSvgLane.tsx`

**Interfaces:**
- Produces: `GraphEdge` with `edge_type: "merge"`, `from_col`, `to_col`.
- Behavior: Converging lanes set to `None` so they don't persist as ghost vertical lines.

- [x] **Step 1: Add failing integration test in `m1_graph_test.rs` for merge commit**
  Create a repo with 2 branches and a merge commit. Assert that `GraphEdge` contains at least one edge with `edge_type == "merge"` and that active lanes are cleanly merged.

- [x] **Step 2: Run test to confirm failure**
  Run: `cargo test --test m1_graph_test`

- [x] **Step 3: Implement merge lane convergence in `src-tauri/src/read/graph.rs`**
  When resolving `col` for `oid`, find all other indices `j != col` where `active_lanes[j] == Some(*oid)`.
  Push merge edges and clear slots `active_lanes[j] = None`.

- [x] **Step 4: Implement SVG merge curve rendering in `GraphSvgLane.tsx`**
  Add support for `edge.edge_type === 'merge'`: draw a smooth cubic bezier from `(from_x, 0)` to `(to_x, nodeY)`.

- [x] **Step 5: Run tests and verify they pass**
  Run: `cargo test --test m1_graph_test`
  Run: `pnpm test`

---

### Task 2: Fix Duplicate Hunk Header in File Diff (C3)

**Files:**
- Modify: `src-tauri/src/read/diff.rs`
- Modify: `src-tauri/tests/m1_diff_test.rs`

**Interfaces:**
- Produces: `FileDiffResult` containing hunks whose `lines` only contain actual content lines (`'+'`, `'-'`, `' '`), never `'H'`.

- [x] **Step 1: Add assertion in `m1_diff_test.rs`**
  Assert that no `DiffLine.content` begins with `@@` and `line_type` is never context for a hunk header.

- [x] **Step 2: Fix line filter in `src-tauri/src/read/diff.rs`**
  Filter `line.origin()` to only accept `'+'`, `'-'`, and `' '`.

- [x] **Step 3: Verify tests pass**
  Run: `cargo test --test m1_diff_test`

---

### Task 3: Optimize Graph Revwalk, Detached HEAD / Remotes & Pagination (C2 & I2)

**Files:**
- Modify: `src-tauri/src/read/graph.rs`

- [x] **Step 1: Push HEAD, heads glob, and remotes glob in revwalk**
  Call `let _ = revwalk.push_head();`, `let _ = revwalk.push_glob("refs/heads/*");`, `let _ = revwalk.push_glob("refs/remotes/*");`.

- [x] **Step 2: Optimize metadata allocation during pagination**
  For commits outside the requested `offset..end` window, perform lightweight lane tracking without extracting summary, author, email strings.

- [x] **Step 3: Run backend and frontend tests**
  Run: `cargo test --test m1_graph_test`
  Run: `pnpm test`

---

### Task 4: Bounded Diff Cache with Repo Scope (I1)

**Files:**
- Modify: `src-tauri/src/read/diff.rs`

- [x] **Step 1: Update cache key to include repository path**
  Change cache key type from `(String, String)` to `(PathBuf, String, String)`.

- [x] **Step 2: Add maximum capacity limit (500 items) and eviction**
  When cache length exceeds 500, evict oldest entries.

- [x] **Step 3: Verify tests pass**
  Run: `cargo test --test m1_diff_test`

---

### Task 5: Graph Alignment & Keyboard Accessibility (I3 & I6)

**Files:**
- Modify: `src/components/graph/CommitGraph.tsx`
- Modify: `src/components/graph/GraphSvgLane.tsx`

- [x] **Step 1: Stabilize SVG width to prevent jagged row layout**
  Determine a consistent minimum column width for the SVG lane area so commit summaries line up vertically across rows.

- [x] **Step 2: Add keyboard navigation and accessibility attributes**
  In `CommitGraph.tsx`, add `role="button"`, `tabIndex={0}`, and `onKeyDown` (ArrowUp, ArrowDown, Enter) so commits are keyboard-selectable.

- [x] **Step 3: Verify frontend tests**
  Run: `pnpm test`

---

### Task 6: Persistent Storage Directory & WelcomeScreen Error Handling (I4 & I5)

**Files:**
- Modify: `src-tauri/src/repo/recent.rs`
- Modify: `src/components/welcome/WelcomeScreen.tsx`

- [x] **Step 1: Use persistent user app data directory in `recent.rs`**
  Replace `temp_dir()` with user local app data directory.

- [x] **Step 2: Add error state & user feedback in `WelcomeScreen.tsx`**
  Wrap folder and recent repo openings in `try ... catch` and display an error banner when a repository cannot be opened.

- [x] **Step 3: Verify frontend and backend tests**
  Run: `pnpm test`
  Run: `cargo test --test m1_repo_test`

---

### Task 7: Titlebar, Translations, and Fixtures Cleanup (M1-M6)

**Files:**
- Modify: `src/components/Titlebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src-tauri/tests/common/fixtures.rs`

- [x] **Step 1: Update Titlebar badge and dynamic repo name**
  Show active repo name or app title; update badge to M1.1.

- [x] **Step 2: Prevent unlisten race condition in App.tsx**
  Add cancellation flag to `listenToRepoChanged` effect cleanup.

- [x] **Step 3: Add `#[allow(dead_code)]` to test fixtures**
  Eliminate compiler dead_code warnings during `cargo test`.

- [x] **Step 4: Final verification pass**
  Run: `cargo test`
  Run: `pnpm test`
  Run: `pnpm build`
  Run: `pnpm check-contrast`
