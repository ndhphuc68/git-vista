# Thiết Kế Milestone M4.2: Trình Giải Quyết Xung Đột 3 Cột (3-Column Conflict Resolver)

**Ngày:** 2026-09-13  
**Trạng thái:** Đã duyệt thiết kế, sẵn sàng lập kế hoạch triển khai (Implementation Plan)  
**Tài liệu gốc:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md` (Mục 6.2, 6.3 - Conflict Resolver)  

---

## 1. Mục Tiêu & Phạm Vi (M4.2)

Milestone M4.2 hoàn thiện trải nghiệm giải quyết xung đột Git bằng giao diện đồ hoạ 3 cột trực quan:
1. **Phát hiện file xung đột rõ ràng:**
   - Cập nhật API lấy danh sách trạng thái repository (`get_repo_status`) để nhận diện và tách riêng các file đang bị xung đột (`conflicted files`), không gộp lẫn vào modified thông thường.
   - Hiển thị nhãn cảnh báo đỏ `Xung đột (Conflicted)` trên màn hình Changes kèm nút mở nhanh trình giải quyết xung đột.
2. **Trình giải quyết xung đột 3 cột (3-Column Conflict Resolver Screen):**
   - Màn hình chuyên dụng `conflict` với không gian tối đa cho việc đối chiếu mã nguồn.
   - **Cột 1 (Của bạn - Ours):** Nội dung từ commit/nhánh hiện tại (`HEAD`). Nút hành động: *Lấy bên này (Accept Ours)*.
   - **Cột 2 (Kết quả - Merged Result):** Nội dung sau khi gộp. Nút hành động: *Lấy cả hai (Accept Both: Ours trước, Theirs sau)*. Cho phép người dùng chỉnh sửa tay trực tiếp trong ô mã nguồn.
   - **Cột 3 (Của họ - Theirs):** Nội dung từ nhánh đang được gộp hoặc commit đang rebase. Nút hành động: *Lấy bên này (Accept Theirs)*.
3. **Thanh điều hướng & Thao tác hàng loạt (Toolbar & Batch Actions):**
   - Bộ đếm tiến độ: `Xung đột: X/N khối`.
   - Nút điều hướng nhanh: `◀ Khối trước` / `Khối sau ▶` (tự động cuộn đến khối xung đột tương ứng).
   - Nút thao tác nhanh toàn file: `Lấy tất cả Của bạn` và `Lấy tất cả Của họ`.
   - Nút `Hoàn tất & Đánh dấu đã giải quyết (Save & Mark Resolved)`: Ghi nội dung đã giải quyết xuống đĩa và tự động stage (`git add`) để đánh dấu với Git rằng xung đột của file đã được xử lý xong.

---

## 2. Kiến Trúc Backend Rust & Danh Sách Lệnh IPC

### 2.1 Cập nhật Repo Status (`src-tauri/src/read/status.rs`)
Bổ sung `conflicted: Vec<StatusFileItem>` vào cấu trúc `RepoStatusResult`:

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

Khi duyệt qua các status entries của repository, các entry có cờ `git2::Status::CONFLICTED` sẽ được đưa vào mảng `conflicted` thay vì chỉ xếp vào `unstaged`.

### 2.2 Module Đọc & Bóc Tách Khối Xung Đột (`src-tauri/src/read/conflict.rs`)
Đọc nội dung file xung đột trực tiếp từ working tree và phân tích cú pháp Git conflict marker:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct ConflictHunk {
    pub id: String,                    // "hunk_0", "hunk_1", ...
    pub is_conflict: bool,
    pub content: Option<String>,       // Nội dung code bình thường nếu is_conflict == false
    pub ours: Option<String>,          // Nội dung giữa <<<<<<< và =======
    pub theirs: Option<String>,        // Nội dung giữa ======= và >>>>>>>
    pub base: Option<String>,          // Nội dung giữa ||||||| và ======= (nếu dùng diff3)
    pub ours_label: Option<String>,    // Nhãn sau <<<<<<< (thường là HEAD)
    pub theirs_label: Option<String>,  // Nhãn sau >>>>>>> (tên branch hoặc commit ID)
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct ConflictFileData {
    pub file_path: String,
    pub total_conflicts: usize,
    pub hunks: Vec<ConflictHunk>,
}
```

