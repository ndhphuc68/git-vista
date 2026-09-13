# Thiết Kế Milestone M2.2: Quản Lý Branch Hoàn Chỉnh & Phím Tắt Toàn Cục

**Ngày:** 2026-09-13  
**Trạng thái:** Đã duyệt thiết kế, sẵn sàng lập kế hoạch triển khai (Implementation Plan)  
**Tài liệu gốc:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md` (Mục 2, 4, 6.1, 6.4, 6.5, 10 - M2)  
**Kế thừa từ:** `docs/superpowers/specs/2026-09-13-m2-1-changes-and-commit-design.md` (Hoàn tất M2)

---

## 1. Mục Tiêu & Phạm Vi (M2.2)

Milestone M2.2 là nửa thứ hai của Milestone M2, bổ sung khả năng thao tác toàn diện với Git branches và phím tắt điều hướng nhanh trên toàn ứng dụng:

* **Quản lý Branch (100% in-process qua libgit2):** Tạo nhánh mới (từ HEAD hoặc commit cụ thể), chuyển nhánh (checkout an toàn), đổi tên nhánh, và xoá nhánh an toàn.
* **Cơ chế An toàn (Mục 6.4):**
  * Tự động tạo backup ref `refs/gitui-backup/delete-branch-<name>-<timestamp>` trước khi xoá bất kỳ branch nào.
  * Cấm xoá nhánh đang được trỏ bởi HEAD.
  * Kiểm tra trạng thái merged; yêu cầu xác nhận bắt buộc nếu xoá nhánh chưa merge.
  * Safe Checkout: cho phép chuyển nhánh khi có thay đổi chưa commit nếu không xung đột file; cảnh báo chi tiết nếu có file xung đột.
* **Tương tác UI trực quan:** Nút tạo nhánh, Context Menu (chuột phải & menu ba chấm `...`), các Modal chuyên dụng (Create, Rename, Delete, Conflict).
* **Phím tắt toàn cục:** Điều hướng màn hình Lịch sử (`Cmd/Ctrl+1`), màn hình Thay đổi (`Cmd/Ctrl+2`), mở tạo nhánh (`Cmd/Ctrl+B`), đóng modal (`Escape`).

---

## 2. Kiến Trúc Backend & IPC Commands (`src-tauri/src/write/branch.rs`)

Toàn bộ thao tác ghi nhánh được thực hiện trong `src-tauri/src/write/branch.rs` và đăng ký typed IPC qua Tauri Specta.

### 2.1 Bảng Lệnh IPC (Tauri Specta)

| Command | Tham số | Kết quả | Trách nhiệm |
|---|---|---|---|
| `create_branch` | `repo_path: String, name: String, target_commit: Option<String>, checkout: bool` | `()` | Tạo nhánh mới từ HEAD hoặc commit chỉ định; tuỳ chọn tự động checkout |
| `checkout_branch` | `repo_path: String, branch_name: String` | `()` | Chuyển sang nhánh chỉ định bằng cơ chế Safe Checkout của Git |
| `rename_branch` | `repo_path: String, old_name: String, new_name: String` | `()` | Đổi tên nhánh local |
| `delete_branch` | `repo_path: String, branch_name: String, force: bool` | `String` (backup ref) | Xoá nhánh an toàn, tạo backup ref, kiểm tra merge |

### 2.2 Chi Tiết Triển Khai Trong Rust

```rust
// src-tauri/src/write/branch.rs

/// Tạo nhánh mới
pub fn create_branch<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    target_commit_id: Option<&str>,
    checkout: bool,
) -> Result<(), AppError>;

/// Chuyển nhánh an toàn (Safe Checkout)
pub fn checkout_branch<P: AsRef<Path>>(
    repo_path: P,
    branch_name: &str,
) -> Result<(), AppError>;

/// Đổi tên nhánh
pub fn rename_branch<P: AsRef<Path>>(
    repo_path: P,
    old_name: &str,
    new_name: &str,
) -> Result<(), AppError>;

