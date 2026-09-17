# Design Spec: Multi-Tab Multi-Repo Architecture & 2-Tier Settings

## 1. Mục tiêu (Goals)

Nâng cấp GitVista từ mô hình đơn repo (`single-repo`) sang mô hình đa tab đa repo (`multi-tab multi-repo`) tương tự như GitKraken và Google Chrome, đồng thời tái cấu trúc hệ thống Cài đặt thành 2 tầng phân cấp rõ rệt:

1. **Quản lý Đa Tab & Đa Repository**:
   - Thanh Tab Bar tích hợp ở đỉnh cửa sổ (Window Top Bar), tiết kiệm tối đa diện tích dọc.
   - Luôn có tab **`Home`** (Welcome screen để mở/clone repo mới và xem repo gần đây) cùng các **Repo Tab** (`[📁 repo-name] [branch] [✕]`).
   - Khả năng mở đồng thời nhiều repository, chuyển đổi qua lại giữa các tab với độ trễ 0ms (nhờ cơ chế phân tách cache query key của TanStack React Query).
   - Tự động lưu và khôi phục toàn bộ phiên làm việc (**Session Restore**) khi người dùng tắt và mở lại ứng dụng.
   - Hỗ trợ đầy đủ bộ phím tắt điều hướng tab: `Ctrl+T` / `Cmd+T` (tab mới), `Ctrl+W` / `Cmd+W` (đóng tab), `Ctrl+Tab` / `Ctrl+Shift+Tab` (chuyển tab), `Ctrl+1..9` (nhảy tab).

2. **Hệ thống Cài đặt 2 Tầng Phân Cấp (2-Tier Settings)**:
   - Thanh chuyển đổi Scope trên đỉnh `SettingsModal`: `[🌐 Toàn ứng dụng (Global)]` và `[📁 Repository này (<tên repo>)]`.
   - **Tầng Toàn App (Global Settings)**: Giao diện (Theme, Khiếm thị màu, Ngôn ngữ, Chế độ Simple/Advanced) và Cấu hình Git mặc định toàn cục (`user.name`, `user.email`, `init.defaultBranch`, `pull.rebase`).
   - **Tầng Từng Repo (Per-Repository Settings)**: Cấu hình tác giả và hành vi riêng cho từng repo với công tắc **"Kế thừa từ Global"** hoặc **"Ghi đè cho repo này"** (`git config --local`), kèm nút **"Khôi phục về Global"** (xóa local override).

---

## 2. Kiến trúc Tầng Backend (Rust libgit2 & Tauri IPC)

### 2.1 Cải tiến `RepoManager` (`src-tauri/src/repo/mod.rs`)
Chuyển đổi `RepoManager` từ lưu trữ 1 repo đơn lẻ sang quản lý một bảng băm các repository và watcher độc lập:

```rust
pub struct RepoManager {
    /// Bảng map các repository đang mở theo đường dẫn chuẩn hóa (canonical path)
    active_repos: HashMap<PathBuf, RepoSummary>,
    /// Bộ theo dõi đĩa riêng biệt cho từng repo
    watchers: HashMap<PathBuf, RepoWatcher>,
    /// Quản lý danh sách repository đã mở gần đây
    recent_store: RecentRepoStore,
}
```

Các phương thức nghiệp vụ:
- `open(&mut self, path: P) -> Result<RepoSummary, AppError>`:
  - Mở repository bằng `git2::Repository::open`.
  - Chuẩn hóa đường dẫn (`canonicalize`) để tránh trùng lặp giữa các đường dẫn tương đối hoặc khác biệt ký tự hoa/thường trên Windows.
  - Lưu vào `recent_store` và đưa vào `active_repos`.
  - Trả về `RepoSummary` gồm: `path`, `name`, `is_bare`, `head_branch`, `head_commit_id`.
- `start_watcher<F>(&mut self, repo_path: &Path, on_changed: F) -> Result<(), AppError>`:
  - Nếu đã tồn tại watcher cho đường dẫn này, dừng watcher cũ.
  - Khởi chạy luồng `RepoWatcher` với debounce 200ms và bộ lọc các file nội bộ Git (Deep Module).
  - Lưu watcher vào `watchers`.
- `close_repository(&mut self, repo_path: &Path) -> Result<(), AppError>`:
  - Dừng luồng `RepoWatcher` tương ứng (`watcher.stop()`).
  - Xóa mục khỏi `watchers` và `active_repos`.
  - Giải phóng file lock / handle của hệ điều hành.

### 2.2 Tauri Commands (`src-tauri/src/commands/repo.rs`)
- Cập nhật lệnh `open_repository(app: tauri::AppHandle, path: String) -> Result<RepoSummary, AppError>`:
  - Khởi tạo watcher cho repo cụ thể này và phát sự kiện `repo-changed` chứa payload `{ repo_path, reason, timestamp_ms }`.
- Bổ sung lệnh `close_repository(path: String) -> Result<(), AppError>`:
  - Gọi `RepoManager::close_repository`.
