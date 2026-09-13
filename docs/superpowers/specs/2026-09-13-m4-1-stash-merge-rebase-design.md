# Thiết Kế Milestone M4.1: Quản Lý Stash, Thao Tác Merge / Rebase Cơ Bản & Phát Hiện Trạng Thái Dở Dang

**Ngày:** 2026-09-13  
**Trạng thái:** Đã duyệt thiết kế, sẵn sàng lập kế hoạch triển khai (Implementation Plan)  
**Tài liệu gốc:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md` (Mục 2, 3, 4.1, 4.2, 6.1, 6.4, 8.1, 10 - M4)

---

## 1. Mục Tiêu & Phạm Vi (M4.1)

Milestone M4.1 tập trung vào ba trụ cột nghiệp vụ thiết yếu của Git hằng ngày:
1. **Quản lý Stash toàn diện:**
   - Cho phép lưu nhanh các thay đổi đang làm dở (bao gồm tuỳ chọn untracked files).
   - Danh sách Stash hiển thị trực quan trên Sidebar với số lượng và thông tin thời gian.
   - Trải nghiệm xem trước: Bấm vào Stash để xem danh sách file và Diff các thay đổi trước khi quyết định.
   - Thao tác tường minh với chú thích rõ ràng: **Apply** (Áp dụng & giữ lại), **Pop** (Áp dụng & xoá), **Drop** (Xoá bỏ kèm xác nhận).
   - Tích hợp vào `CheckoutConflictModal`: Cho phép **"Stash rồi chuyển nhánh"** chỉ với 1 click khi bị chặn chuyển nhánh do working tree bẩn.
2. **Thao tác Merge & Rebase cơ bản:**
   - Thực thi thông qua `git CLI` trong module `exec/` để đảm bảo xử lý đầy đủ các cấu hình hook và config git của người dùng.
   - Khởi chạy trực quan từ Sidebar hoặc Context Menu nhánh.
   - Hộp thoại xác nhận an toàn (Modal): Thể hiện rõ chiều nhánh (Nguồn $\rightarrow$ Đích), kiểm tra working tree (cảnh báo nếu còn file chưa commit/stash), và tuỳ chọn chế độ (Fast-forward hoặc Tạo merge commit `--no-ff`).
3. **Phát Hiện & Kiểm Soát Trạng Thái Dở Dang (In-progress Operations):**
   - Backend phát hiện trạng thái repo theo thời gian thực qua `libgit2::Repository::state()` (`Clean`, `Merge`, `Rebase`, `CherryPick`, v.v.).
   - Hiển thị Banner cảnh báo cố định dưới Header khi repo đang ở giữa quá trình Merge hoặc Rebase dở dang (đặc biệt khi xảy ra conflict).
   - Cung cấp hai hành động dứt khoát: **Huỷ bỏ (Abort)** an toàn 100% đưa repo về nguyên trạng, hoặc **Tiếp tục (Continue)** sau khi đã giải quyết xong xung đột.

---

## 2. Kiến Trúc Backend Rust & Danh Sách Lệnh IPC

### 2.1 Module Stash (`src-tauri/src/write/stash.rs`)

Sử dụng `libgit2` in-process để đọc/ghi stash nhanh chóng và an toàn:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct StashItem {
    pub index: usize,
    pub message: String,
    pub commit_id: String,
    pub created_at: i64,
}
```

**Các hàm xử lý cốt lõi:**
- `get_stashes(repo_path: &str) -> Result<Vec<StashItem>, String>`:
  Sử dụng `repo.stash_foreach(...)` để thu thập danh sách stash theo thứ tự từ `stash@{0}` trở đi, trích xuất OID commit và message.
- `save_stash(repo_path: &str, message: Option<String>, include_untracked: bool) -> Result<String, String>`:
  Tạo chữ ký commit `signature` từ cấu hình Git của người dùng. Sử dụng cờ `StashFlags::INCLUDE_UNTRACKED` nếu được chọn. Trả về OID commit của stash mới tạo.
- `apply_stash(repo_path: &str, index: usize) -> Result<(), String>`:
  Gọi `repo.stash_apply(index, None)`. Nếu có conflict trong working directory, trả về lỗi rõ ràng để UI hiển thị hướng dẫn.
- `pop_stash(repo_path: &str, index: usize) -> Result<(), String>`:
  Gọi `repo.stash_pop(index, None)`.
- `drop_stash(repo_path: &str, index: usize) -> Result<(), String>`:
  Gọi `repo.stash_drop(index)`.

*Tái sử dụng Diff:* Do mỗi mục stash trong Git thực chất là một Commit OID, UI có thể tái sử dụng ngay lệnh IPC `get_commit_diff(repo_path, stash_commit_id)` để hiển thị cây file và diff của stash mà không cần viết thêm API diff riêng.

### 2.2 Module Merge & Rebase (`src-tauri/src/exec/merge.rs` & `rebase.rs`)

Thực thi qua `git CLI` trong module `exec/`:

