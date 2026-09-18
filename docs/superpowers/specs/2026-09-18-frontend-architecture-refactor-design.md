# Thiết kế: Tái cấu trúc kiến trúc GitVista

**Ngày**: 2026-09-18
**Trạng thái**: Đã duyệt thiết kế, chờ lập kế hoạch thực thi
**Phạm vi**: Toàn bộ `src/` (frontend) và `src-tauri/src/` (Rust)

---

## 1. Vấn đề

Yêu cầu ban đầu là "code bị duplicate, không có component dùng chung, không có util/const/enum chuẩn". Khảo sát thực tế xác nhận điều đó, nhưng cũng cho thấy duplicate UI chỉ là **triệu chứng bề mặt**. Gốc rễ là **thiếu tầng kiến trúc**: component đang đồng thời gánh render, gọi IPC, quản lý cache và xử lý lỗi.

### 1.1 Bằng chứng đo được

| Vấn đề                                                | Số liệu           |
| ----------------------------------------------------- | ----------------- |
| Modal tự dựng overlay/backdrop                        | 26 file           |
| Escape handler `useEffect` lặp giống hệt              | ~30 bản sao       |
| Nút Cancel lặp                                        | 13 bản, 3 biến thể lệch nhau |
| Nút Submit `bg-accent`                                | ~20 biến thể      |
| `err instanceof Error ? err.message : String(err)`    | 17 chỗ            |
| `setLoading(true)` + try/catch/finally                | 16 chỗ            |
| File constants/enums dùng chung                       | **0**             |
| Component import thẳng `ipc/client`                   | **36 / 60 file**  |
| Query key literal viết tay                            | ~40               |
| `invalidateQueries()` không tham số                   | ~25 chỗ           |
| `src/ipc/client.ts`                                   | 1748 dòng         |
| `src/components/sidebar/BranchSidebar.tsx`            | 1327 dòng         |
| `Repository::open` lặp trong Rust                     | 58 lần / 77 command |

### 1.2 Hai lỗi nghiêm trọng phát hiện trong quá trình khảo sát

**(a) Bug cache — query key lệch tên khiến invalidate trượt.**

Cùng một dữ liệu nhưng được đặt key khác nhau ở các file khác nhau:

- `["repo_status"]` vs `["repoStatus"]`
- `["commit-graph"]` vs `["commit_graph"]`
- `["github_repo_info"]` vs `["github-repo-info"]`
- `["repo_head_info"]` vs `["repoHeadInfo"]`

`invalidateQueries({ queryKey: ["commit-graph"] })` **không** làm mới `["commit_graph"]`. Hậu quả: UI hiển thị dữ liệu cũ sau thao tác Git. Lỗi này hiện đang bị **che giấu** bởi ~25 lời gọi `invalidateQueries()` không tham số — chúng xoá sạch toàn bộ cache nên "có vẻ chạy đúng", đổi lại là refetch thừa toàn bộ và mất hiệu năng.

**(b) `src/ipc/bindings.ts` (486 dòng) được viết TAY dù dự án đã cài `tauri-specta`.**

`lib.rs` ghi chú rõ đây là chủ ý, lý do là `invokeCommand` có hình dạng riêng và có mock cho browser dev. Hậu quả: 77 command Rust ↔ 81 hàm TypeScript **đồng bộ thủ công**. Đổi một field trong struct Rust thì TypeScript vẫn compile xanh, lỗi chỉ nổ lúc runtime. Đây là lỗ hổng an toàn kiểu nghiêm trọng nhất của dự án và đi ngược trực tiếp mục tiêu bảo trì dài hạn.

Nguyên nhân kỹ thuật: mock data cho browser dev bị nhét chung vào `client.ts`, chiếm phần lớn 1748 dòng của file đó.

### 1.3 Điều quan trọng hơn số dòng lặp: các bản sao đã phân kỳ

`DeleteTagModal` và `PruneConfirmModal` cùng là modal xác nhận nhưng khác nhau ở:

