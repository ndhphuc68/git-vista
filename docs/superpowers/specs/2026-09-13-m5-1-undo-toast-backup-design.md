# Thiết Kế Milestone M5.1: Hệ Thống Undo, Toast, Ref Backup An Toàn & Ánh Xạ Thông Điệp Lỗi

**Ngày:** 2026-09-13  
**Trạng thái:** Đã duyệt thiết kế, sẵn sàng lập kế hoạch triển khai (Implementation Plan)  
**Tài liệu gốc:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md` (Mục 6.4, 8.1, 8.2 - M5)  

---

## 1. Mục Tiêu & Phạm Vi (M5.1)

Milestone M5.1 xây dựng lưới an toàn (safety net) cho người dùng khi thao tác với Git, giúp loại bỏ nỗi sợ mất mã nguồn:
1. **Cơ chế Ref Backup Tự Động:**
   - Trước các thao tác ghi có tính chất thay đổi lịch sử hoặc xoá dữ liệu (commit, delete branch, discard file, drop stash), backend tự động tạo một git reference lưu lại commit OID hiện tại trong `refs/gitui-backup/<action>-<timestamp>`.
   - Tự động dọn dẹp các backup ref quá 30 ngày để giữ repository gọn gàng.
2. **Hệ Thống Hoàn Tác (Undo Engine):**
   - Hỗ trợ hoàn tác nhanh 4 thao tác quan trọng nhất:
     - **Hoàn tác Commit (Undo Commit):** Soft reset về commit trước đó (`HEAD~1`), giữ nguyên các thay đổi trong Staged / Working tree.
     - **Hoàn tác Xoá Nhánh (Undo Delete Branch):** Tái tạo lại nhánh đã xoá trỏ về commit OID cũ.
     - **Hoàn tác Xoá Stash (Undo Drop Stash):** Khôi phục lại mục Stash vừa bị drop.
     - **Hoàn tác Discard File (Undo Discard File):** Phục hồi nội dung file vừa bị huỷ thay đổi.
3. **Toast Thông Báo & Tương Tác:**
   - Toast cố định ở góc dưới bên phải (`bottom-4 right-4`).
   - Tồn tại trong 10 giây kèm thanh đếm lùi trực quan và nút **"Hoàn tác"** nổi bật.
4. **Ánh Xạ Thông Điệp Lỗi Thân Thiện (Friendly Error Mapping):**
   - Không ném stderr thô của Git vào mặt người dùng.
   - Dịch các lỗi thường gặp (Authentication failed, non-fast-forward push, working tree dirty, timeout) sang tiếng Việt dễ hiểu kèm gợi ý hành động.
   - Nút thu gọn / mở rộng "Xem chi tiết kỹ thuật" để dev chuyên nghiệp kiểm tra khi cần.

---

## 2. Kiến Trúc Backend Rust & Lệnh IPC

### 2.1 Module Ref Backup (`src-tauri/src/write/backup.rs`)

```rust
use crate::error::AppError;
use git2::{Oid, Repository};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn create_backup_ref(
    repo: &Repository,
    action: &str,
    target_oid: Oid,
) -> Result<String, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let ref_name = format!("refs/gitui-backup/{}-{}", action, now);
    repo.reference(&ref_name, target_oid, true, "gitui automatic safety backup")?;
    Ok(ref_name)
}

