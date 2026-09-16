# Thiết Kế: Màn Hình Khởi Động (Splash Screen) & Nâng Cấp UX Animation Toàn Diện

**Ngày:** 2026-09-16  
**Trạng thái:** Đã duyệt (Sẵn sàng lập kế hoạch & triển khai)  
**Dựa trên:** [Visual Git Client Design v1](./2026-09-12-visual-git-client-design.md) & [Design System](../../DESIGN_SYSTEM.md)

---

## 1. Mục Tiêu & Trải Nghiệm Người Dùng

Mục tiêu của thiết kế này là mang lại trải nghiệm mở đầu và tương tác đẳng cấp chuẩn Desktop Native (Apple/macOS style) cho GitVista:
1. **Màn hình Splash Screen (`SplashScreen`):**
   - Tạo ấn tượng thương hiệu chuyên nghiệp, mượt mà ngay khi mở app với logo GitVista, quầng sáng ambient glow và khẩu hiệu trực quan.
   - Thời lượng chuẩn mực ~1.8s intro animation, sau đó chuyển cảnh fade-out êm dịu (300ms) để lộ giao diện chính đã được tải sẵn ở hậu cảnh.
2. **Hệ thống UX Animation & Micro-interactions Toàn Diện:**
   - Chuyển cảnh mượt mà giữa các màn hình (`WelcomeScreen` $\leftrightarrow$ `RepoContent`, `History` $\leftrightarrow$ `Changes` $\leftrightarrow$ `ConflictResolver`).
   - Thanh trượt chỉ báo chuyển tab linh hoạt (Sliding Pill Tab Indicator) trên `RepoHeader`.
   - Toàn bộ Modals (`CloneModal`, `CreateBranchModal`, `DeleteBranchModal`, `RenameBranchModal`, `ShortcutsHelpModal`) và `CommandPalette` mở ra với hiệu ứng scale-spring và backdrop-blur tinh tế, có hiệu ứng exit mượt mà khi đóng.
   - Micro-interactions khi click chuột (`active:scale-[0.98]`), hover card, và phản hồi trạng thái file staging.
3. **Hiệu năng & Trọng lượng:**
   - Giải pháp **Zero External Dependencies**: Hoàn toàn dựa trên CSS GPU-accelerated (`transform`, `opacity`) và helper component React thuần siêu nhẹ.
   - Đạt 60-120fps mượt mà, tôn trọng tuyệt đối `prefers-reduced-motion`.
   - Bảo toàn 100% test suite hiện tại (40 test files, 173 unit tests).

---

## 2. Kiến Trúc Kỹ Thuật

### 2.1 Thành Phần Splash Screen (`src/components/splash/SplashScreen.tsx`)

- **Thành phần hiển thị:**
  - **Logo GitVista:** Biểu tượng ứng dụng (`/app-icon.png`) hiển thị với hiệu ứng xuất hiện `scale-in` mềm mại kèm hiệu ứng hào quang (`radial-gradient` accent glow).
  - **Typography Thương Hiệu:** Nhãn `GitVista` (font sans đậm, `tracking-tight`) và khẩu hiệu phụ `Visual Git Client` xuất hiện trễ 150ms tạo chiều sâu thị giác (staggered entrance).
  - **Thanh tiến trình tinh tế (Ambient Progress Pulse):** Một thanh chỉ báo mảnh chạy êm qua đáy logo theo đúng chu kỳ 1.8s.

- **Vòng đời khởi động (Startup Lifecycle trong `App.tsx`):**
  - Quản lý qua state `splashState: 'active' | 'exiting' | 'hidden'` (mặc định `'active'`).
  - **Timeline:**
    - `0ms – 1800ms` (`active`): Splash hiển thị toàn màn hình (fixed overlay, z-index 50). Trong lúc này, cây component chính của app bên dưới đã mount và bắt đầu kích hoạt React Query và Tauri IPC events ngầm.
    - `1800ms – 2100ms` (`exiting`): Kích hoạt class `opacity-0 scale-[1.03] transition-all duration-300 ease-macos pointer-events-none`.
    - `2100ms` (`hidden`): Unmount hoàn toàn `SplashScreen` khỏi React DOM tree.
  - **Khả năng kiểm thử (Testability):** Cho phép bypass hoặc truyền prop `skipSplash` / kiểm tra biến môi trường test để các bài kiểm thử tự động của `App.test.tsx` chạy tức thì mà không cần đợi 2.1s.

