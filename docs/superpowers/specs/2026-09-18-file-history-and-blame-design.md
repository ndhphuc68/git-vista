# Design Specification: File History & Git Blame (Phase 1.2.2)

- **Date:** 2026-09-18
- **Phase:** 1.2.2 (Deep Git Workflows)
- **Status:** Approved for Implementation Planning

---

## 1. Overview & Goals

When working in GitVista, developers frequently need to understand the evolution and provenance of code:
1. **Git Blame:** Knowing line-by-line who wrote each snippet of code, which commit introduced it, and when.
2. **File History:** Inspecting all commits that altered a specific file over time, with instant access to the corresponding diff at each point in time.

This specification defines the architecture, data models, IPC protocols, and UI components for **File History & Git Blame** using a unified, slide-over **File Inspector Drawer**.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                             React Frontend                             │
│                                                                        │
│  [FileDiffViewer / CommitDetailPanel / StagingFileList]                │
│       │ (click Blame / History)                                        │
│       ▼                                                                │
│  [useInspectorStore] (filePath, commitId, activeTab: "blame"|"history")│
│       │                                                                │
│       ▼                                                                │
│  [FileInspectorDrawer] (Slide-over drawer from right, 80vw)            │
│    ├── Tab Header: [Git Blame] | [File History]                        │
│    ├── Content View:                                                   │
│    │    ├── [BlameView] ─── invokeCommand.getFileBlame() ──────────┐   │
│    │    │    └── Author Avatar, Short SHA, Tooltip, Code Gutter    │   │
│    │    └── [FileHistoryView] ─ invokeCommand.getFileHistory() ──┐ │   │
│    │         ├── Left Pane: Commits List                         │ │   │
│    │         └── Right Pane: FileDiffViewer (selected commit)    │ │   │
└────────┬─────────────────────────────────────────────────────────┼─┼───┘
         │                                                         │ │
         ▼                                                         ▼ ▼
    invokeCommand                                           invokeCommand
  getFileBlame                                              getFileHistory
         │                                                         │
─────────┼─────────────────────────────────────────────────────────┼──────
         ▼                                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Rust Backend                              │
│                                                                        │
│  commands::get_file_blame                  commands::get_file_history  │
│         │                                                │             │
│         ▼                                                ▼             │
│  read::blame::get_file_blame             read::file_history::          │
│  - git2::Repository::blame_file            get_file_history            │
│  - Extract blob text lines               - revwalk with topological    │
│  - Map line numbers to hunks               and time sorting            │
│  - Extract author, signature,            - Compare tree entry OIDs     │
│    commit summary                          between commit and parents  │
│  - Set is_hunk_start                     - Classify change type        │
│                                          - Pagination (offset, limit)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Specifications

### 3.1 Backend Rust Engine

#### 1. Module `src-tauri/src/read/blame.rs`
- **Data Structures (Specta exported):**
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct BlameLine {
      pub line_no: u32,
      pub content: String,
      pub commit_id: String,
      pub short_id: String,
      pub summary: String,
      pub author_name: String,
      pub author_email: String,
      pub timestamp_sec: f64,
      pub is_hunk_start: bool,
  }

  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct FileBlameResult {
      pub file_path: String,
      pub commit_id: Option<String>,
      pub lines: Vec<BlameLine>,
      pub total_lines: u32,
  }
  ```
- **Function Signature:**
  ```rust
  pub fn get_file_blame<P: AsRef<Path>>(
      repo_path: P,
      file_path: &str,
      commit_id: Option<&str>,
  ) -> Result<FileBlameResult, AppError>
  ```
- **Algorithm:**
  1. Open repository.
  2. Configure `git2::BlameOptions`. If `commit_id` is provided, parse OID and set `opts.newest_commit(oid)`.
  3. Call `repo.blame_file(Path::new(file_path), Some(&mut opts))`.
  4. Fetch file content:
     - If `commit_id` is provided: traverse commit tree to find tree entry and retrieve the `Blob`.
     - If no `commit_id`: read file from disk (working directory) or index.
     - Check for binary content (null bytes); if binary, return `AppError::Generic("Binary files do not support blame")`.
     - Split text into UTF-8 lines.
  5. For each line `i` from 1 to `total_lines`:
     - Query `blame.get_line(i)`.
     - Extract `final_commit_id`, `final_signature` (name, email, when.seconds).
     - Cache or lookup commit object to get `commit.summary()`.
     - Determine `is_hunk_start`: `true` if `i == 1` or previous line had a different `commit_id`.
  6. Return `FileBlameResult`.

#### 2. Module `src-tauri/src/read/file_history.rs`
- **Data Structures (Specta exported):**
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct FileHistoryItem {
      pub commit_id: String,
      pub short_id: String,
      pub summary: String,
      pub author_name: String,
      pub author_email: String,
      pub timestamp_sec: f64,
      pub change_type: String, // "added" | "modified" | "deleted"
  }

  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct FileHistoryResult {
      pub file_path: String,
      pub commits: Vec<FileHistoryItem>,
      pub has_more: bool,
      pub total_count: u32,
  }
  ```
- **Function Signature:**
  ```rust
  pub fn get_file_history<P: AsRef<Path>>(
      repo_path: P,
      file_path: &str,
      offset: u32,
      limit: u32,
  ) -> Result<FileHistoryResult, AppError>
  ```
