# Thiết Kế Milestone M3: Remote Operations (Fetch, Pull, Push, Clone, Tiến Độ Thời Gian Thực & Huỷ An Toàn)

**Ngày:** 2026-09-13  
**Trạng thái:** Đã duyệt thiết kế, sẵn sàng lập kế hoạch triển khai (Implementation Plan)  
**Tài liệu gốc:** `docs/superpowers/specs/2026-09-12-visual-git-client-design.md` (Mục 2, 3, 4.1, 4.2, 5.4, 6.1, 8.2, 10 - M3)

---

## 1. Mục Tiêu & Phạm Vi (M3)

Milestone M3 hoàn thiện khả năng làm việc với các máy chủ từ xa (Remote Repositories):
* **Toàn bộ thao tác mạng thực thi 100% qua `git` CLI:** Kế thừa toàn bộ cấu hình SSH agent, credential helper, proxy, và config alias sẵn có trên hệ thống của người dùng.
* **Tiến độ thời gian thực & Huỷ an toàn (Mục 5.4):** Không dùng spinner chặn toàn màn hình; bóc tách thông tin tiến độ từ stream `stderr` (`--progress`) và đẩy về qua event `task-progress`; hỗ trợ huỷ bỏ tác vụ tức thì qua `cancel_task`.
* **Bộ ba thao tác Remote cốt lõi:**
  * **Fetch:** Lấy metadata và ref mới nhất từ remote (`git fetch [remote] --progress --prune`).
  * **Pull:** Lấy và gộp thay đổi (`git pull [remote] [branch] --progress`), tôn trọng cấu hình git của người dùng và hỗ trợ tuỳ chọn repo-level cho `pull.rebase`.
  * **Push:** Đẩy commit lên remote (`git push [remote] [branch] --progress`), tự động cấu hình upstream tracking (`--set-upstream`) cho các nhánh mới tạo.
* **Clone Repository:** Cho phép clone repo từ URL (HTTPS / SSH) vào thư mục chỉ định, hiển thị tiến độ và tự động mở repo sau khi clone thành công.
* **Ahead / Behind Tracking:** Tính toán số commit Ahead và Behind giữa local HEAD và upstream tracking branch thông qua `libgit2` in-process (`graph_ahead_behind`).

---

## 2. Kiến Trúc Backend & CLI Async Subsystem (`src-tauri/src/exec/`)

### 2.1 Quản Lý Tác Vụ CLI & Streaming (`src-tauri/src/exec/mod.rs`)

```rust
pub struct TaskManager {
    // Lưu child process hoặc kill signal theo task_id
    tasks: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
}
```

* **Xử lý Output Stream:**
  * Git CLI gửi tiến độ dạng `\r` trên `stderr` khi có cờ `--progress`.
  * Parser regex/string trích xuất các giai đoạn (e.g. `Counting objects`, `Compressing objects`, `Writing objects`, `Receiving objects`, `Resolving deltas`) và phần trăm $0-100\%$.
  * Phát event Tauri Specta: `TaskProgressPayload { task_id, progress_percent, status_text }`.
* **Cơ chế Huỷ:**
  * Khi người dùng bấm Huỷ trên frontend: `cancel_remote_task(task_id)` đặt cờ huỷ và gửi tín hiệu terminate / kill đến child process.
  * Backend dọn dẹp và trả về thông báo huỷ an toàn.

### 2.2 Danh Sách Lệnh IPC (Tauri Specta)

| Command | Tham số | Kết quả | Trách nhiệm |
|---|---|---|---|
| `fetch_repo` | `repo_path: String, remote: Option<String>, prune: Option<bool>, task_id: String` | `String` (output) | Chạy `git fetch` có progress |
| `pull_repo` | `repo_path: String, remote: Option<String>, branch: Option<String>, rebase: Option<bool>, task_id: String` | `String` (output) | Chạy `git pull` có progress |
| `push_repo` | `repo_path: String, remote: Option<String>, branch: Option<String>, set_upstream: Option<bool>, force: Option<bool>, task_id: String` | `String` (output) | Chạy `git push` có progress |
| `clone_repo` | `url: String, target_dir: String, task_id: String` | `String` (cloned_path) | Chạy `git clone` có progress |
| `cancel_remote_task` | `task_id: String` | `()` | Huỷ tiến trình CLI đang thực thi |
| `set_repo_pull_rebase`| `repo_path: String, rebase: bool` | `()` | Cấu hình `git config branch.<name>.rebase` hoặc `pull.rebase` cục bộ |

### 2.3 Ahead / Behind Calculation (`src-tauri/src/read/branches.rs`)

Mở rộng `BranchItem`:
```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BranchItem {
    pub name: String,
    pub is_head: bool,
    pub target_commit_id: String,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
}
```

Đối với mỗi local branch có upstream:
* Sử dụng `repo.find_reference(&format!("refs/remotes/{}", upstream))` để lấy OID upstream.
* Gọi `repo.graph_ahead_behind(local_oid, upstream_oid) -> Result<(usize, usize), Error>`.
* Gán `ahead = ahead as u32`, `behind = behind as u32`.

### 2.4 Phân Loại & Ánh Xạ Lỗi Thông Minh (Mục 8.2)