/// Xoá nhánh an toàn (trả về tên backup ref đã tạo)
pub fn delete_branch<P: AsRef<Path>>(
    repo_path: P,
    branch_name: &str,
    force: bool,
) -> Result<String, AppError>;
```

#### Quy tắc xử lý:
1. **Validation tên nhánh:** Kiểm tra bằng `git2::Reference::is_valid_name(&format!("refs/heads/{}", name))` trước khi thao tác. Từ chối tên chứa ký tự cấm (`..`, `~`, `^`, `:`, `?`, `*`, `[`, `\`, khoảng trắng).
2. **Safe Checkout:**
   * Sử dụng `git2::build::CheckoutBuilder::new().safe()`.
   * Nếu có xung đột working tree với nhánh đích: bắt lỗi `git2::ErrorCode::Conflict` và trả về `AppError::InvalidOperation(format!("CHECKOUT_CONFLICT: {}", conflicting_paths))`.
   * Cập nhật `repo.set_head(&format!("refs/heads/{}", branch_name))` và checkout tree tương ứng.
3. **Delete Branch Safety:**
   * Nếu `repo.head()?.shorthand() == Some(branch_name)`: trả về `AppError::InvalidOperation("Không thể xoá nhánh đang được chọn (HEAD)".into())`.
   * Kiểm tra merge: `repo.graph_descendant_of(head_oid, branch_oid)` hoặc `head_oid == branch_oid`. Nếu `!is_merged && !force`, trả về `AppError::InvalidOperation("UNMERGED_BRANCH".into())`.
   * Luôn tạo backup ref: `refs/gitui-backup/delete-branch-<name>-<timestamp>` trỏ vào commit OID của nhánh trước khi gọi `branch.delete()`.
4. **Reactive Notification:**
   * Mọi thao tác thành công đều phát event `repo-changed` qua `emit_repo_changed(app, repo_path, action)` để TanStack Query tự động invalidate và re-fetch danh sách branch cùng commit graph.

---

## 3. Giao Diện Người Dùng & Tương Tác React

### 3.1 Nâng Cấp `BranchSidebar.tsx`

* **Nút Tạo Nhánh:** Thêm nút icon `+` ở header `NHÁNH CỤC BỘ`, click mở `CreateBranchModal`.
* **Action Menu (Ba chấm `...`) & Context Menu:**
  * Click vào nút `...` (hiển thị khi hover vào từng hàng nhánh) hoặc click chuột phải vào hàng nhánh sẽ mở menu hành động gồm:
    * **Chuyển tới nhánh này (Checkout):** Ẩn hoặc disable nếu là nhánh HEAD.
    * **Đổi tên... (Rename):** Mở `RenameBranchModal`.
    * **Xoá nhánh... (Delete):** Disable nếu là nhánh HEAD kèm tooltip cảnh báo.
* **Trạng thái Active (HEAD):**
  * Nhánh HEAD có chấm tròn accent nổi bật, nhãn `HEAD` pill tag, và text in đậm.

### 3.2 Các Modal Chuyên Dụng

1. **`CreateBranchModal.tsx`:**
   * Input nhập tên nhánh mới (tự động gợi ý, tự đổi khoảng trắng thành `-`, validate tức thời).
   * Điểm xuất phát: Mặc định HEAD (hoặc OID nếu được truyền từ commit đang chọn).
   * Checkbox: `[x] Chuyển sang nhánh mới sau khi tạo` (mặc định bật).
   * Phím tắt trong modal: `Enter` xác nhận tạo, `Esc` huỷ.
2. **`RenameBranchModal.tsx`:**
   * Input nhập tên mới cho nhánh đang chọn.
   * Nút Huỷ & Đổi tên.
3. **`DeleteBranchModal.tsx`:**
   * Hiển thị thông báo xác nhận xoá nhánh `[tên nhánh]`.
   * Nếu nhánh chưa merge: hiển thị banner cảnh báo nguy hiểm màu vàng/đỏ: *"Nhánh này chứa commit chưa được gộp vào HEAD"*.
   * Ghi chú an toàn: *"Một bản sao lưu sẽ tự động được tạo trong refs/gitui-backup/ để bạn có thể khôi phục trong 30 ngày."*
   * Nút bấm: "Huỷ" và "Xoá nhánh" (hoặc "Vẫn xoá" nếu unmerged).
4. **`CheckoutConflictModal.tsx`:**
   * Hiển thị khi checkout gặp conflict với file dở dang.
   * Liệt kê danh sách file bị xung đột.
   * Nút: "Chuyển sang màn hình Thay đổi" (để commit hoặc discard) và "Đóng".

### 3.3 Phím Tắt Toàn Cục (`useGlobalShortcuts.ts`)

Hook được gắn tại component gốc `App.tsx`:
* `Cmd/Ctrl + 1`: Chuyển sang màn hình Lịch sử (`activeScreen = "history"`).
* `Cmd/Ctrl + 2`: Chuyển sang màn hình Thay đổi (`activeScreen = "changes"`).
* `Cmd/Ctrl + B`: Mở `CreateBranchModal`.
* `Escape`: Đóng menu ngữ cảnh hoặc modal đang mở.

---

## 4. Kế Hoạch Kiểm Thử (Testing Strategy)

### 4.1 Backend Integration Tests (`src-tauri/tests/m2_branch_test.rs`)

Kiểm thử với `TestRepoFixture`:
1. `test_create_branch_and_checkout`: Tạo nhánh mới và kiểm tra HEAD cập nhật khi `checkout = true`.
2. `test_safe_checkout_with_clean_and_dirty_tree`: Chuyển nhánh khi có file sửa đổi không xung đột (thành công) và khi có xung đột (trả về lỗi xung đột).
3. `test_rename_branch`: Đổi tên nhánh và kiểm tra tên mới tồn tại, tên cũ biến mất.
4. `test_delete_branch_merged`: Xoá nhánh đã merge thành công, kiểm tra backup ref được tạo.
5. `test_delete_branch_unmerged`: Xoá nhánh chưa merge mà `force = false` trả về lỗi; khi `force = true` thì xoá thành công và tạo backup ref.
6. `test_delete_head_branch_forbidden`: Cố tình xoá nhánh HEAD trả về lỗi cấm.

### 4.2 Frontend Unit & Integration Tests

1. `src/test/BranchSidebar.test.tsx`:
   * Render danh sách nhánh local và remote.
   * Mở menu context / ba chấm.
   * Kích hoạt mở modal tạo, đổi tên, xoá.
2. `src/test/CreateBranchModal.test.tsx`:
   * Validation tên nhánh (không cho ký tự cấm, không cho rỗng).
   * Gọi đúng lệnh `create_branch`.
3. `src/test/useGlobalShortcuts.test.ts`:
   * Nhấn `Ctrl+1` / `Ctrl+2` đổi màn hình.
   * Nhấn `Ctrl+B` mở modal tạo nhánh.

---

## 5. Tiêu Chuẩn Hoàn Thành (Definition of Done)

* 100% Rust tests trong `cargo test --test m2_branch_test` pass.
* 100% Frontend tests trong `pnpm test` pass.
* TypeScript build (`pnpm build`) không có lỗi.
* Đạt chuẩn WCAG AA ($\ge 4.5:1$ contrast) cho mọi button, modal và menu.
