# Trạng thái tái cấu trúc GitVista

> **Đọc file này trước khi làm tiếp.** Đây là điểm vào duy nhất cho công việc tái cấu trúc — nó cho biết đã làm gì, đang ở đâu, và làm gì tiếp theo.

**Cập nhật**: 2026-09-19
**Nhánh làm việc**: `refactor/phase0-foundation` (chứa cả GĐ0 và GĐ1, chưa merge vào `main`)
**Tiến độ**: 2 / 8 giai đoạn xong

---

## 1. Bắt đầu lại ở máy khác

```bash
git clone <repo-url> && cd project-v3
git checkout refactor/phase0-foundation
pnpm install

# Xác nhận mọi thứ xanh trước khi làm gì
pnpm lint          # phải exit 0
pnpm build         # phải exit 0
pnpm test          # phải 87 file / 444 test xanh
pnpm check-query-keys   # phải báo "Không có query key literal..."
```

Nếu một trong bốn lệnh trên đỏ, **dừng lại và tìm nguyên nhân** trước khi viết code mới — chúng là mốc chuẩn của nhánh này.

### Tài liệu liên quan

| File | Nội dung |
| --- | --- |
| `docs/superpowers/specs/2026-09-18-frontend-architecture-refactor-design.md` | Thiết kế tổng thể, 8 giai đoạn, lý do từng quyết định |
| `docs/superpowers/plans/2026-09-18-refactor-phase0-foundation.md` | Kế hoạch GĐ0 (đã xong) |
| `docs/superpowers/plans/2026-09-18-refactor-phase1-querykeys.md` | Kế hoạch GĐ1 (đã xong) |
| `docs/DESIGN_SYSTEM.md` | Design token — nguồn chuẩn cho màu, bo góc, khoảng cách |

---

## 2. Vấn đề ban đầu và số liệu đo được

Yêu cầu là "code duplicate, không có component dùng chung, muốn clean và dễ bảo trì". Khảo sát cho thấy duplicate chỉ là bề mặt:

| Vấn đề | Số liệu khi bắt đầu |
| --- | --- |
| Modal tự dựng overlay | 26 file |
| Escape handler lặp | ~30 bản |
| Nút Cancel / Submit | 13 + ~20 biến thể |
| File constants/enums dùng chung | **0** |
| Component gọi thẳng `ipc/client` | 36 / 60 file |
| Query key literal | **75** |
| `invalidateQueries()` trống | **23** |
| Vi phạm độ phức tạp (lint) | 131 |
| `src/ipc/client.ts` | 1748 dòng |
| `src/components/sidebar/BranchSidebar.tsx` | 1327 dòng, 25 `useState` |

**Hai lỗi nghiêm trọng phát hiện khi khảo sát:**

1. **Bug cache** — cùng dữ liệu nhưng key khác chữ (`repo_status` vs `repoStatus`), nên invalidate không khớp và UI hiện dữ liệu cũ. → **Đã sửa ở GĐ1.**
2. **`src/ipc/bindings.ts` viết tay** dù `tauri-specta` đã cài sẵn — 77 command Rust và 81 hàm TS đồng bộ thủ công, mất an toàn kiểu compile-time. → **Chưa sửa, là GĐ3.**

---

## 3. Đã làm được gì

### Giai đoạn 0 — Nền tảng ✅

Tạo tầng `domain/` và `shared/` **mà không sửa một dòng code ứng dụng nào**.

```
src/domain/
├─ queryKeys.ts          nguồn chân lý duy nhất cho cache key
├─ enums.ts              CHANGE_TYPE, PR_STATE, CHECK_STATUS, CONFIG_SCOPE, SCREEN_TYPE
└─ constants/
   ├─ ui.ts              SHORT_SHA_LENGTH, COPY_FEEDBACK_MS, MODAL_SIZE...
   ├─ motion.ts          MOTION.fast/normal/slow
   └─ zIndex.ts          Z_INDEX.dropdown/overlay/modal/modalStacked/toast

src/shared/
├─ utils/    shortSha(), toErrorMessage()
├─ hooks/    useEscapeKey(), useCopyToClipboard()
└─ ui/       Modal (compound), Button, Alert
```

Kèm theo: bật 6 luật lint độ phức tạp ở mức `warn` (`max-lines` 300, `max-lines-per-function` 80, `complexity` 15, `max-depth` 4, `max-params` 5, `max-nested-callbacks` 3).

**Hai lỗi thật phát hiện ở cuối GĐ0 và đã sửa ngay:**

