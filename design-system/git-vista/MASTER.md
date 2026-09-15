# GitVista Master Design System
**Version**: 1.0.0  
**Design Direction**: Clean Studio Light & Modern Craft (Apple / Notion / Linear Aesthetic)  
**Target Platform**: Desktop (Tauri v2 + React 19 + Tailwind CSS v4)

---

## 1. Triết lý Thiết kế (Design Philosophy)

GitVista được định vị là một công cụ đồ họa trực quan Git chuyên nghiệp dành cho lập trình viên. Thiết kế của GitVista tuân thủ 4 nguyên tắc cốt lõi:

1. **Gọn gàng & Tường minh (Zero Clutter, Maximum Clarity)**:
   - Loại bỏ các chi tiết trang trí thừa thãi, không dùng quầng sáng neon hào nhoáng hay bảng màu u ám gây mỏi mắt khi làm việc 8–10 tiếng/ngày.
   - Bố cục khúc chiết, tỷ lệ không gian thở thoáng đãng (breathable spacing), phân cấp thị giác mạch lạc từ trên xuống dưới.

2. **Chất lượng Hoàn thiện Cao cấp (Modern Craft)**:
   - Sử dụng các đường viền siêu mỏng 1px (`border-border-subtle`), đổ bóng tầng thấp tinh tế (`shadow-xs` / `shadow-sm`), tạo chiều sâu bằng sự xếp lớp tự nhiên giữa bề mặt cửa sổ (`bg-window`) và thẻ nội dung (`bg-surface`).

3. **Công thái học Desktop & Phím tắt là trọng tâm (Keyboard-First Ergonomics)**:
   - Mọi thao tác cốt lõi đều đi kèm phím tắt rõ ràng.
   - Phím tắt luôn được thể hiện dưới dạng kbd tactile (`Ctrl+O`, `Ctrl+N`, `Ctrl+F`, `Ctrl+K`, `?`, `Ctrl+T`).

4. **Dữ liệu Đi đôi với Ngữ cảnh (Contextual Information)**:
   - Không hiển thị dữ liệu khô khan: Các kho chứa luôn hiển thị kèm nhánh Git hiện tại, thời gian truy cập gần nhất dạng tương đối (*"10 phút trước"*, *"Hôm qua"*), và trạng thái làm việc.

---

## 2. Bảng màu & Semantic Design Tokens

Tất cả các thành phần giao diện **BẮT BUỘC** phải sử dụng biến CSS / token ngữ nghĩa thay vì hardcode mã màu hex trực tiếp.

### 2.1 Bảng màu Clean Studio Light (Mặc định)
```css
:root,
[data-theme="light"] {
  /* Nền & Bề mặt */
  --bg-window: #F8FAFC;        /* Nền cửa sổ xám nhạt thanh lịch */
  --bg-surface: #FFFFFF;       /* Bề mặt thẻ, panel nổi tinh khôi */
  --bg-surface-hover: #F1F5F9; /* Trạng thái hover êm dịu */
  --bg-surface-active: #E2E8F0;

  /* Đường viền */
  --border-subtle: #E2E8F0;    /* Viền mỏng 1px ngăn cách tinh tế */
  --border-strong: #CBD5E1;    /* Viền nhấn, phân vùng chính */

  /* Chữ & Phân cấp văn bản */
  --text-primary: #0F172A;     /* Tiêu đề & nội dung chính (tương phản cao) */
  --text-secondary: #475569;   /* Mô tả & nhãn phụ */
  --text-tertiary: #64748B;    /* Đường dẫn, chú thích, kbd, icon mờ */

  /* Màu điểm nhấn (Accent) */
  --accent: #2563EB;           /* Xanh dương hoàng gia chuẩn xác */
  --accent-hover: #1D4ED8;
  --accent-subtle: #EFF6FF;    /* Nền biểu tượng & huy hiệu điểm nhấn */
  --accent-contrast: #FFFFFF;

  /* Trạng thái Git & Phân biệt màu */
  --diff-add-bg: #ECFDF5;      /* Xanh ngọc lục bảo (Thêm / Clone / Clean) */
  --diff-add-text: #065F46;
  --diff-add-border: #A7F3D0;

  --diff-remove-bg: #FFEBE9;   /* Đỏ hồng (Xoá / Cảnh báo huỷ) */
  --diff-remove-text: #82071E;
  --diff-remove-border: #FF8182;

  --warning-bg: #FFFBEB;       /* Hổ phách (Ghim ⭐ / Đang sửa đổi) */
  --warning-text: #B45309;
  --warning-border: #FDE68A;
}
```

