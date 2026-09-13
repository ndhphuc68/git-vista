# Thiết Kế Milestone M2.1: Màn Hình Changes, Staging & Commit, Filesystem Watcher

**Ngày:** 2026-09-13  
**Trạng thái:** Đã duyệt thiết kế, sẵn sàng lập kế hoạch triển khai (Implementation Plan)  
**Tài liệu gốc:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md` (Mục 4, 5.2, 5.3, 6.1, 6.2, 6.4, 7.2, 10 - M2)

---

## 1. Mục Tiêu & Phạm Vi (M2.1)

Milestone M2 được chia thành 2 giai đoạn nhằm đảm bảo chất lượng kiểm thử và triển khai:
* **M2.1 (Tài liệu này):** Filesystem Watcher + Status/Diff Working Tree + Staging linh hoạt (file, hunk, dòng) + Commit & Amend an toàn + Màn hình Changes (2 cột).
* **M2.2 (Giai đoạn sau):** Quản lý Branch hoàn chỉnh (tạo, chuyển, đổi tên, xoá branch kèm backup ref) + Phím tắt điều hướng toàn cục.

### Kết quả đạt được sau M2.1:
Người dùng có thể thực hiện trọn vẹn vòng lặp làm việc hằng ngày: chỉnh sửa file bằng bất kỳ editor nào -> app tự cập nhật ngay lập tức -> xem diff thay đổi -> chọn lọc stage theo file, hunk hoặc dòng -> soạn commit message kèm cảnh báo độ dài -> commit hoặc amend mà không cần chạm vào terminal.

---

## 2. Kiến Trúc & Luồng Dữ Liệu

### 2.1 Luồng Dữ Liệu Tự Động (Reactive Loop)

```
[Chỉnh sửa file trên đĩa / Lệnh Git ngoài CLI]
                      │
                      ▼ (lọc bỏ .git/objects, debounce 200ms)
[notify::RepoWatcher (Background Thread Rust)]
                      │
                      ▼ phát event Tauri: `repo-changed`
[App.tsx (Global Event Listener)]
                      │
                      ▼ gọi `queryClient.invalidateQueries()`
[TanStack Query tự động re-fetch `repo_status`, `working_diff`, `commit_graph`]
                      │
                      ▼
[Giao diện tự động re-render — Zero git state trong React]
```

**Nguyên tắc cốt lõi:** Tuyệt đối không lưu trạng thái Git nào trong UI state. Mọi thay đổi trên filesystem hay qua thao tác bấm nút trong UI đều phát event `repo-changed` để TanStack Query đồng bộ lại từ nguồn đĩa thật.

### 2.2 Danh Sách IPC Commands (Tauri Specta)

Tất cả lệnh được định nghĩa kiểu dữ liệu chặt chẽ qua Specta:

| Command | Tham số | Kết quả | Trách nhiệm |
|---|---|---|---|
| `get_repo_status` | `repo_path: String` | `RepoStatusResult` | Lấy danh sách file thay đổi (staged, unstaged, untracked) |
| `get_working_file_diff` | `repo_path, file_path, is_staged: bool` | `FileDiffResult` | Tính diff working tree (Index <-> WT hoặc HEAD <-> Index) |
| `stage_file` | `repo_path, file_path` | `()` | Đưa 1 file vào Git Index |
| `unstage_file` | `repo_path, file_path` | `()` | Bỏ 1 file khỏi Git Index |
| `stage_all` | `repo_path` | `()` | Đưa toàn bộ thay đổi vào Git Index |
| `unstage_all` | `repo_path` | `()` | Bỏ toàn bộ file khỏi Git Index |
| `discard_file_changes` | `repo_path, file_path` | `()` | Khôi phục file về trạng thái Index/HEAD |
| `stage_hunk` | `repo_path, file_path, hunk_index: u32, is_staged: bool` | `()` | Stage hoặc unstage một khối hunk cụ thể |
| `stage_lines` | `repo_path, file_path, hunk_index: u32, line_indices: Vec<u32>, is_staged: bool` | `()` | Stage hoặc unstage các dòng code cụ thể |
| `create_commit` | `repo_path, summary: String, description: Option<String>, amend: bool` | `CommitDetails` | Tạo commit mới hoặc amend HEAD |

---

## 3. Thiết Kế Giao Diện (Layout Phương Án B — 2 Cột)

Giao diện màn hình Changes được tối ưu không gian theo **Phương án B (2 Cột)** giúp vùng xem code Diff có diện tích hiển thị tối đa:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [my-project — master]              [ History (Cmd+1) | Changes (Cmd+2) ]│
├──────────────────────────────┬─────────────────────────────────────────┤
│ CỘT TRÁI (~320px)            │ CỘT PHẢI (1fr)                          │
│                              │                                         │
│ STAGED CHANGES (1)  Unstage  │ src/write/mod.rs              +12 -0    │
│  ✓ src/App.tsx            −  │ [ + Stage Entire File ]                 │
│                              │ ─────────────────────────────────────── │
│ UNSTAGED CHANGES (2)   Stage │ @@ -15,4 +15,10 @@         [Stage Hunk] │
│  ● src/write/mod.rs       +  │  15   pub fn commit(...) {              │
│  ? Cargo.toml             +  │  16+ +    let sig = repo.signature()?;  │
│                              │  17+ +    repo.commit(...)?;            │
│ ──────────────────────────── │  18   }                                 │
│ [ Summary: feat(m2)... 27/72]│                                         │
│ [ Mô tả chi tiết (tuỳ chọn)] │                                         │
│ [x] Amend   [ Commit (1) ]   │                                         │
└──────────────────────────────┴─────────────────────────────────────────┘
```

