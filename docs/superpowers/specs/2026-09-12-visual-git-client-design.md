# Visual Git Client — Thiết kế v1

**Ngày:** 2026-09-12
**Trạng thái:** Đã duyệt, sẵn sàng lập kế hoạch triển khai

---

## 1. Mục tiêu

Xây dựng một Git client đồ hoạ chạy trên Windows, Linux và macOS với ba yêu cầu cốt lõi: giao diện đẹp, thao tác mượt, và dễ hiểu với cả người mới lẫn dev chuyên nghiệp.

**Người dùng mục tiêu:** kết hợp hai nhóm. Mặc định app hoạt động ở chế độ đơn giản cho người còn e ngại Git; một công tắc trong Settings mở khoá chế độ nâng cao với đầy đủ thuật ngữ và thao tác chuẩn.

**Thành công trông như thế nào:** người dùng hoàn thành trọn vẹn vòng lặp làm việc hằng ngày — bao gồm cả lúc gặp conflict — mà không cần mở terminal.

---

## 2. Phạm vi

### Có trong v1

- Mở repo, danh sách repo gần đây, clone
- Commit graph với lịch sử đầy đủ
- Xem diff của commit và của thay đổi chưa commit
- Stage/unstage theo file, theo hunk, theo từng dòng
- Commit, amend
- Tạo / chuyển / xoá / đổi tên branch
- Fetch, pull, push
- Merge, rebase, stash
- Giải quyết conflict bằng giao diện ba cột
- Undo cho các thao tác ghi
- Command palette và phím tắt đầy đủ
- Light + dark theme, i18n tiếng Việt + tiếng Anh
- Chế độ Simple / Advanced

### Cố ý để lại cho v2

Interactive rebase kéo-thả, blame, bisect, submodule, worktree, tích hợp GitHub/GitLab (PR, issue), Git LFS.

**Lý do:** mỗi hạng mục trên đều có giá trị, nhưng đưa vào v1 sẽ kéo dài gấp đôi thời gian trước khi có sản phẩm dùng được. Ưu tiên là đạt tới trạng thái "dùng được hằng ngày" sớm nhất.

---

## 3. Nền tảng kỹ thuật

| Thành phần | Lựa chọn |
|---|---|
| Khung ứng dụng | Tauri 2 |
| Backend | Rust |
| Frontend | React + TypeScript |
| Server-state | TanStack Query |
| UI-state | Zustand |
| Virtualization | `@tanstack/react-virtual` |
| Đọc Git | `git2-rs` (libgit2) |
| Ghi & mạng | `git` CLI (spawn process) |
| Theo dõi filesystem | `notify` crate |

### Vì sao hybrid libgit2 + git CLI

**Đọc qua libgit2:** status, diff, log, graph, blame chạy trong process, không tốn chi phí spawn, cho phép phân trang và huỷ giữa chừng.

**Ghi và mạng qua `git` CLI:** push, pull, fetch, rebase, merge, hook. Lý do là tương thích. libgit2 xử lý kém hoặc không xử lý credential helper phức tạp, SSH agent, hook, config alias, sparse-checkout. Dùng CLI cho những phần này giúp app thừa hưởng toàn bộ cấu hình Git sẵn có trên máy người dùng, tránh được lỗi kinh điển của GUI client: "app không push được nhưng terminal thì được".

---

## 4. Kiến trúc

### 4.1 Ba tầng

```
┌─ UI (React + TypeScript) ────────────────────────────┐
│  Component thuần, không chứa logic Git               │
│  TanStack Query (server-state) + Zustand (UI-state)  │
└──────────────── Tauri IPC (typed commands) ──────────┘
┌─ Core (Rust) ────────────────────────────────────────┐
│  repo/    mở repo, cache, filesystem watcher         │
│  read/    status, diff, log-graph, blame  → libgit2  │
│  write/   commit, branch, stash            → libgit2 │
│  exec/    push, pull, fetch, rebase, merge → git CLI │
│  events/  phát sự kiện thay đổi về UI                │
└──────────────────────────────────────────────────────┘
```

### 4.2 Ranh giới module

Mỗi module có một trách nhiệm duy nhất và một giao diện typed rõ ràng:

