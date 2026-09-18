# Design Specification: Visual Interactive Rebase (Phase 2.0.1)

- **Date:** 2026-09-18
- **Phase:** 2.0.1 (Advanced Power Tools)
- **Status:** Approved for Implementation Planning

---

## 1. Overview & Goals

Interactive Rebase (`git rebase -i`) is one of Git's most powerful history-editing commands, but terminal-based text editors can be intimidating, error-prone, and lack visual feedback.

The goal of **Phase 2.0.1: Visual Interactive Rebase** is to provide a clean, modern, intuitive desktop interface for interactive rebasing:
1. **Visual Reordering & Action Selection:** Drag-and-drop handles and Up/Down buttons for ordering commits; clear color-coded action pills for `Pick`, `Reword`, `Squash`, `Fixup`, and `Drop`.
2. **Inline Message Editor:** Seamless accordion textareas for drafting new messages when selecting `Reword` or `Squash` without opening external editors.
3. **Real-time Live Preview:** A dedicated split-preview panel projecting the resulting commit timeline, counting remaining/squashed/dropped commits, and highlighting message modifications before execution.
4. **3-Layer Safety & Undo:**
   - Layer 1: Working tree validation with automatic `rebase.autoStash` support.
   - Layer 2: Safety backup ref (`refs/gitui-backup/interactive-rebase-...`) and commit recovery receipt with a 10-second "Undo" toast.
   - Layer 3: Conflict resilience integrated with GitVista's Conflict Resolver, `InProgressOperationBanner`, and Abort/Continue commands.
5. **Universal Entry Points:** Accessible directly from `CommitGraph` right-click context menu, `BranchSidebar`, and Command Palette (`Ctrl+K` / `Cmd+K`).

---

## 2. Architecture & Component Interaction

```
┌────────────────────────────────────────────────────────────────────────┐
│                             React Frontend                             │
│                                                                        │
│  [CommitGraph.tsx] (Right-click commit: "Interactive Rebase here...")  │
│  [BranchSidebar.tsx] (Branch context menu: "Interactive Rebase...")     │
│  [CommandPalette.tsx] ("Git: Interactive Rebase")                      │
│                    │                                                   │
│                    ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   InteractiveRebaseModal.tsx                     │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────┬─────────────────────────────┐  │  │
│  │  │  Left: Rebase Plan Editor    │ Right: Live Preview Panel   │  │  │
│  │  │  - Commits (oldest to newest)│ - Projected commit count    │  │  │
│  │  │  - Drag / Up / Down handles  │ - Squashed & dropped badges │  │  │
│  │  │  - Action: Pick/Reword/Squash│ - Simulated timeline graph  │  │  │
│  │  │  - Inline message editor     │ - Modified messages preview │  │  │
│  │  └──────────────────────────────┴─────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  Footer: [Auto-stash checkbox]  [Reset]  [Cancel]  [Start Rebase]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                    │                                                   │
│                    ▼ (IPC invoke)                                      │
│  [client.ts] ──> executeInteractiveRebase(repoPath, base, steps)       │
│                    │                                                   │
│                    ├── Success ──> Toast with "Undo" (10s)             │
│                    └── Conflict ─> InProgressOperationBanner +        │
│                                    Redirect to Conflict Resolver       │
└────────────────────┼───────────────────────────────────────────────────┘
                     │ IPC
                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Rust Backend                              │
│                                                                        │
│  commands::rebase                                                      │
│   ├── get_rebase_commits()      ──> read::rebase::get_rebase_commits    │
│   │                                 (revwalk base..HEAD in             │
│   │                                  chronological order)              │
│   └── execute_interactive_rebase()                                     │
│        ├── 1. Check clean working tree / autostash                     │
│        ├── 2. Create backup ref & commit undo recovery token           │
│        ├── 3. Generate custom `git-rebase-todo` file                   │
│        │      (pick, exec commit --amend, fixup, drop)                 │
│        ├── 4. Spawn `git rebase -i <base>` with                        │
│        │      GIT_SEQUENCE_EDITOR="cp '<todo>'"                        │
│        │      GIT_EDITOR="true"                                        │
│        └── 5. Return InteractiveRebaseResult & emit repo-changed       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models & Rust Backend Design

### 3.1 Data Structures (`src-tauri/src/read/rebase.rs` & `bindings.ts`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RebaseCommitItem {
    pub id: String,
    pub short_id: String,
    pub summary: String,
    pub message: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp: i64,
    pub parent_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub enum RebaseActionKind {
    Pick,
    Reword,
    Squash,
    Fixup,
    Drop,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RebasePlanStep {
    pub commit_id: String,
    pub action: RebaseActionKind,
    pub new_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct InteractiveRebaseResult {
    pub success: bool,
    pub status: String, // "Success" | "Conflict" | "Error"
    pub head_commit_id: Option<String>,
    pub undo_token: Option<String>,
    pub output: String,
}
```

