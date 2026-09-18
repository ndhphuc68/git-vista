# Thiết Kế: Trang Web Giới Thiệu & Tải Ứng Dụng GitVista (Landing Page)

**Ngày:** 2026-09-18  
**Trạng thái:** Chờ duyệt kế hoạch triển khai  
**Tham chiếu:** [README.md](../../../README.md), [Git Extensions Website](https://gitextensions.github.io/)

---

## 1. Mục Tiêu

Xây dựng trang web giới thiệu chính thức (Landing Page / Product Website) cho ứng dụng **GitVista** để triển khai trên GitHub Pages (`https://ndhphuc68.github.io/git-vista-/`), tương tự trang của [Git Extensions](https://gitextensions.github.io/) nhưng mang phong cách hiện đại, tinh gọn và tối ưu trải nghiệm cho lập trình viên:

1. **Hiển thị sản phẩm & Nhận diện thương hiệu:** Hero section ấn tượng với logo GitVista, khẩu hiệu tốc độ & an toàn, và khung mockup đồ thị commit trực quan.
2. **Hỗ trợ Song ngữ tức thì (Bilingual EN / VI):** Mặc định tiếng Anh chuẩn quốc tế, hỗ trợ chuyển đổi mượt sang tiếng Việt chuẩn hóa theo `README.md` mà không cần tải lại trang.
3. **Tải về thông minh (Smart Platform Download):** Tự động phát hiện hệ điều hành của người dùng (Windows / macOS / Linux) để hiển thị nút tải phù hợp nhất, kèm bảng tải về đầy đủ các định dạng (`.exe`, `.msi`, `.dmg`, `.deb`, `.AppImage`).
4. **Trưng bày tính năng & Phím tắt:** 6 khối tính năng cốt lõi (Commit Graph, Visual Rebase, Undo 10s, Multi-Tab, Word Diff, Conflict Resolver) và bảng tra cứu phím tắt tương tác.
5. **Triển khai tự động (GitHub Actions CI/CD):** Tự động xuất bản lên GitHub Pages khi cập nhật mã nguồn trên nhánh `main`.

---

## 2. Kiến Trúc & Cấu Trúc Thư Mục

Trang web được xây dựng theo kiến trúc **Static Single-Page Application (SPA)** thuần túy, 0 phụ thuộc nặng, thời gian tải trang < 50ms và không cần bước build Node.js phức tạp trên CI.

### Cấu trúc thư mục (`website/`):

```
website/
├── index.html              # Cấu trúc HTML5 ngữ nghĩa, thẻ SEO, OpenGraph, Favicon
├── style.css               # Bố cục, typography, hiệu ứng gradient/glow Dark Mode
├── i18n.js                 # Từ điển dữ liệu song ngữ chuẩn EN và VI
├── app.js                  # Logic đổi ngôn ngữ, tự nhận diện OS, hiệu ứng tương tác
└── assets/
    └── app-icon.png        # Icon ứng dụng GitVista (sao chép từ app-icon.png gốc)
```

---

## 3. Chi Tiết Các Phân Vùng Giao Diện (Layout Sections)

### 3.1 Header / Thanh Điều Hướng (Sticky Header)
- **Logo & Thương hiệu:** Icon GitVista + Tên `GitVista` + nhãn phiên bản `v0.1.0`.
- **Menu điều hướng:**
  - *Features* (Tính năng)
  - *Downloads* (Tải về)
  - *Shortcuts* (Phím tắt)
  - *Documentation* (Tài liệu)
- **Nút chuyển đổi ngôn ngữ (Language Toggle):**
  - Chuyển đổi giữa `🇬🇧 English` và `🇻🇳 Tiếng Việt`.
  - Lưu cấu hình vào `localStorage.getItem('gitvista_lang')`.
- **Hành động nhanh (Quick Action):** Nút "View on GitHub" kèm biểu tượng sao và link đến repository `ndhphuc68/git-vista-`.

### 3.2 Hero Section (Khu vực mở đầu)
- **Headline & Tagline:**
  - *EN:* "A fast, keyboard-driven, visual Git client for Windows, macOS & Linux."
  - *VI:* "Phần mềm Git đồ họa tốc độ cao, điều khiển bằng bàn phím và an toàn tuyệt đối."
- **Mô tả ngắn gọn:** Nhấn mạnh khả năng xử lý đồ thị commit lớn với độ trễ 0ms, điểm sao lưu an toàn tự động và hoàn tác 10 giây.
- **Smart Download Button (Nút tải thông minh):**
  - Tự động nhận diện User Agent của trình duyệt:
    - Nếu là Windows: "Download for Windows (.exe)" (trỏ tới file setup NSIS).
    - Nếu là macOS: "Download for macOS (.dmg)".
    - Nếu là Linux: "Download for Linux (.deb)".
  - Nút phụ: "All Platforms & Formats" (cuộn mượt xuống bảng tải về chi tiết).
- **Interactive Visual Mockup:**
  - Khung giả lập giao diện GitVista với theme Dark Mode: thanh sidebar nhánh, bảng commit list với các node đồ thị topology đa màu sắc, thanh diff inspector.

### 3.3 Tính Năng Nổi Bật (Features Grid - 6 Cột Mốc)
1. **Interactive Commit Graph & History:** Đồ thị topology biểu diễn rõ ràng các nhánh rẽ, nhánh nhập; cuộn ảo mượt mà xử lý hàng chục nghìn commit.
2. **Visual Interactive Rebase Studio:** Sắp xếp, gộp commit (Squash/Fixup), sửa thông điệp (Reword) trực quan với timeline xem trước kết quả.
3. **Automated Safety Refs & 10s Instant Undo:** Mọi hành động nguy hiểm tự động tạo điểm cứu hộ `refs/gitui-backup/*`, đồng hồ đếm ngược 10 giây hoàn tác chỉ bằng một cú nhấp chuột.
4. **Multi-Tab & Multi-Repository Workspace:** Mở nhiều kho mã nguồn song song, chuyển đổi tab 0ms với bộ nhớ đệm phân vùng riêng biệt.
5. **Word-Level Diff & File Inspector:** Tô màu chính xác từng ký tự khác biệt, bỏ qua khoảng trắng thừa, tích hợp Git Blame từng dòng và lịch sử file.
6. **3-Way Conflict Resolver & GitHub PRs:** So sánh Ours vs Theirs vs Result giải quyết xung đột trực quan; duyệt và kiểm tra PR trực tiếp.

### 3.4 Ma Trận Tải Về Đa Nền Tảng (Download Matrix)
Bảng chia 3 cột rõ ràng cho từng hệ điều hành:
- **Windows:**
  - `GitVista_0.1.0_x64-setup.exe` (NSIS Installer - Khuyên dùng)
  - `GitVista_0.1.0_x64_en-US.msi` (Windows Installer)
  - `visual-git-client.exe` (Standalone Portable)
- **macOS:**
  - `GitVista_0.1.0_universal.dmg` (Apple Silicon & Intel)
- **Linux:**
  - `gitvista_0.1.0_amd64.deb` (Debian / Ubuntu)
  - `GitVista_0.1.0_amd64.AppImage` (Universal Linux)
- Nút liên kết trực tiếp tới trang **[GitHub Releases](https://github.com/ndhphuc68/git-vista-/releases/latest)**.

### 3.5 Bảng Phím Tắt Tương Tác (Keyboard Shortcuts)
Bảng tra cứu các phím tắt quan trọng:
- `Ctrl + K` / `Cmd + K`: Bảng lệnh nhanh (Command Palette)
- `Ctrl + T`: Mở tab kho lưu trữ mới
- `Ctrl + W`: Đóng tab hiện tại
- `Ctrl + Tab`: Chuyển tab tiếp theo
- `Ctrl + B`: Đóng/Mở thanh danh sách nhánh
- `Ctrl + /`: Focus nhanh vào ô tìm kiếm
- `?`: Hiển thị trợ giúp phím tắt
- `Escape`: Đóng hộp thoại / Bỏ chọn

### 3.6 Footer
- Thông tin bản quyền: `Copyright © 2026 GitVista Team. Distributed under the MIT License.`
- Liên kết hữu ích: GitHub Repo, Issue Tracker, Release Notes.

---

## 4. Cơ Chế Hoạt Động Của Client Script (`app.js` & `i18n.js`)

1. **Quản lý Ngôn ngữ:**
   - `i18n.js` xuất đối tượng từ điển chứa đầy đủ các chuỗi theo cấu trúc key: `hero.title`, `hero.subtitle`, `features.graph.title`, v.v.
   - Hàm `applyLanguage(lang)` duyệt tất cả phần tử mang thuộc tính `data-i18n="key"` để gán nội dung text, và `data-i18n-attr="attr:key"` để cập nhật placeholder, title.
   - Khi người dùng bấm nút chuyển đổi, gọi `setLanguage('vi' | 'en')` và lưu vào `localStorage`.
2. **Nhận diện Nền tảng (Platform Detection):**
   - Hàm `detectPlatform()` phân tích `navigator.userAgent` hoặc `navigator.userAgentData`:
     - Nếu chứa `"Win"` -> Windows (ưu tiên link tải `.exe`).
     - Nếu chứa `"Mac"` -> macOS (ưu tiên link tải `.dmg`).
     - Nếu chứa `"Linux"` -> Linux (ưu tiên link tải `.deb`).
   - Cập nhật text và icon của nút CTA chính trong Hero section.

---

## 5. Quy Trình Triển Khai GitHub Pages (`.github/workflows/deploy-pages.yml`)

- **Workflow Name:** `Deploy Landing Page to GitHub Pages`
- **Sự kiện kích hoạt:**
  - `push` lên nhánh `main` với phạm vi đường dẫn `website/**`.
  - `workflow_dispatch` (kích hoạt thủ công).
- **Quyền hạn (Permissions):**
  ```yaml
  permissions:
    contents: read
    pages: write
    id-token: write
  ```
- **Các bước thực thi:**
  1. `actions/checkout@v4`
  2. `actions/configure-pages@v5`
  3. `actions/upload-pages-artifact@v3` với `path: './website'`
  4. `actions/deploy-pages@v4`

---

## 6. Kế Hoạch Kiểm Thử & Đảm Bảo Chất Lượng (Verification)

1. **Hiển thị & Tương thích:** Kiểm tra giao diện responsive trên Desktop (1920x1080, 1366x768), Tablet (768px) và Mobile (375px).
2. **Kiểm tra Chuyển đổi Ngôn ngữ:** Đảm bảo 100% các thành phần văn bản chuyển đổi chính xác giữa Tiếng Anh và Tiếng Việt, không sót key hay vỡ layout.
3. **Kiểm tra Liên kết Tải về:** Xác nhận các liên kết trỏ đúng vào repository `ndhphuc68/git-vista-` và các file release.
4. **Kiểm tra Workflow:** Xác nhận cấu trúc cú pháp của `.github/workflows/deploy-pages.yml` hợp lệ.
