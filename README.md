<p align="center">
  <img src="app-icon.png" alt="GitVista Logo" width="108" height="108" />
</p>

<h1 align="center">GitVista</h1>

<p align="center">
  <strong>A fast, keyboard-driven, visual Git desktop client built for clarity, speed, and safety.</strong>
</p>

<p align="center">
  <a href="https://ndhphuc68.github.io/git-vista-/"><strong>🌐 Official Website</strong></a> •
  <a href="#-english">English</a> •
  <a href="#-tiếng-việt">Tiếng Việt</a>
</p>

<p align="center">
  <a href="https://ndhphuc68.github.io/git-vista-/"><img src="https://img.shields.io/badge/Website-ndhphuc68.github.io%2Fgit--vista---6366f1?style=for-the-badge&logo=githubpages&logoColor=white" alt="Official Website" /></a>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Requires-Git%202.x+-orange?style=for-the-badge&logo=git&logoColor=white" alt="Git 2.x+" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="MIT License" />
</p>

---

## 🌐 English

### Overview

**GitVista** is a modern, high-performance visual Git client designed to take the fear out of Git operations while keeping power users fast with a keyboard-driven workflow. Built with a native Rust core and a fluid, beautiful desktop interface, GitVista provides an instant mental model of your repositories, reliable safety nets against lost work, and deep productivity tools.

---

### ✨ Key Features

#### 🌳 Interactive Commit Graph & History
- **Crystal-Clear Visualization**: Topology-based visual branch, merge, and tag graph.
- **Ultra-Fast & Smooth**: Virtualized list rendering handles repositories with tens of thousands of commits with zero lag.
- **Instant Commit Details**: Inspect authors, timestamps, commit signatures, file changes, and inline diffs immediately upon selecting a commit.
- **Quick Commit Comparison**: Hold `Ctrl` / `Cmd` and click any two commits on the graph to compare them side-by-side.

#### 🔀 Visual Interactive Rebase
- **Interactive Rebase Studio**: Clean up and curate your commit history before sharing your code with teammates.
- **Drag-and-Drop & Arrow Keys**: Reorder commits effortlessly.
- **Full Action Suite**: Apply `Pick`, `Reword` (with an inline message editor), `Squash`, `Fixup`, and `Drop`.
- **Live Preview Timeline**: Real-time visual timeline showing exactly what your branch will look like after rebasing.
- **Safety Guardrails**: Automatically stashes dirty working directories and creates safety backup refs so you can revert anytime.

#### 📑 Multi-Tab & Multi-Repository Workspace
- **Modern Tabbed Interface**: Open and manage multiple repositories simultaneously in a single window.
- **Instant Tab Switching**: Zero-latency tab switching with per-repository cache partitioning.
- **Independent State**: Each tab maintains its own active screen, selected commit, and diff views.

#### 🛡️ Safety Backup & 10-Second Instant Undo
- **Automated Safety Refs**: Risky operations—such as creating commits, deleting branches, discarding file changes, dropping stashes, or cherry-picking—automatically generate safety backup refs under `refs/gitui-backup/*`.
- **10-Second Countdown Undo**: Non-intrusive notification toasts feature a 10-second countdown allowing you to reverse accidental actions with a single click.

#### 🔍 Deep Git Inspection Tools
- **Word-Level Diff & Whitespace Toggle**: Character and word-level difference highlighting (Unicode-aware LCS algorithm) with a quick toggle to ignore whitespace changes.
- **File Inspector (Git Blame & History)**: Slide-over drawer featuring line-by-line Git Blame with author color hashing, relative timestamps, commit tooltips, and file revision history.
- **Compare Commits & Branches**: Compare any two branches or commits using either **Merge-Base** (`A...B`, PR review style) or **Direct** (`A..B`, tree-to-tree) modes.
- **Cherry-Pick & Revert**: Cherry-pick or revert commits with optional auto-commit, safety backups, and conflict handoff.
- **Remote Management & Pruning**: Manage remotes and clean up deleted upstream tracking branches with one click.

#### 🐙 GitHub Pull Request Integration
- **Direct GitHub Connection**: Authenticate using a Personal Access Token (PAT) or automatically via the GitHub CLI (`gh`).
- **PR Hub & Inspection**: Browse open, closed, and your own PRs, check CI/CD run statuses, inspect changed files, and checkout PR branches locally.
- **Create Pull Requests**: Craft and submit new PRs (including Draft PRs) directly from within GitVista.

