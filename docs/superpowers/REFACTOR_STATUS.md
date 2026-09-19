# Trạng thái tái cấu trúc GitVista

> **Đọc file này trước khi làm tiếp.** Đây là điểm vào duy nhất cho công việc tái cấu trúc — nó cho biết đã làm gì, đang ở đâu, và làm gì tiếp theo.

**Cập nhật**: 2026-09-19
**Nhánh làm việc**: `refactor/phase0-foundation` (chứa cả GĐ0 và GĐ1, chưa merge vào `main`)
**Tiến độ**: 2 / 8 giai đoạn xong, cộng điều kiện tiên quyết của GĐ2 (focus management — mục 5)
**Việc tiếp theo**: Giai đoạn 2 — migrate 26 modal sang `Modal`/`Button`/`Alert`

---

## 1. Bắt đầu lại ở máy khác

```bash
git clone <repo-url> && cd project-v3
git checkout refactor/phase0-foundation
pnpm install

# Xác nhận mọi thứ xanh trước khi làm gì
pnpm lint                     # phải exit 0
pnpm build                    # phải exit 0
pnpm test                     # phải 88 file / 467 test xanh
pnpm check-query-keys         # "No query key literals found..."
pnpm check-comment-language   # "All comments are in English."
```

Nếu một trong năm lệnh trên đỏ, **dừng lại và tìm nguyên nhân** trước khi viết code mới — chúng là mốc chuẩn của nhánh này.

> **Ngôn ngữ:** code, comment, mô tả test và commit message đều viết **tiếng Anh**. Chỉ chuỗi người dùng đọc được (i18n, `aria-label`, `title`) giữ tiếng Việt. Xem `AGENTS.md` → Language. `pnpm check-comment-language` ép buộc điều này.

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

### Điều kiện tiên quyết GĐ2 — Focus management cho `Modal` ✅

Xem **mục 5** để biết chi tiết. Tóm tắt: thêm `useFocusTrap`, gắn vào `Modal`, +23 test.

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
| Test | 73 file / ~370 | **88 file / 467** |
| Query key literal | 75 | **0** |
| `invalidateQueries()` trống | 23 | **1** (cố ý, có comment) |
| Cặp key lệch | 3 | **0** |
| `pnpm lint` | exit 1 | **exit 0** |
| `pnpm build` | exit 0 | exit 0 |

---

## 4. Còn lại: 6 giai đoạn

| GĐ | Nội dung | Rủi ro | Ghi chú |
| --- | --- | --- | --- |
| **2** | Migrate 26 modal sang `Modal`/`Button`/`Alert` | Thấp | ← **Việc tiếp theo.** Điều kiện tiên quyết (focus management) đã xong, xem mục 5 |
| **3** | Bật `tauri-specta`, bỏ `bindings.ts` viết tay, tách mock khỏi `client.ts` | **Cao** | Giá trị lớn nhất cho bảo trì dài hạn. PR riêng. |
| **4** | Tách `ipc/client.ts` (1748 dòng) theo domain | Trung bình | |
| **5** | Migrate sang `features/` từng cái: branch → tag → remote → changes | Thấp mỗi bước | |
| **5b** | Xẻ nhỏ file khổng lồ, gom state modal về union | Trung bình | Làm cùng lúc với GĐ5 cho từng feature |
| **6** | Rust: `with_repo()` thay 58 chỗ lặp, gom `emit_repo_changed` (9 bản, 2 chữ ký) | Thấp | |
| **7** | Nâng lint từ `warn` lên `error` | Không | Khoá kiến trúc lại vĩnh viễn |

---

## 5. Việc PHẢI làm trước Giai đoạn 2 ✅ ĐÃ XONG

**`Modal` đã có focus management** (commit `4bae4be`). Trước đó không có focus trap, không tự focus khi mở, không trả focus về nút đã mở nó — người dùng bàn phím có thể Tab ra khỏi modal vào nội dung nền.

Lý do phải làm **trước** GĐ2: một khi cả 26 modal cùng kế thừa từ primitive này, sửa một chỗ là sửa cho tất cả. Làm sau nghĩa là 26 modal ship khuyết điểm trước rồi mới vá.

Thêm `src/shared/hooks/useFocusTrap.ts` — `useFocusTrap(containerRef, enabled)` — phủ cả ba hành vi:

| Hành vi | Chi tiết |
| --- | --- |
| Focus ban đầu | Vào phần tử `data-autofocus` nếu có, không thì phần tử focus được đầu tiên, không nữa thì chính container |
| Trap | Tab / Shift+Tab cuộn vòng trong container, không ra được nền |
| Trả focus | Khi đóng hoặc unmount, focus về đúng phần tử đã mở modal |