- `merge_branch(repo_path: &str, target_branch: &str, no_ff: bool) -> Result<MergeResult, String>`:
  - Lệnh CLI: `git merge <target_branch>` (hoặc bổ sung `--no-ff`).
  - Phân tích mã thoát (exit code) và stdout/stderr:
    - Nếu thành công: Trả về trạng thái `Merged` hoặc `FastForward`.
    - Nếu phát sinh xung đột (conflict): Trả về `Conflict` kèm danh sách file xung đột. Repo chuyển sang trạng thái `RepositoryState::Merge`.
- `rebase_branch(repo_path: &str, upstream_branch: &str) -> Result<RebaseResult, String>`:
  - Lệnh CLI: `git rebase <upstream_branch>`.
  - Nếu thành công: Trả về `Success`.
  - Nếu có conflict: Trả về `Conflict`. Repo chuyển sang trạng thái `RepositoryState::Rebase`.
- `abort_in_progress(repo_path: &str, operation: &str) -> Result<(), String>`:
  - Dựa vào `operation` ("merge" hoặc "rebase"): Chạy `git merge --abort` hoặc `git rebase --abort`.
  - Đưa repo trở về trạng thái trước khi thực hiện thao tác.
- `continue_in_progress(repo_path: &str, operation: &str) -> Result<(), String>`:
  - Chạy `git merge --continue` hoặc `git rebase --continue`.

### 2.3 Phát Hiện Trạng Thái Repo (`src-tauri/src/read/state.rs`)