### 2.2 Bảng màu Dark Mode (Midnight Charcoal)
```css
[data-theme="dark"] {
  --bg-window: #0F1117;        /* Than chì đen sâu, không đen kịt 100% */
  --bg-surface: #161B22;       /* Bề mặt panel chuẩn GitHub/Linear Dark */
  --bg-surface-hover: #21262D;
  --bg-surface-active: #30363D;

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: #30363D;

  --text-primary: #F0F6FC;
  --text-secondary: #8B949E;
  --text-tertiary: #6E7681;

  --accent: #3B82F6;
  --accent-hover: #60A5FA;
  --accent-subtle: rgba(59, 130, 246, 0.15);
  --accent-contrast: #FFFFFF;

  --diff-add-bg: #12261E;
  --diff-add-text: #3FB950;
  --diff-add-border: #1B4B32;

  --diff-remove-bg: #2D1416;
  --diff-remove-text: #F85149;
  --diff-remove-border: #5C1D24;
}
```

---

## 3. Hệ thống Typography & Phông chữ

### 3.1 Cấu hình Phông chữ
- **UI & Văn bản chung**: `-apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Inter, sans-serif`
- **Mã nguồn, Đường dẫn & Hashes**: `"JetBrains Mono", "SF Mono", "Cascadia Code", monospace`

### 3.2 Tỉ lệ Chữ (Type Scale)
| Cấp độ | Kích thước | Độ đậm (Weight) | Áp dụng |
|---|---|---|---|
| **Display / Hero** | `text-2xl` đến `text-3xl` | `font-extrabold (800)` | Tiêu đề màn hình chào mừng, tên ứng dụng |
| **Section Header** | `text-xs` đến `text-sm` | `font-bold (700)` | Tiêu đề nhóm nội dung, uppercase tracking-wider |
| **Card Title** | `text-sm` đến `text-base` | `font-bold (700)` | Tên repo, tên nút hành động chính |
| **Body Text** | `text-xs` đến `text-sm` | `font-normal (400) / font-medium (500)` | Mô tả thẻ, thông báo, nhãn trường nhập |
| **Code / Subtext** | `text-xs` | `font-mono (400)` | Đường dẫn thư mục, branch name, commit hash |
| **Badge / Pill** | `text-[10px]` đến `text-xs` | `font-semibold (600)` | Tag trạng thái, huy hiệu phiên bản, phím tắt |

---

## 4. Khuôn mẫu Linh kiện Chuẩn (Component Anatomy & Patterns)

Mọi màn hình và component mới được tạo sau này **BẮT BUỘC** phải tuân theo các khuôn mẫu chuẩn dưới đây:

### 4.1 Khung Chứa Bề Mặt (Card Surface Container)
Thẻ bao quanh nhóm nội dung chính:
```tsx
<div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs">
  {/* Header & Content */}
</div>
```

### 4.2 Thẻ Hành Động Chính (Primary Action Card)
Dùng cho các nút hành động lớn có icon + tiêu đề + kbd shortcut:
```tsx
<button
  onClick={handleAction}
  className="group flex items-start gap-4 p-4.5 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-accent rounded-xl text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md min-h-[92px]"
>
  <div className="w-11 h-11 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
    <Icon size={22} />
  </div>
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm sm:text-base font-bold text-primary group-hover:text-accent transition-colors">
        Tiêu đề hành động
      </span>
      <kbd className="text-xs font-mono text-tertiary bg-window px-2 py-0.5 rounded border border-border-subtle shrink-0">
        Ctrl+O
      </kbd>
    </div>
    <p className="text-xs text-secondary mt-1 leading-relaxed">
      Mô tả ngắn gọn hành động cho người dùng
    </p>
  </div>
</button>
```

### 4.3 Dòng Danh Sách Tương Tác (Interactive List Row)
Dùng cho danh sách repository, commit, nhánh, file thay đổi:
```tsx
<div
  onClick={handleSelect}
  className="group flex items-center justify-between p-3 rounded-xl bg-transparent hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all cursor-pointer gap-2.5"
>
  <div className="flex items-center gap-3 min-w-0 flex-1">
    <div className="w-8 h-8 rounded-lg bg-window border border-border-subtle flex items-center justify-center text-secondary group-hover:text-accent group-hover:border-accent transition-colors shrink-0">
      <ItemIcon size={15} />
    </div>
    <div className="flex flex-col min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm text-primary group-hover:text-accent transition-colors">
          Tên mục
        </span>
        {/* Badge trạng thái nếu có */}
      </div>
      <span className="text-xs font-mono text-tertiary truncate mt-0.5">
        Thông tin phụ (đường dẫn, commit...)
      </span>
    </div>
  </div>

  <div className="flex items-center gap-2 shrink-0">
    {/* Metadata (thời gian, status) */}
    <span className="text-xs text-tertiary hidden sm:inline-block">10 phút trước</span>
    
    {/* Action buttons (chỉ hiện khi hover) */}
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
      <button className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-window text-secondary hover:text-primary transition-all cursor-pointer">
        <ActionIcon size={14} />
      </button>
    </div>

    <ArrowRight size={16} className="text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
  </div>
</div>
```