- `read/` **không bao giờ** ghi. Có thể gọi song song, không cần khoá.
- `write/` thay đổi repo qua libgit2, luôn tạo ref backup trước thao tác rủi ro.
- `exec/` là **nơi duy nhất** được phép spawn process. Mọi lệnh CLI đi qua đây, nên chỉ cần một chỗ để xử lý timeout, cancel, và parse lỗi.
- `events/` là nơi duy nhất phát sự kiện tới UI.

Một module có thể hiểu và test được mà không cần đọc nội bộ module khác.

### 4.3 Mô hình command

Mọi thao tác Git là một **command** có tên, tham số typed, và kết quả typed. UI không bao giờ tự ghép chuỗi lệnh Git.

Điều này mang lại ba lợi ích:

1. **Nhật ký thao tác** — hiển thị được cho người dùng "bạn vừa làm gì"
2. **Undo** — mỗi command ghi lại trạng thái trước khi thực thi
3. **Testability** — backend test được hoàn toàn độc lập với UI

### 4.4 Luồng dữ liệu

```
UI gọi command → Rust thực thi → phát event repo-changed
                                        ↓
                      TanStack Query invalidate cache
                                        ↓
                              UI tự vẽ lại
```

**Không có state Git nào sống trong UI.** Đây là quyết định có chủ đích: nó loại bỏ hoàn toàn khả năng giao diện hiển thị lệch với thực tế trên đĩa.

### 4.5 Filesystem watcher

`notify` crate theo dõi `.git/` và working tree, debounce 200ms. Khi người dùng chạy lệnh Git trong terminal, app cập nhật ngay mà không cần bấm refresh.

---

## 5. Hiệu năng

Mục tiêu: repo lớn (ví dụ Linux kernel — 1.3 triệu commit, 80 nghìn file) mở trong dưới một giây và cuộn ở 60fps.

### 5.1 Commit graph

Không bao giờ load toàn bộ lịch sử. Rust giữ một walker libgit2 có trạng thái; UI yêu cầu theo trang (ví dụ commit 0–200), Rust trả về kèm **lane layout đã tính sẵn** — commit nằm ở cột nào, đường nối đi tới đâu. UI chỉ vẽ SVG từ dữ liệu có sẵn, không tính toán.

Danh sách dùng virtualization: chỉ khoảng 30 hàng tồn tại trong DOM bất kể lịch sử dài bao nhiêu.

**Đánh đổi đã chấp nhận:** tính lane layout trong Rust khiến việc thay đổi cách vẽ graph phải sửa code Rust thay vì chỉ sửa frontend. Đây là chi phí cần thiết để đạt hiệu năng ở repo lớn.

### 5.2 Status và diff

`git status` trên repo lớn tốn 100–500ms, nên chạy trên thread riêng và stream kết quả về theo batch — giao diện hiện dần thay vì đứng im.

Diff chỉ tính cho file đang được chọn, không tính trước hàng loạt.

### 5.3 Chiến lược cache

| Dữ liệu | Cache |
|---|---|
| Commit metadata (hash, tác giả, message) | LRU trong Rust, sống theo phiên |
| Diff đã tính | Theo khoá `(commit_hash, file_path)` — bất biến nên cache vĩnh viễn an toàn |
| Status | **Không cache.** Luôn tính lại khi watcher báo thay đổi |

### 5.4 Chống giật giao diện

Mọi lệnh Rust đều async và chạy ngoài main thread. Lệnh nặng (clone, fetch repo lớn, blame file lớn) trả về ngay một `task_id`; tiến độ đẩy về qua event; nút Cancel huỷ thật sự thông qua cancellation token.

Không có spinner chặn toàn màn hình ở bất kỳ đâu.

### 5.5 Ngân sách hiệu năng

Các con số này được đo tự động trong CI, không phải mục tiêu ước lượng:

| Thao tác | Ngân sách |
|---|---|
| Mở repo | < 800ms |
| Khung hình đầu tiên của graph | < 200ms |
| Chuyển branch | < 300ms |
| Phản hồi mọi tương tác | < 100ms |
| Cuộn danh sách | 60fps |

---

## 6. Giao diện

### 6.1 Bố cục chính

