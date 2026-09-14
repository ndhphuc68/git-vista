# Thiết Kế Milestone M5.3: Đóng Gói Cài Đặt Đa Nền Tảng, CI Benchmark & Phát Hành v1.0

**Ngày:** 2026-09-14  
**Trạng thái:** Sẵn sàng triển khai  
**Dựa trên:** [Visual Git Client Design v1](../../superpowers/specs/2026-09-12-visual-git-client-design.md) (Mục 5.5, 9.2, 10)

---

## 1. Mục Tiêu

Milestone M5.3 là cột mốc hoàn thiện cuối cùng của phiên bản **Visual Git Client v1.0**, đưa ứng dụng từ môi trường phát triển sang trạng thái sẵn sàng xuất xưởng và phân phối tới người dùng trên Windows, macOS và Linux:
1. **Cấu hình Đóng Gói (Production Bundling):** Kích hoạt hệ thống đóng gói của Tauri 2 với đầy đủ icon, metadata, chữ ký bảo mật và bộ cài đặt cho từng hệ điều hành (`.exe`/`.msi` trên Windows, `.dmg`/`.app` trên macOS, `.deb`/`.AppImage` trên Linux).
2. **CI Release Workflow (`.github/workflows/release.yml`):** Tự động biên dịch và tạo bộ cài đặt phân phối chính thức trên cả 3 hệ điều hành khi gắn tag phiên bản (`v1.0.0`).
3. **Kiểm Thử Hiệu Năng & Benchmark (Performance Guard):** Xây dựng bộ đo lường ngân sách hiệu năng tự động (load repo & commit graph < 800ms) chạy trong test suite để bảo vệ cam kết "mượt mà" dài hạn theo mục 5.5 và 9.2 của đặc tả.
4. **Tài Liệu Phát Hành & Hướng Dẫn Sử Dụng v1.0:** Hoàn thiện `README.md` và `docs/RELEASE_NOTES_v1.0.md` với đầy đủ tính năng từ M1 đến M5, hướng dẫn cài đặt và bảng phím tắt.

---

## 2. Chi Tiết Kiến Trúc

### 2.1 Cấu Hình Đóng Gói (`src-tauri/tauri.conf.json`)
- Bật `"bundle": { "active": true }`.
- Định cấu hình mục tiêu đóng gói:
  - Windows: `["nsis", "msi"]`
  - macOS: `["dmg"]`
  - Linux: `["deb", "appimage"]`
- Định cấu hình danh sách icon chuẩn từ `src-tauri/icons/`:
  - `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico`.
- Metadata ứng dụng:
  - `shortDescription: "Visual Git Client"`
  - `longDescription: "A fast, beautiful, and intuitive visual Git client for Windows, macOS, and Linux"`
  - `category: "DeveloperTool"`
  - `copyright: "Copyright © 2026 Visual Git Team"`

### 2.2 Quy Trình CI Tự Động Đóng Gói (`.github/workflows/release.yml`)
- Trigger khi push tag `v*` hoặc trigger thủ công (`workflow_dispatch`).
- Ma trận 3 OS (`windows-latest`, `macos-latest`, `ubuntu-latest`).
- Tự động biên dịch frontend và backend, đóng gói các file cài đặt (`.msi`, `.exe`, `.dmg`, `.deb`, `.AppImage`).
- Tạo GitHub Release và đính kèm các file binary.

### 2.3 Benchmark Hiệu Năng Tự Động (`src-tauri/tests/m5_benchmark_test.rs`)
- Tạo fixture repository chuẩn hóa với 500+ commits và đồ thị nhánh đa luồng.
- Đo thời gian thực thi:
  - `open_repo` + `get_repo_status`: ngân sách < 500ms.
  - `get_commit_graph`: ngân sách < 800ms.
- Tự động báo fail (red CI) nếu vượt ngân sách hiệu năng quy định.

### 2.4 Tài Liệu Phát Hành v1.0
- **`README.md`**: Giới thiệu ứng dụng, ảnh minh hoạ, tính năng nổi bật, cách cài đặt, phím tắt nhanh, hướng dẫn đóng góp.
- **`docs/RELEASE_NOTES_v1.0.md`**: Chi tiết tính năng phát hành của từng mốc (M0, M1, M2, M3, M4, M5).
