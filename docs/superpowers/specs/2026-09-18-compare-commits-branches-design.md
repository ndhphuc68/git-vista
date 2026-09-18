# Design Specification: Compare 2 Commits / 2 Branches (Phase 2.0.2)

- **Date:** 2026-09-18
- **Phase:** 2.0.2 (Advanced Power Tools)
- **Status:** Approved for Implementation Planning

---

## 1. Overview & Goals

In real-world Git workflows, developers frequently need to understand what changed between two points in time—such as comparing a feature branch against `main` before opening a Pull Request, reviewing differences between two releases/tags, or inspecting the diff between two arbitrary commits on the history graph.

The goal of **Phase 2.0.2: Compare 2 Commits / 2 Branches** is to provide a seamless, rich visual comparison tool inside GitVista:
1. **Flexible Comparison Points:** Compare any pair of branches, tags, or commit SHAs.
2. **Dual Comparison Modes:**
   - **Merge-Base Diff (`A...B`, Three-dot):** Identifies the common ancestor (`merge-base`) and displays only the changes introduced on the target branch since diverging from base (GitHub/GitLab PR review style).
   - **Direct Diff (`A..B`, Two-dot):** Compares the trees of base and target directly, regardless of branching history.
3. **Comprehensive Review Experience:**
   - **Commits Overview:** Full chronological commit log between base and target with author, date, and commit messages.
   - **Changed Files List:** Tree/list view of modified, added, deleted, and renamed files with added/removed line counts.
   - **Interactive Rich Diff Viewer:** Full integration with GitVista's word-level diff, Split vs. Unified mode, and Ignore Whitespace toggle.
4. **Instant Swapping & Switching:** One-click swap button (`⇄`) to invert source and target orientations, plus dropdown search for any branch, tag, or commit.
5. **Multiple Entry Points:** Multi-select on `CommitGraph` (Ctrl/Cmd + click), context menu on commit graph nodes, context menu on `BranchSidebar` branches, and Command Palette (`Ctrl+K` -> `git-compare`).

---

## 2. Architecture & Component Interaction

```
┌────────────────────────────────────────────────────────────────────────┐
│                             React Frontend                             │
│                                                                        │
│  [CommitGraph] (Ctrl/Cmd + Click 2 commits OR Context Menu)            │
│  [BranchSidebar] (Right-click branch: "Compare with current branch")   │
│  [CommandPalette] ("Git: Compare 2 Commits or Branches...")            │
│                         │                                              │
│                         ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        CompareModal.tsx                          │  │
│  │                                                                  │  │
│  │  Header Bar:                                                     │  │
│  │  [Base Selector: main ▼] ──⇄── [Target Selector: feature/x ▼]   │  │
│  │  Mode Switch: [● Merge-Base (A...B)  ○ Direct (A..B)]           │  │
│  ├──────────────────────────────────┬───────────────────────────────┤  │
│  │ Left Sidebar (380px):            │ Right Pane (Flex-1):          │  │
│  │ Tabs: [Commits (4)] [Files (7)]  │                               │  │
│  │                                  │ [File Diff Toolbar]           │  │
│  │ (If Commits tab):                │ - Split / Unified             │  │
│  │ - Commit 1 (Author, SHA, Msg)    │ - Word Diff ON/OFF            │  │
│  │ - Commit 2 ...                   │ - Ignore Whitespace ON/OFF    │  │
│  │                                  │                               │  │
│  │ (If Files tab):                  │ [FileDiffViewer]              │  │
│  │ - Filter search input            │ - Line numbers                │  │
│  │ - src/app.ts  (+12, -4)  [MOD]   │ - Word-level additions/del    │  │
│  │ - src/api.ts  (+30, -0)  [ADD]   │                               │  │
│  └──────────────────────────────────┴───────────────────────────────┘  │
│                         │                                              │
│                         ▼ (IPC Invoke)                                 │
│  [client.ts] ──> compareCommits(repoPath, base, target, mode)          │
│              ──> getCompareFileDiff(repoPath, base, target, file, mode)│
└─────────────────────────┼──────────────────────────────────────────────┘
                          │ IPC
                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Rust Backend                              │
│                                                                        │
│  [commands/compare.rs]                                                 │
│    ├── compare_commits() ──> resolve_revision(base, target)            │
│    │                         ├── if MergeBase: repo.merge_base()       │
│    │                         ├── revwalk(effective_base..target)       │
│    │                         └── diff_tree_to_tree(base_tree, tgt_tree)│
│    └── get_compare_file_diff() ──> diff_tree_to_tree for single file   │
│                                                                        │
│  Data structures: CompareSummary, CompareCommitItem, CompareFileItem   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Data Models & Rust APIs

### 3.1 Data Structures (`src-tauri/src/read/compare.rs`)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
pub enum CompareMode {
    MergeBase, // A...B (common ancestor to target)
    Direct,    // A..B (direct tree comparison)
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CompareCommitItem {
    pub id: String,
    pub short_id: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp: i64,
    pub parent_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CompareFileItem {
    pub path: String,
    pub old_path: Option<String>,
    pub status: String, // "Modified", "Added", "Deleted", "Renamed"
    pub additions: usize,
    pub deletions: usize,
    pub is_binary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CompareSummary {
    pub base_rev: String,
    pub target_rev: String,
    pub resolved_base_oid: String,
    pub resolved_target_oid: String,
    pub effective_base_oid: String,
    pub merge_base_oid: Option<String>,
    pub mode: CompareMode,
    pub ahead_count: usize,
    pub behind_count: usize,
    pub commits: Vec<CompareCommitItem>,
    pub files: Vec<CompareFileItem>,
    pub total_additions: usize,
    pub total_deletions: usize,
}
```