```
┌──────────────────────────────────────────────────────────┐
│ [Repo ▾]   ⟳ Fetch  ↓ Pull 3  ↑ Push 2      🔍  ⚙       │
├───────────┬──────────────────────────┬───────────────────┤
│ SIDEBAR   │  GRAPH / DIFF            │  DETAIL           │
│           │                          │                   │
│ Changes 5 │  ●─┐ feat: add login     │  Commit abc123    │
│ ───────── │  │ ●  fix: typo          │  Nguyễn Văn A     │
│ LOCAL     │  ●─┘ merge branch        │  2 giờ trước      │
│  main     │  │                       │                   │
│  ▸feature │  ●   initial             │  3 files changed  │
│ ───────── │                          │   +42 −8          │
│ REMOTE    │                          │                   │
│ STASH 2   │                          │                   │
└───────────┴──────────────────────────┴───────────────────┘
```

Sidebar thu gọn được. Ba cột kéo chỉnh độ rộng; kích thước được nhớ riêng cho từng repo.

### 6.2 Bốn màn hình

**Welcome** — danh sách repo gần đây kèm ảnh mini của graph, nút Clone và Mở thư mục. Hỗ trợ kéo-thả thư mục vào cửa sổ.

**Changes** — màn hình dùng nhiều nhất. Bên trái là danh sách file thay đổi chia nhóm unstaged/staged. Nút Amend chỉ xuất hiện ở Advanced mode (xem mục 6.6). Bên phải là diff của file đang chọn, cho phép stage theo hunk hoặc theo từng dòng bằng cách click vào số dòng. Ô nhập commit message ở dưới, đếm ký tự dòng tiêu đề và cảnh báo nhẹ khi vượt 72 ký tự.

**History** — commit graph kèm diff của commit đang chọn.

**Conflict resolver** — tự động bật khi phát hiện conflict.

### 6.3 Giải quyết conflict

Ba cột: `Của bạn | Kết quả | Của họ`.

Mỗi khối conflict có ba nút hành động: *Lấy bên trái*, *Lấy bên phải*, *Lấy cả hai*. Cột giữa cho phép sửa tay trực tiếp.

Thanh trên cùng hiển thị tiến độ ("Conflict 2/5") kèm nút nhảy tới khối tiếp theo. Khi mọi khối đã giải quyết, nút "Hoàn tất merge" được kích hoạt.

Đây là phần được đầu tư nhiều nhất về thiết kế, vì conflict là tình huống mà giao diện đồ hoạ có giá trị rõ rệt nhất so với terminal.

### 6.4 Undo và an toàn

Mỗi thao tác ghi đều lưu lại trạng thái trước đó. Toast ở góc màn hình: *"Đã tạo commit — Hoàn tác"*, tồn tại 10 giây.

Thao tác nguy hiểm luôn có hộp thoại xác nhận mô tả hậu quả bằng ngôn ngữ đời thường, ví dụ: *"3 commit sẽ biến mất khỏi nhánh này. Vẫn lấy lại được từ reflog trong 30 ngày."*

**Danh sách thao tác bắt buộc xác nhận:** force push, hard reset, xoá branch chưa merge, discard changes, xoá stash, clean untracked files.

Trước mỗi thao tác ghi rủi ro, backend tạo một ref backup trong `refs/gitui-backup/` để luôn có đường khôi phục. Ref backup đặt tên theo `<thao-tác>-<timestamp>` và tự động dọn sau 30 ngày, khớp với thời hạn mặc định của reflog.

### 6.5 Bàn phím

| Phím | Hành động |
|---|---|
| `Cmd/Ctrl+K` | Command palette — mọi lệnh đều tìm được ở đây |
| `Cmd/Ctrl+1..4` | Chuyển giữa bốn màn hình |
| `Space` | Stage/unstage file đang chọn |
| `Enter` | Commit |

Mọi lệnh đều có phím tắt, và phím tắt luôn hiển thị trong menu.

### 6.6 Simple và Advanced

**Simple mode** ẩn: rebase, cherry-pick, reflog, force push, amend. Dùng từ ngữ đời thường — "Lấy thay đổi mới" thay cho Pull, "Gửi lên" thay cho Push.

**Advanced mode** hiện đầy đủ tính năng với thuật ngữ Git chuẩn. Trong Advanced vẫn áp dụng progressive disclosure: tính năng ít dùng nằm sau menu phụ hoặc context menu để giao diện không bị rối.

Công tắc nằm trong Settings, và được hỏi một lần ở màn hình chào đầu tiên.

---

## 7. Hệ thống thiết kế