pub fn prune_expired_backups(repo: &Repository, max_age_days: u64) -> Result<usize, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let max_age_secs = max_age_days * 86400;
    let mut pruned = 0;

    let refs = repo.references_glob("refs/gitui-backup/*")?;
    for reference in refs {
        if let Ok(mut r) = reference {
            if let Some(name) = r.name() {
                if let Some(timestamp_str) = name.rsplit('-').next() {
                    if let Ok(ts) = timestamp_str.parse::<u64>() {
                        if now.saturating_sub(ts) > max_age_secs {
                            let _ = r.delete();
                            pruned += 1;
                        }
                    }
                }
            }
        }
    }
    Ok(pruned)
}
```

### 2.2 Module Undo (`src-tauri/src/write/undo.rs`)

Các thao tác hoàn tác an toàn:
1. `undo_commit(repo_path: &str) -> Result<(), AppError>`:
   - Dùng `repo.head()?.peel_to_commit()`.
   - Tìm parent commit đầu tiên (`parent(0)`).
   - Gọi `repo.reset(&parent_obj, git2::ResetType::Soft, None)` để chuyển HEAD về parent commit nhưng giữ nguyên toàn bộ index staged.
2. `undo_delete_branch(repo_path: &str, branch_name: &str, commit_id: &str) -> Result<(), AppError>`:
   - Phân tích OID từ `commit_id`, tìm commit tương ứng trong repo.
   - Gọi `repo.branch(branch_name, &commit, false)` để tái tạo lại nhánh.
3. `undo_drop_stash(repo_path: &str, stash_commit_id: &str, message: &str) -> Result<(), AppError>`:
   - Trích xuất stash commit OID. Tạo lại commit stash reference hoặc cập nhật ref `refs/stash`.
4. `undo_discard_file(repo_path: &str, file_path: &str, backup_content: &str) -> Result<(), AppError>`:
   - Ghi lại nội dung `backup_content` vào file trong working directory.

### 2.3 Đăng ký IPC Commands
Tạo `src-tauri/src/commands/undo.rs`:
- `undo_commit(app: tauri::AppHandle, repo_path: String) -> Result<(), AppError>`
- `undo_delete_branch(app: tauri::AppHandle, repo_path: String, branch_name: String, commit_id: String) -> Result<(), AppError>`
- `undo_drop_stash(app: tauri::AppHandle, repo_path: String, stash_commit_id: String, message: String) -> Result<(), AppError>`
- `undo_discard_file(app: tauri::AppHandle, repo_path: String, file_path: String, backup_content: String) -> Result<(), AppError>`
- Mọi lệnh đều gọi `emit_repo_changed` sau khi hoàn tất.
- Đăng ký vào `create_specta_builder()` trong `src-tauri/src/lib.rs`.

---

## 3. Kiến Trúc Frontend: Toast, Undo & Ánh Xạ Lỗi

### 3.1 Error Mapping Engine (`src/utils/errorMapping.ts`)
Phân tích lỗi Git và chuyển thể sang tiếng Việt thân thiện:
```typescript
export interface FriendlyError {
  title: string;
  message: string;
  actionHint?: string;
  rawError?: string;
}