- Bổ sung lệnh `get_open_repositories() -> Result<Vec<RepoSummary>, AppError>`:
  - Trả về danh sách tất cả các repo hiện đang mở và đang được quản lý watcher.

---

## 3. Kiến trúc Tầng Frontend (React + Zustand + React Query)

### 3.1 Cấu trúc Dữ liệu Tab & Session
Định nghĩa trong `src/types/tab.ts` (hoặc `src/store/useTabStore.ts`):

```typescript
export interface TabItem {
  id: string; // 'home' hoặc canonical path của repo
  type: 'home' | 'repo';
  repoSummary?: RepoSummary;
  alias?: string; // Tên hiển thị tùy chỉnh (nếu người dùng đặt)

  // Trạng thái giao diện độc lập của tab:
  activeScreen: 'history' | 'changes' | 'conflict';
  selectedCommitId: string | null;
  selectedFilePath: string | null;
  selectedBranch: string | null;
  activeConflictFile: string | null;
}

export interface TabSessionData {
  openRepoPaths: string[];
  activeTabId: string;
}
```

### 3.2 Zustand Store: `useTabStore` (`src/store/useTabStore.ts`)
Thay thế vai trò của `useRepoStore` và `useViewStore` cục bộ bằng một store quản lý tập trung:
- **State**:
  - `tabs: TabItem[]`: Danh sách các tab (mặc định khởi tạo luôn có tab `Home`).
  - `activeTabId: string`: ID của tab hiện tại (`'home'` hoặc đường dẫn repo).
  - `isRestoringSession: boolean`: Cờ báo đang nạp lại các tab từ phiên trước.
- **Actions**:
  - `openRepoTab(repo: RepoSummary)`: Thêm tab repo mới (hoặc chuyển focus tới tab nếu đã mở sẵn). Cập nhật session storage.
  - `openHomeTab()`: Chuyển focus về tab Home (`activeTabId = 'home'`).
  - `closeTab(tabId: string)`:
    - Nếu tab bị đóng là tab đang active, tự động chuyển sang tab liền kề (hoặc quay về `home` nếu không còn repo tab nào).
    - Gọi IPC `invokeCommand.closeRepository(repoPath)`.
    - Cập nhật session storage.
  - `setActiveTab(tabId: string)`: Đổi tab active.
  - `updateTabState(tabId: string, partial: Partial<TabItem>)`: Cập nhật trạng thái view (screen, commit, file, branch) cho tab tương ứng.
  - `getActiveTab(): TabItem | undefined`: Helper lấy tab hiện tại.
  - `setRepoAlias(repoPath: string, alias: string)`: Đặt tên hiển thị ngắn cho repo.
  - `restoreSession()`: Đọc `gitvista_session_tabs` từ `localStorage`, lần lượt gọi `invokeCommand.openRepository` cho từng path (bỏ qua các path không tồn tại), và thiết lập lại `activeTabId`.

### 3.3 Tích hợp React Query Cache & Sự kiện `repo-changed`
- Trong TanStack React Query, mọi query liên quan đến Git đều được gắn `repoPath` vào `queryKey`:
  - `['commit_graph', repoPath, offset, limit]`
  - `['repo_status', repoPath]`
  - `['branches', repoPath]`
  - `['repoHeadInfo', repoPath]`
- Khi nhận sự kiện `repo-changed` từ backend:
  ```typescript
  listenToRepoChanged((payload) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key.some((part) => part === payload.repo_path);
      },
    });
  });
  ```
  Nhờ vậy, file thay đổi ở repo A sẽ **chỉ làm mới dữ liệu của repo A**, các tab repo khác vẫn giữ nguyên 100% cache và không bị reload lại giao diện.

### 3.4 Giao diện Thanh Tab: `WindowTabBar` (`src/components/header/WindowTabBar.tsx`)
Nằm ở đỉnh cửa sổ ứng dụng:
- Khối bên trái: Các nút điều khiển cửa sổ tiêu chuẩn macOS traffic lights (`🔴 🟡 🟢`) hoặc Windows.
- Khối giữa (Dải Tab có thanh cuộn ngang khi tràn):
  - **Tab Home**: Icon `🏠`, nhãn "Home".
  - **Các Tab Repo**: Icon `📁`, tên repo (hoặc alias), nhãn branch hiện tại (`main`, `feat/...`), nút đóng `✕` (có hiệu ứng hover).
  - Nút **`+`**: Bấm để mở hộp thoại chọn thư mục hoặc chuyển về tab Home để clone.
- Khối bên phải:
  - Nút **`⚙️ Cài đặt`**: Mở modal Cài đặt.
  - Shortcut badge hướng dẫn nhanh.
- Phím tắt toàn cục (`useGlobalShortcuts`):
  - `Ctrl+T` / `Cmd+T`: Mở tab mới.
  - `Ctrl+W` / `Cmd+W`: Đóng tab đang chọn (nếu ở tab Home thì không đóng).
  - `Ctrl+Tab` / `Ctrl+Shift+Tab`: Chuyển đổi tab xoay vòng.
  - `Ctrl+1` .. `Ctrl+8`: Nhảy đến tab số 1..8; `Ctrl+9`: Nhảy đến tab cuối cùng.