### 3.2 Core Algorithms
1. **Revision Resolution:** Resolves input strings (e.g., `"main"`, `"feature/auth"`, `"v1.0.0"`, `"a1b2c3d"`) to canonical commit OIDs.
2. **Effective Base Calculation:**
   - In `MergeBase` mode: Calls `repo.merge_base(base_oid, target_oid)`. If no common ancestor exists, fallback to `base_oid`.
   - In `Direct` mode: Effective base is `base_oid`.
3. **Commit Log Collection:**
   - Uses `repo.revwalk()` with topological sorting.
   - Pushes `target_oid`, hides `effective_base_oid`.
   - Collects all commits along the range in reverse-chronological order.
4. **Tree Diff Calculation:**
   - Obtains the `git2::Tree` of `effective_base_oid` and `target_oid`.
   - Runs `repo.diff_tree_to_tree(Some(&base_tree), Some(&target_tree), Some(&mut opts))`.
   - Computes delta statuses and line addition/deletion statistics per delta and aggregated across the diff.
5. **File Diff Extraction:**
   - Filters `diff_tree_to_tree` down to the specific `file_path` and formats it into line-by-line diff structs compatible with `FileDiffViewer`.

---

## 4. Frontend Architecture & User Interface

### 4.1 Component Directory Structure
```
src/components/compare/
├── CompareModal.tsx            # Main modal dialog container
├── CompareHeader.tsx           # Base/Target selectors, Swap button, Mode switch
├── CompareCommitList.tsx       # List of commits in diff range
├── CompareFileList.tsx         # List of changed files with search and stats
├── CompareDiffView.tsx         # Diff viewer container with toolbar
└── index.ts                    # Module exports
```

### 4.2 User Interface Layout & Styling
- **Modal Size:** Fullscreen-capable maximized modal (`max-w-7xl h-[90vh] bg-surface rounded-xl shadow-2xl`).
- **Header:**
  - Base combobox with Git icon (`GitBranch`, `Tag`, `GitCommit`).
  - Swap button (`ArrowLeftRight` / `⇄`) with smooth hover animation.
  - Target combobox.
  - Mode segmented control: `Merge Base (A...B)` vs `Direct (A..B)`.
  - Stat summary badge: `+X -Y across Z files, N commits ahead`.
- **Sidebar Tabs:**
  - Tab 1: **Commits** (`{commits.length}`) - Shows commit cards with short SHA, author, date, and message.
  - Tab 2: **Tập tin thay đổi** (`{files.length}`) - Search filter, file items with colorful status badges (`A`: green, `M`: blue, `D`: rose, `R`: amber), `+X` / `-Y` count.