export function mapGitError(error: unknown): FriendlyError {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("authentication failed") || lower.includes("permission denied")) {
    return {
      title: "Lỗi xác thực Git",
      message: "Không thể kết nối hoặc không có quyền truy cập vào máy chủ Git.",
      actionHint: "Vui lòng kiểm tra lại SSH key hoặc Personal Access Token trên tài khoản của bạn.",
      rawError: raw,
    };
  }

  if (lower.includes("rejected") || lower.includes("fetch first") || lower.includes("non-fast-forward")) {
    return {
      title: "Nhánh từ xa đã có commit mới",
      message: "Máy chủ từ xa chứa các thay đổi mà bạn chưa có ở máy cục bộ.",
      actionHint: "Hãy thực hiện 'Lấy về (Pull)' các commit mới trước khi Gửi lên (Push).",
      rawError: raw,
    };
  }

  if (lower.includes("checkout_conflict") || lower.includes("local changes would be overwritten")) {
    return {
      title: "Xung đột khi chuyển nhánh",
      message: "Bạn đang có các thay đổi chưa lưu có thể bị ghi đè khi đổi nhánh.",
      actionHint: "Hãy Commit các thay đổi hoặc bấm 'Lưu tạm (Stash)' trước khi chuyển nhánh.",
      rawError: raw,
    };
  }

  if (lower.includes("could not resolve host") || lower.includes("connection timed out")) {
    return {
      title: "Không thể kết nối mạng",
      message: "Không thể liên lạc với máy chủ máy chủ từ xa.",
      actionHint: "Vui lòng kiểm tra lại kết nối Internet của bạn và thử lại.",
      rawError: raw,
    };
  }

  return {
    title: "Thao tác không thành công",
    message: raw,
    rawError: raw,
  };
}
```

### 3.2 Toast Store (`src/store/useToastStore.ts`)
```typescript
export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  durationMs?: number;
  undoAction?: () => Promise<void>;
  undoLabel?: string;
  friendlyError?: FriendlyError;
}
```

### 3.3 Toast UI (`src/components/toast/ToastContainer.tsx` & `ToastItem.tsx`)
- Hiển thị danh sách toast góc dưới bên phải (`fixed bottom-4 right-4 flex flex-col gap-2 z-[9999]`).
- Thanh progress bar đếm lùi thời gian còn lại (mặc định 10s).
- Nút **"Hoàn tác"** bấm vào sẽ kích hoạt `undoAction`, xử lý loading và đóng toast.
- Đối với toast lỗi: có nút bấm `Xem chi tiết kỹ thuật` mở rộng hiển thị `rawError`.

---

## 4. Tích Hợp Vào Các Thao Tác Ứng Dụng

1. **CommitBox.tsx:**
   - Sau khi `invokeCommand.createCommit(...)` thành công:
     - Gọi `toast.showSuccess("Đã tạo commit", { durationMs: 10000, undoAction: () => invokeCommand.undoCommit(repoPath) })`.
2. **DeleteBranchModal.tsx & BranchSidebar.tsx:**
   - Trước khi xoá nhánh: lấy `target_commit_id` của nhánh.
   - Sau khi xoá thành công:
     - Gọi `toast.showSuccess(`Đã xoá nhánh ${branchName}`, { durationMs: 10000, undoAction: () => invokeCommand.undoDeleteBranch(repoPath, branchName, targetCommitId) })`.
3. **BranchSidebar.tsx (Drop Stash):**
   - Sau khi drop stash:
     - Gọi `toast.showSuccess(`Đã xoá Stash #${index}`, { durationMs: 10000, undoAction: () => invokeCommand.undoDropStash(repoPath, stashCommitId, message) })`.
4. **ChangesScreen.tsx / StagingFileList.tsx (Discard File):**
   - Trước khi discard file: đọc nội dung file hiện tại.
   - Sau khi discard:
     - Gọi `toast.showSuccess(`Đã huỷ thay đổi trong ${path}`, { durationMs: 10000, undoAction: () => invokeCommand.undoDiscardFile(repoPath, path, originalContent) })`.

---

## 5. Kế Hoạch Kiểm Thử (Testing & TDD)

### 5.1 Backend Tests (`src-tauri/tests/m5_undo_test.rs`)
- Test `create_backup_ref` và `prune_expired_backups`.
- Test `undo_commit`: tạo commit, kiểm tra HEAD di chuyển, gọi `undo_commit`, kiểm tra HEAD lùi về parent và index vẫn staged.
- Test `undo_delete_branch`: xoá branch, gọi `undo_delete_branch`, xác nhận branch phục hồi về đúng OID.
- Test `undo_discard_file`: huỷ thay đổi, gọi `undo_discard_file`, xác nhận nội dung file phục hồi.

### 5.2 Frontend Tests (`src/test/ToastUndo.test.tsx`, `src/test/ErrorMapping.test.ts`)
- Test `mapGitError`: ánh xạ đúng các mẫu lỗi xác thực, push rejected, checkout conflict, network.
- Test `ToastContainer`: render toast với đếm lùi, click nút Hoàn tác gọi callback tương ứng.
- Test tích hợp CommitBox: sau khi commit, toast hoàn tác xuất hiện và gọi `undoCommit`.

---

## 6. Tiêu Chí Thành Công (Definition of Done)
1. 100% tests backend và frontend pass (59+ tests Rust, 120+ tests Vitest).
2. Quy trình build production `cargo check` và `pnpm run build` thành công, 0 lỗi.
3. Người dùng có thể hoàn tác commit, hoàn tác xoá nhánh, hoàn tác discard file trực tiếp từ Toast trong vòng 10 giây mà không cần thao tác terminal phức tạp.