- `Modal` không biểu diễn được modal lồng nhau. `ManageRemotesModal` render 3 modal con bên trong; hiện chạy được *chỉ nhờ* `z-[9999]` vs `z-[10000]`. `Modal` mới hardcode một z-index → hai modal hoà nhau, thắng thua phụ thuộc thứ tự DOM. Đã thêm `Z_INDEX.modalStacked` và prop `stacked`.
- Một lần Escape đóng **cả hai** modal lồng nhau, vì mỗi instance gắn listener riêng vào `window`. Đã sửa bằng registry cấp module: chỉ instance trên cùng phản hồi.

### Giai đoạn 1 — Query keys và bug cache ✅

Chuyển toàn bộ 75 key literal sang `qk`, sửa dứt điểm bug cache.

**Bug đã sửa, đường đi cụ thể:**

- `CommitGraph.tsx` invalidate `["repo_status"]` — *không kèm đường dẫn repo*
- `ChangesScreen.tsx:29` và `RepoHeader.tsx:36` đọc `["repoStatus", path]`

Hai chuỗi khác nhau → React Query coi là hai cache riêng → sau checkout/revert/cherry-pick từ đồ thị commit, **màn hình Changes và header vẫn hiện trạng thái cũ**.

Giờ cả ba dùng chung `qk.repo.status(path)`. Vì cùng một hàm với cùng tham số nên ra mảng giống hệt nhau — sự phân kỳ **không còn khả năng xảy ra về mặt cấu trúc**, không phải chỉ "đã sửa xong lần này".

Cả ba cặp key lệch đã biến mất: `repo_status`/`repoStatus`, `commit-graph`/`commit_graph`, `github_repo_info`/`github-repo-info`.

**Ba lỗi khác phát hiện thêm trong quá trình làm:**

| Lỗi | Hậu quả nếu không sửa |
| --- | --- |
| `qk.fileDiff` thiếu tham số `ignoreWhitespace` | Bật/tắt "bỏ qua khoảng trắng" dùng chung ô cache → hiện sai diff |
| `qk.compareFileDiff` không tồn tại (key thật có 6 tham số) | Không migrate được, hoặc migrate sai |
| `CreatePullRequestModal` có predicate tìm chuỗi `"github-pull-requests"` — chuỗi đó **không tồn tại trong bất kỳ key nào** | Khớp rỗng → tạo PR xong danh sách sidebar không làm mới |

**Hiệu năng:** 12 lời gọi `invalidateQueries()` trống trong `ChangesScreen` nghĩa là mỗi lần stage một file là xoá sạch cache của *mọi repo đang mở ở tab khác* rồi fetch lại tất cả. Giờ chỉ làm mới repo hiện tại.

**Chống tái phát:** `scripts/check-query-keys.mjs`, nối vào `pnpm check`. (Kế hoạch ban đầu định dùng luật oxlint `no-restricted-syntax` — hoá ra oxlint 1.83 **không có** luật đó, chỉ có các biến thể hẹp. Đã thay bằng script theo tiền lệ `check-contrast.mjs` sẵn có.)

### Số liệu hiện tại

| Chỉ số | Khi bắt đầu | Bây giờ |
| --- | --- | --- |
| Test | 73 file / ~370 | **87 file / 444** |
| Query key literal | 75 | **0** |
| `invalidateQueries()` trống | 23 | **1** (cố ý, có comment) |
| Cặp key lệch | 3 | **0** |
| `pnpm lint` | exit 1 | **exit 0** |
| `pnpm build` | exit 0 | exit 0 |

---

## 4. Còn lại: 6 giai đoạn

| GĐ | Nội dung | Rủi ro | Ghi chú |
| --- | --- | --- | --- |
| **2** | Migrate 26 modal sang `Modal`/`Button`/`Alert` | Thấp | **Phải làm focus management trước** (mục 5) |
| **3** | Bật `tauri-specta`, bỏ `bindings.ts` viết tay, tách mock khỏi `client.ts` | **Cao** | Giá trị lớn nhất cho bảo trì dài hạn. PR riêng. |
| **4** | Tách `ipc/client.ts` (1748 dòng) theo domain | Trung bình | |
| **5** | Migrate sang `features/` từng cái: branch → tag → remote → changes | Thấp mỗi bước | |
| **5b** | Xẻ nhỏ file khổng lồ, gom state modal về union | Trung bình | Làm cùng lúc với GĐ5 cho từng feature |
| **6** | Rust: `with_repo()` thay 58 chỗ lặp, gom `emit_repo_changed` (9 bản, 2 chữ ký) | Thấp | |
| **7** | Nâng lint từ `warn` lên `error` | Không | Khoá kiến trúc lại vĩnh viễn |

---

