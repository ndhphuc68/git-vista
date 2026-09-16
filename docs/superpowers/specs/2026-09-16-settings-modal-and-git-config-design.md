# Design Spec: Settings Modal & Git Configuration (Sub-project 1.1.1)

## 1. Mục tiêu (Goals)
Xây dựng giao diện Cài đặt toàn diện (Settings Modal) và hệ thống đọc/ghi cấu hình Git (Git Config) cho GitVista:
- Cung cấp giao diện đồ họa trực quan để xem và chỉnh sửa thông tin tác giả Git (`user.name`, `user.email`, `init.defaultBranch`), hỗ trợ phạm vi áp dụng linh hoạt (Global hoặc Local repository).
- Tập trung hóa cấu hình giao diện & trải nghiệm người dùng (Theme, Ngôn ngữ, Chế độ Đơn giản / Nâng cao, Chế độ mù màu) vào một modal chuyên dụng.
- Cấu hình hành vi Git (Pull merge vs rebase, Background auto-fetch).
- Tích hợp phím tắt `Ctrl+,` (hoặc `Cmd+,`), icon bánh răng trên Header, và đăng ký vào Command Palette (`Ctrl+K`).

---

## 2. Kiến trúc & Tầng Backend (Rust libgit2 & Tauri IPC)

### 2.1 Cấu trúc Module
- **`src-tauri/src/read/config.rs`**:
  - Đọc cấu hình từ `git2::Config::open_default()` (system + global).
  - Nếu `repo_path` được cung cấp, mở cấu hình repo qua `repo.config()` để truy vấn các giá trị ghi đè (overrides).
  - Trả về cấu trúc `GitConfigDto`.
- **`src-tauri/src/write/config.rs`**:
  - Ghi cấu hình dựa trên `scope`:
    - `ConfigScope::Global`: Ghi vào `~/.gitconfig` bằng cách mở `ConfigLevel::Global`.
    - `ConfigScope::Local`: Ghi vào `.git/config` của repository hiện tại.
  - Hỗ trợ các key: `user.name`, `user.email`, `init.defaultBranch`, `pull.rebase`.
- **`src-tauri/src/commands/config.rs`**:
  - Expose 2 Tauri command:
    - `get_git_config(repo_path: Option<String>) -> Result<GitConfigDto, AppError>`
    - `set_git_config(repo_path: Option<String>, scope: ConfigScope, key: String, value: String) -> Result<(), AppError>`
  - Đăng ký vào builder trong `src-tauri/src/lib.rs`.

### 2.2 DTOs (Specta Data Transfer Objects)
```rust
#[derive(Serialize, Deserialize, specta::Type, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ConfigScope {
    Global,
    Local,
}

#[derive(Serialize, Deserialize, specta::Type, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GitConfigDto {
    pub user_name: Option<String>,
    pub user_name_source: Option<ConfigScope>,
    pub user_email: Option<String>,
    pub user_email_source: Option<ConfigScope>,
    pub default_branch: Option<String>,
    pub pull_rebase: Option<bool>,
}
```

---

## 3. Kiến trúc Tầng Frontend (React + Zustand + Tailwind)

### 3.1 Store mở rộng (`src/store/useSettingsStore.ts`)
Bổ sung các trường và action:
- `isSettingsOpen: boolean`
- `activeTab: 'profile' | 'appearance' | 'behavior'`
- `openSettings: (tab?: 'profile' | 'appearance' | 'behavior') => void`
- `closeSettings: () => void`

### 3.2 Cấu trúc Thư mục Giao diện
```
src/components/settings/
  SettingsModal.tsx       # Khung modal chính, backdrop, tabs navigation, phím Escape
  tabs/
    GitProfileTab.tsx     # user.name, user.email, scope switcher (Global vs Local), default branch
    AppearanceTab.tsx     # Theme (Light/Dark/System), Locale (vi/en), Mode (Simple/Advanced), Colorblind
    GitBehaviorTab.tsx    # Pull behavior (merge/rebase), auto-fetch interval
```

### 3.3 Thiết kế Giao diện & Trải nghiệm (UI/UX)
- **SettingsModal**:
  - Kích thước: `max-w-2xl w-full h-[520px]`.
  - Hiệu ứng: Áp dụng spring transition motion của GitVista (`motion-preset` / `motion-spring`).
  - Phím tắt: Bấm `Escape` hoặc click ra ngoài backdrop để đóng modal.
- **GitProfileTab**:
  - Scope Switcher: Hai tab con hoặc Segmented Control `[ Toàn máy (Global) | Repository này (Local) ]`.
  - Badge trạng thái: Hiển thị nhãn `Kế thừa từ Global` màu xám nhạt nếu repo chưa đặt giá trị riêng.
  - Nút lưu: "Lưu thông tin Git", gọi `set_git_config` và bắn thông báo Toast thành công.
- **AppearanceTab**:
  - Bộ chọn thẻ Card Radio trực quan cho Theme (☀️ Sáng, 🌙 Tối, 💻 Hệ thống).
  - Thẻ chọn Ngôn ngữ (🇻🇳 Tiếng Việt, 🇬🇧 English).
  - Tùy chọn Simple / Advanced Mode và Công tắc Chế độ mù màu (Colorblind).
- **GitBehaviorTab**:
  - Tùy chọn Git pull: Merge vs Rebase.
  - Tùy chọn Background auto-fetch: Tắt / 5 phút / 15 phút.

### 3.4 Điểm kích hoạt & Phím tắt
- Thêm icon bánh răng ⚙️ vào thanh công cụ [ControlsBar.tsx](file:///d:/project-v3/src/components/ControlsBar.tsx).
- Phím tắt toàn cục: `Ctrl+,` (hoặc `Cmd+,` trên macOS).
- Đăng ký vào Command Palette (`Ctrl+K`): Thao tác "Mở Cài đặt / Open Settings".
- Đăng ký vào bảng trợ giúp phím tắt (`?`).

---

## 4. Xử lý Lỗi & Trường hợp Ngoại lệ (Edge Cases)
1. **Chưa mở Repository**:
   - Khi ở màn hình Welcome hoặc không có repo nào đang mở, `repo_path` là `null`.
   - `GitProfileTab` tự động vô hiệu hóa lựa chọn `Local` và chỉ cho phép cấu hình `Global`.
2. **Máy chưa có `~/.gitconfig`**:
   - `git2::Config::open_default()` xử lý êm dịu; khi ghi key lần đầu, libgit2 tự động tạo file.
3. **Môi trường Dev Browser (`pnpm dev`)**:
   - Khai báo mock IPC trong `src/ipc/bindings.ts` cho `get_git_config` và `set_git_config`, đảm bảo giao diện hoạt động mượt mà khi phát triển không cần Tauri runtime.

---

## 5. Kế hoạch Kiểm thử (Testing)
- **Rust unit tests**:
  - `test_read_git_config_empty_or_defaults`: Đọc cấu hình khi không có file.
  - `test_write_and_read_local_config`: Ghi và đọc lại từ repo fixture tạm thời.
  - `test_write_and_read_global_config`: Ghi vào file config global tạm thời.
- **Vitest tests**:
  - `SettingsModal.test.tsx`:
    - Kiểm tra mở/đóng modal qua phím tắt `Ctrl+,` và phím `Escape`.
    - Kiểm tra chuyển qua lại giữa các Tab.
    - Kiểm tra tương tác đổi Theme/Ngôn ngữ phản ánh ngay tức thì vào store.
    - Kiểm tra form submit gọi đúng IPC và hiển thị Toast.
