# Word-level Diff & Ignore Whitespace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide intra-line token-level diff highlighting for changed lines and support ignoring whitespace modifications across both commit history and staging diff viewers in GitVista.

**Architecture:** Rust `git2` backend passes `ignore_whitespace` options (`opts.ignore_whitespace(true)`) to `get_file_diff` and `get_working_file_diff` with a 4-tuple cache key. The frontend computes word/token LCS differences between paired delete/add lines via a pure TypeScript utility and renders highlighted spans with interactive toolbar controls synchronized with `useSettingsStore`.

**Tech Stack:** Rust (`git2`, `specta`, `serde`), TypeScript, React 19, Tailwind CSS v4, Lucide icons, Vitest, React Query.

**Spec:** [2026-09-18-word-diff-ignore-whitespace-design.md](file:///d:/project-v3/docs/superpowers/specs/2026-09-18-word-diff-ignore-whitespace-design.md)

## Global Constraints

- Use Gitmoji for new commit messages: `<emoji> <short description>` without Conventional Commit prefixes (`feat:`, `fix:`) and without parenthesized scopes.
- Maintain 100% bilingual parity between `src/i18n/vi.ts` and `src/i18n/en.ts`.
- All backend tests (`cargo test`) must pass with zero failures.
- All frontend tests (`pnpm vitest run`) must pass with zero failures.
- Zero TypeScript and Vite production build errors (`pnpm build`).

---

## File Structure

- **Backend Rust:**
  - Modify: `src-tauri/src/read/diff.rs` (update `get_file_diff`, cache key 4-tuple, `ignore_whitespace` option)
  - Modify: `src-tauri/src/read/status.rs` (update `get_working_file_diff` with `ignore_whitespace` option)
  - Modify: `src-tauri/src/write/staging.rs` (pass `None` for internal diff calls)
  - Modify: `src-tauri/src/commands/repo.rs` (update `get_commit_file_diff` & `get_working_file_diff` Specta commands)
  - Test: `src-tauri/tests/diff_options_test.rs` (automated test for whitespace filtering)
- **Frontend IPC:**
  - Modify: `src/ipc/bindings.ts` (signatures for `getCommitFileDiff`, `getWorkingFileDiff`)
  - Modify: `src/ipc/client.ts` (invoke wrappers & browser mock handlers)
  - Test: `src/test/ipcDiffOptions.test.ts` (verify mock client options)
- **Word Diff Algorithm & Renderer:**
  - Create: `src/utils/wordDiff.ts` (tokenizer, LCS, line pair diffing)
  - Create: `src/components/diff/DiffLineContent.tsx` (token highlighter component)
  - Test: `src/test/wordDiff.test.ts` (unit tests for tokenizer & LCS)
- **UI & Controls:**
  - Modify: `src/components/diff/FileDiffViewer.tsx` (toolbar buttons, word diff rendering, query key sync)
  - Modify: `src/components/changes/InteractiveDiffViewer.tsx` (toolbar buttons, word diff rendering, query key sync)
  - Modify: `src/i18n/vi.ts` & `src/i18n/en.ts` (i18n dictionary keys)
  - Test: `src/test/DiffViewerWordDiff.test.tsx` (component integration tests)

---

### Task 1: Backend DiffOptions ignore_whitespace & Caching

**Files:**
- Create: `src-tauri/tests/diff_options_test.rs`
- Modify: `src-tauri/src/read/diff.rs:59-196`
- Modify: `src-tauri/src/read/status.rs:160-220`
- Modify: `src-tauri/src/write/staging.rs:240-280`
- Modify: `src-tauri/src/commands/repo.rs:135-165`

**Interfaces:**
- Consumes: `git2::DiffOptions`, `git2::Repository`
- Produces:
  - `get_file_diff(repo, commit_id, path, ignore_whitespace: Option<bool>) -> Result<FileDiffResult, AppError>`
  - `get_working_file_diff(repo, path, is_staged, ignore_whitespace: Option<bool>) -> Result<FileDiffResult, AppError>`
  - Tauri Specta commands `get_commit_file_diff` and `get_working_file_diff` accepting `ignore_whitespace: Option<bool>`.

- [ ] **Step 1: Write the failing integration test**

Create `src-tauri/tests/diff_options_test.rs`:
```rust
use std::fs;
use std::path::Path;
use tempfile::TempDir;
use visual_git_lib::read::diff::get_file_diff;
use visual_git_lib::read::status::get_working_file_diff;

fn setup_test_repo_with_whitespace_change() -> (TempDir, String) {
    let dir = TempDir::new().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();

    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Test User").unwrap();
    config.set_str("user.email", "test@example.com").unwrap();

    let file_path = dir.path().join("code.txt");
    fs::write(&file_path, "function test() {\n    return 42;\n}\n").unwrap();

    let mut index = repo.index().unwrap();
    index.add_path(Path::new("code.txt")).unwrap();
    index.write().unwrap();
    let tree_id = index.write_tree().unwrap();
    let tree = repo.find_tree(tree_id).unwrap();
    let sig = repo.signature().unwrap();
    let commit1 = repo
        .commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
        .unwrap();

    // Commit 2: change indentation only (spaces to tabs / extra spaces)
    fs::write(&file_path, "function test() {\n        return 42;\n}\n").unwrap();
    index.add_path(Path::new("code.txt")).unwrap();
    index.write().unwrap();
    let tree_id2 = index.write_tree().unwrap();
    let tree2 = repo.find_tree(tree_id2).unwrap();
    let parent = repo.find_commit(commit1).unwrap();
    let commit2 = repo
        .commit(
            Some("HEAD"),
            &sig,
            &sig,
            "Whitespace only commit",
            &tree2,
            &[&parent],
        )
        .unwrap();

    (dir, commit2.to_string())
}

#[test]
fn test_get_file_diff_respects_ignore_whitespace() {
    let (dir, commit2_id) = setup_test_repo_with_whitespace_change();

    // Default or ignore_whitespace = false should find differences
    let diff_normal = get_file_diff(dir.path(), &commit2_id, "code.txt", Some(false)).unwrap();
    assert_eq!(diff_normal.hunks.len(), 1);

    // ignore_whitespace = true should filter out whitespace-only changes
    let diff_ignored = get_file_diff(dir.path(), &commit2_id, "code.txt", Some(true)).unwrap();
    assert_eq!(diff_ignored.hunks.len(), 0);
}

#[test]
fn test_get_working_file_diff_respects_ignore_whitespace() {
    let (dir, _) = setup_test_repo_with_whitespace_change();
    let file_path = dir.path().join("code.txt");

    // Add trailing whitespace to working tree
    fs::write(&file_path, "function test() {\n        return 42;   \n}\n").unwrap();

    let diff_normal = get_working_file_diff(dir.path(), "code.txt", false, Some(false)).unwrap();
    assert_eq!(diff_normal.hunks.len(), 1);

    let diff_ignored = get_working_file_diff(dir.path(), "code.txt", false, Some(true)).unwrap();
    assert_eq!(diff_ignored.hunks.len(), 0);
}
```

- [ ] **Step 2: Run test to verify it fails to compile or fails**

Run: `cargo test --test diff_options_test`
Expected: Compile error because `get_file_diff` and `get_working_file_diff` do not yet take 4 parameters.

- [ ] **Step 3: Implement `ignore_whitespace` in `read/diff.rs`, `read/status.rs`, `write/staging.rs`, and `commands/repo.rs`**

In `src-tauri/src/read/diff.rs`:
```rust
type DiffCacheKey = (PathBuf, String, String, bool);

struct BoundedDiffCache {
    map: HashMap<DiffCacheKey, FileDiffResult>,
    order: Vec<DiffCacheKey>,
}

fn get_cached_diff(key: &DiffCacheKey) -> Option<FileDiffResult> { ... }
fn set_cached_diff(key: DiffCacheKey, result: FileDiffResult) { ... }

pub fn get_file_diff<P: AsRef<Path>>(
    repo_path: P,
    commit_id_str: &str,
    target_path: &str,
    ignore_whitespace: Option<bool>,
) -> Result<FileDiffResult, AppError> {
    let ignore_ws = ignore_whitespace.unwrap_or(false);
    let repo_buf = repo_path.as_ref().to_path_buf();
    let cache_key = (repo_buf, commit_id_str.to_string(), target_path.to_string(), ignore_ws);
    if let Some(cached) = get_cached_diff(&cache_key) {
        return Ok(cached);
    }
    // ...
    let mut opts = DiffOptions::new();
    opts.pathspec(target_path);
    if ignore_ws {
        opts.ignore_whitespace(true);
        opts.ignore_whitespace_eol(true);
    }
    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), Some(&mut opts))?;
    let result = parse_diff_to_file_diff_result(&diff, target_path)?;
    set_cached_diff(cache_key, result.clone());
    Ok(result)
}
```

In `src-tauri/src/read/status.rs`:
```rust
pub fn get_working_file_diff<P: AsRef<Path>>(
    repo_path: P,
    target_path: &str,
    is_staged: bool,
    ignore_whitespace: Option<bool>,
) -> Result<FileDiffResult, AppError> {
    let ignore_ws = ignore_whitespace.unwrap_or(false);
    let repo = Repository::open(repo_path.as_ref())?;
    let mut opts = DiffOptions::new();
    opts.pathspec(target_path);
    if ignore_ws {
        opts.ignore_whitespace(true);
        opts.ignore_whitespace_eol(true);
    }
    // continue diff generation using opts
    // ...
}
```

Update call sites in `src-tauri/src/write/staging.rs` (lines 246, 272) to pass `None` for `ignore_whitespace`.
Update call sites in `src-tauri/tests/m2_status_test.rs` and `src-tauri/tests/m2_staging_test.rs` to pass `None`.
Update `src-tauri/src/commands/repo.rs`:
```rust
#[tauri::command]
#[specta::specta]
pub fn get_commit_file_diff(
    repo_path: String,
    commit_id: String,
    file_path: String,
    ignore_whitespace: Option<bool>,
) -> Result<FileDiffResult, AppError> {
    crate::read::diff::get_file_diff(repo_path, &commit_id, &file_path, ignore_whitespace)
}

#[tauri::command]
#[specta::specta]
pub fn get_working_file_diff(
    repo_path: String,
    file_path: String,
    is_staged: bool,
    ignore_whitespace: Option<bool>,
) -> Result<FileDiffResult, AppError> {
    crate::read::status::get_working_file_diff(repo_path, &file_path, is_staged, ignore_whitespace)
}
```

- [ ] **Step 4: Run backend tests to verify**

Run: `cargo test`
Expected: 28 test suites / 82 tests pass 100%.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/read/diff.rs src-tauri/src/read/status.rs src-tauri/src/write/staging.rs src-tauri/src/commands/repo.rs src-tauri/tests/diff_options_test.rs src-tauri/tests/m2_status_test.rs src-tauri/tests/m2_staging_test.rs
git commit -m "✨ add ignore_whitespace diff option and 4-tuple cache key"
```

---

### Task 2: Frontend IPC Bindings & Client Mocks

**Files:**
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`
- Test: `src/test/ipcDiffOptions.test.ts`

**Interfaces:**
- Consumes: Backend Specta commands
- Produces: `invokeCommand.getCommitFileDiff` and `invokeCommand.getWorkingFileDiff` accepting optional `ignoreWhitespace?: boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/test/ipcDiffOptions.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC Diff Client with ignoreWhitespace", () => {
  it("passes ignoreWhitespace flag to getCommitFileDiff in browser mock mode", async () => {
    const diffWithWs = await invokeCommand.getCommitFileDiff("/mock/repo", "c1", "file.ts", false);
    expect(diffWithWs).toBeDefined();
    expect(diffWithWs.hunks.length).toBeGreaterThan(0);

    const diffNoWs = await invokeCommand.getCommitFileDiff("/mock/repo", "c1", "file.ts", true);
    expect(diffNoWs).toBeDefined();
  });

  it("passes ignoreWhitespace flag to getWorkingFileDiff in browser mock mode", async () => {
    const diff = await invokeCommand.getWorkingFileDiff("/mock/repo", "src/App.tsx", false, true);
    expect(diff).toBeDefined();
    expect(diff.file_path).toBe("src/App.tsx");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/ipcDiffOptions.test.ts`
Expected: FAIL (types / parameters mismatch).

- [ ] **Step 3: Implement client signatures and mock handling**

In `src/ipc/bindings.ts`:
```typescript
export interface Commands {
  // ...
  get_commit_file_diff: (
    repoPath: string,
    commitId: string,
    filePath: string,
    ignoreWhitespace?: boolean | null
  ) => Promise<FileDiffResult>;
  get_working_file_diff: (
    repoPath: string,
    filePath: string,
    isStaged: boolean,
    ignoreWhitespace?: boolean | null
  ) => Promise<FileDiffResult>;
}
```

In `src/ipc/client.ts`:
```typescript
getCommitFileDiff: async (
  repoPath: string,
  commitId: string,
  filePath: string,
  ignoreWhitespace?: boolean
): Promise<FileDiffResult> => {
  if (isTauri()) {
    return invoke("get_commit_file_diff", {
      repoPath,
      commitId,
      filePath,
      ignoreWhitespace: ignoreWhitespace ?? false,
    });
  }
  // Mock mode: filter out whitespace-only lines if ignoreWhitespace is true
  return getMockCommitFileDiff(filePath, ignoreWhitespace);
},

getWorkingFileDiff: async (
  repoPath: string,
  filePath: string,
  isStaged: boolean,
  ignoreWhitespace?: boolean
): Promise<FileDiffResult> => {
  if (isTauri()) {
    return invoke("get_working_file_diff", {
      repoPath,
      filePath,
      isStaged,
      ignoreWhitespace: ignoreWhitespace ?? false,
    });
  }
  return getMockWorkingFileDiff(filePath, isStaged, ignoreWhitespace);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/test/ipcDiffOptions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ipc/bindings.ts src/ipc/client.ts src/test/ipcDiffOptions.test.ts
git commit -m "✨ update diff client bindings to support ignoreWhitespace"
```

---

### Task 3: Word-Level Diff Tokenizer & LCS Algorithm

**Files:**
- Create: `src/utils/wordDiff.ts`
- Create: `src/components/diff/DiffLineContent.tsx`
- Create: `src/test/wordDiff.test.ts`

**Interfaces:**
- Produces:
  - `tokenize(text: string): string[]`
  - `computeWordDiff(oldText: string, newText: string): WordDiffResult`
  - `pairHunkLines(lines: DiffLine[]): Map<number, WordDiffToken[]>`
  - `<DiffLineContent line={DiffLine} tokens={WordDiffToken[] | undefined} />`

- [ ] **Step 1: Write the failing unit tests**

Create `src/test/wordDiff.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { tokenize, computeWordDiff, pairHunkLines } from "../utils/wordDiff";
import { DiffLine } from "../ipc/bindings";

describe("Word-level Diff Tokenizer & LCS", () => {
  it("tokenizes identifiers, whitespace, and punctuation", () => {
    const tokens = tokenize("const count = 42; // note");
    expect(tokens).toEqual([
      "const", " ", "count", " ", "=", " ", "42", ";", " ", "/", "/", " ", "note"
    ]);
  });

  it("computes word differences between paired lines", () => {
    const oldLine = "const maxUsers = 50;";
    const newLine = "const maxUsers = 100;";

    const { oldTokens, newTokens } = computeWordDiff(oldLine, newLine);

    // Old tokens should mark "50" as removed
    const removedTokens = oldTokens.filter((t) => t.type === "removed");
    expect(removedTokens.map((t) => t.text)).toEqual(["50"]);

    // New tokens should mark "100" as added
    const addedTokens = newTokens.filter((t) => t.type === "added");
    expect(addedTokens.map((t) => t.text)).toEqual(["100"]);

    // Equal tokens should include const, maxUsers, =
    const equalTokens = newTokens.filter((t) => t.type === "equal");
    expect(equalTokens.map((t) => t.text).join("")).toBe("const maxUsers = ;");
  });

  it("pairs consecutive delete and add lines in a hunk", () => {
    const lines: DiffLine[] = [
      { line_type: "context", content: "export function run() {", old_lineno: 1, new_lineno: 1 },
      { line_type: "delete", content: "  const a = 1;", old_lineno: 2, new_lineno: null },
      { line_type: "add", content: "  const a = 2;", old_lineno: null, new_lineno: 2 },
      { line_type: "context", content: "}", old_lineno: 3, new_lineno: 3 },
    ];

    const pairedTokenMap = pairHunkLines(lines);
    expect(pairedTokenMap.has(1)).toBe(true); // line index 1 (delete) has tokens
    expect(pairedTokenMap.has(2)).toBe(true); // line index 2 (add) has tokens

    const delTokens = pairedTokenMap.get(1)!;
    expect(delTokens.find((t) => t.type === "removed")?.text).toBe("1");

    const addTokens = pairedTokenMap.get(2)!;
    expect(addTokens.find((t) => t.type === "added")?.text).toBe("2");
  });

  it("handles unpaired insertions without crashing or marking equal text as removed", () => {
    const lines: DiffLine[] = [
      { line_type: "add", content: "  console.log('new feature');", old_lineno: null, new_lineno: 1 },
    ];
    const pairedTokenMap = pairHunkLines(lines);
    expect(pairedTokenMap.has(0)).toBe(false); // Unpaired line has no word-diff map entry
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/wordDiff.test.ts`
Expected: FAIL (`cannot find module ../utils/wordDiff`).

- [ ] **Step 3: Implement `src/utils/wordDiff.ts` and `src/components/diff/DiffLineContent.tsx`**

Create `src/utils/wordDiff.ts`:
```typescript
import { DiffLine } from "../ipc/bindings";

export type WordDiffType = "equal" | "removed" | "added";

export interface WordDiffToken {
  text: string;
  type: WordDiffType;
}

export interface WordDiffResult {
  oldTokens: WordDiffToken[];
  newTokens: WordDiffToken[];
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const regex = /([\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s])/gu;
  const matches = text.match(regex);
  return matches ?? [text];
}

export function computeWordDiff(oldText: string, newText: string): WordDiffResult {
  const tOld = tokenize(oldText);
  const tNew = tokenize(newText);

  const m = tOld.length;
  const n = tNew.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tOld[i - 1] === tNew[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to extract common tokens
  const oldTokens: WordDiffToken[] = [];
  const newTokens: WordDiffToken[] = [];

  let i = m;
  let j = n;

  const revOld: WordDiffToken[] = [];
  const revNew: WordDiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tOld[i - 1] === tNew[j - 1]) {
      revOld.push({ text: tOld[i - 1]!, type: "equal" });
      revNew.push({ text: tNew[j - 1]!, type: "equal" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      revNew.push({ text: tNew[j - 1]!, type: "added" });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      revOld.push({ text: tOld[i - 1]!, type: "removed" });
      i--;
    }
  }

  return {
    oldTokens: revOld.reverse(),
    newTokens: revNew.reverse(),
  };
}

export function pairHunkLines(lines: DiffLine[]): Map<number, WordDiffToken[]> {
  const tokenMap = new Map<number, WordDiffToken[]>();

  let idx = 0;
  while (idx < lines.length) {
    if (lines[idx]?.line_type === "delete") {
      const delIndices: number[] = [];
      while (idx < lines.length && lines[idx]?.line_type === "delete") {
        delIndices.push(idx);
        idx++;
      }

      const addIndices: number[] = [];
      while (idx < lines.length && lines[idx]?.line_type === "add") {
        addIndices.push(idx);
        idx++;
      }

      const pairCount = Math.min(delIndices.length, addIndices.length);
      for (let p = 0; p < pairCount; p++) {
        const delIdx = delIndices[p]!;
        const addIdx = addIndices[p]!;
        const delContent = lines[delIdx]!.content;
        const addContent = lines[addIdx]!.content;

        const { oldTokens, newTokens } = computeWordDiff(delContent, addContent);
        tokenMap.set(delIdx, oldTokens);
        tokenMap.set(addIdx, newTokens);
      }
    } else {
      idx++;
    }
  }

  return tokenMap;
}
```

Create `src/components/diff/DiffLineContent.tsx`:
```typescript
import React from "react";
import clsx from "clsx";
import { WordDiffToken } from "../../utils/wordDiff";

interface DiffLineContentProps {
  content: string;
  lineType: string;
  tokens?: WordDiffToken[];
  showWordDiff?: boolean;
}

export const DiffLineContent: React.FC<DiffLineContentProps> = ({
  content,
  lineType,
  tokens,
  showWordDiff = true,
}) => {
  if (!showWordDiff || !tokens || tokens.length === 0) {
    return <span>{content}</span>;
  }

  return (
    <span>
      {tokens.map((token, i) => {
        if (token.type === "removed") {
          return (
            <span
              key={i}
              className="bg-red-500/30 text-diff-remove-text font-semibold rounded-xs px-0.5"
            >
              {token.text}
            </span>
          );
        }
        if (token.type === "added") {
          return (
            <span
              key={i}
              className="bg-emerald-500/30 text-diff-add-text font-semibold rounded-xs px-0.5"
            >
              {token.text}
            </span>
          );
        }
        return <span key={i}>{token.text}</span>;
      })}
    </span>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/test/wordDiff.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/wordDiff.ts src/components/diff/DiffLineContent.tsx src/test/wordDiff.test.ts
git commit -m "✨ implement word diff tokenizer LCS algorithm and DiffLineContent renderer"
```

---

### Task 4: UI Integration in `FileDiffViewer` & `InteractiveDiffViewer` + i18n

**Files:**
- Modify: `src/i18n/vi.ts` & `src/i18n/en.ts`
- Modify: `src/components/diff/FileDiffViewer.tsx`
- Modify: `src/components/changes/InteractiveDiffViewer.tsx`
- Create: `src/test/DiffViewerWordDiff.test.tsx`

**Interfaces:**
- Consumes:
  - `useSettingsStore` (`diffIgnoreWhitespace`, `setDiffIgnoreWhitespace`)
  - `pairHunkLines` from `src/utils/wordDiff`
  - `<DiffLineContent />`
  - i18n keys for ignoreWhitespace and wordDiff
- Produces:
  - Header toolbar on `FileDiffViewer` with Ignore Whitespace toggle and Word Diff toggle
  - Header toolbar on `InteractiveDiffViewer` with Ignore Whitespace toggle and Word Diff toggle
  - Automatic query invalidation / refetch with `diffIgnoreWhitespace` included in query keys.

- [ ] **Step 1: Add localization keys to `vi.ts` and `en.ts`**

In `src/i18n/vi.ts`:
```typescript
diff: {
  // ...
  ignoreWhitespace: "Bỏ qua khoảng trắng",
  ignoreWhitespaceActive: "Đang bỏ qua khoảng trắng",
  wordDiff: "Tô màu chi tiết từ (Word diff)",
  wordDiffActive: "Đang bật tô màu chi tiết từ",
}
```

In `src/i18n/en.ts`:
```typescript
diff: {
  // ...
  ignoreWhitespace: "Ignore whitespace",
  ignoreWhitespaceActive: "Ignoring whitespace",
  wordDiff: "Word-level diff",
  wordDiffActive: "Word-level diff active",
}
```

- [ ] **Step 2: Write component integration test**

Create `src/test/DiffViewerWordDiff.test.tsx`:
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileDiffViewer } from "../components/diff/FileDiffViewer";
import { InteractiveDiffViewer } from "../components/changes/InteractiveDiffViewer";
import { useSettingsStore } from "../store/useSettingsStore";
import { invokeCommand } from "../ipc/client";