Ánh xạ các lỗi phổ biến từ CLI `stderr`:
1. **Xác thực thất bại:** `Authentication failed` hoặc `Permission denied (publickey)` $\rightarrow$ *"Xác thực không thành công. Vui lòng kiểm tra SSH key hoặc thông tin đăng nhập trên máy."*
2. **Push bị từ chối do lệch lịch sử:** `[rejected] (non-fast-forward)` hoặc `fetch first` $\rightarrow$ *"Máy chủ từ xa có các commit mới hơn. Vui lòng Pull trước khi Push."*
3. **Lỗi mạng / Không tìm thấy host:** `Could not resolve host` hoặc `Connection timed out` $\rightarrow$ *"Không thể kết nối tới máy chủ từ xa. Vui lòng kiểm tra kết nối mạng."*
4. **Xung đột khi Pull:** `CONFLICT (content)` hoặc `Automatic merge failed` $\rightarrow$ *"Xung đột khi gộp nhánh từ remote. Vui lòng kiểm tra màn hình Thay đổi."*

---

## 3. Giao Diện Người Dùng & Tương Tác React

### 3.1 Nút Thao Tác Remote trên `RepoHeader.tsx`

Tích hợp trực tiếp vào thanh điều hướng Header:
* **Nút `Fetch` (`⟳ Fetch`):** Kèm tooltip thời điểm fetch gần nhất.
* **Nút `Pull` (`↓ Pull 3`):** 
  * Hiển thị số commit Behind khi `behind > 0`.
  * Disabled hoặc mờ khi `behind == 0` (vẫn có thể click nếu muốn force pull).
* **Nút `Push` (`↑ Push 2`):**
  * Hiển thị số commit Ahead khi `ahead > 0`.
  * Tự động kích hoạt cờ `set_upstream: true` nếu nhánh chưa có upstream.
* Trong khi đang chạy: nút chuyển sang spinner xoay nhỏ và text *"Đang xử lý..."*.

### 3.2 Thanh Tiến Độ Không Chặn (`RemoteProgressBanner.tsx`)

* Hiển thị dạng floating banner gọn gàng ở góc dưới bên phải màn hình khi có `task_id` đang active.
* Nội dung: Icon mạng, Tên thao tác (*Đang Fetch / Pull / Push / Clone...*), Thanh tiến độ phần trăm (`progress_percent %`), và Status text chi tiết (*Receiving objects: 75%*).
* Nút **"Huỷ (Cancel)"**: Cho phép người dùng dừng tác vụ ngay lập tức.
* Không chặn người dùng đọc diff, xem graph hay chuyển đổi các tab màn hình.

### 3.3 Modal Clone Repository (`CloneModal.tsx`)

* Nút **"Clone kho chứa"** trên màn hình [WelcomeScreen.tsx](file:///d:/project-v3/src/components/welcome/WelcomeScreen.tsx).
* Form nhập:
  * URL repository (`https://github.com/...` hoặc `git@github.com:...`).
  * Thư mục đích: Nút Duyệt thư mục (`select_repo_folder`), tự động gợi ý tên thư mục con theo tên repo.
* Trong khi clone: hiển thị thanh tiến độ thực sự và nút Huỷ.
* Sau khi hoàn tất: tự động mở repo vào ứng dụng và lưu vào Recent Repos.

---

## 4. Kế Hoạch Kiểm Thử (Testing Strategy)

### 4.1 Backend Integration Tests (`src-tauri/tests/m3_remote_test.rs`)

Sử dụng `TestRepoFixture` tạo local origin repo tạm thời đóng vai trò "remote bare repo":
1. `test_ahead_behind_calculation`: Tạo commit local, kiểm tra ahead tăng; tạo commit remote và fetch, kiểm tra behind tăng.
2. `test_fetch_command`: Fetch từ remote fixture, kiểm tra refs được cập nhật.
3. `test_push_command_with_set_upstream`: Push nhánh mới lên remote với cờ `set_upstream = true`.
4. `test_pull_command_merge_and_rebase`: Pull các commit mới từ remote (thử nghiệm cả chế độ merge và rebase).
5. `test_clone_command`: Clone từ remote bare repo fixture vào thư mục mới, xác minh repo mới mở được bình thường.
6. `test_cancel_task`: Khởi chạy một tác vụ dài và gọi `cancel_remote_task`, xác minh tiến trình bị dừng.

### 4.2 Frontend Unit & Integration Tests

1. `src/test/RepoHeaderRemote.test.tsx`:
   * Hiển thị đúng số ahead/behind trên nút Push/Pull.
   * Bấm nút Fetch/Pull/Push gọi đúng IPC tương ứng kèm sinh `task_id`.
2. `src/test/RemoteProgressBanner.test.tsx`:
   * Render tiến độ khi nhận event `task-progress`.
   * Bấm Huỷ gọi đúng `cancel_remote_task`.
3. `src/test/CloneModal.test.tsx`:
   * Validation URL hợp lệ.
   * Gọi đúng `clone_repo` và mở repo khi xong.

---

## 5. Tiêu Chuẩn Hoàn Thành (Definition of Done)

* 100% Rust tests trong `cargo test --test m3_remote_test` pass.
* 100% Frontend tests trong `pnpm test` pass.
* TypeScript build (`pnpm build`) không có lỗi.
* Đạt chuẩn WCAG AA ($\ge 4.5:1$ contrast) cho mọi button, banner và modal remote.