---

## 4. Kiến trúc Cài đặt 2 Tầng (2-Tier Settings)

### 4.1 Thanh điều hướng Scope trên `SettingsModal` (`src/components/settings/SettingsModal.tsx`)
Trên thanh tiêu đề của `SettingsModal`, trang bị nút chuyển đổi phân tầng:
```text
[ 🌐 Toàn ứng dụng (Global) ]   [ 📁 Repository này: backend-api ▼ ]
```
- Nếu `SettingsModal` được mở khi đang đứng ở một repo tab: Tự động chọn scope `Repository` của repo đó.
- Nếu mở khi đang ở tab Home: Mặc định chọn scope `Global` (kèm dropdown cho phép chọn bất kỳ repo nào đang mở nếu muốn cấu hình).

### 4.2 Tầng 1: Cài đặt Toàn ứng dụng (Global)
- **Danh mục Profile**:
  - `Global User Name` (`git config --global user.name`).
  - `Global User Email` (`git config --global user.email`).
  - `Tên nhánh mặc định` (`git config --global init.defaultBranch`).
- **Danh mục Giao diện (Appearance)**:
  - Giao diện: Sáng / Tối / Theo hệ điều hành.
  - Hỗ trợ khiếm thị màu (Colorblind).
  - Ngôn ngữ: Tiếng Việt / English.
  - Chế độ hiển thị: Đơn giản (Simple) / Nâng cao (Advanced).
- **Danh mục Hành vi (Behavior)**:
  - Chiến lược Pull mặc định toàn cục (`git config --global pull.rebase`: merge commit vs rebase).

### 4.3 Tầng 2: Cài đặt Từng Repository (Per-Repository)
- **Tác giả cục bộ (Local Profile)**:
  - Switch: `[Kế thừa cấu hình Global] (Inherit)` vs `[Ghi đè cho repo này] (Override)`.
  - Khi ở chế độ Kế thừa: Hiển thị giá trị đang áp dụng từ Global, có nhãn `Kế thừa từ Global`.
  - Khi ở chế độ Ghi đè: Cho phép nhập `user.name` và `user.email` riêng (`git config --local`).
  - Nút **"Khôi phục về Global"**: Gửi lệnh xóa key cục bộ trong `.git/config`.
- **Hành vi Git của Repo (Local Behavior)**:
  - Chiến lược Pull riêng cho repo này (Kế thừa từ Global / Luôn dùng Merge commit / Luôn Rebase / Fast-forward only).
- **Tùy chọn hiển thị Repo**:
  - Tên gợi nhớ (Repo Alias) trên thanh tab.

---

## 5. Kế hoạch Kiểm thử & Xác minh (Verification Plan)

### 5.1 Kiểm thử Tự động (Automated Tests)
1. **Unit test Backend Rust** (`src-tauri/src/repo/mod.rs`):
   - Test mở cùng lúc nhiều repository trong `RepoManager`.
   - Test đóng 1 repository và xác nhận watcher của repo đó đã dừng hoạt động.
   - Test tính năng prune expired backup refs.
2. **Unit test Frontend Store** (`src/test/useTabStore.test.ts`):
   - Test mở tab mới, trùng lặp path không tạo thêm tab mới.
   - Test đóng tab active chuyển sang tab kế tiếp.
   - Test đóng hết tab chuyển về tab `home`.
   - Test lưu và khôi phục session từ `localStorage`.
3. **Component test UI** (`src/test/WindowTabBar.test.tsx`, `src/test/SettingsModal.test.tsx`):
   - Test render thanh TabBar, click chuyển tab, click nút `+`, click nút `✕`.
   - Test thanh chuyển đổi Scope Global vs Repo trong SettingsModal.
4. **Full Test Suite**: Chạy `pnpm test` và `cargo test` để đảm bảo không làm gãy bất kỳ tính năng hiện có nào.

### 5.2 Kiểm thử Thủ công (Manual Verification)
- Khởi động ứng dụng bằng `pnpm dev` hoặc `pnpm tauri dev`.
- Mở liên tiếp 2-3 repository thật trên máy tính:
  - Kiểm tra các tab xuất hiện đúng tên và branch trên thanh tiêu đề.
  - Chuyển đổi giữa các tab và xác nhận cây commit, danh sách file thay đổi chuyển đổi tức thì.
  - Thay đổi một file trong repo 1 ở ngoài editor: xác nhận tab repo 1 tự động reload badge thay đổi mà không ảnh hưởng tab repo 2.
- Kiểm tra tính năng Cài đặt 2 tầng:
  - Chuyển sang scope Global: Đặt tên tác giả chung.
  - Chuyển sang scope Repo 1: Ghi đè tên tác giả riêng -> commit thử nghiệm -> xác nhận author name đúng với cấu hình cục bộ.
- Tắt ứng dụng và mở lại: Xác nhận toàn bộ các tab repo được tự động khôi phục nguyên vẹn.