Hàm truy vấn trạng thái repo chạy in-process siêu nhẹ:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RepoStateInfo {
    pub state: String,           // "clean", "merge", "rebase", "cherry_pick", "revert"
    pub is_in_progress: bool,    // true nếu state != "clean"
    pub head_name: String,       // Nhánh hiện tại
    pub target_name: Option<String>, // Nhánh đang merge hoặc rebase vào
    pub conflict_count: usize,   // Số file đang ở trạng thái Conflicted
}
```

- Sử dụng `repo.state()` của `libgit2`:
  - `git2::RepositoryState::Clean` $\rightarrow$ "clean"
  - `git2::RepositoryState::Merge` $\rightarrow$ "merge"
  - `git2::RepositoryState::Rebase` | `RebaseInteractive` | `RebaseMerge` $\rightarrow$ "rebase"
- Đếm số lượng file conflict bằng cách quét `repo.statuses(Some(&mut StatusOptions::new().include_untracked(false)))` tìm các file có cờ `git2::Status::CONFLICTED`.

---

## 3. Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (Frontend UI/UX)

### 3.1 Cập Nhật Sidebar: Mục STASH

Trong `src/components/sidebar/BranchSidebar.tsx`:
- Bổ sung khối collapsible `STASH (N)` bên dưới Remote branches.
- Mỗi hàng Stash hiển thị:
  - Tên/index: `stash@{0}`.
  - Message: Tóm tắt mô tả (hoặc "WIP on branch...").
  - Nút tác vụ nhanh:
    - **Áp dụng (Apply)**: Nút thao tác nhanh.
    - **Menu 3 chấm**: Áp dụng & xoá (Pop), Xoá stash (Drop - có modal xác nhận).
- Khi nhấp vào một dòng Stash:
  - App chuyển sang chế độ xem Stash Diff (tương tự như chọn commit trên History): hiển thị danh sách các file thay đổi và vùng Diff chi tiết kèm banner chứa các nút thao tác Apply / Pop / Drop trực tiếp.

### 3.2 Modal Tạo Stash & Nút Stash trên Màn Hình Changes

- Trên màn hình `ChangesScreen.tsx`: Bổ sung nút **"Lưu tạm (Stash)"** ở cạnh tiêu đề Unstaged Changes hoặc bên cạnh nút Commit.
- Bật `CreateStashModal`:
  - Input: *Thông điệp mô tả* (placeholder: `WIP: [Tên nhánh] - [Thời gian]`).
  - Checkbox: *Lưu cả các file chưa theo dõi (Include untracked files)*.
  - Nút *Lưu tạm (Stash)*: Gọi `save_stash`, sau đó tự động reload repo status & stashes.

### 3.3 Tích Hợp Vào `CheckoutConflictModal`

Cập nhật `CheckoutConflictModal.tsx`:
- Bổ sung nút hành động chính: **"Lưu tạm (Stash) rồi chuyển nhánh"**.
- Khi bấm: App tự động gọi `save_stash("Tự động lưu trước khi chuyển sang " + targetBranch, true)`, sau đó thực hiện `checkoutBranch(targetBranch)`.
- Giúp dev mới giải quyết ngay tình huống khó xử chỉ với 1 click duy nhất.

### 3.4 Modal Xác Nhận Merge & Rebase

- Thêm hai modal: `MergeBranchModal.tsx` và `RebaseBranchModal.tsx`.
- Giao diện `MergeBranchModal`:
  - Thông tin trực quan: Nhánh hiện tại $\leftarrow$ Nhánh được gộp (Target Branch).
  - Tóm tắt số commit sẽ được gộp vào.
  - Tuỳ chọn:
    - *Tự động (Fast-forward nếu có thể)* (mặc định).
    - *Luôn tạo commit gộp mới (--no-ff)*.
  - Cảnh báo: Nếu repo có uncommitted changes, hiển thị cảnh báo yêu cầu commit hoặc Stash trước khi tiếp tục.
- Giao diện `RebaseBranchModal`:
  - Thông tin cảnh báo hậu quả dễ hiểu: *"Các commit của nhánh hiện tại sẽ được áp dụng lại trên đỉnh của nhánh [Upstream]. Lịch sử nhánh cục bộ sẽ được viết lại."*
  - Yêu cầu working tree sạch 100%.

### 3.5 Banner Trạng Thái Dở Dang (In-progress Operation Banner)

- Component `src/components/banner/InProgressOperationBanner.tsx` hiển thị ở vị trí trên cùng của nội dung (dưới `RepoHeader`):
  - Màu nền: Cảnh báo dịu (Tone vàng/cam nhẹ trong dark/light theme).
  - Nội dung:
    - Biểu tượng cảnh báo `GitMerge` / `RotateCw`.
    - Thông điệp: *"Đang trong quá trình [Merge / Rebase] nhánh '{target_name}'."*
    - Nếu có xung đột: Hiển thị tag màu đỏ: *"{conflict_count} file bị xung đột"*.
  - Các nút hành động:
    - **Huỷ bỏ (Abort)**: Nút viền đỏ, bấm vào sẽ chạy `abort_in_progress`, hiển thị toast *"Đã huỷ bỏ thao tác và đưa nhánh về trạng thái ban đầu"*.
    - **Xem file xung đột**: Chuyển đến màn hình *Thay đổi* (nơi các file conflict được highlight).
    - **Tiếp tục (Continue)**: Nút màu xanh/accent, chỉ kích hoạt khi `conflict_count === 0` (đã giải quyết xong).

---

## 4. Danh Sách Lệnh IPC Tauri Mới (Specta Types)

| Tên Command | Tham số | Kết quả | Trách nhiệm |
|---|---|---|---|
| `get_stashes` | `repo_path: String` | `Vec<StashItem>` | Lấy danh sách toàn bộ stash |
| `save_stash` | `repo_path: String, message: Option<String>, include_untracked: bool` | `String` (commit_id) | Lưu thay đổi vào stash |
| `apply_stash` | `repo_path: String, index: usize` | `()` | Áp dụng stash vào working tree |
| `pop_stash` | `repo_path: String, index: usize` | `()` | Áp dụng và xoá stash |
| `drop_stash` | `repo_path: String, index: usize` | `()` | Xoá bỏ một stash |
| `merge_branch` | `repo_path: String, target_branch: String, no_ff: bool` | `MergeResponse` | Chạy lệnh `git merge` qua CLI |
| `rebase_branch` | `repo_path: String, upstream_branch: String` | `RebaseResponse` | Chạy lệnh `git rebase` qua CLI |
| `get_repo_state` | `repo_path: String` | `RepoStateInfo` | Đọc `repo.state()` và đếm conflict |
| `abort_in_progress` | `repo_path: String, operation: String` | `()` | Chạy `git merge/rebase --abort` |
| `continue_in_progress` | `repo_path: String, operation: String` | `()` | Chạy `git merge/rebase --continue` |

---

## 5. Chiến Lược Kiểm Thử (Testing Strategy)

### 5.1 Backend Integration Tests (Rust)
- `tests/test_stash.rs`:
  - Kiểm tra tạo stash khi có modified file & untracked file.
  - Kiểm tra `get_stashes` trả về đúng số lượng và message.
  - Kiểm tra `apply_stash`, `pop_stash`, `drop_stash`.
- `tests/test_merge_rebase.rs`:
  - Test merge fast-forward thành công giữa 2 nhánh.
  - Test merge tạo merge commit (`--no-ff`).
  - Test merge có conflict: Kiểm tra `get_repo_state` trả về `state == "merge"`, `conflict_count > 0`.
  - Test `abort_in_progress("merge")`: Kiểm tra trạng thái quay về `state == "clean"`.
  - Test rebase thành công và rebase có conflict kèm abort.

### 5.2 Frontend Unit / Component Tests (Vitest)
- Test `BranchSidebar`: Render mục STASH, hiển thị đúng số lượng stash, nút Apply/Pop/Drop trigger đúng hàm IPC.
- Test `CreateStashModal`: Nhập message, toggle include untracked, gọi đúng `save_stash`.
- Test `CheckoutConflictModal`: Nút "Stash rồi chuyển" gọi đúng chuỗi lệnh và reload.
- Test `MergeBranchModal` & `RebaseBranchModal`: Hiển thị đúng thông tin nhánh, gọi đúng lệnh merge/rebase.
- Test `InProgressOperationBanner`: Hiển thị đúng khi `is_in_progress = true`, bấm Abort gọi đúng `abort_in_progress`.