## 5. Việc PHẢI làm trước Giai đoạn 2

**`Modal` chưa có focus management.** Không có focus trap, không tự focus khi mở, không trả focus về nút đã mở nó khi đóng. Người dùng bàn phím có thể Tab ra khỏi modal vào nội dung nền.

26 modal hiện tại cũng không có, nên đây không phải bước lùi. Nhưng **một khi cả 26 cùng kế thừa từ một primitive, sửa một chỗ là sửa cho tất cả** — bỏ lỡ thời điểm này là bỏ lỡ cơ hội rẻ nhất.

Cần bổ sung vào `src/shared/ui/Modal.tsx`, kèm test cho cả ba hành vi (trap, focus ban đầu, trả focus).

*(Ghi chú: spec từng viết `Modal` "tự lo focus trap" — đó là sai sót của spec, code không hề có. Đã sửa spec nói đúng sự thật.)*

---

## 6. Nợ kỹ thuật đã ghi nhận (không chặn merge)

| Vấn đề | Mức | Ghi chú |
| --- | --- | --- |
| `App.tsx:284` dùng `part.includes(repo_path)` thay vì so sánh bằng | Minor | Repo `/proj` cũng khớp `/proj-legacy` → thừa refetch, không sai dữ liệu. Giờ `qk` đặt path ở vị trí cố định nên sửa rất dễ. |
| `qk.githubToken()` chưa ai invalidate | Minor | An toàn hiện tại (không có UI ghi token). Sẽ thành bẫy khi thêm màn hình cài đặt token. |
| `qk.github.repoInfo` không được invalidate khi đổi remote URL | Minor | Đã giảm nhẹ ở GĐ1 (`refreshData()` giờ có invalidate), nhưng chưa phủ hết đường. |
| `bindings.ts:270` comment thiếu `"renamed"` so với Rust trả về | Minor | Bằng chứng cho luận điểm bindings viết tay bị lệch. GĐ3 xoá bỏ hẳn. |
| 175 warning lint độ phức tạp | Theo kế hoạch | Giảm dần qua GĐ5b, nâng lên `error` ở GĐ7. |

---

## 7. Quy ước khi làm tiếp

Những nguyên tắc này rút ra từ GĐ0–1 và đã nhiều lần chứng minh giá trị:

**1. Không viết query key literal.** Luôn dùng `qk` từ `src/domain/queryKeys.ts`. `pnpm check-query-keys` sẽ chặn.

**2. Ranh giới tầng:** `features → shared → domain`. `shared/ui/**` cấm import `ipc/`, `store/`, `i18n/`.

**3. Mỗi test mới phải qua thí nghiệm phá.** Cố tình làm hỏng implementation, xác nhận test **FAIL**, rồi hoàn nguyên. Không có bước này thì không biết test xanh vì code đúng hay vì test rỗng.

> Điều này đã bắt được vấn đề thật nhiều lần. Rõ nhất: một test "huỷ timer khi unmount" chỉ assert `not.toThrow()` — **xanh dù có cleanup hay không**, vì React 18+ không ném lỗi khi setState trên component đã gỡ.

**4. Không sửa assertion của test cũ cho nó xanh.** Ngoại lệ duy nhất: khi assertion đang *mã hoá chính khuyết điểm* (GĐ1 có 14 assertion pin key thiếu path — giữ nguyên nghĩa là cấm sửa bug vĩnh viễn). Khi đó thay thế phải **mạnh hơn**: dựng từ `qk` chứ không hardcode, giữ đủ số lượng, không nới lỏng.

**5. Migrate là thay thế cơ học.** Không nhân tiện đổi logic fetch, `enabled`, `staleTime`, cấu trúc. Thấy gì muốn cải thiện thì ghi lại, đừng làm luôn.

**6. Khi bỏ tham số khỏi key, phải chứng minh an toàn.** Bỏ một tham số là cách kinh điển tạo va chạm cache. GĐ1 có 2 trường hợp phải truy tới tận source Rust mới kết luận được.

**7. Trailer commit:** `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` — cố định cho nhánh này, không đổi theo model.

---

## 8. Nếu muốn merge nhánh này

Nhánh đã ở trạng thái lành mạnh, có thể merge bất cứ lúc nào. Lưu ý: nhánh chứa cả 6 commit landing page (`website/`) từ công việc khác, không liên quan đến refactor.

```bash
pnpm check    # format + lint + query-keys + build + test + rust
```

*(Lưu ý: `pnpm format:check` hiện đỏ do nợ định dạng có sẵn — `main` có 193 file chưa format, nhánh này 187. Nợ này có trước, refactor không gây ra và còn làm giảm đi một ít.)*