|              | DeleteTagModal      | PruneConfirmModal   |
| ------------ | ------------------- | ------------------- |
| Chiều rộng   | `max-w-115`         | `max-w-md`          |
| Bo góc       | `rounded-sm`        | `rounded-lg`        |
| z-index      | `z-[9999]`          | `z-[10000]`         |
| Backdrop     | `backdrop-blur-sm`  | `backdrop-blur-xs`  |

Đây không còn là dư thừa mà là **UI đang không nhất quán**. Mỗi modal mới lại copy một biến thể ngẫu nhiên, nên độ lệch tăng dần theo thời gian.

---

## 2. Mục tiêu

1. Thêm một tính năng mới = **thêm một thư mục**, không phải sửa rải rác nhiều file.
2. Ranh giới kiến trúc được **CI ép buộc**, không phụ thuộc kỷ luật con người.
3. Type giữa Rust và TypeScript **an toàn tại thời điểm compile**.
4. Loại bỏ duplicate UI bằng primitives dùng chung, chuẩn hoá theo `docs/DESIGN_SYSTEM.md`.
5. Sửa dứt điểm bug cache ở mục 1.2(a).

### Ngoài phạm vi

- Thêm tính năng người dùng mới.
- Đổi thư viện (giữ React Query, Zustand, Tailwind v4, git2).
- Viết lại module `read`/`write`/`exec` phía Rust (đã tách sạch).

---

## 3. Kiến trúc mục tiêu

### 3.1 Bốn tầng, phụ thuộc một chiều

```
┌──────────────────────────────────────────────────────────┐
│  features/     nghiệp vụ theo tính năng (branch, tag...)  │
├──────────────────────────────────────────────────────────┤
│  shared/       ui/ primitives thuần + hooks dùng chung    │
├──────────────────────────────────────────────────────────┤
│  domain/       queryKeys, enums, constants — tầng đáy     │
├──────────────────────────────────────────────────────────┤
│  ipc/          bindings sinh tự động + wrapper theo domain│
└──────────────────────────────────────────────────────────┘
          Phụ thuộc chỉ đi XUỐNG. Không bao giờ đi lên.
```

### 3.2 Cấu trúc thư mục

```
src/
├─ app/                          khởi tạo, provider, layout gốc
├─ domain/
│   ├─ queryKeys.ts              nguồn chân lý DUY NHẤT cho cache
│   ├─ enums.ts                  ChangeType, ConflictSide, PullRequestState...
│   └─ constants/
│       ├─ zIndex.ts             thang bậc z-index
│       ├─ ui.ts                 kích thước modal, breakpoint
│       └─ motion.ts             thời lượng/easing animation
├─ ipc/
│   ├─ bindings.generated.ts     tauri-specta SINH — cấm sửa tay
│   ├─ invoke.ts                 wrapper mỏng quanh tauri invoke
│   ├─ tag.ts branch.ts remote.ts ...   khớp module Rust
│   └─ mock/                     mock cho browser dev, chỉ nạp ở dev/test
├─ shared/
│   ├─ ui/                       Modal, Button, Alert, Field, Spinner
│   ├─ hooks/                    useEscapeKey, useAsyncAction, useFocusTrap
│   └─ utils/                    toError, formatters
└─ features/
    ├─ branch/  { api/  components/  index.ts }
    ├─ tag/     { api/  components/  index.ts }
    ├─ remote/  { api/  components/  index.ts }
    ├─ changes/ { api/  components/  index.ts }
    └─ ...
```

Mỗi feature tự chứa: lệnh gọi backend (`api/`), giao diện (`components/`), và một cổng public duy nhất (`index.ts`).

### 3.3 Năm quy tắc bất biến

1. Phụ thuộc chỉ đi xuống: `features → shared → domain`.
2. `features/a` **không** import `features/b`. Cần dùng chung thì đẩy xuống `shared/`.
3. `shared/ui/` **không** import `ipc/`, `store/`, `i18n/`. Nhận mọi thứ qua props.
4. Component **không** gọi `invokeCommand` trực tiếp. Luôn đi qua `features/*/api`.
5. **Không** viết query key literal. Luôn dùng `domain/queryKeys`.

