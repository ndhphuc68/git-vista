// GitVista Landing Page Bilingual Dictionary (English & Tiếng Việt)
(function (root) {
  const I18N_DATA = {
    en: {
      // Navigation
      "nav.features": "Features",
      "nav.downloads": "Downloads",
      "nav.shortcuts": "Shortcuts",
      "nav.docs": "Documentation",
      "nav.github": "GitHub",
      "nav.quick_download": "Download",

      // Hero
      "hero.badge": "v0.1.0 Released • Fast & Native Git Client",
      "hero.title": "A Fast, Keyboard-Driven Visual Git Desktop Client",
      "hero.tagline": "Built with Rust and modern Web technologies for clarity, speed, and absolute safety.",
      "hero.desc": "GitVista turns complex Git operations into intuitive visual workflows. Featuring a topology-based commit graph, zero-latency multi-repository tabs, visual interactive rebase, and a 10-second instant undo safety net so you never lose code again.",
      "hero.download_primary": "Download for Windows",
      "hero.all_platforms": "All Platforms & Formats",
      "hero.view_github": "View on GitHub",
      "hero.sub_note": "Free & Open Source under MIT License • Supports Windows, macOS & Linux",

      // Mockup window
      "mockup.title": "GitVista — visual-git-client (main)",
      "mockup.branch": "Branch: main",
      "mockup.status": "Clean • 0 uncommitted changes",
      "mockup.tab1": "git-vista (main)",
      "mockup.tab2": "api-backend (feat/auth)",

      // Features Header
      "features.badge": "Why GitVista?",
      "features.title": "Designed for Clarity, Speed, and Peace of Mind",
      "features.subtitle": "Powerful desktop tools crafted to streamline everyday development without intimidating Git intricacies.",

      // 6 Core Features
      "features.graph.title": "Interactive Commit Graph",
      "features.graph.desc": "Crystal-clear topology-based branch visualization. Virtualized rendering effortlessly handles tens of thousands of commits with 0ms lag.",
      "features.rebase.title": "Visual Interactive Rebase",
      "features.rebase.desc": "Drag-and-drop commit reordering with full Pick, Reword, Squash, Fixup, and Drop support. Includes live timeline preview and auto-stash.",
      "features.undo.title": "10s Instant Undo & Safety Refs",
      "features.undo.desc": "Never fear losing work. Risky actions automatically create safety backup refs, and an interactive 10-second countdown toast lets you reverse mistakes in one click.",
      "features.multitab.title": "Multi-Tab & Multi-Repo Workspace",
      "features.multitab.desc": "Open and inspect multiple repositories side-by-side in a single window with partitioned cache and instant zero-latency tab switching.",
      "features.diff.title": "Word-Level Diff & File Inspector",
      "features.diff.desc": "Character and word-level difference highlighting with whitespace ignore toggle, alongside a slide-over drawer featuring line-by-line Git Blame and file history.",
      "features.conflict.title": "3-Way Conflict Resolver & PR Hub",
      "features.conflict.desc": "Resolve merge conflicts visually with Ours vs Theirs vs Result hunks. Connect directly with GitHub to browse, inspect, and checkout Pull Requests.",

      // Downloads
      "downloads.badge": "Get Started",
      "downloads.title": "Download GitVista for Your Platform",
      "downloads.subtitle": "Choose the installer package tailored for your operating system. Free and open source.",
      "downloads.windows.title": "Windows",
      "downloads.windows.desc": "Windows 10 / 11 (64-bit)",
      "downloads.windows.btn_setup": "Installer (.exe)",
      "downloads.windows.btn_msi": "Windows Package (.msi)",
      "downloads.windows.btn_portable": "Portable (.exe)",
      "downloads.mac.title": "macOS",
      "downloads.mac.desc": "macOS 10.13+ (Apple Silicon & Intel)",
      "downloads.mac.btn_dmg": "Disk Image (.dmg)",
      "downloads.mac.universal_note": "Universal binary for M-Series and Intel chips",
      "downloads.linux.title": "Linux",
      "downloads.linux.desc": "Ubuntu, Debian, Fedora, Arch Linux",
      "downloads.linux.btn_deb": "Debian Package (.deb)",
      "downloads.linux.btn_appimage": "Universal AppImage",
      "downloads.release_note": "Looking for previous versions or checksums? Check out",
      "downloads.releases_link": "GitHub Releases",

      // Shortcuts
      "shortcuts.badge": "Efficiency First",
      "shortcuts.title": "Keyboard-Driven Navigation",
      "shortcuts.subtitle": "Designed from the ground up so you rarely have to take your hands off the keyboard.",
      "shortcuts.k1.key": "Ctrl + K",
      "shortcuts.k1.desc": "Open Command Palette (search commands & branches)",
      "shortcuts.k2.key": "Ctrl + T",
      "shortcuts.k2.desc": "Open a new repository tab",
      "shortcuts.k3.key": "Ctrl + W",
      "shortcuts.k3.desc": "Close the active repository tab",
      "shortcuts.k4.key": "Ctrl + Tab",
      "shortcuts.k4.desc": "Switch to next / previous repository tab",
      "shortcuts.k5.key": "Ctrl + 1..9",
      "shortcuts.k5.desc": "Jump directly to tab index 1 through 9",
      "shortcuts.k6.key": "Ctrl + B",
      "shortcuts.k6.desc": "Toggle branch sidebar visibility",
      "shortcuts.k7.key": "Ctrl + /",
      "shortcuts.k7.desc": "Quickly focus search and filter input",
      "shortcuts.k8.key": "Escape",
      "shortcuts.k8.desc": "Close active dialog, modal, or clear selection",

      // Footer
      "footer.built_with": "Built with Rust, Tauri 2, and React.",
      "footer.license": "Released under the MIT License.",
      "footer.issues": "Report an Issue",
      "footer.docs": "Online Manual",
      "footer.github": "GitHub Repository",
      "footer.copyright": "© 2026 GitVista Team. All rights reserved."
    },
    vi: {
      // Navigation
      "nav.features": "Tính Năng",
      "nav.downloads": "Tải Về",
      "nav.shortcuts": "Phím Tắt",
      "nav.docs": "Tài Liệu",
      "nav.github": "GitHub",
      "nav.quick_download": "Tải Ngay",

      // Hero
      "hero.badge": "Bản v0.1.0 Đã Phát Hành • Nhanh & Native",
      "hero.title": "Phần Mềm Git Đồ Họa Tốc Độ Cao, Điều Khiển Bằng Bàn Phím",
      "hero.tagline": "Xây dựng trên nền tảng Rust và công nghệ Web hiện đại cho sự rõ ràng, mượt mà và an toàn tuyệt đối.",
      "hero.desc": "GitVista biến các thao tác Git phức tạp thành quy trình trực quan, dễ hiểu. Tích hợp đồ hình commit topology chuẩn xác, mở nhiều dự án song song với độ trễ 0ms, Visual Rebase Studio và cơ chế hoàn tác tức thì 10 giây để bạn không bao giờ lo mất code.",
      "hero.download_primary": "Tải về cho Windows",
      "hero.all_platforms": "Tất Cả Nền Tảng & Định Dạng",
      "hero.view_github": "Xem trên GitHub",
      "hero.sub_note": "Mã nguồn mở miễn phí theo giấy phép MIT • Hỗ trợ Windows, macOS & Linux",

      // Mockup window
      "mockup.title": "GitVista — visual-git-client (main)",
      "mockup.branch": "Nhánh: main",
      "mockup.status": "Sạch • 0 thay đổi chưa commit",
      "mockup.tab1": "git-vista (main)",
      "mockup.tab2": "api-backend (feat/auth)",

      // Features Header
      "features.badge": "Vì Sao Chọn GitVista?",
      "features.title": "Thiết Kế Vì Sự Rõ Ràng, Tốc Độ & Sự An Tâm Tuyệt Đối",
      "features.subtitle": "Bộ công cụ mạnh mẽ được tối ưu hóa cho công việc lập trình hàng ngày mà không làm bạn rối bời bởi các lệnh Git phức tạp.",

      // 6 Core Features
      "features.graph.title": "Đồ Thị Commit Trực Quan",
      "features.graph.desc": "Thuật toán phân nhánh topology biểu diễn rõ ràng các nhánh rẽ và nhánh nhập. Cuộn ảo mượt mà xử lý nhẹ nhàng hàng chục nghìn commit mà không giật lag.",
      "features.rebase.title": "Visual Interactive Rebase",
      "features.rebase.desc": "Kéo thả sắp xếp thứ tự commit, hỗ trợ đầy đủ Pick, Reword, Squash, Fixup và Drop. Kèm theo timeline xem trước kết quả thời gian thực và tự động stash.",
      "features.undo.title": "Hoàn Tác 10s & Sao Lưu An Toàn",
      "features.undo.desc": "Không còn nỗi sợ mất code khi thao tác nhầm. Mọi hành động rủi ro đều tự động tạo điểm cứu hộ, cùng đồng hồ đếm ngược 10 giây giúp hoàn tác chỉ bằng 1 cú nhấp chuột.",
      "features.multitab.title": "Không Gian Đa Tab & Đa Kho Mã Nguồn",
      "features.multitab.desc": "Mở và theo dõi song song nhiều repository trong cùng một cửa sổ ứng dụng với bộ nhớ đệm phân vùng riêng và chuyển đổi tab tức thì với độ trễ 0ms.",
      "features.diff.title": "Word-Level Diff & Thanh Tra Tệp Tin",
      "features.diff.desc": "Tô màu chi tiết từng từ, từng ký tự bị sửa đổi kèm nút bật tắt bỏ qua khoảng trắng thừa. Bảng trượt Git Blame từng dòng và xem toàn bộ lịch sử tệp tin.",
      "features.conflict.title": "Bộ Giải Quyết Xung Đột 3 Bên & PR Hub",
      "features.conflict.desc": "So sánh trực quan Ours vs Theirs vs Result để chọn thay đổi từng khối an toàn. Kết nối trực tiếp GitHub để duyệt, kiểm tra CI và checkout Pull Requests.",

      // Downloads
      "downloads.badge": "Bắt Đầu Ngay",
      "downloads.title": "Tải GitVista Cho Thiết Bị Của Bạn",
      "downloads.subtitle": "Lựa chọn gói cài đặt phù hợp với hệ điều hành của bạn. Hoàn toàn miễn phí và mã nguồn mở.",
      "downloads.windows.title": "Windows",
      "downloads.windows.desc": "Windows 10 / 11 (64-bit)",
      "downloads.windows.btn_setup": "Bản cài đặt (.exe)",
      "downloads.windows.btn_msi": "Gói Windows (.msi)",
      "downloads.windows.btn_portable": "Bản Portable (.exe)",
      "downloads.mac.title": "macOS",
      "downloads.mac.desc": "macOS 10.13+ (Apple Silicon & Intel)",
      "downloads.mac.btn_dmg": "Ảnh đĩa (.dmg)",
      "downloads.mac.universal_note": "Hỗ trợ chuẩn Universal cho chip M-Series và Intel",
      "downloads.linux.title": "Linux",
      "downloads.linux.desc": "Ubuntu, Debian, Fedora, Arch Linux",
      "downloads.linux.btn_deb": "Gói Debian (.deb)",
      "downloads.linux.btn_appimage": "Gói Universal AppImage",
      "downloads.release_note": "Cần tìm phiên bản trước hoặc mã băm checksum? Hãy ghé thăm",
      "downloads.releases_link": "GitHub Releases",

      // Shortcuts
      "shortcuts.badge": "Hiệu Năng Tối Đa",
      "shortcuts.title": "Điều Khiển Mọi Thứ Bằng Bàn Phím",
      "shortcuts.subtitle": "Được thiết kế tỉ mỉ để bạn hiếm khi phải rời tay khỏi bàn phím khi làm việc với Git.",
      "shortcuts.k1.key": "Ctrl + K",
      "shortcuts.k1.desc": "Mở Bảng lệnh nhanh (tìm kiếm lệnh & chuyển nhánh tức thì)",
      "shortcuts.k2.key": "Ctrl + T",
      "shortcuts.k2.desc": "Mở một tab kho lưu trữ mới",
      "shortcuts.k3.key": "Ctrl + W",
      "shortcuts.k3.desc": "Đóng tab kho lưu trữ đang chọn",
      "shortcuts.k4.key": "Ctrl + Tab",
      "shortcuts.k4.desc": "Chuyển sang tab tiếp theo / tab trước đó",
      "shortcuts.k5.key": "Ctrl + 1..9",
      "shortcuts.k5.desc": "Nhảy nhanh trực tiếp tới tab từ 1 đến 9",
      "shortcuts.k6.key": "Ctrl + B",
      "shortcuts.k6.desc": "Đóng hoặc mở thanh danh sách nhánh bên trái",
      "shortcuts.k7.key": "Ctrl + /",
      "shortcuts.k7.desc": "Đặt con trỏ nhanh vào ô tìm kiếm và lọc",
      "shortcuts.k8.key": "Escape",
      "shortcuts.k8.desc": "Đóng hộp thoại đang mở hoặc bỏ chọn",

      // Footer
      "footer.built_with": "Được xây dựng bằng Rust, Tauri 2 và React.",
      "footer.license": "Phát hành theo Giấy phép MIT.",
      "footer.issues": "Báo cáo lỗi (Issue Tracker)",
      "footer.docs": "Hướng dẫn sử dụng",
      "footer.github": "Mã nguồn GitHub",
      "footer.copyright": "© 2026 Đội ngũ GitVista. Bản quyền đã được bảo lưu."
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18N_DATA;
  } else {
    root.I18N_DATA = I18N_DATA;
  }
})(typeof window !== 'undefined' ? window : this);