describe("Diff Viewer Word-level Diff and Ignore Whitespace UI", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useSettingsStore.setState({ diffIgnoreWhitespace: false });
  });

  it("FileDiffViewer renders Ignore Whitespace and Word Diff toolbar buttons", async () => {
    vi.spyOn(invokeCommand, "getCommitFileDiff").mockResolvedValue({
      file_path: "src/index.ts",
      status: "modified",
      additions: 1,
      deletions: 1,
      hunks: [
        {
          header: "@@ -1,1 +1,1 @@",
          old_start: 1,
          old_lines: 1,
          new_start: 1,
          new_lines: 1,
          lines: [
            { line_type: "delete", content: "const a = 10;", old_lineno: 1, new_lineno: null },
            { line_type: "add", content: "const a = 20;", old_lineno: null, new_lineno: 1 },
          ],
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FileDiffViewer repoPath="/mock/repo" commitId="c1" filePath="src/index.ts" />
      </QueryClientProvider>
    );

    // Verify file diff content and word highlight
    await waitFor(() => {
      expect(screen.getByText("src/index.ts")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    // Check Ignore Whitespace toggle button
    const ignoreWsBtn = screen.getByTitle(/Bỏ qua khoảng trắng|Ignore whitespace/i);
    expect(ignoreWsBtn).toBeInTheDocument();

    fireEvent.click(ignoreWsBtn);
    expect(useSettingsStore.getState().diffIgnoreWhitespace).toBe(true);
  });

  it("InteractiveDiffViewer provides Ignore Whitespace button while retaining staging actions", async () => {
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue({
      file_path: "src/App.tsx",
      status: "modified",
      additions: 1,
      deletions: 1,
      hunks: [
        {
          header: "@@ -1,1 +1,1 @@",
          old_start: 1,
          old_lines: 1,
          new_start: 1,
          new_lines: 1,
          lines: [
            { line_type: "delete", content: "let msg = 'hello';", old_lineno: 1, new_lineno: null },
            { line_type: "add", content: "let msg = 'world';", old_lineno: null, new_lineno: 1 },
          ],
        },
      ],
    });

    const onStageHunk = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <InteractiveDiffViewer
          repoPath="/mock/repo"
          filePath="src/App.tsx"
          isStaged={false}
          onStageHunk={onStageHunk}
          onUnstageHunk={vi.fn()}
          onStageLines={vi.fn()}
          onUnstageLines={vi.fn()}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("src/App.tsx")).toBeInTheDocument();
    });

    const ignoreWsBtn = screen.getByTitle(/Bỏ qua khoảng trắng|Ignore whitespace/i);
    expect(ignoreWsBtn).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Update `FileDiffViewer.tsx` and `InteractiveDiffViewer.tsx`**

In `FileDiffViewer.tsx`:
- Read `diffIgnoreWhitespace`, `setDiffIgnoreWhitespace` from `useSettingsStore`.
- Query key: `["file-diff", repoPath, commitId, filePath, diffIgnoreWhitespace]`.
- Call `invokeCommand.getCommitFileDiff(repoPath, commitId, filePath, diffIgnoreWhitespace)`.
- Use local state `showWordDiff` (default `true`).
- In each hunk: compute `const tokenMap = useMemo(() => pairHunkLines(hunk.lines), [hunk.lines]);`.
- Render code line content via `<DiffLineContent content={line.content} lineType={line.line_type} tokens={tokenMap.get(lIdx)} showWordDiff={showWordDiff} />`.
- Add toolbar header with Space (ignore ws) and Type (word diff) toggle buttons.

In `InteractiveDiffViewer.tsx`:
- Read `diffIgnoreWhitespace`, `setDiffIgnoreWhitespace` from `useSettingsStore`.
- Query key: `["workingFileDiff", repoPath, filePath, isStaged, diffIgnoreWhitespace]`.
- Call `invokeCommand.getWorkingFileDiff(repoPath, filePath, isStaged, diffIgnoreWhitespace)`.
- Add toggle button for Ignore Whitespace and Word Diff in the header right-side controls.
- Render line contents via `<DiffLineContent />` while maintaining existing Stage Hunk / Stage Line buttons and interactions.

- [ ] **Step 4: Run tests to verify**

Run: `pnpm vitest run src/test/DiffViewerWordDiff.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/vi.ts src/i18n/en.ts src/components/diff/FileDiffViewer.tsx src/components/changes/InteractiveDiffViewer.tsx src/test/DiffViewerWordDiff.test.tsx
git commit -m "✨ integrate word diff highlighting and ignore whitespace controls in diff viewers"
```

---

### Task 5: Full Regression Testing & Documentation

**Files:**
- Modify: `docs/ROADMAP_STATUS.md`

- [ ] **Step 1: Run all backend tests**

Run: `cargo test`
Expected: 28 test suites / 82 tests pass 100%.

- [ ] **Step 2: Run all frontend tests**

Run: `pnpm vitest run`
Expected: 59 test files / 295+ tests pass 100%.

- [ ] **Step 3: Run production build**

Run: `pnpm build`
Expected: TypeScript check and Vite build exit with code 0.

- [ ] **Step 4: Update `docs/ROADMAP_STATUS.md`**

Update Phase 1.2.1 status to `✅ Đã hoàn thành (100%)`.

- [ ] **Step 5: Commit**

```bash
git add docs/ROADMAP_STATUS.md
git commit -m "📝 update roadmap status to mark word diff and ignore whitespace complete"
```
