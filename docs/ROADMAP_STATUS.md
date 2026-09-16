# Báo Cáo Tiến Độ Phát Triển GitVista: Phase 1.1, 1.2 & 2.0

> Báo cáo này tổng hợp trạng thái thực tế toàn diện của hệ thống mã nguồn GitVista theo lộ trình đã thống nhất: **Phase 1.1 (Nền tảng cốt lõi)** -> **Phase 1.2 (Quy trình Git chuyên sâu)** -> **Phase 2.0 (Công cụ sức mạnh nâng cao)**.

---

## 📊 Bảng Tổng Quan Tiến Độ

| Giai đoạn | Hạng mục | Trọng số | Trạng thái | Tiến độ |
| :--- | :--- | :---: | :---: | :---: |
| **Phase 1.1** | 1.1.1: Modal Cài đặt & Cấu hình Git | 35% | ✅ Đã hoàn thành | 100% |
| | 1.1.2: Quản lý Thẻ (Tag Management) | 35% | ⏳ Kế tiếp (Sẵn sàng) | 0% |
| | 1.1.3: Cherry-pick & Revert Commit | 30% | 📋 Chờ thực hiện | 0% |
| **Tổng Phase 1.1** | **Nền tảng cốt lõi (Core Essentials)** | **100%** | 🔄 **Đang triển khai** | **35%** |
| | | | | |
| **Phase 1.2** | 1.2.1: Word-level Diff & Bỏ qua khoảng trắng | 35% | 📋 Chờ thực hiện | 0% |
| | 1.2.2: Lịch sử từng file & Git Blame | 35% | 📋 Chờ thực hiện | 0% |
| | 1.2.3: Quản lý Remote & Prune branches | 30% | 📋 Chờ thực hiện | 0% |
| **Tổng Phase 1.2** | **Quy trình Git chuyên sâu (Deep Git Workflows)** | **100%** | 📋 **Chờ Phase 1.1** | **0%** |
| | | | | |
| **Phase 2.0** | 2.0.1: Rebase tương tác trực quan (Interactive Rebase) | 40% | 📋 Chờ thực hiện | 0% |
| | 2.0.2: So sánh 2 Commit / 2 Nhánh bất kỳ | 30% | 📋 Chờ thực hiện | 0% |
| | 2.0.3: Tích hợp GitHub / GitLab Pull Requests | 30% | 📋 Chờ thực hiện | 0% |
| **Tổng Phase 2.0** | **Công cụ sức mạnh nâng cao (Advanced Power Tools)** | **100%** | 📋 **Chờ Phase 1.2** | **0%** |

---

## 🔍 Chi Tiết Từng Giai Đoạn & Hạng Mục

### 1. PHASE 1.1: NỀN TẢNG CỐT LÕI (CORE ESSENTIALS)

#### ✅ 1.1.1: Modal Cài đặt & Cấu hình Git (Settings Modal & Git Configuration) — [HOÀN THÀNH 100%]
- **Rust Backend:**
  - `src-tauri/src/read/config.rs`: Đọc cấu hình `user.name`, `user.email`, `init.defaultBranch`, `pull.rebase` với thuật toán phát hiện scope kế thừa (kế thừa từ Global hay ghi đè tại Local).
  - `src-tauri/src/write/config.rs`: Ghi cấu hình chuẩn vào `~/.gitconfig` (Global) hoặc `.git/config` (Local).
  - `src-tauri/src/commands/config.rs`: Tauri IPC commands `get_git_config` và `set_git_config`.
- **Frontend IPC & Quản lý trạng thái:**
  - Định nghĩa kiểu dữ liệu `ConfigScope`, `GitConfigDto` trong `bindings.ts` và tích hợp IPC trong `client.ts` (có mock dữ liệu khi test browser).
  - `useSettingsStore.ts`: Quản lý trạng thái mở modal, tab đang chọn, theme, locale, mode, colorblind mode.
  - Từ điển song ngữ Anh - Việt đầy đủ tại `vi.ts` và `en.ts`.
- **Giao diện người dùng (UI Components):**
  - `SettingsModal.tsx`: Lớp phủ overlay `fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm` đè kín 100% toàn màn hình (che phủ toàn bộ thanh drawer nhánh và header), layout co giãn tự nhiên không có khoảng trống thừa.
  - `GitProfileTab.tsx`: Bộ chuyển đổi Global/Local, form cập nhật tên, email, nhánh mặc định, huy hiệu kế thừa, thông báo Toast.
  - `AppearanceTab.tsx`: Thẻ chọn Theme (Sáng/Tối/Hệ thống), Ngôn ngữ (Việt/Anh), Chế độ giao diện (Đơn giản/Nâng cao) có mô tả chuẩn xác, Toggle Switch hỗ trợ mù màu mượt mà.
  - `GitBehaviorTab.tsx`: Chọn chiến lược Pull (Merge commit vs Rebase), cấu hình chu kỳ tìm nạp ngầm (Tắt, 5p, 15p).
