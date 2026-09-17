# Design Specification: Word-level Diff & Ignore Whitespace (Phase 1.2.1)

- **Date:** 2026-09-18
- **Phase:** 1.2.1 (Deep Git Workflows)
- **Status:** Approved for Implementation Planning

---

## 1. Overview & Goals

When inspecting code changes in GitVista, developers need to quickly identify exact modifications within lines and filter out noisy indentation or whitespace alterations.

This specification designs:
1. **Word-level Diff (Intra-line Diff):** Highlighting specific tokens (words, symbols) that changed within paired deleted/added lines in both commit history and staging diff viewers.
2. **Ignore Whitespace:** Integrating `git2::DiffOptions::ignore_whitespace(true)` into the Rust backend and providing a quick-toggle toolbar control synchronized with application settings.
3. **Diff Viewer Toolbar:** Adding responsive controls on `FileDiffViewer` and `InteractiveDiffViewer` with bilingual tooltips and active states.

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                        │
│                                                             │
│  [DiffViewerTab] ──(diffIgnoreWhitespace)──► [useSettingsStore]
│                                                    │        │
│                                           (syncs)  ▼        ▼
│  [FileDiffViewer]        [InteractiveDiffViewer]   (Toolbar Toggle)
│        │                          │
│        ▼                          ▼
│  computeWordDiff()         computeWordDiff()
│  (Intra-line LCS)          (Intra-line LCS)
└────────┬──────────────────────────┬─────────────────────────┘
         │                          │
         ▼                          ▼
    invokeCommand              invokeCommand
  getCommitFileDiff          getWorkingFileDiff
  (ignore_whitespace)        (ignore_whitespace)
         │                          │
─────────┼──────────────────────────┼───────────────────────────
         ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Rust Backend                         │
│                                                             │
│  get_commit_file_diff      get_working_file_diff            │
│  (read/diff.rs)            (read/status.rs)                 │
│         │                          │                        │
│         ▼                          ▼                        │
│   DIFF_CACHE                 DiffOptions                    │
│   (4-tuple key)              .ignore_whitespace(true)       │
│                              .ignore_whitespace_eol(true)   │
│         │                          │                        │
│         └───────────► git2 ◄───────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Specifications

### 3.1 Backend Rust Engine

#### `src-tauri/src/read/diff.rs`
- **Function Signature:**
  ```rust
  pub fn get_file_diff<P: AsRef<Path>>(
      repo_path: P,
      commit_id_str: &str,
      target_path: &str,
      ignore_whitespace: Option<bool>,
  ) -> Result<FileDiffResult, AppError>
  ```
- **DiffOptions Configuration:**
  When `ignore_whitespace.unwrap_or(false)` is `true`:
  ```rust
  opts.ignore_whitespace(true);
  opts.ignore_whitespace_eol(true);
  ```
- **Cache Key Update:**
  Update bounded cache from `(PathBuf, String, String)` to:
  ```rust
  type DiffCacheKey = (PathBuf, String, String, bool);
  ```
  where the 4th field is `ignore_whitespace.unwrap_or(false)`.

#### `src-tauri/src/read/status.rs`
- **Function Signature:**
  ```rust
  pub fn get_working_file_diff<P: AsRef<Path>>(
      repo_path: P,
      target_path: &str,
      is_staged: bool,
      ignore_whitespace: Option<bool>,
  ) -> Result<FileDiffResult, AppError>
  ```
- Apply the identical `opts.ignore_whitespace(true)` and `opts.ignore_whitespace_eol(true)` when `ignore_whitespace.unwrap_or(false)` is `true`.

#### `src-tauri/src/commands/repo.rs` & `src-tauri/src/lib.rs`
- Expose updated Specta Tauri commands:
  ```rust
  #[tauri::command]
  #[specta::specta]
  pub fn get_commit_file_diff(
      repo_path: String,
      commit_id: String,
      file_path: String,
      ignore_whitespace: Option<bool>,
  ) -> Result<FileDiffResult, AppError>;

  #[tauri::command]
  #[specta::specta]
  pub fn get_working_file_diff(
      repo_path: String,
      file_path: String,
      is_staged: bool,
      ignore_whitespace: Option<bool>,
  ) -> Result<FileDiffResult, AppError>;
  ```

---

### 3.2 Frontend TypeScript Bindings & Client

#### `src/ipc/bindings.ts` & `src/ipc/client.ts`
- Update TypeScript bindings:
  ```typescript
  getCommitFileDiff: (
    repoPath: string,
    commitId: string,
    filePath: string,
    ignoreWhitespace?: boolean
  ) => Promise<FileDiffResult>;

  getWorkingFileDiff: (
    repoPath: string,
    filePath: string,
    isStaged: boolean,
    ignoreWhitespace?: boolean
  ) => Promise<FileDiffResult>;
  ```
