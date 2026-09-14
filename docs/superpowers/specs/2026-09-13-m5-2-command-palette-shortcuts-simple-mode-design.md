# Thiết Kế Milestone M5.2: Command Palette, Hệ Thống Phím Tắt & Chế Độ Simple/Advanced

**Ngày:** 2026-09-13  
**Trạng thái:** Sẵn sàng triển khai  
**Dựa trên:** [Visual Git Client Design v1](../../superpowers/specs/2026-09-12-visual-git-client-design.md) (Mục 2 & 10)

---

## 1. Mục Tiêu & Trải Nghiệm Người Dùng

Milestone M5.2 hoàn thiện trải nghiệm tương tác nhanh và cá nhân hoá trải nghiệm cho cả hai nhóm người dùng mục tiêu (người mới bắt đầu và chuyên gia Git):
1. **Command Palette (`Ctrl+K` / `Cmd+K`):** Cho phép người dùng tìm kiếm và kích hoạt mọi thao tác trong app nhanh chóng bằng bàn phím mà không cần rê chuột tìm menu.
2. **Bảng Phím Tắt Trực Quan (`?` hoặc `Ctrl+/`):** Cheat-sheet tra cứu toàn bộ phím tắt của ứng dụng chia theo danh mục rõ ràng.
3. **Chế Độ Đơn Giản vs Nâng Cao (Simple vs Advanced Mode):**
   - **Simple Mode:** Ngôn ngữ tiếng Việt đời thường, lược bỏ thuật ngữ Git hàn lâm ("Lấy về", "Kéo về", "Đẩy lên", "Lưu tạm"), giao diện tinh gọn.
   - **Advanced Mode:** Thuật ngữ Git chuẩn (`Fetch`, `Pull`, `Push`, `Stash`, `Rebase`, commit SHA ngắn, chi tiết kỹ thuật), đầy đủ các nút công cụ chuyên sâu.

---

## 2. Kiến Trúc Kỹ Thuật

### 2.1 Command Palette (`src/components/palette/CommandPalette.tsx`)
- **Trạng thái mở/đóng (`useViewStore` hoặc `useCommandPaletteStore`):**
  - Mở qua `Ctrl+K` / `Cmd+K`, hoặc bấm icon tìm kiếm trên Header / Titlebar.
  - Đóng qua `Escape` hoặc click backdrop.
- **Điều hướng bàn phím:**
  - `ArrowDown` / `ArrowUp`: Duyệt danh sách các lệnh.
  - `Enter`: Thực thi lệnh đang chọn và đóng Palette.
- **Cấu trúc Lệnh (`CommandItem`):**
  ```typescript
  export interface CommandItem {
    id: string;
    title: string;
    description?: string;
    category: "navigation" | "git" | "branch" | "settings";
    keywords?: string[];
    shortcut?: string;
    action: () => void | Promise<void>;
  }
  ```
- **Bộ lọc tìm kiếm:** Tìm kiếm không dấu / có dấu theo tiêu đề, mô tả, từ khoá và danh mục.

### 2.2 Bảng Trợ Giúp Phím Tắt (`src/components/shortcuts/ShortcutsHelpModal.tsx`)
- Phím kích hoạt: `?` (khi không trong input) hoặc `Ctrl+/` / `Cmd+/`.
- Trình bày dạng modal lưới gồm 4 nhóm:
  - **Chung:** `Ctrl+K` (Command Palette), `?` / `Ctrl+/` (Bảng phím tắt), `Esc` (Đóng modal).
  - **Màn hình:** `Ctrl+1` (Lịch sử commit), `Ctrl+2` (Màn hình Thay đổi).
  - **Thao tác Git:** `Ctrl+B` (Tạo nhánh), `Ctrl+Enter` (Commit), `Ctrl+Shift+F` (Fetch), `Ctrl+Shift+P` (Pull), `Ctrl+Shift+U` (Push), `Ctrl+Shift+A` (Stage tất cả).
  - **Tuỳ chỉnh:** `Ctrl+T` (Đổi Theme Sáng/Tối).

### 2.3 Quản Lý Phím Tắt Toàn Cục (`src/hooks/useGlobalShortcuts.ts`)
- Lắng nghe sự kiện `keydown` trên toàn window.
- Bỏ qua khi người dùng đang gõ trong `input`, `textarea`, hoặc `contentEditable`.
- Kích hoạt các callback đã đăng ký và hiển thị feedback trực quan.

### 2.4 Chế Độ Simple vs. Advanced
- Store: `useSettingsStore` (`mode: "simple" | "advanced"`).
- Giao diện phản ứng theo `mode`:
  - **Simple:** 
    - Nhãn nút: "Lấy về (Fetch)" -> "Lấy về", "Kéo về (Pull)" -> "Kéo về", "Gửi lên (Push)" -> "Gửi lên", "Lưu tạm (Stash)" -> "Lưu tạm".
    - Ẩn các chi tiết commit SHA phức tạp hoặc thông số hash không cần thiết.
  - **Advanced:**
    - Giữ nguyên các thuật ngữ Git quốc tế (`Fetch`, `Pull`, `Push`, `Stash`, `Rebase`, `Merge`).
    - Hiển thị commit SHA ngắn 7 ký tự kèm nút copy nhanh.
    - Cung cấp các tuỳ chọn nâng cao khi commit / rebase.

---

## 3. Kế Hoạch Kiểm Thử
1. **Unit test Command Palette (`src/test/CommandPalette.test.tsx`):**
   - Mở/đóng bằng `Ctrl+K` và `Escape`.
   - Lọc lệnh theo từ khoá tìm kiếm.
   - Điều hướng mũi tên `ArrowDown`/`ArrowUp` và kích hoạt bằng `Enter`.
2. **Unit test Shortcuts Help Modal (`src/test/ShortcutsHelpModal.test.tsx`):**
   - Mở modal khi bấm `?` hoặc `Ctrl+/`.
   - Hiển thị danh mục các phím tắt đầy đủ.
3. **Unit test Simple/Advanced Mode (`src/test/AppMode.test.tsx`):**
   - Chuyển đổi mode cập nhật `useSettingsStore`.
   - Các nhãn giao diện và hiển thị thay đổi tương ứng theo mode.
4. **Integration test toàn bộ hệ thống (`pnpm test --run`, `pnpm run build`).**
