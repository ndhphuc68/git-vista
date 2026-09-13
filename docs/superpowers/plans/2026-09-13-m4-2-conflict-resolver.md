# Milestone M4.2: Trình Giải Quyết Xung Đột 3 Cột (3-Column Conflict Resolver) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng tính năng giải quyết xung đột mã nguồn trực quan bằng giao diện 3 cột (Ours | Merged Result | Theirs), hỗ trợ thao tác theo từng khối xung đột, sửa tay trực tiếp, thao tác hàng loạt và tự động lưu/stage file vào Git.

**Architecture:** Sử dụng `libgit2` để phân loại file xung đột (`git2::Status::CONFLICTED`), bóc tách cú pháp Git conflict marker chuẩn (`<<<<<<<`, `=======`, `>>>>>>>`) thành cấu trúc `ConflictHunk`, và ghi đè nội dung kèm auto-stage vào Git index. Frontend xây dựng màn hình chuyên dụng `ConflictResolverScreen` 3 cột với điều hướng mượt mà và kết nối từ màn hình Changes.

**Tech Stack:** Tauri 2 (Rust + libgit2 0.20), React 19, TypeScript 5.8, Zustand 5, TanStack Query 5, Vitest, Testing Library, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-09-13-m4-2-conflict-resolver-design.md`

## Global Constraints

- Backend: Không spawn git CLI trong `write/conflict.rs` hoặc `read/conflict.rs`; sử dụng `libgit2` in-process.
- Mọi thao tác ghi (`resolve_conflict_file`) phát event `repo-changed` để tự động làm mới TanStack Query cache.
- Tôn trọng các marker chuẩn của Git (`<<<<<<<`, `=======`, `>>>>>>>`, `|||||||`).
- Giao diện tiếng Việt nhất quán, phím tắt Esc thoát modal/màn hình an toàn, bàn phím điều hướng thân thiện.
- Tuân thủ nghiêm ngặt quy trình Test-Driven Development (TDD): Viết test trước, kiểm tra test fail, viết code tối thiểu, kiểm tra test pass, commit.

---

### Task 1: Backend Conflicted Status Classification (`src-tauri/src/read/status.rs`)

**Files:**
- Modify: `src-tauri/src/read/status.rs`
- Test: `src-tauri/tests/m4_status_conflict_test.rs`

**Interfaces:**
- Consumes: `git2::Repository`, `git2::Status::CONFLICTED`
- Produces:
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
  pub enum FileStatus {
      Modified,
      New,
      Deleted,
      Renamed,
      Typechange,
      Conflicted,
  }

  #[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
  pub struct RepoStatusResult {
      pub staged: Vec<StatusFileItem>,
      pub unstaged: Vec<StatusFileItem>,
      pub untracked: Vec<StatusFileItem>,
      pub conflicted: Vec<StatusFileItem>,
  }
  ```

- [ ] **Step 1: Write the failing integration test in `src-tauri/tests/m4_status_conflict_test.rs`**

```rust
use std::fs;
use std::path::Path;
use std::process::Command;
use visual_git_lib::read::status::{get_repo_status, FileStatus};

fn create_conflict_repo() -> (tempfile::TempDir, String) {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
    };

    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);

    fs::write(p.join("conflict.txt"), "base content\n").unwrap();
    run(&["add", "conflict.txt"]);
    run(&["commit", "-m", "initial"]);
    run(&["branch", "-M", "main"]);

    run(&["checkout", "-b", "feature"]);
    fs::write(p.join("conflict.txt"), "feature content\n").unwrap();
    run(&["commit", "-am", "feature commit"]);

    run(&["checkout", "main"]);
    fs::write(p.join("conflict.txt"), "main content\n").unwrap();
    run(&["commit", "-am", "main commit"]);

    // Merge gây conflict (không assert success)
    let _ = Command::new("git").current_dir(p).args(&["merge", "feature"]).output().unwrap();

    let path_str = dir.path().to_str().unwrap().to_string();
    (dir, path_str)
}

#[test]
fn test_get_repo_status_detects_conflicted_files() {
    let (_dir, repo_path) = create_conflict_repo();

    let status = get_repo_status(&repo_path).unwrap();
    assert_eq!(status.conflicted.len(), 1);
    assert_eq!(status.conflicted[0].path, "conflict.txt");
    assert_eq!(status.conflicted[0].status, FileStatus::Conflicted);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test m4_status_conflict_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (`status.conflicted` does not exist or `FileStatus::Conflicted` not defined)

- [ ] **Step 3: Update `src-tauri/src/read/status.rs`**

Update `FileStatus` enum: add `Conflicted`.
Update `RepoStatusResult`: add `pub conflicted: Vec<StatusFileItem>`.
In `get_repo_status`:
Check if `s.contains(git2::Status::CONFLICTED)`:
```rust
if s.contains(git2::Status::CONFLICTED) {
    conflicted.push(StatusFileItem {
        path: path.clone(),
        status: FileStatus::Conflicted,
        is_staged: false,
        old_path: None,
    });
    continue;
}
```
Add `conflicted` to `RepoStatusResult`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test m4_status_conflict_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/read/status.rs src-tauri/tests/m4_status_conflict_test.rs
git commit -m "feat(m4): classify conflicted files in repo status"
```