- **Diff View:**
  - Seamlessly reuses or integrates with existing `FileDiffViewer` to guarantee word-level diff, whitespace toggling, and split/unified modes.

---

## 5. Entry Points & User Flows

1. **CommitGraph Multi-Select:**
   - User clicks commit A, then holds `Ctrl` or `Cmd` and clicks commit B.
   - A floating bar or action triggers `CompareModal` with `baseCommitId = A` and `targetCommitId = B`.
2. **CommitGraph Context Menu:**
   - Right-click on any commit node $\rightarrow$ *"So sánh với..."* (`t.graph.compareWith`).
   - If a commit was already selected, defaults Base = selected, Target = clicked. Otherwise, defaults Base = clicked, Target = HEAD.
3. **BranchSidebar Context Menu:**
   - Right-click on any local or remote branch $\rightarrow$ *"So sánh với nhánh hiện tại ({head})..."* (`t.branch.compareWithCurrent`).
4. **Command Palette (`Ctrl+K`):**
   - Command `git-compare` (*"Git: So sánh 2 Commit hoặc Nhánh..."*). Opens modal defaulted to `main` vs current branch.

---

## 6. Bilingual i18n Dictionary Additions

Keys to be added to both `src/i18n/vi.ts` and `src/i18n/en.ts`:
- `compare.title`: "So sánh Commit / Nhánh" / "Compare Commits / Branches"
- `compare.base`: "Gốc (Base)" / "Base"
- `compare.target`: "Đích (Target)" / "Target"
- `compare.swap`: "Đổi chiều so sánh" / "Swap base and target"
- `compare.modeMergeBase`: "PR / Merge Base (A...B)" / "Merge Base (A...B)"
- `compare.modeMergeBaseDesc`: "Chỉ xem thay đổi nhánh đích tạo ra kể từ khi rẽ nhánh" / "Changes introduced since diverging from common ancestor"
- `compare.modeDirect`: "So sánh trực tiếp (A..B)" / "Direct Diff (A..B)"
- `compare.modeDirectDesc`: "So sánh toàn bộ trạng thái giữa 2 mốc bất kể phân nhánh" / "Direct tree comparison between two revisions"
- `compare.tabCommits`: "Commits ({count})" / "Commits ({count})"
- `compare.tabFiles`: "Tập tin thay đổi ({count})" / "Files Changed ({count})"
- `compare.searchFiles`: "Lọc tập tin..." / "Filter files..."
- `compare.noCommits`: "Không có commit nào chênh lệch giữa 2 mốc" / "No commits between revisions"
- `compare.noFiles`: "Không có thay đổi tập tin nào giữa 2 mốc" / "No file changes between revisions"
- `compare.identical`: "Hai mốc này hoàn toàn giống nhau" / "These revisions are identical"
- `graph.compareWith`: "So sánh với..." / "Compare with..."
- `branch.compareWithCurrent`: "So sánh với nhánh hiện tại ({branch})..." / "Compare with current branch ({branch})..."

---

## 7. Testing & Quality Verification Plan

1. **Rust Integration Tests (`src-tauri/tests/compare_test.rs`):**
   - `test_compare_commits_direct_mode`: Verify accurate tree diff and commit listing between linear commits.
   - `test_compare_commits_merge_base_mode`: Create divergent branches with a common ancestor, verify `merge_base` calculation and correct commits/files in `A...B`.
   - `test_compare_identical_revisions`: Verify empty files/commits when base == target.
   - `test_compare_get_file_diff`: Verify line-by-line diff output for a selected file.
2. **Frontend Unit Tests:**
   - `src/test/ipcCompare.test.ts`: Verify IPC client bindings, mock responses, and error handling.
   - `src/test/CompareModal.test.tsx`: Test rendering of base/target dropdowns, switching tabs, selecting files to view diffs, and swap action.
3. **TypeScript & Production Build:**
   - `pnpm tsc --noEmit` & `pnpm build`: Zero errors.
   - Full Vitest suite pass.