Hàm trích xuất:
`pub fn get_conflict_file_data<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<ConflictFileData, AppError>`:
- Mở file theo đường dẫn `repo_path.join(file_path)`.
- Duyệt từng dòng để bóc tách:
  - Các dòng bình thường gom vào một `ConflictHunk` (`is_conflict: false`).
  - Gặp `<<<<<<<` bắt đầu thu thập `ours` cho đến `=======` (hoặc `|||||||`).
  - Gặp `=======` thu thập `theirs` cho đến `>>>>>>>`.
  - Kết thúc `>>>>>>>` tạo một `ConflictHunk` (`is_conflict: true`), tăng biến đếm `total_conflicts`.

### 2.3 Module Ghi & Đánh Dấu Giải Quyết (`src-tauri/src/write/conflict.rs`)
Ghi nội dung đã giải quyết và cập nhật Git index:

```rust
pub fn resolve_conflict_file<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    resolved_content: &str,
    auto_stage: bool,
) -> Result<(), AppError> {
    let full_path = repo_path.as_ref().join(file_path);
    std::fs::write(&full_path, resolved_content)?;

    if auto_stage {
        let mut repo = git2::Repository::open(repo_path.as_ref())?;
        let mut index = repo.index()?;
        index.add_path(Path::new(file_path))?;
        index.write()?;
    }

    Ok(())
}
```

### 2.4 Đăng ký IPC Commands & Specta
Tạo lệnh Tauri:
- `get_conflict_file_data(repo_path: String, file_path: String) -> Result<ConflictFileData, AppError>`
- `resolve_conflict_file(app: tauri::AppHandle, repo_path: String, file_path: String, resolved_content: String, auto_stage: Option<bool>) -> Result<(), AppError>`
  - Sau khi ghi, gọi `emit_repo_changed(&app, &repo_path, "resolve_conflict")`.
- Cập nhật `src/ipc/bindings.ts` và `src/ipc/client.ts` kèm browser-mock fallbacks.

---

## 3. Thiết Kế Giao Diện Người Dùng (Frontend 3-Column Resolver)

### 3.1 Mở Rộng Store Quản Lý Màn Hình (`src/store/useViewStore.ts`)
Bổ sung trạng thái:
```typescript
export type ActiveScreen = "history" | "changes" | "conflict";

export interface ViewState {
  activeScreen: ActiveScreen;
  activeConflictFile: string | null;
  setActiveScreen: (screen: ActiveScreen) => void;
  openConflictResolver: (filePath: string) => void;
  closeConflictResolver: () => void;
}
```

### 3.2 Màn Hình `src/components/conflict/ConflictResolverScreen.tsx`
- **Thanh tiêu đề & Công cụ (Sticky Toolbar):**
  - Nút quay lại: `← Quay lại Thay đổi` (`closeConflictResolver()`).
  - Đường dẫn file: Hiển thị nổi bật, ví dụ `src/App.tsx`.
  - Huy hiệu tiến độ: `Xung đột: {resolvedCount}/{totalConflicts} khối`.
  - Bộ nút điều hướng: `◀ Khối trước` và `Khối sau ▶` (dùng `ref.scrollIntoView({ behavior: 'smooth' })`).
  - Thao tác hàng loạt: `Lấy tất cả Của bạn` và `Lấy tất cả Của họ`.
  - Nút chính: `Hoàn tất & Đánh dấu đã giải quyết (Save & Stage)`:
    - Nếu vẫn còn khối chưa giải quyết: Hiển thị modal/hộp thoại xác nhận *"Còn {remaining} khối xung đột chưa chọn. Bạn có chắc muốn lưu?"*.
    - Khi lưu thành công: Quay lại màn hình `changes` và làm mới query repository.