- In `client.ts`: Update mock handlers to accept `ignoreWhitespace?: boolean`. In mock mode, if `ignoreWhitespace` is true, strip pure whitespace changes from mock hunks.

---

### 3.3 Word-Level Diff Algorithm (`src/utils/wordDiff.ts`)

#### Tokenizer
- Regex: `/([\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s])/gu`
- Segments strings into:
  - Alphanumeric / identifier tokens (`\w+`)
  - Whitespace tokens (`\s+`)
  - Punctuation / operator tokens (`[^\w\s]`)

#### Intra-line LCS (Longest Common Subsequence)
- Inputs: `oldText: string`, `newText: string`.
- Output:
  ```typescript
  export interface WordDiffToken {
    text: string;
    type: "equal" | "removed" | "added";
  }

  export interface WordDiffResult {
    oldTokens: WordDiffToken[];
    newTokens: WordDiffToken[];
  }
  ```
- Algorithm:
  1. Tokenize both strings into `T_old` and `T_new`.
  2. Compute standard dynamic programming LCS matrix (O(N*M) where N, M <= 100 for line tokens).
  3. Backtrack to produce matched equal tokens and mismatched slices.
  4. Emit `oldTokens` (marking deleted tokens as `removed` and identical as `equal`) and `newTokens` (marking inserted tokens as `added` and identical as `equal`).

#### Hunk Line Pairing
- In a hunk's lines:
  - Detect consecutive groups of `delete` lines followed immediately by `add` lines.
  - Pair line `del[i]` with `add[i]` up to `min(del.length, add.length)`.
  - Compute word diff for paired lines.
  - Unpaired lines (e.g. added new functions or deleted dead code blocks) render normally without token highlighting.

---

### 3.4 UI & Styling

#### Word Highlight Styling
- **Deleted word span:**
  `className="bg-red-500/30 text-diff-remove-text font-semibold rounded-xs px-0.5"`
- **Added word span:**
  `className="bg-emerald-500/30 text-diff-add-text font-semibold rounded-xs px-0.5"`
- **Equal word span:**
  `<span>{token.text}</span>`

#### Toolbar Controls
- Rendered in header of `FileDiffViewer.tsx` and `InteractiveDiffViewer.tsx`:
  - **Ignore Whitespace button:**
    - Icon: `<Space size={13} />`
    - Active: `bg-accent/15 text-accent border border-accent/40 shadow-2xs`
    - Inactive: `bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary`
    - Tooltip: Dynamic based on state ("Bỏ qua khoảng trắng" / "Đang bỏ qua khoảng trắng")
    - Clicking toggles `diffIgnoreWhitespace` in `useSettingsStore`.
  - **Word Diff button:**
    - Icon: `<Type size={13} />`
    - Active: `bg-accent/15 text-accent border border-accent/40 shadow-2xs`
    - Inactive: `bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary`
    - Tooltip: "Bật/tắt tô màu chi tiết từ"

---

### 3.5 Localization (i18n)

Update `src/i18n/vi.ts` and `src/i18n/en.ts`:
```typescript
diff: {
  // Existing keys...
  ignoreWhitespace: "Bỏ qua khoảng trắng",
  ignoreWhitespaceActive: "Đang bỏ qua khoảng trắng",
  wordDiff: "Tô màu chi tiết từ (Word diff)",
  wordDiffActive: "Đang tô màu chi tiết từ",
}
```

---

## 4. Verification Plan

### 4.1 Automated Tests

1. **Rust Backend Tests (`tests/diff_options_test.rs`):**
   - Create repo with commit containing only indentation/whitespace change.
   - Assert `get_file_diff(..., ignore_whitespace: false)` returns hunks.
   - Assert `get_file_diff(..., ignore_whitespace: true)` returns 0 hunks.
   - Assert working file diff with whitespace changes obeys `ignore_whitespace`.

2. **Frontend Unit Tests (`src/test/wordDiff.test.ts`):**
   - Test tokenizer with variable names, symbols, strings, Unicode.
   - Test LCS computation for single-word change, multiple-word change, and exact match.
   - Test line pairing logic for 1:1, 1:N, N:1, and pure insertions.

3. **Frontend Component Integration Tests (`src/test/DiffViewerWordDiff.test.tsx`):**
   - Verify `FileDiffViewer` renders word-level highlight spans on modified lines.
   - Verify clicking "Ignore Whitespace" button triggers query refetch with `ignoreWhitespace = true` and updates store.
   - Verify `InteractiveDiffViewer` renders word-level highlight spans and preserves Stage Hunk / Stage Line action capabilities.

4. **Full Test Suites:**
   - `cargo test`: all backend suites pass.
   - `pnpm vitest run`: all test files pass 100%.
   - `pnpm build`: 0 compilation errors.