Phong cách: macOS native-ish — trung tính ấm, bo góc mềm, vibrancy.

### 7.1 Design token

Toàn bộ màu, khoảng cách, bo góc được khai báo thành CSS custom properties ở một nơi duy nhất. Light và dark là hai bộ giá trị của cùng bộ token. Không hardcode màu trong component.

### 7.2 Bảng màu

| Vai trò | Light | Dark |
|---|---|---|
| Nền cửa sổ | `#F5F3F1` | `#1C1B1A` |
| Bề mặt nổi | `#FFFFFF` | `#252423` |
| Chữ chính | `#1A1918` | `#EDEBE9` |
| Chữ phụ | `#6B6764` | `#98938E` |
| Accent | `#2F6FEB` | `#4D8DFF` |
| Diff thêm | `#DAFBE1` | `#12261E` |
| Diff xoá | `#FFEBE9` | `#2D1416` |

Màu diff phải đạt tương phản tối thiểu 4.5:1 với chữ ở cả hai theme, kiểm tra bằng script tự động trong CI.

Có chế độ hỗ trợ mù màu, đổi cặp xanh lá / đỏ sang xanh dương / cam.

### 7.3 Vibrancy theo nền tảng

| OS | Xử lý |
|---|---|
| macOS | Vibrancy thật của hệ thống qua Tauri |
| Windows 11 | Mica hoặc Acrylic |
| Linux | **Nền đặc.** Blur không được đảm bảo trên mọi compositor |

Fallback nền đặc trên Linux là quyết định có chủ đích: giao diện phải đẹp cả khi không có hiệu ứng blur.

### 7.4 Typography

**Giao diện:** font hệ thống — `-apple-system` / `Segoe UI Variable` / `Inter`.

**Code và diff:** `SF Mono` / `Cascadia Code` / `JetBrains Mono`.

**Thang cỡ chữ:** 11 / 12 / 13 / 15 / 17 / 22px. Cỡ nền là 13px theo chuẩn ứng dụng desktop, không dùng 16px theo thói quen web.

### 7.5 Chuyển động

| Loại | Thời lượng |
|---|---|
| Hover, focus | 120ms |
| Panel trượt, mở dropdown | 200ms |

Easing: `cubic-bezier(0.32, 0.72, 0, 1)` — đường cong đặc trưng của macOS, tăng tốc nhanh và dừng mềm.

**Quy tắc:** không animation nào vượt 300ms. Không có hiệu ứng thuần trang trí — mỗi chuyển động phải giải thích được điều gì vừa di chuyển đi đâu.

Tôn trọng `prefers-reduced-motion`: tắt toàn bộ chuyển động, chỉ giữ fade.

### 7.6 Trạng thái rỗng và loading

Dùng skeleton có hình dạng khớp với nội dung sắp xuất hiện, không dùng spinner xoay.

Màn hình rỗng (chưa có thay đổi, branch sạch) có minh hoạ nhẹ và gợi ý hành động tiếp theo.

### 7.7 Khả năng tiếp cận

Điều hướng bàn phím đầy đủ, focus ring rõ ràng, nhãn ARIA cho screen reader, vùng click tối thiểu 28px. Đây là yêu cầu bắt buộc của v1, không phải hạng mục bổ sung.

---

## 8. Xử lý lỗi

### 8.1 Phân loại

| Loại | Ví dụ | Cách xử lý |
|---|---|---|
| Người dùng sửa được | Xác thực thất bại, conflict khi pull, working tree bẩn khi switch branch | Hộp thoại mô tả vấn đề kèm **nút hành động sẵn** — "Stash rồi chuyển", "Mở cấu hình SSH" |
| Tạm thời | Mất mạng khi fetch, remote timeout | Toast kèm nút "Thử lại", không mất trạng thái đang làm |
| Git dở dang | App tắt giữa lúc rebase hoặc merge | Khi mở lại hiện banner: *"Đang trong quá trình rebase — Tiếp tục / Huỷ bỏ"* |
| Lỗi lập trình | Panic trong Rust, parse sai output CLI | Không được làm sập app. Ghi log ra file, hiện toast kèm nút copy chi tiết |

### 8.2 Nguyên tắc thông báo