- **Tích hợp hệ thống:**
  - Phím tắt `Ctrl+,` / `Cmd+,` mở cài đặt toàn cục.
  - Nút cài đặt trên Header (`RepoHeader.tsx`) và màn hình chào mừng (`WelcomeScreen.tsx`).
  - Đăng ký lệnh mở cài đặt trong Command Palette (`Ctrl+K`).
- **Kiểm thử:** 45/45 file test (188/188 test cases) và build production (`pnpm build`) đạt 100%.

---

#### ⏳ 1.1.2: Quản lý Thẻ (Tag Management) — [KẾ TIẾP / READY TO IMPLEMENT]
- **Mục tiêu:** Cho phép người dùng đánh dấu các phiên bản phát hành phần mềm (v1.0.0, release tags) và điều hướng repo theo thẻ.
- **Các phần cần làm:**
  - **Rust Backend:**
    - `src-tauri/src/read/tags.rs`: Đọc danh sách tag chi tiết (tên tag, commit OID mục tiêu, summary commit, phân loại lightweight vs annotated, thông điệp chú thích, tên người gắn tag, thời gian).
    - `src-tauri/src/write/tags.rs`: Tạo tag lightweight, tạo tag annotated với tin nhắn, xoá tag nội bộ (local), xoá tag máy chủ (remote), checkout repo về commit của tag (Detached HEAD).
    - `src-tauri/src/read/graph.rs`: Bổ sung cơ chế bóc tách (`peel_to_commit`) cho các annotated tag để ref badge gắn chính xác vào dòng commit tương ứng trên đồ thị.
    - Expose các Tauri IPC commands qua Specta.
  - **Frontend UI & Sidebar:**
    - Nâng cấp phần "TAGS" trong `BranchSidebar.tsx`: Nút tạo tag nhanh (`+`), hiển thị mã hash commit mục tiêu của tag.
    - Menu ngữ cảnh (Context Menu) chuột phải vào từng tag:
      - *Chuyển sang thẻ này (Checkout Tag / Detached HEAD)*.
      - *Tạo nhánh mới từ thẻ này (Create Branch from Tag)*.
      - *Đẩy thẻ lên máy chủ (Push Tag to Remote)*.
      - *Xoá thẻ (Delete Tag)* kèm hộp thoại xác nhận an toàn.
    - Menu chuột phải vào bất kỳ commit nào trên `CommitGraph`: *Tạo thẻ tại đây (Create Tag here)*.
    - `CreateTagModal.tsx`: Hộp thoại tạo tag với tuỳ chọn Lightweight hoặc Annotated (nhập message).

---

#### 📋 1.1.3: Nhặt & Hoàn tác Commit (Cherry-pick & Revert Commit) — [CHƯA LÀM]
- **Mục tiêu:** Sao chép thay đổi của một commit vào nhánh hiện tại hoặc tạo commit nghịch đảo để huỷ bỏ một commit lỗi.
- **Các phần cần làm:**
  - **Rust Backend:**
    - `src-tauri/src/write/cherry_pick.rs`: Áp dụng `repo.cherrypick` của libgit2 lên commit được chọn. Tự động commit nếu không có xung đột, hoặc kích hoạt trạng thái Conflict Resolver nếu phát hiện đụng độ file.
    - `src-tauri/src/write/revert.rs`: Tạo commit nghịch đảo đảo ngược thay đổi (`repo.revert`).
  - **Frontend UI:**
    - Menu chuột phải trên commit row trong `CommitGraph`: *Cherry-pick commit này*, *Revert commit này*.
    - Hộp thoại cảnh báo xác nhận trước khi thực thi.
    - Toast thông báo kết quả kèm thao tác Undo nhanh nếu khả thi.

---

### 2. PHASE 1.2: QUY TRÌNH GIT CHUYÊN SÂU (DEEP GIT WORKFLOWS)

#### 📋 1.2.1: Word-level Diff & Bỏ qua khoảng trắng (Ignore Whitespace) — [CHƯA LÀM]
- **Mục tiêu:** So sánh diff chi tiết từng từ/ký tự bên trong dòng thay vì chỉ đánh dấu nguyên dòng, và lọc bỏ thay đổi format/tab/space rác.
- **Các phần cần làm:**
  - **Backend:** Thêm cờ `ignore_whitespace` (`git2::DiffOptions::ignore_whitespace`) vào `read/diff.rs`.
  - **Frontend Diff Viewer:**
    - Nút toggle "Bỏ qua khoảng trắng" (Ignore whitespace) trên thanh công cụ của `InteractiveDiffViewer`.
    - Thuật toán highlight word-diff (đổi màu riêng các từ/cụm ký tự thực sự thay đổi trong 1 dòng thêm/xoá).
    - Hỗ trợ xem dạng Split Diff (2 cột song song so sánh trực quan).