Quy tắc 1–4 được ép bằng `no-restricted-imports` của oxlint (xem mục 6). Đây là điểm phân biệt "kiến trúc trên giấy" và "kiến trúc còn sống sau hai năm".

---

## 4. Thiết kế chi tiết

### 4.1 `domain/queryKeys.ts` — sửa bug cache

```ts
export const qk = {
  repo: {
    status: (repo: string) => ["repo", repo, "status"] as const,
    head: (repo: string) => ["repo", repo, "head"] as const,
    all: (repo: string) => ["repo", repo] as const,
  },
  branches: (repo: string) => ["repo", repo, "branches"] as const,
  tags: (repo: string) => ["repo", repo, "tags"] as const,
  remotes: (repo: string) => ["repo", repo, "remotes"] as const,
  commitGraph: (repo: string) => ["repo", repo, "commitGraph"] as const,
} as const;
```

Key phân cấp có tiền tố `["repo", repoPath]` cho phép invalidate theo phạm vi: làm mới toàn bộ một repo bằng `qk.repo.all(path)`, hoặc chỉ một phần bằng key cụ thể. Nhờ đó ~25 lời gọi `invalidateQueries()` trống được thay bằng invalidate đúng phạm vi, vừa sửa bug vừa tăng hiệu năng.

### 4.2 `shared/ui/Modal.tsx` — compound component

Chọn compound thay vì boolean props. Lý do: thân của 26 modal rất khác nhau (form, checkbox, danh sách, cảnh báo). Dùng props kiểu `showCheckbox` / `showWarning` / `dangerMode` sẽ đẻ ra hơn 15 boolean — đúng cái bẫy đang muốn tránh.

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="md" labelledBy="delete-tag-title">
  <Modal.Header icon={Trash2} tone="danger" title={t.modals.deleteTag.title} onClose={onClose} />
  <Modal.Body>{/* nội dung riêng từng modal */}</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>
      {t.common.cancel}
    </Button>
    <Button variant="danger" loading={loading} onClick={run}>
      {t.modals.deleteTag.submit}
    </Button>
  </Modal.Footer>