### 3.1 Điều hướng chuyển màn hình (`RepoHeader.tsx` & `useViewStore.ts`)
* Thanh Header bổ sung 2 nút chuyển đổi màn hình:
  * **History (`Cmd/Ctrl+1`):** Màn hình đồ thị commit & xem commit cũ (M1).
  * **Changes (`Cmd/Ctrl+2`):** Màn hình quản lý thay đổi & commit (M2.1), kèm huy hiệu hiển thị số lượng file thay đổi (ví dụ: `Changes (3)`).

### 3.2 Cột trái (~320px): `StagingFileList.tsx` & `CommitBox.tsx`
* **`StagingFileList.tsx`:**
  * Chia 2 nhóm có thể đóng/mở: **Staged Changes** (icon xanh lá, nút *Unstage All*) và **Changes (Unstaged & Untracked)** (icon vàng, nút *Stage All*).
  * Mỗi file có icon trạng thái rõ ràng (Modified, Added/Untracked, Deleted).
  * Thao tác nhanh trên từng hàng file: nút Stage (`+`), Unstage (`−`), và Discard (`🗑️`).
  * Bấm nút Discard sẽ mở modal xác nhận an toàn: *"Các thay đổi chưa lưu trong file này sẽ bị xoá vĩnh viễn"*.
  * Click chọn file để hiển thị diff tương ứng ở cột phải.
* **`CommitBox.tsx`:**
  * **Summary input:** Ô nhập tiêu đề 1 dòng.
  * **Đếm ký tự:** Bộ đếm `xx/72` (chuyển sang màu vàng cảnh báo khi vượt 72 ký tự).
  * **Description textarea:** Ô nhập mô tả chi tiết nhiều dòng (hỗ trợ markdown text thuần).
  * **Checkbox Amend:**
    * Khi tích chọn, tự động điền lại message của HEAD commit.
    * Hiển thị cảnh báo an toàn về việc tạo backup ref.
  * **Nút Commit:** Tự động kích hoạt khi có file staged (hoặc khi amend), hỗ trợ phím tắt `Cmd/Ctrl+Enter`.

### 3.3 Cột phải (`1fr`): `InteractiveDiffViewer.tsx`
* Hiển thị toàn bộ hunk diff với font monospace (`JetBrains Mono`, `Cascadia Code`, `SF Mono`).
* **Header file:** Tên file, thống kê dòng thay đổi `+X / −Y`, và nút *Stage File* / *Unstage File*.
* **Hunk Action:** Nút *Stage Hunk* hoặc *Unstage Hunk* trên thanh header của mỗi hunk (`@@ -x,y +a,b @@`).
* **Line Action:** Nút hành động nhỏ xuất hiện khi hover vào từng dòng code: *Stage Line* hoặc *Unstage Line*.
* Màu sắc diff tuân thủ design token: `--diff-add-bg`, `--diff-add-text`, `--diff-remove-bg`, `--diff-remove-text` với độ tương phản WCAG AA $\ge 4.5:1$.

---

## 4. Chi Tiết Backend Rust (`src-tauri/src/`)

### 4.1 Module `read/status.rs`
* Sử dụng `git2::Repository::statuses()` với `StatusOptions`:
  - `include_untracked(true)`
  - `recurse_untracked_dirs(true)`
  - `renames_head_to_index(true)`