### 4.4 Các Huy Hiệu Trạng Thái (Status Badges / Chips)
- **Huy hiệu Nhánh Git (Branch)**:
  ```tsx
  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
    main
  </span>
  ```
- **Huy hiệu Ghim (Pinned ⭐)**:
  ```tsx
  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
    ⭐ Ghim
  </span>
  ```
- **Huy hiệu Phiên bản / Badge phụ**:
  ```tsx
  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
    v0.1
  </span>
  ```

### 4.5 Ô Tìm Kiếm & Lọc (Search / Filter Field)
```tsx
<div className="relative w-full max-w-[240px]">
  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
  <input
    type="text"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Lọc danh sách..."
    className="w-full text-xs sm:text-sm pl-8 pr-7 py-1.5 bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent transition-all font-medium"
  />
  {query && (
    <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary p-0.5">
      <X size={13} />
    </button>
  )}
</div>
```

### 4.6 Vùng Kéo Thả (Dropzone Strip)
```tsx
<div
  onClick={handleBrowse}
  className="p-3.5 rounded-xl bg-surface/70 border border-dashed border-border-strong/70 hover:border-accent flex items-center justify-center gap-2.5 text-xs sm:text-sm text-secondary hover:text-primary transition-all cursor-pointer shadow-2xs hover:bg-surface"
>
  <FolderGit2 size={16} className="text-tertiary shrink-0" />
  <span>Kéo thả thư mục Git vào đây hoặc bấm để duyệt</span>
</div>
```

---

## 5. Quy Chuẩn Khoảng Cách, Bo Góc & Chuyển Động (Spacing & Motion)

### 5.1 Khoảng cách (Spacing Scale)
- Khung trang chào mừng: Tối đa `max-w-[840px]`, căn giữa dọc/ngang (`my-auto`).
- Khoảng cách giữa các khối lớn: `gap-6` (24px).
- Khoảng cách giữa các thẻ phụ: `gap-3.5` (14px) hoặc `gap-3` (12px).
- Padding thẻ chuẩn: `p-4 sm:p-5`.

### 5.2 Bo Góc (Border Radii)
- Khung lớn, thẻ card: `rounded-xl` (12px) hoặc `rounded-2xl` (16px cho logo container).
- Nút bấm nhỏ, ô input: `rounded-lg` (8px) hoặc `rounded-md` (6px).
- Huy hiệu, badge, avatar đếm: `rounded-full` (9999px).

### 5.3 Chuyển Động & Tương Tác (Motion)
- Thời gian chuyển đổi chuẩn: `duration-200`.
- Easing: `var(--ease-macos)` hoặc `ease-out`.
- Scale nhẹ khi hover nút quan trọng: `group-hover:scale-105 transition-transform`.
- Dịch chuyển nhẹ mũi tên: `group-hover:translate-x-0.5 transition-transform`.
- Phản hồi thị giác tức thời (Copy path đổi icon sang Checkmark xanh trong 2000ms).

---

## 6. Hướng Dẫn Kỹ Thuật Cho Lập Trình Viên & AI Assistants

Khi phát triển hoặc sửa đổi bất kỳ màn hình nào tiếp theo (như `RepoHeader`, `BranchSidebar`, `CommitGraph`, `ChangesScreen`, `ConflictResolver`, Modals...):

1. **Tuân thủ Bảng Token**: Sử dụng `bg-window`, `bg-surface`, `bg-surface-hover`, `border-border-subtle`, `text-primary`, `text-secondary`, `text-tertiary`, `text-accent`, `bg-accent-subtle`.
2. **Không tự ý thêm màu hex lạ**: Mọi màu sắc mới phải phù hợp với bảng màu hoặc bổ sung vào `tokens.css`.
3. **Đa ngôn ngữ 100%**: Mọi văn bản hiển thị trên UI đều phải thông qua hook `useTranslation()` từ `src/i18n`, có đầy đủ cả 2 file `en.ts` và `vi.ts`.
4. **Bảo tồn Phím tắt & Trợ năng**:
   - Tất cả các nút bấm icon phải có `aria-label` và `title`.
   - Các phím tắt phải được hiển thị bằng thẻ `<kbd>` tinh tế.
5. **Kiểm tra Tương phản (WCAG AA)**: Sau mỗi lần thay đổi màu sắc, luôn chạy script:
   ```powershell
   npm run check-contrast
   ```
   để đảm bảo tỷ lệ tương phản luôn đạt tối thiểu `4.5:1`.