---

### 2.2 Hệ Thống Motion Tokens & CSS Keyframes

#### 2.2.1 Bổ sung Tokens trong `src/styles/tokens.css` & `@theme` trong `globals.css`
- **Đường cong chuyển động (Easing):**
  - `--ease-macos: cubic-bezier(0.32, 0.72, 0, 1)` (chuẩn desktop mềm mại)
  - `--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.12)` (độ nảy tự nhiên cho modals/dialogs)
- **Thời lượng (Durations):**
  - `--duration-instant: 100ms` (phản hồi click chuột, phím)
  - `--duration-fast: 180ms` (hover, badge, dropdown)
  - `--duration-normal: 250ms` (tab switch, modal open, panel slide)
  - `--duration-slow: 350ms` (chuyển màn hình lớn, splash fade)

#### 2.2.2 Tiện ích CSS Animations trong `src/styles/globals.css`
- `@keyframes fadeIn`: `from { opacity: 0; } to { opacity: 1; }`
- `@keyframes scaleIn`: `from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); }`
- `@keyframes slideUp`: `from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`
- `@keyframes slideRight`: `from { transform: translateX(100%); } to { transform: translateX(0); }`
- `@keyframes pulseGlow`: Hiệu ứng thở nhẹ của ambient glow logo splash.
- **Utility Classes:**
  - `.animate-fade-in`: Áp dụng `fadeIn` với `--duration-normal` & `--ease-macos`.
  - `.animate-scale-in`: Áp dụng `scaleIn` với `--duration-normal` & `--ease-spring`.
  - `.animate-slide-up`: Áp dụng `slideUp` với `--duration-normal` & `--ease-macos`.
  - `.btn-press`: `active:scale-[0.97] transition-transform duration-100 ease-out`.
  - `.card-lift`: `transition-all duration-200 ease-macos hover:-translate-y-0.5 hover:shadow-md`.
  - `.modal-backdrop`: `bg-black/40 backdrop-blur-xs transition-opacity duration-200`.

---

### 2.3 Component Điều Khiển Hiệu Ứng Thoát: `<Transition />`

File: `src/components/common/Transition.tsx`

Hỗ trợ chạy xong animation khi đóng (Exit animation) trước khi unmount khỏi DOM mà không cần thư viện bên thứ 3:

```typescript
export interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  enterClass?: string;
  exitClass?: string;
  duration?: number; // ms, mặc định 200
  unmountOnExit?: boolean; // mặc định true
  className?: string;
}
```

- Khi `show = true`: Component mount vào DOM và áp dụng `enterClass`.
- Khi `show = false`: Component tiếp tục hiển thị trong DOM trong `duration` ms với `exitClass`, sau đó mới unmount hoàn toàn.

---

## 3. Nâng Cấp UX Chi Tiết Cho Từng Màn Hình

### 3.1 Màn Hình Chào Mừng (`src/components/welcome/WelcomeScreen.tsx`)
- **Staggered Entrance:** Header thương hiệu $\rightarrow$ 2 Thẻ mở repo $\rightarrow$ Hộp Recent Repositories xuất hiện lần lượt với độ trễ 60ms.
- **Thẻ hành động chính:** Áp dụng `.card-lift` và viền sáng màu accent khi hover/focus.
- **Danh sách Repo gần đây:**
  - Hiệu ứng hover mượt mà trên từng dòng.
  - Các nút tác vụ nhanh (Ghim ⭐, Copy đường dẫn 📋, Xóa ✕) fade-in khi hover.
  - Khung Drag & Drop: Hiệu ứng viền chuyển màu accent và scale nhẹ khi người dùng kéo thư mục vào ứng dụng.

### 3.2 Thanh Điều Hướng Header (`src/components/header/RepoHeader.tsx`)
- **Sliding Pill Tab Indicator:**
  - Tab Switcher giữa `History` và `Changes` sử dụng pill highlight nền trượt mượt mà theo vị trí tab được chọn (`transition-all duration-250 ease-macos`).