### 3.2 Reading Commits for Rebase (`src-tauri/src/read/rebase.rs`)
- `get_rebase_commits(repo: &Repository, base_commit_id: &str) -> Result<Vec<RebaseCommitItem>, AppError>`:
  1. Parses `base_commit_id` OID and HEAD commit OID.
  2. Initializes `repo.revwalk()` configured with `Sort::TOPOLOGICAL | Sort::TIME | Sort::REVERSE`.
  3. Pushes HEAD, hides `base_commit_id`.
  4. Collects commits chronologically (from the commit immediately following `base` up to `HEAD`).
  5. Extracts full commit metadata (summary, body message, author, parents).

### 3.3 Executing Interactive Rebase (`src-tauri/src/exec/rebase.rs`)
- **Safety checks:**
  - If working directory has unstaged or staged changes:
    - If `auto_stash == true`: passes `--autostash` to `git rebase`.
    - If `auto_stash == false`: aborts with `AppError::InvalidOperation("Working tree is dirty")`.
- **Backup & Recovery:**
  - Creates backup ref: `refs/gitui-backup/interactive-rebase-<timestamp>-<head_oid>`.
  - Generates `undo_token` via `create_undo_token(...)`.
- **Todo generation:**
  - Writes a temporary file `new_todo.txt`:
    - For `Pick`: `pick <short_sha> <summary>`
    - For `Reword`: `pick <short_sha> <summary>\nexec git commit --amend -m "<new_message>"` (escaped)
    - For `Fixup`: `fixup <short_sha> <summary>`
    - For `Squash`: `fixup <short_sha> <summary>\nexec git commit --amend -m "<new_message>"`
    - For `Drop`: omitted or `drop <short_sha>`
- **Execution via Git CLI:**
  - Spawns `git rebase -i <base_commit_id>` with:
    - `GIT_SEQUENCE_EDITOR = "cp '<escaped_todo_path>'"`
    - `GIT_EDITOR = "true"`
- **Result handling:**
  - Success: returns `InteractiveRebaseResult { success: true, status: "Success", ... }`.
  - Conflict: returns `InteractiveRebaseResult { success: false, status: "Conflict", ... }`.
  - Error: returns `InteractiveRebaseResult { success: false, status: "Error", ... }`.
  - Temporary files cleaned up via RAII/drop guards.

---

## 4. Frontend UI Components & User Flow

### 4.1 Component Structure
- `src/components/rebase/InteractiveRebaseModal.tsx`:
  - 2-column modal layout with macOS/Windows 11 backdrop blur and smooth entrance.
  - Left pane: list of `RebaseCommitRow` components with up/down controls, drag handles, action badge buttons, and collapsible inline editor.
  - Right pane: `RebaseLivePreview` displaying the live simulation.
  - Footer controls: Autostash toggle, Reset button, Cancel button, and "Start Rebase" button.
- `src/components/rebase/RebaseCommitRow.tsx`:
  - Renders single commit row: index badge, author avatar, SHA, original summary.
  - Action selector dropdown/pill group: `Pick` (green), `Reword` (blue), `Squash` (amber), `Fixup` (yellow), `Drop` (rose).
  - Validation: First row disables `Squash` and `Fixup`.
  - Smooth expandable textarea for editing commit message.
- `src/components/rebase/RebaseLivePreview.tsx`:
  - Summary metrics: resulting commit count, squashed count, dropped count, reworded count.
  - Compact visual preview list of projected commits.

### 4.2 Integration & Entry Points
- `src/components/graph/CommitGraph.tsx`:
  - Adds context menu item: *"Interactive Rebase từ commit này..."* (`t.graph.interactiveRebaseHere`).
  - Sets `interactiveRebaseBase` state and opens `InteractiveRebaseModal`.
- `src/utils/commandRegistry.ts` & `src/App.tsx`:
  - Adds `git-interactive-rebase` command palette entry.
- `src/i18n/vi.ts` & `src/i18n/en.ts`:
  - 100% bilingual translations for all dialog titles, action descriptions, buttons, tooltips, and toast messages.

---

## 5. Verification & Testing Strategy

### 5.1 Backend Tests (`src-tauri/tests/interactive_rebase_test.rs`)
1. `test_get_rebase_commits_ordering`: Verifies commits are returned in chronological order between base and HEAD.
2. `test_interactive_rebase_reorder_and_drop`: Tests swapping commits and dropping a commit.
3. `test_interactive_rebase_reword`: Tests changing commit messages non-interactively.
4. `test_interactive_rebase_squash_fixup`: Tests squashing commits into a single commit with a new message.
5. `test_interactive_rebase_safety_backup_and_undo`: Verifies safety backup ref creation and 1-click restore.

### 5.2 Frontend Tests (`src/test/InteractiveRebaseModal.test.tsx`)
1. Renders commits and controls correctly.
2. Reordering commits via up/down buttons updates order.
3. Changing action to `Reword` displays inline textarea and updates message.
4. First commit has `Squash` disabled.
5. Live Preview updates metrics accurately in real-time.
6. Triggering rebase calls IPC and displays undo toast upon success.

### 5.3 Build Verification
- `cargo test` passes 100%.
- `pnpm vitest run` passes 100%.
- `pnpm build` completes with 0 errors.