* Phân chia thành 3 mảng: `staged`, `unstaged`, `untracked`.
* Hàm `get_working_file_diff`:
  - Nếu `is_staged == false`: tính diff giữa `Index` và `WorkingDir` (thay đổi chưa stage).
  - Nếu `is_staged == true`: tính diff giữa `HEAD tree` và `Index` (thay đổi đã stage, xử lý trường hợp unborn HEAD khi repo mới tạo chưa có commit nào).

### 4.2 Module `write/staging.rs`
* 100% in-process qua `libgit2`:
  - `stage_file`: gọi `index.add_path(path)` hoặc `index.remove_path(path)` (nếu file đã bị xoá trên đĩa), sau đó `index.write()`.
  - `unstage_file`: gọi `repo.reset_default(head_obj, &[path])` (hoặc `index.remove_path` nếu chưa có commit đầu).
  - `stage_all`: gọi `index.add_all(["*"], git2::IndexAddOption::DEFAULT, None)`.
  - `unstage_all`: gọi `repo.reset_default(head_obj, &["*"])`.
  - `discard_file_changes`: gọi `repo.checkout_head()` hoặc khôi phục file từ index.
  - `stage_hunk` & `stage_lines`: Trích xuất patch diff của hunk hoặc các dòng chỉ định, sử dụng `git2::Apply` áp dụng trực tiếp vào Index (`git2::ApplyLocation::Index`). Khi unstage, áp dụng patch ngược chiều.

### 4.3 Module `write/commit.rs`
* Lấy `signature` qua `repo.signature()`. Nếu chưa cấu hình `user.name` hoặc `user.email`, trả về lỗi nghiệp vụ rõ ràng: `AppError::GitConfigMissing("Chưa cấu hình Git user.name hoặc user.email")`.
* Ghi Index thành Tree qua `index.write_tree()`.
* **Amend commit:**
  - Gọi `create_backup_ref(repo_path, "amend")` tạo ref `refs/gitui-backup/amend-<timestamp>`.
  - Cập nhật commit HEAD với danh sách parent của commit trước đó.
* **Commit thông thường:**
  - Tạo commit mới trỏ parent vào HEAD hiện tại.
  - Cập nhật HEAD reference đến commit mới vừa tạo.

### 4.4 Module `repo/watcher.rs`
* Sử dụng `notify::RecommendedWatcher` chạy trên Tokio async task.
* **Lọc sự kiện:** Bỏ qua `.git/objects/**`, `.git/index.lock`, và file tạm của OS/IDE.
* **Debounce 200ms:** Tránh phát dồn dập sự kiện khi lưu file hoặc compile.
* **Quản lý vòng đời trong `RepoManager`:** Mỗi khi mở một repo mới, watcher của repo cũ được huỷ sạch sẽ để giải phóng tài nguyên.

---

## 5. An Toàn & Xử Lý Lỗi

1. **Bảo vệ chống mất dữ liệu khi Discard:** Mọi hành động Discard đều bắt buộc có modal xác nhận trước khi thực hiện.
2. **Bảo toàn lịch sử khi Amend:** Luôn tạo ref backup trong `refs/gitui-backup/` để khôi phục trong 30 ngày.
3. **Chống lỗi thiếu Git Config:** Không để crash ứng dụng khi thiếu tên/email, hiển thị thông báo hướng dẫn người dùng.
4. **Không xung đột lock file:** Bỏ qua `.git/index.lock` trong watcher để tránh false alarm khi Git đang thực hiện ghi.

---

## 6. Chiến Lược Kiểm Thử (Testing)

### 6.1 Backend Rust Tests (`src-tauri/tests/`)
* `m2_status_test.rs`: Kiểm tra phân loại trạng thái Modified, Untracked, Deleted, Staged và tính diff working tree.
* `m2_staging_test.rs`: Kiểm tra `stage_file`, `unstage_file`, `stage_all`, `unstage_all`, `stage_hunk`, và `stage_lines`.
* `m2_commit_test.rs`: Kiểm tra tạo commit mới, cập nhật HEAD, kiểm tra backup ref và parent của amend commit.
* `m2_watcher_test.rs`: Kiểm tra ghi file kích hoạt event `repo-changed` sau debounce.

### 6.2 Frontend Vitest Tests (`src/test/`)
* `ChangesScreen.test.tsx`: Kiểm tra chuyển đổi tab History / Changes qua click và phím tắt.
* `StagingFileList.test.tsx`: Kiểm tra render file, gọi lệnh stage/unstage và modal xác nhận discard.
* `CommitBox.test.tsx`: Kiểm tra đếm ký tự, phím tắt `Cmd+Enter`, amend pre-population và disabled state.
* `InteractiveDiffViewer.test.tsx`: Kiểm tra hiển thị hunk và các nút stage hunk/dòng.