- **Algorithm:**
  1. Open repository.
  2. Setup `revwalk` with `Sort::TOPOLOGICAL | Sort::TIME`, push `HEAD`.
  3. Walk commits:
     - For each commit, retrieve its tree.
     - Look up `commit_tree.get_path(Path::new(file_path))`.
     - If commit has 0 parents (root commit):
       - If path exists in root tree, mark as `"added"`.
     - If commit has parents:
       - Check parent tree entry for `file_path`.
       - If entry exists in both trees and OIDs match: file was unmodified in this commit, skip.
       - If entry exists in child tree but not parent: file was `"added"`.
       - If entry exists in parent tree but not child: file was `"deleted"`.
       - If entry exists in both but OIDs differ: file was `"modified"`.
  4. Collect matching commits.
  5. Apply pagination: slice matching list using `offset` and `limit`.
  6. Return `FileHistoryResult` with `total_count` and `has_more`.

#### 3. IPC Commands in `src-tauri/src/commands/repo.rs` & `src-tauri/src/lib.rs`
- Expose commands:
  - `get_file_blame(repo_path: String, file_path: String, commit_id: Option<String>) -> Result<FileBlameResult, AppError>`
  - `get_file_history(repo_path: String, file_path: String, offset: Option<u32>, limit: Option<u32>) -> Result<FileHistoryResult, AppError>`
- Register in `collect_commands!` in `src-tauri/src/lib.rs`.

---

### 3.2 Frontend Architecture & Components

#### 1. Inspector Store (`src/store/useInspectorStore.ts`)
- Zustand store maintaining:
  - `isOpen: boolean`
  - `filePath: string | null`
  - `commitId: string | null`
  - `activeTab: "blame" | "history"`
  - `openInspector(filePath: string, tab?: "blame" | "history", commitId?: string | null)`
  - `closeInspector()`
  - `setActiveTab(tab: "blame" | "history")`

#### 2. Components

##### `src/components/inspector/FileInspectorDrawer.tsx`
- Slide-over drawer on right edge with backdrop (`z-40`, width `w-4/5 max-w-[90vw]`).
- Header:
  - File name & full path with copy path button.
  - Segmented tab switch: **[Git Blame]** và **[File History]**.
  - Close button (`X` icon and `Escape` key shortcut).
- Body renders either `<BlameView />` or `<FileHistoryView />`.

##### `src/components/inspector/BlameView.tsx`
- Fetches data via `invokeCommand.getFileBlame`.
- Renders source code with sticky author gutter:
  - Author avatar badge (color hashed by `getAuthorAvatarStyle`).
  - Author name and relative time (`formatRelativeTime`).
  - Short SHA button (clicking navigates or selects commit in `useRepoStore` / `CommitGraph`).
  - Tooltip on hover showing full commit subject, exact timestamp, and author email.
  - Visual grouping: muted/omitted author details on continuation lines within the same commit hunk (`is_hunk_start`).
  - Right code gutter: 1-indexed line numbers and syntax-styled monospace code line with `whitespace-pre`.

##### `src/components/inspector/FileHistoryView.tsx`
- Fetches data via `invokeCommand.getFileHistory`.
- Two-pane split view:
  - **Left Pane (35%):**
    - Search input to filter commits by message or author.
    - Commit item list: Status badge (`A`/`M`/`D`), author avatar, short SHA, relative time, and commit summary.
    - Selected commit highlighting.
  - **Right Pane (65%):**
    - Embeds `FileDiffViewer` targeting the selected commit ID and the inspect file path.

#### 3. Entry Points & Integrations
- **`FileDiffViewer.tsx`:** Add action buttons to the right toolbar:
  - `<FileText size={13} />` for Git Blame
  - `<History size={13} />` for File History
- **`CommitDetailPanel.tsx`:** In the file list, add hover quick-actions or right-click options: "Git Blame" and "File History".
- **`StagingFileList.tsx`:** Add action button or context action for tracked files.

#### 4. Internationalization (i18n)
- Add complete Vietnamese (`vi.ts`) and English (`en.ts`) dictionaries under `t.inspector`:
  - `blameTab`, `historyTab`, `copyPath`, `copyPathSuccess`, `noHistory`, `loadingBlame`, `loadingHistory`, `filterCommitsPlaceholder`, `jumpToCommit`, `changeTypeAdded`, `changeTypeModified`, `changeTypeDeleted`, `viewBlame`, `viewHistory`.

---

## 4. Verification Plan

### Automated Tests
1. **Backend Integration Tests (`src-tauri/tests/blame_and_history_test.rs`):**
   - Test repository initialization with multiple commits modifying a shared file.
   - Verify `get_file_blame` yields correct line attribution, `is_hunk_start`, and author signatures.
   - Verify `get_file_history` returns commit list filtered to the target file, with accurate `change_type` and pagination.
2. **Frontend Unit Tests (`src/test/FileInspector.test.tsx`):**
   - Test `useInspectorStore` open, close, and tab switching actions.
   - Test `BlameView` rendering of line items, author avatars, and tooltips.
   - Test `FileHistoryView` rendering of commit lists and diff viewer embedding.
   - Test toolbar triggers on `FileDiffViewer`.

### Manual & System Verification
- `cargo test`: Ensure all suites pass (target: 30 test suites, 86+ tests).
- `pnpm test`: Ensure all vitest files pass (target: 61 test files, 318+ tests).
- `pnpm build`: Verify clean TypeScript compilation and Vite build with 0 errors.