---

### Task 2: Backend Conflict Hunk Parser & File Resolver (`src-tauri/src/read/conflict.rs`, `src-tauri/src/write/conflict.rs`)

**Files:**
- Create: `src-tauri/src/read/conflict.rs`, `src-tauri/src/write/conflict.rs`
- Modify: `src-tauri/src/read/mod.rs`, `src-tauri/src/write/mod.rs`
- Test: `src-tauri/tests/m4_conflict_test.rs`

**Interfaces:**
- Consumes: `crate::error::AppError`, `git2::Repository`
- Produces:
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
  pub struct ConflictHunk {
      pub id: String,
      pub is_conflict: bool,
      pub content: Option<String>,
      pub ours: Option<String>,
      pub theirs: Option<String>,
      pub base: Option<String>,
      pub ours_label: Option<String>,
      pub theirs_label: Option<String>,
  }

  #[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
  pub struct ConflictFileData {
      pub file_path: String,
      pub total_conflicts: usize,
      pub hunks: Vec<ConflictHunk>,
  }

  pub fn get_conflict_file_data<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<ConflictFileData, AppError>;
  pub fn resolve_conflict_file<P: AsRef<Path>>(repo_path: P, file_path: &str, resolved_content: &str, auto_stage: bool) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write the failing integration test in `src-tauri/tests/m4_conflict_test.rs`**