Không hiển thị raw stderr của Git cho người dùng ở Simple mode. Mỗi lỗi Git phổ biến được ánh xạ sang một thông điệp bằng ngôn ngữ đời thường kèm gợi ý hành động.

Luôn có nút "Xem chi tiết kỹ thuật" để mở output gốc — người dùng Advanced cần nó.

---

## 9. Chiến lược test

### 9.1 Ba tầng

**Tầng 1 — Rust unit và integration (khoảng 70% công sức test).**
Mỗi test tạo một repo tạm thật từ fixture, chạy command, kiểm tra trạng thái Git sau đó. Đây là nơi phần lớn bug thực sự nằm.

Bộ fixture bắt buộc có: repo có conflict, repo đang rebase dở, repo detached HEAD, repo có submodule, repo 10 nghìn commit để đo hiệu năng.

**Tầng 2 — Frontend component test (Vitest + Testing Library).**
Test logic giao diện với backend mock: stage hunk có gọi đúng command không, danh sách có render đúng không.

**Tầng 3 — E2E (WebdriverIO + tauri-driver).**
Chỉ 5–8 kịch bản xương sống, ví dụ: mở repo → sửa file → stage → commit → push. Chạy trên CI cả ba OS. Giữ số lượng nhỏ vì tầng này chậm và dễ vỡ.

### 9.2 Benchmark là test

Có suite đo các ngân sách ở mục 5.5, chạy trong CI trên hai repo mẫu cố định: một repo nhỏ khoảng 500 commit và một repo lớn khoảng 100 nghìn commit sinh ra từ script fixture, để kết quả đo ổn định giữa các lần chạy. Nếu mở repo chậm hơn 800ms thì CI báo đỏ.

Đây là cơ chế duy nhất giữ được yêu cầu "mượt" xuyên suốt nhiều tháng phát triển.

### 9.3 CI

GitHub Actions build và test trên Windows, Ubuntu, macOS (cả Intel và Apple Silicon) ở mỗi pull request.

---

## 10. Lộ trình

Mỗi mốc cho ra một ứng dụng chạy được. Không có mốc nào thuần hạ tầng.

| Mốc | Thời gian | Nội dung | Kết quả |
|---|---|---|---|
| **M0** | Tuần 1 | Dựng Tauri 2 + React + TS, design token light/dark, i18n vi/en, CI ba OS, khung IPC typed, bộ fixture repo test | App mở ra cửa sổ trống nhưng đã đúng theme và đẹp |
| **M1** | Tuần 2–3 | Mở repo, sidebar branch, commit graph có lane layout và virtualization, xem diff của commit | Một Git viewer dùng được thật |
| **M2** | Tuần 4–5 | Màn hình Changes, stage/unstage theo file/hunk/dòng, commit, amend, quản lý branch, filesystem watcher | Commit được từ app, không cần terminal |
| **M3** | Tuần 6 | Fetch, pull, push qua CLI, tiến độ và cancel, xác thực SSH agent và credential helper, clone | Làm việc trọn vẹn với remote |
| **M4** | Tuần 7–8 | Merge, rebase, stash, conflict resolver ba cột, phát hiện và tiếp tục thao tác dở dang | Đóng đủ phạm vi v1 |
| **M5** | Tuần 9–10 | Undo và toast, command palette, phím tắt đầy đủ, ánh xạ thông điệp lỗi, Simple/Advanced toggle, benchmark CI, đóng gói `.msi` `.dmg` `.AppImage` `.deb`, auto-update | Sẵn sàng phát hành |

Tổng khoảng 10 tuần cho một người làm toàn thời gian. Mỗi mốc sẽ có kế hoạch triển khai riêng khi tới lượt.

---

## 11. Rủi ro

**Rủi ro lớn nhất: khác biệt WebView giữa ba hệ điều hành.** macOS và Linux dùng WebKit, Windows dùng WebView2. Khác biệt có thể làm vỡ layout hoặc hiệu ứng vibrancy.

**Giảm thiểu:** build và test trên cả ba OS ngay từ M0, không để tới cuối dự án mới phát hiện.

**Rủi ro thứ hai: hiệu năng suy giảm dần theo thời gian.** Một app mượt ở tuần 2 có thể chậm ở tuần 9 sau hàng trăm thay đổi.

**Giảm thiểu:** benchmark chạy trong CI với ngân sách cứng, làm CI đỏ khi vượt ngưỡng.