- **Nút Remote Sync (Fetch, Pull, Push):**
  - Icon xoay mượt mà (`animate-spin`) khi tác vụ fetch/pull/push đang chạy.
  - Badge đếm số commit cần push/pull xuất hiện với hiệu ứng pop-in nhẹ (`animate-scale-in`).

### 3.3 Màn Hình Lịch Sử Commit (`src/components/Shell.tsx` & `src/components/diff/CommitDetailPanel.tsx`)
- **Branch Sidebar:** Khi đóng/mở sidebar, phần chuyển đổi chiều rộng được áp dụng `transition-[width,transform] duration-200 ease-macos`.
- **Commit Detail Panel:** Trượt mượt mà vào từ cạnh phải màn hình khi click chọn 1 commit (`translate-x-0` từ `translate-x-full`).
- **Commit Graph:** Hover từng dòng hiển thị nền mềm mại, node commit được chọn có vòng viền accent rõ nét.

### 3.4 Màn Hình Thay Đổi (`src/components/changes/ChangesScreen.tsx`)
- **File Staging List:** Thao tác stage/unstage file có hiệu ứng fade-slide nhẹ nhàng.
- **Commit Box:**
  - Khung soạn thảo có viền focus ring sáng dần tự nhiên.
  - Nút Commit hỗ trợ micro-interaction `.btn-press`, khi commit thành công có micro-feedback trước khi kích hoạt Toast Undo.

### 3.5 Hệ Thống Modals & Command Palette
- Bọc toàn bộ các modal (`CommandPalette`, `CloneModal`, `CreateBranchModal`, `DeleteBranchModal`, `RenameBranchModal`, `ShortcutsHelpModal`, `DiscardConfirmModal`, `CreateStashModal`) qua `<Transition />`.
- Backdrop áp dụng `.modal-backdrop` (blur nhẹ 4px, làm dịu mắt).
- Khung modal nổi lên với `.animate-scale-in` (`scale 0.95 -> 1.0` với spring curve).

### 3.6 Trợ Năng (Accessibility & Motion Safety)
- Tuân thủ nghiêm ngặt `@media (prefers-reduced-motion: reduce)`:
  - Tắt toàn bộ chuyển động lớn, hạ thời lượng về `0.01ms`.
  - Splash screen chuyển cảnh tức thời hoặc chỉ fade chớp nhoáng (100ms) để không gây chóng mặt cho người dùng nhạy cảm với chuyển động.

---

## 4. Kế Hoạch Kiểm Thử & Xác Minh

### 4.1 Unit & Integration Tests Mới
1. `src/test/SplashScreen.test.tsx`:
   - Kiểm tra render đầy đủ: Logo, Tên ứng dụng GitVista, Tagline.
   - Kiểm tra chu kỳ vòng đời với `vi.useFakeTimers()`:
     - Tại 0ms: `splashState === 'active'`.
     - Tại 1800ms: bắt đầu transition fade out (`exiting`).
     - Tại 2100ms: gọi `onFinish` và ẩn hoàn toàn.
   - Kiểm tra cờ `skipSplash` / prop kiểm thử cho phép hoàn thành ngay lập tức.
2. `src/test/Transition.test.tsx`:
   - Kiểm tra mount khi `show={true}` với enter classes.
   - Kiểm tra giữ DOM và áp dụng exit classes khi `show={false}` trong khoảng `duration`.
   - Kiểm tra unmount sau khi hết `duration`.

### 4.2 Kiểm Thử Chống Hồi Quy (Regression Suite)
- Chạy `npm run test` (toàn bộ 40 test files, 173 tests) đảm bảo 100% test tiếp tục PASS:
  - `App.test.tsx` được cập nhật tương thích với Splash lifecycle.
  - Toàn bộ tests của `CommandPalette`, `CreateBranchModal`, `DeleteBranchModal`, `ShortcutsHelpModal` tiếp tục hoạt động chính xác với transition wrapper.
- Chạy `npm run build` (kiểm tra TypeScript và Vite compilation sạch lỗi).
- Chạy `npm run check-contrast` đảm bảo tương phản màu sắc đạt chuẩn WCAG.