</Modal>
```

`Modal` tự lo: backdrop, Escape, focus trap, `role="dialog"`, `aria-modal`, `stopPropagation`, z-index. Modal con không viết lại các thứ đó nữa.

`size` ánh xạ sang token cố định (`sm | md | lg | xl`) lấy từ `docs/DESIGN_SYSTEM.md`, xoá bỏ phân kỳ `max-w-115` vs `max-w-md`.

### 4.3 `shared/ui/Button.tsx`

Variant: `primary | secondary | danger | ghost`. Có sẵn trạng thái `loading` (hiện `Loader2` xoay) và `disabled`. Thay thế 13 nút Cancel và ~20 biến thể nút submit.

### 4.4 `shared/hooks/useAsyncAction.ts`

Đóng gói mẫu lặp 16 lần: loading → try → toast thành công → catch → `mapGitError` → toast lỗi → finally.

```ts
const { run, loading, error } = useAsyncAction(
  () => ipc.tag.delete(repoPath, tagName, deleteRemote),
  {
    successMessage: t.modals.deleteTag.successToast,
    invalidate: [qk.tags(repoPath), qk.commitGraph(repoPath)],
    onSuccess,
  }
);
```

### 4.5 Tầng `features/*/api`

```ts
// features/tag/api/useDeleteTag.ts
export function useDeleteTag(repoPath: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: DeleteTagVars) => ipc.tag.delete(repoPath, v.name, v.deleteRemote),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.repo.all(repoPath) }),
  });
}
```

Component chỉ gọi `useDeleteTag()`. Không biết IPC, không biết query key, không biết cache. Đổi signature phía Rust chỉ phải sửa một file.

### 4.6 `ipc/` — bỏ bindings viết tay

Tách ba trách nhiệm đang bị trộn trong `client.ts` (1748 dòng):

| File                     | Trách nhiệm              | Nguồn                                      |
| ------------------------ | ------------------------ | ------------------------------------------ |
| `bindings.generated.ts`  | Định nghĩa type          | tauri-specta sinh, cấm sửa tay             |
| `ipc/<domain>.ts`        | Wrapper mỏng quanh `invoke` | Viết tay, tách theo domain khớp module Rust |
| `ipc/mock/`              | Mock cho browser dev     | Viết tay, chỉ nạp ở dev/test               |

Bước này khôi phục an toàn kiểu compile-time giữa Rust và TypeScript. Vì rủi ro cao nên tách thành PR riêng (giai đoạn 3), thực hiện sau khi phần UI đã ổn định.

Cần gỡ `"src/ipc/bindings.ts"` khỏi `ignorePatterns` trong `.oxlintrc.json` và thay bằng `"src/ipc/bindings.generated.ts"`.

### 4.7 Rust

Rust đã tách module sạch (`commands/` → `read`/`write`/`exec`), `AppError` dùng `thiserror` đúng cách, chỉ có 3 chỗ `map_err(|e| e.to_string())` lười. Thay đổi giới hạn ở:

1. **`repo/helpers.rs`** — helper `with_repo()` thay 58 chỗ lặp `Repository::open`:

```rust
pub fn with_repo<T, F>(repo_path: &str, f: F) -> Result<T, AppError>
where
    F: FnOnce(&Repository) -> Result<T, AppError>,
{
    let repo = Repository::open(repo_path)?;
    f(&repo)
}
```

2. **Gom `emit_repo_changed`** — hàm này đang được định nghĩa lặp lại **9 lần** trong `commands/` (`commit_actions`, `conflict`, `github`, `merge`, `rebase`, `remote`, `repo`, `stash`, `tag`), và đã phân kỳ thành **hai chữ ký khác nhau**: `(&str, &str)` ở 6 file, `(String, String)` ở 3 file. Đưa về một hàm dùng chung trong `events/`, thống nhất một chữ ký.

3. **Dọn 3 chỗ `map_err(|e| e.to_string())`** — cả 3 đều nằm trong `commands/undo.rs` (dòng 10, 34, 46). Chuyển sang dùng `AppError` cho nhất quán với 74 command còn lại.

Ghi chú cho giai đoạn 3: `tauri-specta` và `specta-typescript` **đã có sẵn** trong `Cargo.toml`, và các command đã gắn `#[specta::specta]`. Nên GĐ3 chỉ là nối dây phần xuất file, không phải thêm dependency mới — rủi ro thấp hơn so với cảm giác ban đầu, dù vẫn nên tách PR riêng vì nó chạm toàn bộ lớp IPC.

Không viết lại `read`/`write`/`exec`.

---

## 5. Lộ trình thực thi

Tăng dần theo từng feature. Mỗi giai đoạn kết thúc bằng `pnpm check` xanh và commit được. Dừng lại ở bất kỳ ranh giới giai đoạn nào vẫn để lại codebase ở trạng thái lành mạnh.

| GĐ    | Nội dung                                                                    | Rủi ro     | Kiểm chứng                |
| ----- | --------------------------------------------------------------------------- | ---------- | ------------------------- |
| **0** | Dựng `domain/` + `shared/ui` + `shared/hooks`. Chưa đụng code cũ.            | Không      | Test mới cho primitives   |
| **1** | Chuẩn hoá `queryKeys`, thay ~25 `invalidateQueries()` trống. **Sửa bug 1.2(a)** | Thấp       | 73 test sẵn có            |
| **2** | Migrate 26 modal sang `Modal`/`Button`/`Alert`, chuẩn hoá theo DESIGN_SYSTEM.md | Thấp       | Test riêng từng modal     |
| **3** | Bật tauri-specta, tách mock khỏi `client.ts`. **Sửa lỗi 1.2(b)**             | **Cao**    | `pnpm build` + toàn bộ test |
| **4** | Tách `ipc/client.ts` (1748 dòng) theo domain                                | Trung bình | `ipc*.test.ts`            |
| **5** | Migrate sang `features/` từng cái: branch → tag → remote → changes → ...     | Thấp mỗi bước | Test của feature đó    |
| **6** | Rust: `with_repo()`, gom `emit_repo_changed`, dọn `map_err`                 | Thấp       | `cargo test` + `cargo clippy` |
| **7** | Bật lint ranh giới trong CI — khoá kiến trúc lại                            | Không      | `pnpm lint`               |

Giai đoạn 3 mang lại giá trị lớn nhất cho bảo trì dài hạn nhưng cũng rủi ro nhất, nên đứng riêng một PR.

Giai đoạn 5 cho phép cũ và mới sống chung: `components/` và `features/` tồn tại song song cho tới khi feature cuối cùng được chuyển xong.

---

## 6. Ép buộc ranh giới bằng CI

Thêm vào `.oxlintrc.json`:

```jsonc
"rules": {
  "no-restricted-imports": ["error", {
    "patterns": [
      { "group": ["**/ipc/*"],
        "message": "Component phải gọi qua features/*/api, không import ipc trực tiếp." },
      { "group": ["**/features/*/components/*", "**/features/*/api/*"],
        "message": "Import qua features/<name>/index.ts, không chọc vào nội bộ feature." }
    ]
  }]
}
```

Kèm override cho phép `features/*/api` được import `ipc/`, và `shared/ui/` bị cấm import `ipc`/`store`/`i18n`.

Không có bước này, kiến trúc sẽ mục dần vì lint không chặn được vi phạm.

---

## 7. Chiến lược kiểm thử

Dựa vào **73 test file sẵn có** — gần như mọi modal đều đã có test riêng. Đây là lưới an toàn đủ mạnh cho việc di chuyển code.

- **Code chỉ di chuyển** (giai đoạn 2, 4, 5): không viết test mới. Test sẵn có phải xanh không sửa assertion. Nếu phải sửa assertion nghĩa là hành vi đã đổi — cần dừng lại xem xét.
- **Code mới** (giai đoạn 0): viết test cho `Modal`, `Button`, `useAsyncAction`, `useEscapeKey`, `queryKeys`.
- **Giai đoạn 1**: bổ sung test khẳng định invalidate đúng phạm vi.
- **Giai đoạn 3**: `pnpm build` phải xanh — chính là phép kiểm chứng type an toàn đã khôi phục.
- **Giai đoạn 6**: `cargo test` + `cargo clippy -- -D warnings`.
- Sau mỗi giai đoạn: `pnpm check` (format + lint + build + test + rust:lint + rust:test).

---

## 8. Rủi ro

| Rủi ro                                | Mức        | Giảm thiểu                                                                    |
| ------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| GĐ3 làm hỏng lớp IPC                  | Cao        | PR riêng, không gộp việc khác. `pnpm build` là cổng chặn. Revert được độc lập. |
| Chuẩn hoá style làm đổi UI            | Trung bình | Có chủ ý và đã được duyệt. Token lấy từ DESIGN_SYSTEM.md. Rà soát ảnh trước/sau. |
| Di chuyển thư mục làm vỡ import test  | Trung bình | Từng feature một, chạy test ngay sau mỗi lần di chuyển.                        |
| Refactor kéo dài, bỏ dở giữa chừng    | Trung bình | Mỗi giai đoạn tự đứng vững được. Cũ/mới sống chung an toàn.                    |
| Mock tách ra làm hỏng browser dev mode| Trung bình | Giữ nguyên hành vi mock, chỉ đổi vị trí file. E2E `app.spec.ts` kiểm chứng.    |

---

## 9. Tiêu chí hoàn thành

- [ ] `shared/ui/` có Modal, Button, Alert, Field — không import `ipc`/`store`/`i18n`
- [ ] Không còn query key literal ngoài `domain/queryKeys.ts`
- [ ] Không còn `invalidateQueries()` không tham số
- [ ] 26 modal dùng `Modal` dùng chung; không còn `fixed inset-0` tự dựng trong feature
- [ ] `bindings.generated.ts` do tauri-specta sinh; mock nằm ngoài lớp IPC production
- [ ] `ipc/client.ts` 1748 dòng đã tách theo domain
- [ ] Component không import `ipc/` trực tiếp (CI ép)
- [ ] Rust: `with_repo()` thay 58 chỗ lặp; `emit_repo_changed` gom một chỗ
- [ ] `pnpm check` xanh