`Modal.tsx` gắn hook vào `modal-panel` qua ref. Để focus vào ô input thay vì nút đầu tiên, đánh dấu `data-autofocus` — **hữu ích cho GĐ2**, phần lớn 26 modal có form nên sẽ cần.

**Hai lỗi thật do test bắt được (thí nghiệm phá, quy ước 3):**

1. **Chọn trap đang hoạt động theo thứ tự đăng ký là sai.** React mount con trước cha, nên modal cha lồng nhau lại đăng ký **cuối** và bị nhầm là trong cùng. Đã đổi sang xét theo quan hệ chứa nhau trong DOM, đăng ký sau thắng khi hoà — để modal stacked render kiểu anh em (đúng như `ManageRemotesModal` đang làm) vẫn chạy đúng.
2. **Trả focus không được cướp lại** khi ứng dụng đã chủ ý chuyển focus đi nơi khác trong lúc đó.

**Ghi chú về chất lượng test:** 5 mutation đều bị giết. Mutation "chọn trap theo thứ tự đăng ký" **ban đầu sống sót** — vì trong test lồng nhau, React mount trap trong trước nên nó tình cờ là phần tử đầu tiên. Phải thêm test cho trường hợp **anh em** (stacked modal) mới giết được. Đây là ví dụ rõ: test xanh không đồng nghĩa test đủ mạnh.

*(Ghi chú cũ: spec từng viết `Modal` "tự lo focus trap" trong khi code không hề có. Spec đã sửa, và giờ điều đó thành sự thật.)*

---

## 6. Nợ kỹ thuật đã ghi nhận (không chặn merge)

| Vấn đề | Mức | Ghi chú |
| --- | --- | --- |
| `App.tsx:284` dùng `part.includes(repo_path)` thay vì so sánh bằng | Minor | Repo `/proj` cũng khớp `/proj-legacy` → thừa refetch, không sai dữ liệu. Giờ `qk` đặt path ở vị trí cố định nên sửa rất dễ. |
| `qk.githubToken()` chưa ai invalidate | Minor | An toàn hiện tại (không có UI ghi token). Sẽ thành bẫy khi thêm màn hình cài đặt token. |
| `qk.github.repoInfo` không được invalidate khi đổi remote URL | Minor | Đã giảm nhẹ ở GĐ1 (`refreshData()` giờ có invalidate), nhưng chưa phủ hết đường. |
| `bindings.ts:270` comment thiếu `"renamed"` so với Rust trả về | Minor | Bằng chứng cho luận điểm bindings viết tay bị lệch. GĐ3 xoá bỏ hẳn. |
| 175 warning lint độ phức tạp | Theo kế hoạch | Giảm dần qua GĐ5b, nâng lên `error` ở GĐ7. |
| `useFocusTrap` coi phần tử là "nhìn thấy được" nếu không có `hidden`/`aria-hidden` | Minor | jsdom trả rect bằng 0 cho mọi thứ nên không dùng kích thước để xét được. Phần tử ẩn bằng CSS (`display:none`) vẫn lọt vào danh sách focus được. Chưa gặp trong thực tế vì modal ẩn nội dung bằng cách không render. |

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

**8. Khi migrate modal có form, cân nhắc `data-autofocus`.** Mặc định focus rơi vào phần tử focus được đầu tiên trong panel — thường là nút X ở header, không phải ô nhập. Modal nào có ô nhập chính thì đánh dấu `data-autofocus` lên ô đó.

**9. Viết tiếng Anh.** Comment, mô tả test, chuỗi fixture trong test, và commit message. Ngoại lệ duy nhất: chuỗi người dùng đọc được trong app (`src/i18n/*`, `aria-label`, `title`) — giữ tiếng Việt. `pnpm check-comment-language` ép buộc, xem `AGENTS.md` → Language.

> Quy ước này thêm vào sau khi GĐ0–1 lỡ viết comment tiếng Việt. Đáng chú ý: khi bật guard lần đầu, nó phát hiện **13 comment tiếng Việt có sẵn từ trước refactor** — codebase không đồng nhất như tưởng. Đã dịch nốt.

---

## 8. Nếu muốn merge nhánh này

Nhánh đã ở trạng thái lành mạnh, có thể merge bất cứ lúc nào. Lưu ý: nhánh chứa cả 6 commit landing page (`website/`) từ công việc khác, không liên quan đến refactor.

```bash
pnpm check    # format + lint + query-keys + build + test + rust
```

*(Lưu ý: `pnpm format:check` hiện đỏ do nợ định dạng có sẵn — `main` có 193 file chưa format, nhánh này 187. Nợ này có trước, refactor không gây ra và còn làm giảm đi một ít.)*