#### ⚔️ 3-Way Visual Conflict Resolver
- **Visual Conflict Solver**: Compare *Ours* vs *Theirs* vs *Result* with one-click hunk acceptance.
- **Safe Abort & Resume**: Clear indicators to safely abort a merge/rebase or commit resolved changes.

#### ⌨️ Keyboard-Driven & Accessible
- **Command Palette (`Ctrl + K` / `Cmd + K`)**: Fuzzy search and execute any command or switch branches rapidly.
- **Simple & Advanced Modes**: Toggle between beginner-friendly terminology (with clear explanations) and standard Git terminology.
- **Themes & Accessibility**: Dark mode, Light mode, and High-Contrast colorblind-friendly themes.

---

### 📥 Installation Guide

#### System Requirements
- **Git**: Ensure [Git](https://git-scm.com/) (version 2.20 or newer) is installed on your computer.
- **Supported Operating Systems**:
  - **Windows**: Windows 10 or Windows 11 (64-bit)
  - **macOS**: macOS 10.13 (High Sierra) or newer (Apple Silicon & Intel)
  - **Linux**: Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux, etc. (64-bit)

#### Download
Visit the **[Official Website](https://ndhphuc68.github.io/git-vista-/)** or download the latest installer or package for your operating system from the **[GitHub Releases](https://github.com/ndhphuc68/git-vista-/releases)** page.

#### Windows Installation
1. Download `GitVista_x64_en-US.msi` or `GitVista_x64-setup.exe`.
2. Double-click the installer and follow the guided setup wizard.
3. Launch **GitVista** from your Start Menu or Desktop shortcut.

#### macOS Installation
1. Download `GitVista_x64.dmg` (or Apple Silicon `.dmg` if available).
2. Open the `.dmg` file.
3. Drag the **GitVista** app icon into your **Applications** folder.
4. Launch GitVista from Spotlight (`Cmd + Space`) or Launchpad.

#### Linux Installation
- **Debian / Ubuntu (`.deb`)**:
  ```bash
  sudo dpkg -i gitvista_*_amd64.deb
  sudo apt-get install -f  # resolves dependencies if prompted
  ```
- **AppImage (Universal Linux)**:
  ```bash
  chmod +x GitVista_*.AppImage
  ./GitVista_*.AppImage
  ```

---

### ⌨️ Useful Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` / `Cmd + K` | Open Command Palette (search commands & branches) |
| `Ctrl + T` | Open a new repository tab |
| `Ctrl + W` | Close the current repository tab |
| `Ctrl + Tab` / `Ctrl + Shift + Tab` | Switch to next / previous repository tab |
| `Ctrl + 1` .. `Ctrl + 9` | Jump directly to repository tab 1–9 |
| `Ctrl + B` | Toggle the branch sidebar |
| `Ctrl + /` | Quick-focus filter / search bar |
| `?` | Display keyboard shortcuts cheat sheet |
| `Escape` | Close the active modal dialog or clear selection |

---

## 🇻🇳 Tiếng Việt

### Giới thiệu Tổng quan

**GitVista** là phần mềm quản lý Git giao diện trực quan (Git GUI) hiện đại, tốc độ cao dành cho máy tính (Windows, macOS, Linux). Được thiết kế với mục tiêu mang lại trải nghiệm Git an toàn, dễ hiểu và nhanh chóng, GitVista giúp người dùng giải phóng nỗi lo mất mã nguồn khi thao tác Git, đồng thời tối ưu hóa thao tác làm việc hàng ngày bằng bàn phím.

Ứng dụng hỗ trợ hoàn hảo cho các nhà phát triển Việt Nam với từ điển song ngữ chuẩn hóa, các sơ đồ trực quan sinh động và chế độ giải thích thân thiện cho cả người mới bắt đầu lẫn lập trình viên chuyên nghiệp.

---

### ✨ Tính Năng Nổi Bật

#### 🌳 Đồ thị Commit Trực quan & Hiệu năng cao
- **Dựng hình đồ thị Topology chuẩn xác**: Thuật toán phân nhánh biểu diễn rõ ràng các nhánh rẽ, nhánh nhập (merge), và nhãn thẻ (tag).
- **Tốc độ vượt trội & Cuộn ảo mượt mà**: Xử lý mượt mà các kho mã nguồn lớn chứa hàng chục nghìn commit mà không gây giật lag.
- **Chi tiết commit tức thì**: Xem tác giả, chữ ký commit, danh sách tệp thay đổi và nội dung diff trực tiếp ngay khi chọn commit.
- **So sánh nhanh 2 commit**: Giữ phím `Ctrl` (hoặc `Cmd`) và nhấp vào commit thứ hai để mở ngay bảng so sánh chi tiết giữa 2 mốc.

#### 🔀 Rebase Tương tác Trực quan (Visual Interactive Rebase)
- **Studio Rebase chuyên nghiệp**: Hộp thoại trực quan giúp dọn dẹp, sắp xếp lại lịch sử commit gọn gàng trước khi chia sẻ mã nguồn.
- **Kéo thả / Phím mũi tên**: Dễ dàng đảo thứ tự các commit theo ý muốn.
- **Đầy đủ hành động Git**: Hỗ trợ `Pick`, `Reword` (soạn lại nội dung commit trực tiếp), `Squash`, `Fixup`, và `Drop`.
- **Xem trước thời gian thực (Live Preview)**: Xem trước kết quả cây commit sau khi rebase kèm thống kê số commit bị gộp/xoá.
- **Cơ chế bảo vệ an toàn**: Tự động lưu tạm thay đổi (Auto-stash) và tạo điểm sao lưu an toàn để bạn luôn có thể quay lại trạng thái cũ.

#### 📑 Kiến trúc Đa Tab & Quản lý Nhiều Dự án
- **Thanh tab hiện đại**: Mở và quản lý nhiều kho lưu trữ Git song song trong cùng một cửa sổ ứng dụng.
- **Chuyển tab tức thì (0ms)**: Bộ nhớ đệm được phân vùng riêng cho từng kho lưu trữ, giúp chuyển tab lập tức mà không cần tải lại dữ liệu.
- **Lưu giữ trạng thái riêng biệt**: Mỗi tab ghi nhớ màn hình đang xem, commit và tệp tin đang kiểm tra.

#### 🛡️ Sao Lưu An Toàn & Hoàn Tác Tức Thì 10 Giây (Undo System)
- **Điểm cứu hộ tự động**: Mọi hành động có nguy cơ mất mát dữ liệu (tạo commit, xoá nhánh, huỷ thay đổi tệp, xoá stash, cherry-pick) đều được ghi nhận tự động vào `refs/gitui-backup/*`.
- **Đồng hồ đếm ngược hoàn tác 10 giây**: Hộp thông báo xuất hiện kèm nút **"Hoàn tác"** đếm ngược, giúp bạn huỷ bỏ thao tác nhầm lẫn chỉ với 1 cú nhấp chuột.

#### 🔍 Công Cụ Git Chuyên Sâu
- **Word-Level Diff & Bỏ qua khoảng trắng**: Tô màu chính xác từng từ, từng ký tự bị thay đổi trên dòng mã. Bật/tắt bỏ qua sự khác biệt khoảng trắng thụt lề dễ dàng.
- **Thanh tra Tệp Tin (Git Blame & Lịch sử tệp)**: Bảng trượt hiển thị Git Blame từng dòng (kèm mã màu phân biệt từng tác giả) và lịch sử commit của riêng tệp tin đó.
- **So sánh 2 Nhánh / 2 Commit**: Hỗ trợ 2 chế độ so sánh: **Merge-Base** (`A...B`, chuẩn review Pull Request) và **Direct** (`A..B`, so sánh trực tiếp cây thư mục).
- **Cherry-Pick & Revert**: Nhặt commit hoặc đảo ngược commit an toàn với tuỳ chọn tự động commit và khả năng hoàn tác.
- **Quản lý Remote & Dọn dẹp nhánh rác (Prune)**: Quản lý danh sách máy chủ từ xa và cắt tỉa các nhánh tracking đã bị xoá trên máy chủ.

#### 🐙 Tích Hợp GitHub Pull Requests
- **Kết nối GitHub thuận tiện**: Đăng nhập nhanh bằng Personal Access Token (PAT) hoặc tự động nhận diện từ GitHub CLI (`gh`).
- **Trung tâm Pull Requests**: Xem danh sách PR (Đang mở, Của tôi, Đã đóng), kiểm tra trạng thái CI/CD build checks, duyệt diff các file và chuyển nhánh (checkout) PR về máy cục bộ.
- **Tạo Pull Request trực tiếp**: Tạo PR mới hoặc PR nháp (Draft PR) ngay từ giao diện GitVista.

#### ⚔️ Bộ Giải Quyết Xung Đột 3 Bên (Conflict Resolver)
- So sánh trực quan giữa nhánh hiện tại (*Ours*), nhánh cần nhập (*Theirs*) và tệp kết quả (*Result*).
- Chọn giữ thay đổi từng khối chỉ với một cú nhấp chuột, kiểm tra cú pháp và hoàn tất giải quyết xung đột an toàn.

#### ⌨️ Tối Ưu Bàn Phím & Trợ Năng
- **Bảng lệnh thông minh (`Ctrl + K`)**: Tìm kiếm mờ và kích hoạt nhanh mọi tính năng hoặc chuyển nhánh trong tích tắc.
- **Chế độ Đơn giản & Nâng cao**: Chuyển đổi linh hoạt giữa thuật ngữ tiếng Việt thân thiện, dễ hiểu cho người mới và thuật ngữ Git chuẩn quốc tế.
- **Chủ đề hiển thị**: Hỗ trợ chế độ Giao diện Tối (Dark mode), Sáng (Light mode) và chế độ tương phản cao cho người khiếm thị màu sắc.

---

### 📥 Hướng Dẫn Cài Đặt Ứng Dụng

#### Yêu cầu hệ thống
- **Git**: Đảm bảo máy tính của bạn đã cài đặt [Git](https://git-scm.com/) (phiên bản 2.20 trở lên).
- **Hệ điều hành hỗ trợ**:
  - **Windows**: Windows 10 hoặc Windows 11 (64-bit)
  - **macOS**: macOS 10.13 trở lên (Hỗ trợ chip Apple Silicon M1/M2/M3 & Intel)
  - **Linux**: Ubuntu, Debian, Fedora, Arch Linux... (64-bit)

#### Tải bộ cài đặt
Truy cập **[Trang web chính thức](https://ndhphuc68.github.io/git-vista-/)** hoặc tải bộ cài đặt chính thức phiên bản mới nhất tại trang **[GitHub Releases](https://github.com/ndhphuc68/git-vista-/releases)**.

#### Cài đặt trên Windows
1. Tải file `GitVista_x64-setup.exe` hoặc file cài đặt `.msi`.
2. Nhấp đúp vào file cài đặt và làm theo hướng dẫn trên màn hình.
3. Mở **GitVista** từ menu Start hoặc biểu tượng ngoài màn hình Desktop.

#### Cài đặt trên macOS
1. Tải file `GitVista_x64.dmg`.
2. Mở file `.dmg` vừa tải về.
3. Kéo biểu tượng **GitVista** vào thư mục **Applications**.
4. Khởi chạy ứng dụng từ Launchpad hoặc Spotlight (`Cmd + Space`).

#### Cài đặt trên Linux
- **Dành cho Ubuntu / Debian (`.deb`)**:
  ```bash
  sudo dpkg -i gitvista_*_amd64.deb
  sudo apt-get install -f  # Cài đặt các gói phụ thuộc nếu hệ thống yêu cầu
  ```
- **Dành cho AppImage (Chạy trực tiếp không cần cài đặt)**:
  ```bash
  chmod +x GitVista_*.AppImage
  ./GitVista_*.AppImage
  ```

---

### ⌨️ Danh Mục Phím Tắt Phổ Biến

| Phím tắt | Thao tác |
|---|---|
| `Ctrl + K` / `Cmd + K` | Mở Bảng lệnh nhanh Command Palette (tìm lệnh & nhánh) |
| `Ctrl + T` | Mở tab kho lưu trữ mới |
| `Ctrl + W` | Đóng tab kho lưu trữ hiện tại |
| `Ctrl + Tab` / `Ctrl + Shift + Tab` | Chuyển sang tab tiếp theo / tab trước đó |
| `Ctrl + 1` .. `Ctrl + 9` | Nhảy nhanh đến tab tương ứng từ 1 đến 9 |
| `Ctrl + B` | Đóng hoặc mở thanh danh sách nhánh bên trái |
| `Ctrl + /` | Đặt con trỏ nhanh vào ô tìm kiếm |
| `?` | Mở bảng tra cứu phím tắt |
| `Escape` | Đóng hộp thoại đang mở hoặc bỏ chọn |

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<p align="center">
  Crafted with ❤️ by the GitVista Team
</p>