- **Vùng hiển thị 3 cột (3-Column Layout):**
  - Chia làm 3 cột tỉ lệ đều nhau (33% | 34% | 33%), có dải phân cách rõ ràng.
  - **Khối không xung đột (Normal Hunk):**
    - Trải dài cả 3 cột hoặc hiển thị thống nhất với nền xám dịu để giữ ngữ cảnh liền mạch.
  - **Khối xung đột (Conflict Block):**
    - **Cột Trái (Của bạn - Ours):**
      - Header: Tên nhánh hiện tại (ví dụ: `HEAD / main`).
      - Nút bấm: `Lấy bên này (Ours)`.
      - Nền: Xanh lá nhạt (`diff-add-bg`), chữ nổi bật.
    - **Cột Phải (Của họ - Theirs):**
      - Header: Tên nhánh/commit đang gộp (ví dụ: `feature/login`).
      - Nút bấm: `Lấy bên này (Theirs)`.
      - Nền: Xanh dương / tím nhạt.
    - **Cột Giữa (Kết quả - Merged Result):**
      - Header: `KẾT QUẢ GHÉP`.
      - Nút bấm: `Lấy cả hai (Both)` (ghép Ours trước, Theirs sau).
      - Ô soạn thảo (Textarea monospace): Hiển thị kết quả đã chọn hoặc cho phép người dùng gõ sửa mã trực tiếp.

### 3.3 Tích Hợp Vào Màn Hình Thay Đổi (`ChangesScreen.tsx`)
- Danh sách file Unstaged / Conflicted: Các file xung đột được hiển thị ở nhóm riêng `TỆP XUNG ĐỘT (N)` trên đỉnh danh sách file.
- Mỗi file xung đột có icon cảnh báo, huy hiệu đỏ `Conflict`, và nút bấm `Giải quyết...` mở trực tiếp `openConflictResolver(file.path)`.

---

## 4. Kế Hoạch Kiểm Thử (Testing & TDD)

### 4.1 Backend Tests (`src-tauri/tests/m4_conflict_test.rs`)
- Tạo fixture repository có xung đột merge giữa hai branch.
- Test `get_repo_status`: xác nhận file xung đột xuất hiện trong danh sách `conflicted`.
- Test `get_conflict_file_data`: xác nhận bóc tách chính xác các khối normal và conflict, đúng nội dung ours và theirs.
- Test `resolve_conflict_file`: ghi đè nội dung giải quyết, gọi auto-stage, kiểm tra `repo.statuses()` xác nhận file chuyển thành `staged` sạch sẽ và không còn cờ `CONFLICTED`.

### 4.2 Frontend Unit Tests (`src/test/ConflictResolver.test.tsx`)
- Test render giao diện 3 cột với đầy đủ tên nhánh và nội dung các khối xung đột.
- Test click nút "Lấy bên này (Ours)", "Lấy bên này (Theirs)", "Lấy cả hai (Both)".
- Test sửa tay trực tiếp trong ô kết quả cột giữa.
- Test click "Hoàn tất" gọi đúng API `resolveConflictFile` và quay lại màn hình Changes.

---

## 5. Tiêu Chí Thành Công (Definition of Done)
1. Tất cả bài test mới và cũ chạy qua 100% (55+ tests Rust, 106+ tests Vitest).
2. Quy trình build production `cargo check` và `pnpm run build` không có cảnh báo hoặc lỗi.
3. Người dùng có thể hoàn thành toàn bộ chu trình: Gặp conflict khi merge/rebase $\rightarrow$ Xem banner cảnh báo $\rightarrow$ Bấm xem file xung đột $\rightarrow$ Dùng giao diện 3 cột giải quyết $\rightarrow$ Bấm Hoàn tất $\rightarrow$ Bấm Tiếp tục trên Banner và kết thúc merge sạch sẽ mà không cần chạm vào terminal.