```rust
use std::fs;
use std::process::Command;
use visual_git_lib::read::conflict::get_conflict_file_data;
use visual_git_lib::read::status::get_repo_status;
use visual_git_lib::write::conflict::resolve_conflict_file;

fn create_conflict_repo() -> (tempfile::TempDir, String) {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
    };

    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);

    fs::write(p.join("app.txt"), "common header\ncommon middle\ncommon footer\n").unwrap();
    run(&["add", "app.txt"]);
    run(&["commit", "-m", "initial"]);
    run(&["branch", "-M", "main"]);

    run(&["checkout", "-b", "feature"]);
    fs::write(p.join("app.txt"), "common header\nfeature line\ncommon footer\n").unwrap();
    run(&["commit", "-am", "feature change"]);

    run(&["checkout", "main"]);
    fs::write(p.join("app.txt"), "common header\nmain line\ncommon footer\n").unwrap();
    run(&["commit", "-am", "main change"]);

    let _ = Command::new("git").current_dir(p).args(&["merge", "feature"]).output().unwrap();

    let path_str = dir.path().to_str().unwrap().to_string();
    (dir, path_str)
}

#[test]
fn test_conflict_parsing_and_resolution_lifecycle() {
    let (_dir, repo_path) = create_conflict_repo();

    // 1. Phân tích conflict file data
    let data = get_conflict_file_data(&repo_path, "app.txt").unwrap();
    assert_eq!(data.file_path, "app.txt");
    assert_eq!(data.total_conflicts, 1);

    let conflict_hunk = data.hunks.iter().find(|h| h.is_conflict).expect("Must have 1 conflict hunk");
    assert!(conflict_hunk.ours.as_ref().unwrap().contains("main line"));
    assert!(conflict_hunk.theirs.as_ref().unwrap().contains("feature line"));

    // 2. Giải quyết conflict và auto-stage
    let resolved = "common header\nmain line\nfeature line\ncommon footer\n";
    resolve_conflict_file(&repo_path, "app.txt", resolved, true).unwrap();

    // 3. Trạng thái repo không còn conflict và file đã staged
    let status = get_repo_status(&repo_path).unwrap();
    assert_eq!(status.conflicted.len(), 0);
    assert!(status.staged.iter().any(|s| s.path == "app.txt"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test m4_conflict_test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (modules `read::conflict` and `write::conflict` not found)

- [ ] **Step 3: Implement `src-tauri/src/read/conflict.rs` and `src-tauri/src/write/conflict.rs`**

Create `src-tauri/src/read/conflict.rs`:
- Implement parser that reads file lines, splits on `<<<<<<<`, `|||||||`, `=======`, `>>>>>>>`.
- Populates `ConflictHunk` items and `ConflictFileData`.

Create `src-tauri/src/write/conflict.rs`:
- Implements `resolve_conflict_file`: writes string to path, opens `git2::Repository`, stages file to index if `auto_stage` is true.

Update `read/mod.rs` and `write/mod.rs` to expose `pub mod conflict;`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test m4_conflict_test --manifest-path src-tauri/Cargo.toml`
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/read/conflict.rs src-tauri/src/write/conflict.rs src-tauri/src/read/mod.rs src-tauri/src/write/mod.rs src-tauri/tests/m4_conflict_test.rs
git commit -m "feat(m4): implement conflict hunk parser and file resolver"
```

---

### Task 3: Tauri Commands, Specta Registration & Frontend IPC Client

**Files:**
- Create: `src-tauri/src/commands/conflict.rs`
- Modify: `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`, `src/ipc/bindings.ts`, `src/ipc/client.ts`
- Test: `src/test/ipcConflict.test.ts`

**Interfaces:**
- Consumes: `crate::read::conflict`, `crate::write::conflict`
- Produces: Tauri Specta commands `get_conflict_file_data`, `resolve_conflict_file` and frontend client wrappers `invokeCommand.getConflictFileData`, `invokeCommand.resolveConflictFile`.

- [ ] **Step 1: Write the failing test in `src/test/ipcConflict.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC conflict commands (browser mock)", () => {
  it("getConflictFileData returns mock conflict data", async () => {
    const data = await invokeCommand.getConflictFileData("test-repo", "src/App.tsx");
    expect(data.file_path).toBe("src/App.tsx");
    expect(Array.isArray(data.hunks)).toBe(true);
  });

  it("resolveConflictFile completes successfully", async () => {
    await expect(
      invokeCommand.resolveConflictFile("test-repo", "src/App.tsx", "resolved content", true)
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/ipcConflict.test.ts --run`
Expected: FAIL (`invokeCommand.getConflictFileData` is not a function)

- [ ] **Step 3: Implement Tauri commands and frontend client wrappers**

1. Create `src-tauri/src/commands/conflict.rs`:
   - `get_conflict_file_data(repo_path: String, file_path: String) -> Result<ConflictFileData, AppError>`
   - `resolve_conflict_file(app: tauri::AppHandle, repo_path: String, file_path: String, resolved_content: String, auto_stage: Option<bool>) -> Result<(), AppError>`
   - Emits `repo-changed` with reason `"resolve_conflict"`.
2. Register commands in `src-tauri/src/commands/mod.rs` and `create_specta_builder()` in `src-tauri/src/lib.rs`.
3. Update `src/ipc/bindings.ts`: Add `ConflictHunk`, `ConflictFileData`, update `RepoStatusResult` with `conflicted: StatusFileItem[]`.
4. Update `src/ipc/client.ts`: Add `getConflictFileData`, `resolveConflictFile` with browser mock fallbacks.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/ipcConflict.test.ts --run`
Expected: PASS (2 tests passed)
Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Clean compile, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/commands/conflict.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs src/ipc/bindings.ts src/ipc/client.ts src/test/ipcConflict.test.ts
git commit -m "feat(m4): register conflict commands in specta and client bridge"
```

---

### Task 4: ViewStore State & ChangesScreen Conflicted Files Integration

**Files:**
- Modify: `src/store/useViewStore.ts`, `src/components/changes/ChangesScreen.tsx`, `src/components/changes/StagingFileList.tsx`
- Test: `src/test/ConflictedFileList.test.tsx`

**Interfaces:**
- Consumes: `useViewStore.openConflictResolver`, `RepoStatusResult.conflicted`
- Produces: Dedicated "TỆP XUNG ĐỘT (N)" section in staging list with "Giải quyết" action button.

- [ ] **Step 1: Write the failing component test in `src/test/ConflictedFileList.test.tsx`**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StagingFileList } from "../components/changes/StagingFileList";
import { StatusFileItem } from "../ipc/bindings";

describe("StagingFileList with Conflicted files", () => {
  const mockConflicted: StatusFileItem[] = [
    { path: "conflict1.txt", status: "Conflicted", is_staged: false, old_path: null },
  ];

  it("renders conflicted section and triggers onOpenConflictResolver", () => {
    const handleResolve = vi.fn();

    render(
      <StagingFileList
        staged={[]}
        unstaged={[]}
        untracked={[]}
        conflicted={mockConflicted}
        selectedFile={null}
        onSelectFile={vi.fn()}
        onStageFile={vi.fn()}
        onUnstageFile={vi.fn()}
        onDiscardFile={vi.fn()}
        onStageAll={vi.fn()}
        onUnstageAll={vi.fn()}
        onOpenConflictResolver={handleResolve}
      />
    );

    expect(screen.getByText(/TỆP XUNG ĐỘT/i)).toBeInTheDocument();
    expect(screen.getByText("conflict1.txt")).toBeInTheDocument();

    const resolveBtn = screen.getByRole("button", { name: /Giải quyết/i });
    fireEvent.click(resolveBtn);
    expect(handleResolve).toHaveBeenCalledWith("conflict1.txt");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/ConflictedFileList.test.tsx --run`
Expected: FAIL (`conflicted` prop not accepted or section not found)

- [ ] **Step 3: Update `useViewStore.ts`, `StagingFileList.tsx`, and `ChangesScreen.tsx`**

1. In `src/store/useViewStore.ts`:
   - `activeScreen: "history" | "changes" | "conflict"`
   - `activeConflictFile: string | null`
   - `openConflictResolver: (filePath: string) => void`
   - `closeConflictResolver: () => void`
2. In `src/components/changes/StagingFileList.tsx`:
   - Add `conflicted?: StatusFileItem[]` and `onOpenConflictResolver?: (filePath: string) => void` to props.
   - Render section `TỆP XUNG ĐỘT ({conflicted.length})` on top of file list with amber/red styling.
   - Each conflicted file has a "Giải quyết" button.
3. In `src/components/changes/ChangesScreen.tsx`:
   - Wire `repoStatus?.conflicted` and `openConflictResolver` to `StagingFileList`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/ConflictedFileList.test.tsx --run`
Expected: PASS (1 test passed)
Run: `pnpm test --run` to verify zero regressions.

- [ ] **Step 5: Commit**

```bash
git add src/store/useViewStore.ts src/components/changes/StagingFileList.tsx src/components/changes/ChangesScreen.tsx src/test/ConflictedFileList.test.tsx
git commit -m "feat(m4): add conflicted section in ChangesScreen and conflict view state"
```

---

### Task 5: Frontend 3-Column Conflict Resolver Screen (`ConflictResolverScreen.tsx`)

**Files:**
- Create: `src/components/conflict/ConflictResolverScreen.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/ConflictResolverScreen.test.tsx`

**Interfaces:**
- Consumes: `invokeCommand.getConflictFileData`, `invokeCommand.resolveConflictFile`, `useViewStore.activeConflictFile`, `useViewStore.closeConflictResolver`
- Produces: 3-column conflict resolver screen mounted when `activeScreen === "conflict"`.

- [ ] **Step 1: Write the failing component test in `src/test/ConflictResolverScreen.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConflictResolverScreen } from "../components/conflict/ConflictResolverScreen";
import { ConflictFileData } from "../ipc/bindings";

describe("ConflictResolverScreen Component", () => {
  const mockData: ConflictFileData = {
    file_path: "src/main.rs",
    total_conflicts: 1,
    hunks: [
      {
        id: "hunk_0",
        is_conflict: false,
        content: "fn main() {\n",
        ours: undefined,
        theirs: undefined,
        base: undefined,
        ours_label: undefined,
        theirs_label: undefined,
      },
      {
        id: "hunk_1",
        is_conflict: true,
        content: undefined,
        ours: '    println!("Hello Ours");\n',
        theirs: '    println!("Hello Theirs");\n',
        base: undefined,
        ours_label: "HEAD",
        theirs_label: "feature",
      },
      {
        id: "hunk_2",
        is_conflict: false,
        content: "}\n",
        ours: undefined,
        theirs: undefined,
        base: undefined,
        ours_label: undefined,
        theirs_label: undefined,
      },
    ],
  };

  it("renders 3 columns (Ours, Merged, Theirs) and handles Accept Ours", async () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    const handleBack = vi.fn();

    render(
      <ConflictResolverScreen
        filePath="src/main.rs"
        repoPath="/test/repo"
        conflictData={mockData}
        onBack={handleBack}
        onSaveAndStage={handleResolve}
      />
    );

    expect(screen.getByText("src/main.rs")).toBeInTheDocument();
    expect(screen.getByText(/CỦA BẠN/i)).toBeInTheDocument();
    expect(screen.getByText(/KẾT QUẢ/i)).toBeInTheDocument();
    expect(screen.getByText(/CỦA HỌ/i)).toBeInTheDocument();

    const acceptOursBtn = screen.getByRole("button", { name: /Lấy bên này \(Ours\)/i });
    fireEvent.click(acceptOursBtn);

    const saveBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleResolve).toHaveBeenCalledWith(
        expect.stringContaining('println!("Hello Ours");')
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/ConflictResolverScreen.test.tsx --run`
Expected: FAIL (Cannot find module `../components/conflict/ConflictResolverScreen`)

- [ ] **Step 3: Implement `ConflictResolverScreen.tsx` and wire into `src/App.tsx`**

1. Create `src/components/conflict/ConflictResolverScreen.tsx`:
   - Header with Back button, file path, progress badge ("Xung đột: X/N"), navigation ("◀ Khối trước", "Khối sau ▶"), batch actions ("Lấy tất cả Của bạn", "Lấy tất cả Của họ"), and "Hoàn tất" button.
   - Body with 3 columns:
     - Column 1: Ours (HEAD) with "Lấy bên này (Ours)" button.
     - Column 2: Merged Result with "Lấy cả hai (Both)" button and editable textarea for manual code modifications.
     - Column 3: Theirs with "Lấy bên này (Theirs)" button.
   - Normal hunks shown seamlessly to maintain full code context.
   - State management: tracks resolved content per hunk, assembles final file on save.
2. Update `src/App.tsx`:
   - Check `activeScreen === "conflict" && activeConflictFile`.
   - Mount `<ConflictResolverScreen />` when active screen is conflict.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/ConflictResolverScreen.test.tsx --run`
Expected: PASS (1 test passed)
Run: `pnpm test --run`
Expected: PASS across all test files.

- [ ] **Step 5: Commit**

```bash
git add src/components/conflict/ConflictResolverScreen.tsx src/App.tsx src/test/ConflictResolverScreen.test.tsx
git commit -m "feat(m4): implement 3-column ConflictResolverScreen"
```

---

### Task 6: End-to-End Flow Verification & Full Suite Validation

- [ ] **Step 1: Run full backend verification**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All unit & integration tests pass with 0 warnings.

- [ ] **Step 2: Run full frontend test suite**

Run: `pnpm test --run`
Expected: All Vitest test files pass (108+ tests).

- [ ] **Step 3: Run TypeScript compiler & Vite build check**

Run: `pnpm run build`
Expected: `tsc && vite build` succeeds with 0 errors.

- [ ] **Step 4: Update documentation and walkthrough**