#### 📋 1.2.2: Lịch sử từng file & Git Blame (File History & Blame View) — [CHƯA LÀM]
- **Mục tiêu:** Theo dõi nguồn gốc xuất xứ của từng dòng code trong file và lịch sử sửa đổi riêng của từng tệp tin.
- **Các phần cần làm:**
  - **Backend:**
    - `src-tauri/src/read/blame.rs`: Dùng `repo.blame_file` trích xuất commit id, tác giả, ngày tạo cho từng dòng trong file.
    - `src-tauri/src/read/file_history.rs`: Revwalk chỉ duyệt qua các commit có chạm đến đường dẫn file cụ thể.
  - **Frontend UI:**
    - Màn hình/Drawer Git Blame: Xem file với cột lề hiển thị avatar, tên tác giả, ngày sửa của từng dòng.
    - Click vào tác giả dòng code để xem chi tiết commit tương ứng trên đồ thị.
    - Tab xem "Lịch sử tệp tin" (File History) với danh sách các commit đã sửa file đó.

#### 📋 1.2.3: Quản lý Máy chủ từ xa (Remotes Management & Prune) — [CHƯA LÀM]
- **Mục tiêu:** Thêm, sửa, xoá remote repository và đồng bộ dọn rác các nhánh đã xoá trên máy chủ.
- **Các phần cần làm:**
  - **Backend:** Thao tác với `git2::Remote` (Add remote, Rename remote, Remove remote, Set push/fetch URL, Remote Prune).
  - **Frontend UI:**
    - Mục quản lý Remote trong Settings hoặc trên thanh bên Sidebar.
    - Nút "Dọn dẹp nhánh mồ côi" (Prune deleted remote branches) để xoá các nhánh remote không còn tồn tại trên server.

---

### 3. PHASE 2.0: CÔNG CỤ SỨC MẠNH NÂNG CAO (ADVANCED POWER TOOLS)

#### 📋 2.0.1: Rebase tương tác trực quan (Visual Interactive Rebase) — [CHƯA LÀM]
- **Mục tiêu:** Thay thế giao diện dòng lệnh `git rebase -i` phức tạp bằng bảng kéo thả commit trực quan, an toàn.
- **Các phần cần làm:**
  - **Backend:** Engine quản lý chuỗi rebase, ghi đè cây commit theo danh sách hành động (reword, squash, fixup, drop, pick).
  - **Frontend UI:**
    - Bảng danh sách commit với khả năng kéo thả (Drag & Drop) để đổi thứ tự commit.
    - Nút chuyển trạng thái cho từng commit: `Pick` (giữ), `Reword` (sửa commit message), `Squash` (gộp vào commit trước), `Drop` (xoá bỏ commit).
    - Xem trước (Live Preview) nhánh cây sau khi rebase trước khi nhấn nút "Áp dụng Rebase".

#### 📋 2.0.2: So sánh 2 Commit / 2 Nhánh bất kỳ (Compare 2 Commits/Branches) — [CHƯA LÀM]
- **Mục tiêu:** Cho phép chọn bất kỳ 2 điểm mốc nào trong lịch sử repo để xem toàn bộ thay đổi giữa chúng.
- **Các phần cần làm:**
  - **Backend:** `read/compare.rs` tính toán `git diff commitA..commitB` và danh sách commit nằm giữa 2 mốc.
  - **Frontend UI:**
    - Nhấn giữ `Ctrl` / `Cmd` click chọn 2 commit trên `CommitGraph`.
    - Mở giao diện so sánh: Danh sách commit chênh lệch, danh sách file thay đổi tổng hợp và diff tương ứng.

#### 📋 2.0.3: Tích hợp GitHub / GitLab Pull Requests — [CHƯA LÀM]
- **Mục tiêu:** Xem và quản lý Pull Requests trực tiếp trong GitVista mà không cần rời desktop app.
- **Các phần cần làm:**
  - **Cơ chế xác thực:** Lưu trữ Personal Access Token (PAT) an toàn trong cấu hình hệ thống.
  - **API Client:** Gọi GitHub REST/GraphQL API hoặc GitLab API để lấy danh sách PRs mở, trạng thái review, CI checks.
  - **Frontend UI:**
    - Khu vực "Pull Requests" trong Sidebar.
    - Nút "Checkout PR" chỉ với 1 click để tự động fetch nhánh PR về máy và chuyển nhánh làm việc.

---

## 🚀 Kế Hoạch Bước Tiếp Theo

Ngay sau báo cáo này, chúng ta sẽ bắt đầu thực hiện **Sub-project 1.1.2: Quản lý Thẻ (Tag Management)**:
1. Tạo tài liệu thiết kế đặc tả kỹ thuật: `docs/superpowers/specs/2026-09-17-tag-management-design.md`.
2. Tạo kế hoạch triển khai chi tiết: `docs/superpowers/plans/2026-09-17-tag-management.md`.
3. Triển khai backend Rust (`read/tags.rs`, `write/tags.rs`, peel commit) -> IPC Specta -> Frontend UI Sidebar, Graph & Modal -> Kiểm thử 100%.
