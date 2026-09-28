# Trạng thái tái cấu trúc GitVista

> **Đọc file này trước khi làm tiếp.** Đây là điểm vào duy nhất cho công việc tái cấu trúc — nó cho biết đã làm gì, đang ở đâu, và làm gì tiếp theo.

**Cập nhật**: 2026-09-28
**Nhánh làm việc**: `refactor/phase0-foundation` (chứa GĐ0–GĐ4 + GĐ5 lát 1 + GĐ5 lát 2, chưa merge vào `main`). **GĐ5b sống trên nhánh riêng `refactor/phase5b-large-modules`**, rẽ nhánh từ `refactor/phase0-foundation` tại `2e01698` và đã hoà (merge) commit `4fe9bfb` (luật public-index + acyclicity guard) của `refactor/phase0-foundation` vào giữa chừng — xem **mục 12**.
**Tiến độ**: 7 / 8 giai đoạn xong (GĐ0–GĐ6, kể cả GĐ5b). **GĐ7 chia thành 3 lát nhỏ (7a/7b/7c) — 7a đã xong.**
**Việc tiếp theo**: GĐ7b (24 import runtime `ipc/` còn lại, đo bằng `no-restricted-imports`). Bảng lộ trình 7a/7b/7c ở mục 4.

> **GĐ7a đã xong — nâng 7 luật lint đã dọn sạch lên `error`.** `no-console`,
> `typescript/no-explicit-any`, `react/exhaustive-deps`,
> `react/only-export-components`, `max-depth`, `max-params`,
> `max-nested-callbacks` giờ chặn `pnpm lint` khi vi phạm — đã chứng minh
> bằng một probe `any` cố ý (xem mục 3, "Giai đoạn 7a"). Bốn luật còn `warn`
> để dành cho GĐ7b/GĐ7c: `no-restricted-imports`, `max-lines`,
> `max-lines-per-function`, `complexity`. Phát hiện đáng chú ý nhất không
> phải việc mới của lát này mà là một con số cũ bị hiểu sai: `allowTypeImports`
> (thêm ở đầu GĐ7a) cho thấy oxlint đã đếm cả `import type` vào
> `no-restricted-imports` từ trước tới giờ — mốc "70" ở mục 3/6 thổi phồng
> phần việc còn lại tới **46** dòng; con số runtime thật là **24**.

> **GĐ6 đã xong — có sai lệch có chủ đích so với spec.** 9 bản `emit_repo_changed`
> gom về một hàm trong `src-tauri/src/events/mod.rs`; 3 `map_err(|e| e.to_string())`
> trong `commands/undo.rs` đã bỏ. **`with_repo()` không làm** — con người quyết định
> bỏ sau khảo sát (lý do ở mục 3, GĐ6). Gom emitter lộ ra **hai lệnh undo gửi sai
> payload**, khiến frontend xoá sạch cache mọi repo sau mỗi lần hoàn tác.

> **GĐ5b đã xong.** Năm module entry mục tiêu của kế hoạch GĐ5b đều đã dưới
> mốc 300 dòng đo được: `BranchSidebar.tsx` **247**, `CommitGraph.tsx` **140**,
> `CommitDetailPanel.tsx` **211**, `GitBehaviorTab.tsx` **70**,
> `WelcomeScreen.tsx` **202**. Quyết định của con người giữa chừng: ranh giới
> cross-feature co lại thành "chỉ được import qua `index.ts` công khai của
> feature khác" (không còn `CROSS_FEATURE_EXCEPTIONS`). Bốn file khác trong
> `src/features/**` hiện vượt 300 dòng — ghi trung thực ở **mục 12**, không
> xẻ tiếp trong phạm vi task này. Chi tiết đầy đủ ở **mục 12**.

> **GĐ5 lát 2 đã xong.** Feature `remote` và `stash` đều đã migrate:
> `src/components/remote/` và `src/components/stash/` **xoá hẳn**.
> `BranchSidebar` từ 619 chỉ còn nhích xuống **611 dòng** — kế hoạch lát 2 từng
> kỳ vọng dòng "tự rụng" khi remote/stash có feature, thực tế không như vậy vì
> gỡ 7 khối modal bị bù lại bởi interface prop mới và docblock. Chi tiết ở
> **mục 11** — đọc mục đó trước khi làm tiếp.

> **GĐ5 lát 1 đã xong.** Feature `tag` và `branch` đều đã migrate:
> `src/components/sidebar/` giờ chỉ còn `PullRequestsSection.tsx`.
> `BranchSidebar` đã tách từ 1274 xuống 619 dòng — **chưa đạt** mốc 300 dòng
> của kế hoạch; phần còn lại phụ thuộc vào `features/remote` + `features/stash`
> ở lát 2. Chi tiết ở **mục 10**.

> **Còn một việc chưa xác minh của GĐ3:** chạy app Tauri thật để kiểm chứng đầu-cuối (Task 5 trong kế hoạch GĐ3). `pnpm build` xanh chứng minh kiểu khớp, **không** chứng minh dây IPC chạy đúng. Phiên làm GĐ3 không chạy được GUI nên bước này còn nợ. Xem mục 9.

---

## 1. Bắt đầu lại ở máy khác

```bash
git clone <repo-url> && cd project-v3
git checkout refactor/phase0-foundation
pnpm install

# Xác nhận mọi thứ xanh trước khi làm gì
pnpm lint                     # phải exit 0
pnpm build                    # phải exit 0
pnpm test                     # phải 111 file / 762 test xanh
pnpm check-query-keys         # "No query key literals found..."
pnpm check-comment-language   # "All comments are in English."
pnpm check-bindings           # "...is in sync with the Rust commands."
cargo test --manifest-path src-tauri/Cargo.toml   # toàn bộ xanh
```

Nếu một trong các lệnh trên đỏ, **dừng lại và tìm nguyên nhân** trước khi viết code mới — chúng là mốc chuẩn của nhánh này.

> **Ngôn ngữ:** code, comment, mô tả test và commit message đều viết **tiếng Anh**. Chỉ chuỗi người dùng đọc được (i18n, `aria-label`, `title`) giữ tiếng Việt. Xem `AGENTS.md` → Language. `pnpm check-comment-language` ép buộc điều này.

### Tài liệu liên quan

| File | Nội dung |
| --- | --- |
| `docs/superpowers/specs/2026-09-18-frontend-architecture-refactor-design.md` | Thiết kế tổng thể, 8 giai đoạn, lý do từng quyết định |
| `docs/superpowers/plans/2026-09-18-refactor-phase0-foundation.md` | Kế hoạch GĐ0 (đã xong) |
| `docs/superpowers/plans/2026-09-18-refactor-phase1-querykeys.md` | Kế hoạch GĐ1 (đã xong) |
| `docs/superpowers/plans/2026-09-19-refactor-phase3-tauri-specta.md` | Kế hoạch GĐ3 (đã xong, trừ Task 5) |
| `docs/superpowers/plans/2026-09-19-refactor-phase4-split-ipc-client.md` | Kế hoạch GĐ4 (đã xong) |
| `docs/superpowers/plans/2026-09-19-refactor-phase5-features-tag-branch.md` | **Kế hoạch GĐ5 lát 1 (đã xong, 11/11 task)** |
| `docs/superpowers/specs/2026-09-20-refactor-phase5b-large-modules-design.md` | Thiết kế GĐ5b — xẻ nhỏ 5 module entry khổng lồ |
| `docs/superpowers/plans/2026-09-20-refactor-phase5b-large-modules.md` | **Kế hoạch GĐ5b (đã xong, 7/7 task kể cả Task 0')** |
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

### Giai đoạn 2 — Migrate 22 modal ✅

Toàn bộ **22 modal hộp thoại** đã dùng chung `Modal`/`Button`/`Alert`. Làm theo 5 nhóm, mỗi nhóm một commit và chạy đủ bộ kiểm chứng:

| Nhóm | Modal | Commit |
| --- | --- | --- |
| mẫu | DiscardConfirm | `0411953` |
| remote | AddEditRemote, DeleteRemote, PruneConfirm, ManageRemotes | `09962db` |
| branch | CreateBranch, RenameBranch, DeleteBranch, CheckoutConflict | `c43730b` |
| tag/stash | CreateTag, DeleteTag, CreateStash | `337b09e` |
| merge/rebase | MergeBranch, RebaseBranch, InteractiveRebase | `e3a1895` |
| còn lại | CreatePullRequest, Clone, Settings, CherryPick, Revert, Compare, ShortcutsHelp | `5612948` |

Xoá được ~1.400 dòng: 22 overlay tự dựng, 22 Escape handler, ~44 nút bespoke, 6 hack `setTimeout(...)` focus.

**Quy trình:** modal nào thiếu test thì viết **trước**, xác nhận xanh trên code gốc, rồi mới migrate — test không đổi, vẫn xanh. Đó là bằng chứng thay thế cơ học (quy ước 5). Test: 444 → **569**.

**Hai thứ phải thêm vào primitive** thay vì lách ở từng chỗ gọi:

- **Tier `size="full"`** — Settings (85vw) và Compare (`max-w-6xl`) tính theo viewport chứ không theo nội dung; mọi tier cũ đều bóp chúng hẹp lại. `full` đặt `max-w-none` và bỏ `w-full`.
- **Prop `label`** — `CompareModal` đặt tên bằng `aria-label` vì tiêu đề nằm trong `CompareHeader` không có id để trỏ tới.

**Lỗi thật do test bắt được:**

| Modal | Vấn đề |
| --- | --- |
| `RenameBranch` | `focus()` **+ `select()`** qua `setTimeout`. Bản thay thế đầu của tôi sai 2 lần: select lúc value còn rỗng (không ăn), rồi select lại mỗi lần gõ (xoá chữ vừa gõ). Cả hai giờ đều có test. |
| `InteractiveRebase` | Escape chặn khi đang submit nhưng **backdrop thì không** — click ra ngoài huỷ được rebase đang chạy. Đã vá, ghim 2 test. |
| `ManageRemotes` | Test cũ ghim literal `z-[9999]` — chính magic number GĐ0 xoá. Thay bằng assertion suy từ `Z_INDEX`, mạnh hơn. |

**Thay đổi hành vi cố ý (không phải thay thế cơ học), đều có test ghim:**

- `CreateStash` trước không autofocus; dưới `Modal` focus sẽ rơi vào nút X nên trỏ vào ô mô tả.
- `CompareModal` bỏ `if (!isOpen) return null` để có animation đóng như các modal khác.

**Chưa migrate — 4 file có overlay nhưng không phải modal hộp thoại:** `FileInspectorDrawer`, `PullRequestDetailDrawer` (drawer trượt phải), `CommandPalette` (neo đỉnh), `SplashScreen` (không có backdrop/panel). Ép vào `Modal` sẽ phải thêm prop cho từng biến thể layout — đúng thứ compound component sinh ra để tránh. Hai drawer giống nhau gần hết, nếu cần thì tách primitive `Drawer` riêng.

### Giai đoạn 3 — `tauri-specta`, bỏ `bindings.ts` viết tay ✅

`src/ipc/bindings.ts` (486 dòng viết tay) đã bị xoá. Thay bằng `src/ipc/bindings.generated.ts` do `tauri-specta` sinh từ Rust, có check CI chặn drift.

**Cách làm:** giữ `invokeCommand` làm adapter. Một helper `unwrap()` chuyển `{status}` của bindings sinh ra về hình dạng cũ (Promise resolve hoặc reject), ném lỗi **nguyên trạng** để `toErrorMessage` vẫn đọc được `message` của `AppError`. Kết quả: **0 / 291 call site** và **0 / 38 test file mock** phải sửa.

**Cái bẫy lớn nhất — mất nhiều vòng thử mới ra:** xuất bindings cần một binary Rust *chạy được* (`.export()` là lệnh runtime, không phải macro). Mọi binary link `tauri_specta::Builder` phụ thuộc `comctl32.dll` v6, mà Tauri chỉ nhúng manifest Common-Controls v6 vào exe *ứng dụng*. Test binary thiếu manifest → thoát `0xc0000139 STATUS_ENTRYPOINT_NOT_FOUND`, **không in ra gì cả**. `tauri::test::MockRuntime` không cứu được (phụ thuộc đến từ khâu link). Sửa bằng `cargo:rustc-link-arg-tests` trong `build.rs`, đường dẫn manifest phải **tuyệt đối** (đường dẫn tương đối làm mọi crate phụ thuộc đi tìm file trong thư mục của chính nó → `getrandom` gãy khi link).

**Hai lựa chọn xuất bắt buộc, đều có lý do:**

- `dangerously_cast_bigints_to_number()` — specta chặn `i64`/`usize` để tránh mất chính xác, nhưng mọi field ở đây là timestamp/count/index, xa dưới 2^53.
- `enable_lossless_floats()` — không bật thì mọi `f64` ra `number | null` (JSON không tải được NaN/Infinity). Null đó là nhiễu trên field không bao giờ NaN, **và nó che mất 4 field thật sự là `Option<...>`**.

**Lỗi thật phát hiện được — đây chính là lý do giai đoạn này tồn tại:**

| Lỗi | Hậu quả |
| --- | --- |
| **`get_compare_file_diff` nhận `ignore_ws`, client gửi `ignoreWhitespace`** | Tauri bỏ key lạ → backend rơi về `unwrap_or(false)` → **nút "bỏ qua khoảng trắng" ở màn Compare không làm gì cả**. Đã sửa, có test ghim (`d2c3710`) |
| `CommitActionResult.new_commit_id` / `.undo_token` khai `?` nhưng Rust là `Option<String>` (luôn serialize key) | 7 fixture test đang mô phỏng response mà backend không thể gửi |
| `TagItem.timestamp_sec` khai `number` nhưng Rust là `Option<f64>` | Chưa ai đọc field này nên không có hành vi phải sửa; kiểu giờ thành thật, ai dùng sau bị ép xử lý `null` |

**Hai quyết định đáng ghi:**

- Type của GitHub PR (`GitHubPullRequest`, `PullRequestDetail`...) chuyển sang `src/ipc/githubApi.ts`. Chúng mô tả payload REST của GitHub, **không có đối ứng trong Rust** — không có gì để sinh ra chúng.
- Payload event đăng ký bằng `.typ::<T>()` chứ không phải `collect_events!`. `collect_events!` sẽ sinh thêm helper listen theo tên suy từ struct (`repo-changed-payload`) trong khi app emit `"repo-changed"` — helper đó sẽ nghe nhầm kênh.

**Mock tách riêng** sang `src/ipc/mocks.ts` (commit riêng, revert được độc lập). `client.ts`: 1748 → **1347 dòng**.

**Sửa thêm trước khi bắt đầu** (`591c23e`): `test_github_token_storage_lifecycle` đọc/ghi token GitHub **thật** của người dùng. Vì `get_github_token()` có fallback `gh auth token`, máy dev đã đăng nhập `gh` thì assertion `None` nhận token thật **và in nó ra log test**. CI không thấy vì runner không có `gh`. Đã trỏ `GITVISTA_TOKEN_PATH` vào tempdir và ẩn `PATH` trong lúc chạy.

### Giai đoạn 4 — Tách `ipc/client.ts` theo domain ✅

`client.ts` 1347 → **124 dòng**, thành facade thuần tuý. 77 command chuyển sang 16 file domain khớp với `src-tauri/src/commands/`.

**Bản đồ domain suy ra từ Rust, không đoán:** đọc `#[specta::specta]` phía Rust rồi đối chiếu tên lệnh trong `bindings.generated.ts` → **77/77 khớp**, trải trên 13 module.

Chỉ `repo` vượt 300 dòng (28 method, ~389 dòng). Xẻ **theo chỗ `commands/repo.rs` thật sự uỷ quyền tới**, không cắt cho đủ số dòng:

| File | Method | Uỷ quyền tới |
| --- | --- | --- |
| `repo.ts` | 7 | `crate::repo::` (vòng đời) |
| `history.ts` | 8 | `crate::read::` |
| `staging.ts` | 8 | `crate::write::staging` |
| `branch.ts` | 5 | `crate::write::branch` |

**Mọi file IPC viết tay giờ dưới 300 dòng** (lớn nhất: `history.ts` 278).

**Đây là move thuần tuý** — `git diff` cho thấy **0 thay đổi** trong `src/components/`, `src/hooks/`, `src/store/`, `src/services/`, `App.tsx`. 291 call site và 38 test file mock không đụng tới, vì `invokeCommand` gom lại y hệt cũ.

**Một lỗi mà `pnpm build` không bắt được — phải có test riêng:** nếu quên một dòng `...xxxCommands` trong facade, **build vẫn xanh**. Call site vẫn typecheck vì kiểu của facade là kiểu suy ra, chỉ đơn giản là mất method đó — lỗi chỉ lộ lúc chạy. Đã thêm `ipcFacade.test.ts` ghim đúng **77 key** + một đại diện mỗi domain. Thí nghiệm phá: bỏ một spread → cả hai assertion đỏ.

### Giai đoạn 5 lát 1 — Feature `tag` và `branch` ✅

Dựng tầng `features/` và migrate trọn vẹn hai feature đầu tiên. `src/components/tag/` xoá hẳn; `src/components/sidebar/` từ 6 file còn **1** (`PullRequestsSection.tsx`).

Ba thứ mới về mặt kiến trúc:

- **Ranh giới ép bằng test, không chỉ bằng lint.** `architectureBoundaries.test.ts` quét source để ghim hai luật: feature không import feature khác, và chỉ `features/*/api` được chạm `ipc/`. Kèm danh sách ngoại lệ **có tên, có lý do, có điều kiện gỡ** — và một test làm đỏ nếu ngoại lệ còn sống sau khi nguyên nhân đã hết.
- **Hook tự lo invalidation.** Modal không còn nhận `onSuccess` để gọi `invalidateRepo()` hộ; mutation hook tự invalidate `qk.repo.all` trong `onSuccess`. Có test ghim cả chiều ngược: mutation lỗi thì **không** invalidate gì.
- **Union thay cờ rời rạc.** 12 `useState` modal trong `BranchSidebar` gom về một `SidebarDialog`. Hai dialog mở cùng lúc giờ là trạng thái **không biểu diễn được**.

`BranchSidebar` tách từ 1274 → 619 dòng (4 component + 1 hook). **Chưa đạt** mốc 300 dòng của kế hoạch — lý do và phần còn lại ghi ở **mục 10.6**.

Chi tiết đầy đủ, gồm ba lỗi thật phát hiện được, ở **mục 10**.

### Giai đoạn 5 lát 2 — Feature `remote` và `stash` ✅

Dựng `features/remote` và `features/stash`, mỗi feature có `api/` + `components/`. `src/components/remote/` và `src/components/stash/` đều **xoá hẳn**.

**Gỡ được 3/4 ngoại lệ `IPC_IMPORT_EXCEPTIONS` đang mở từ lát 1:** `CheckoutConflictModal` (Task 4) và toàn bộ file `useStashCommands.ts` — xoá hẳn, không phải sửa (Task 5). Còn lại `BranchSidebar`, `DeleteBranchModal`, `StashDiffView` — cả ba đã có lý do và điều kiện gỡ ghi trong `architectureBoundaries.test.ts`.

**`CROSS_FEATURE_EXCEPTIONS` co lại, KHÔNG rỗng — và kế hoạch đã sai khi kỳ vọng nó rỗng.** Hai mục `tag` và `remote` đã gỡ. Còn lại đúng hai mục `["stash"]` (`BranchSidebar`, `CheckoutConflictModal`), vì Task 4 và Task 5 **cố ý** đưa vào hai import `stash/api` bên trong `features/branch` để dùng `useApplyStash`/`usePopStash`/`useDropStash`, và không có task nào trong lát 2 được xếp lịch để gỡ chúng. "Rỗng" chưa từng là khả thi với phạm vi đã lập kế hoạch — đây là lỗi lập kế hoạch bị bắt trong lúc thực thi, không phải một quả bóng bị đá sang lát sau. Tiêu chí thành công đã được sửa lại cho đúng thực tế: phần còn lại là ghép nối **chỉ ở tầng api** — `branch` dùng *hook* của `stash`, không bao giờ dùng *component* của nó — yếu hơn nhiều so với các import component đã gỡ được (`BranchSidebar` từng render thẳng modal của `tag`/`remote` và panel diff của `stash`; giờ `Shell` cung cấp tất cả).

Việc thay Shell cung cấp "cái gì để mở" thay cho import chéo component chính là ví dụ Task 8 — xem quy ước mới ở **mục 7**.

**`BranchSidebar` gần như không nhích: 619 → 611 dòng.** Gỡ 7 khối modal (giao lại cho `Shell`) đúng ra phải cắt sâu, nhưng bị bù lại bởi interface prop mới (`Shell` cần biết state nào để mở dialog nào) và docblock giải thích ranh giới mới. Phần còn cồng kềnh là các domain **chưa có feature**: 2 lệnh tag còn lại (`checkoutTag`/`pushTag`), `mergeBranch`/`rebaseBranch`, `undoDropStash`, và các query trực tiếp `getRemotes`/`getRepoStatus`/`getStashes`/`getTags`. **Đừng coi đây là đã xong** — mốc 300 dòng của kế hoạch gốc còn xa.

**Một lỗ hổng test bị lộ ở Task 8, ghi lại để lát sau vá:** kế hoạch ban đầu định cho `Shell` gọi `renderStashPanel(stash, close)`. Chữ ký đó sẽ **âm thầm phá vỡ toast hoàn tác** — không có test nào bắt được, vì không test nào phủ ba nút hành động (apply/pop/drop) của `StashDiffView`. Đã sửa chữ ký thành `(stash, handlers, close)` trước khi hoà nhánh, nhưng khoảng trống coverage — thiếu test cho 3 nút đó — vẫn còn nguyên. Xem mục 11.4.

Chi tiết đầy đủ ở **mục 11**.

### Giai đoạn 5b — Xẻ nhỏ 5 module entry khổng lồ ✅

**Kế hoạch**: `docs/superpowers/plans/2026-09-20-refactor-phase5b-large-modules.md`, làm trên nhánh riêng `refactor/phase5b-large-modules` (rẽ từ `refactor/phase0-foundation` tại `2e01698`).

Bảy task (Task 1–4, Task 0', Task 5–7) đưa cả 5 module entry mục tiêu xuống dưới 300 dòng đo được: `BranchSidebar.tsx` (247), `CommitGraph.tsx` (140), `CommitDetailPanel.tsx` (211), `GitBehaviorTab.tsx` (70), `WelcomeScreen.tsx` (202) — giảm từ 611/791/764/597/586 dòng lúc bắt đầu (branch/history/history/settings/welcome).

**Quyết định giữa chừng quan trọng nhất — Task 0'.** Một phiên song song trên `refactor/phase0-foundation` đã làm xong luật "feature chỉ được import feature khác qua `index.ts` công khai của nó, cấm import sâu vào `api/`/`components/`/`model/`" (commit `4fe9bfb`), cùng một test bất-chu-kỳ (acyclicity) giữa các feature. Con người quyết định: nhánh GĐ5b phải hoà commit đó vào **giữa** kế hoạch (sau Task 4, trước Task 5) thay vì bỏ qua, vì Task 2 và Task 3 của chính GĐ5b đã **nới rộng** `CROSS_FEATURE_EXCEPTIONS` — vi phạm ràng buộc toàn cục ("Global Constraint") mà bản kế hoạch gốc đặt ra. Task 0' hoà nhánh, xử lý 2 xung đột (giữ code Task 1–4 của `BranchSidebar`, lấy toàn bộ máy phân loại `crossFeatureViolation` mới từ nhánh kia), rồi chuyển mọi import sâu còn sót (`useSidebarActions.ts`, `useSidebarData.ts`) sang import qua `index.ts`. Kết quả: `CROSS_FEATURE_EXCEPTIONS` **biến mất hoàn toàn** khỏi codebase — không còn cơ chế ngoại lệ cross-feature nào, thay bằng luật cứng ép bằng test.

**Ba quyết định của controller (người điều phối) áp dụng xuyên suốt GĐ5b:**

- **IPC chỉ được gọi trong `api/`** cho `settings` và `welcome` — kể cả khi brief chỉ liệt kê `hooks/` không có `api/` (Task 5, Task 6), controller vẫn yêu cầu thêm lớp `api/` mỏng bọc `invokeCommand` để tuân thủ luật `only features/*/api may import ipc/` mà không cần thêm ngoại lệ `IPC_IMPORT_EXCEPTIONS`.
- **Dialog của commit graph do `Shell` cung cấp renderer cụ thể** — theo đúng tiền lệ quy ước 19 (mục 7): feature giữ quyết định *khi nào* mở dialog, `Shell` cung cấp *cái gì* để render, tránh việc `history` phải import chéo component của feature khác.
- **Hook trạng thái repo (`useRepoStatus`) đặt trong `history`**, không phải một feature mới — vì Task 2 cần nó để gỡ import IPC trực tiếp trong `branch`, và `history` đã là chủ sở hữu tự nhiên của dữ liệu trạng thái repo trong luồng UI hiện có.

**Ghi chú môi trường:** pool mặc định (`forks`) của Vitest bị treo (hang) trong worktree Windows liên kết (linked worktree) này trước khi worker nào kịp khởi tạo — không rõ nguyên nhân gốc, không phải lỗi sản phẩm. Toàn bộ xác minh trong worktree này phải dùng `pnpm vitest run --pool=threads`; không sửa `vitest.config.ts`. CI/máy khác chạy `pnpm test` bình thường.

Chi tiết đầy đủ — bảng task/commit, số liệu đo từng bước, danh sách nợ hoãn lại — ở **mục 12**.

### Giai đoạn 6 — Rust: gom `emit_repo_changed`, dọn `map_err` ✅

**Đã làm:**

- **`emit_repo_changed` từ 9 bản sao còn 1 hàm**: `events::emit_repo_changed(&AppHandle, &str, &str)`, cộng thêm `repo_changed_payload()` và hằng `REPO_CHANGED_EVENT`. Trước đó 9 bản đã chia thành 2 chữ ký (`&str` ở 6 file, `String` ở 3 file), và có 3 dạng payload khác nhau.
- **`commands/undo.rs`**: 3 lệnh undo trả `Result<(), AppError>` thay cho `Result<(), String>`, giống 74 lệnh còn lại. Bindings sinh lại, chỉ đổi đúng 3 dòng (`typedError<null, string>` → `typedError<null, AppError>`). Mọi chỗ gọi đã đọc lỗi qua `err.message`/`toErrorMessage` nên không phải sửa. `InteractiveRebaseModal` giờ hiện lỗi thật thay cho câu fallback, vì trước đây lỗi là chuỗi thô, không có `.message`.
- `simulate_repo_change` dùng chung payload builder, nhưng **vẫn tự emit và trả lỗi** thay vì nuốt: lệnh này sinh ra để kiểm tra kênh event.

**Lỗi thật lộ ra khi gom — cùng kiểu với bug cache của GĐ1:**

| Chỗ | Payload cũ | Hậu quả |
| --- | --- | --- |
| `undo_delete_branch`, `undo_drop_stash` | `{ "path": ... }` — thiếu `repo_path`, thiếu `reason` | `App.tsx` không thấy `payload.repo_path` nên rơi vào nhánh `invalidateQueries()` trống → **mỗi lần hoàn tác xoá nhánh hoặc stash là xoá cache của mọi repo ở mọi tab** rồi fetch lại hết. Dữ liệu không sai, chỉ lãng phí. |
| `execute_interactive_rebase` | `serde_json::json!` tự dựng, key `timestamp` thay vì `timestamp_ms` | Không ai đọc timestamp nên chưa có hành vi sai. `ControlsBar` khai kiểu `RepoChangedPayload`, nên kiểu đang nói dối về dữ liệu. |

**Chống tái phát:** `src-tauri/tests/events_test.rs`, 4 test. Test ghim đúng 3 key payload (`reason`, `repo_path`, `timestamp_ms`) và tên kênh. Có một test quét `src/commands/` sẽ đỏ nếu file nào lại chứa `"repo-changed"` hoặc `fn emit_repo_changed` riêng. Thí nghiệm phá (quy ước 3): đổi tên field thành `timestamp` và thêm literal `"repo-changed"` vào `undo.rs` → đúng 2 test tương ứng đỏ.

**Sai lệch có chủ đích so với spec — bỏ `with_repo()`.** Spec (mục 4.8) muốn thay ~60 chỗ `let repo = Repository::open(path)?;` bằng `with_repo(path, |repo| {...})`. Khảo sát cho thấy làm việc này không được gì:

- Mỗi chỗ vốn chỉ có 1 dòng. `?` đã tự chuyển `git2::Error` sang `AppError` (qua `From`), nên helper không gom được logic nào. Bọc closure chỉ thêm một tầng thụt lề cho khoảng 60 hàm.
- Chữ ký của spec (`&Repository`) không dùng được ở 6 chỗ trong `write/stash.rs` cần `&mut`. Nó cũng không hợp với 3 chỗ trong `exec/` mở lại repo giữa chừng (`fresh_repo` sau khi chạy git CLI), và với các chỗ dùng `if let Ok(...)`.

Con người đã chọn bỏ. Nếu sau này cần một chỗ chung để mở repo (ví dụ chuyển sang `Repository::open_ext` với flag), khi đó mới tạo helper `open_repo()` trả `Result<Repository, AppError>`, không dùng closure.

**Kiểm chứng:** `cargo test` **144 passed / 0 failed** (140 + 4 mới); `cargo clippy --all-targets -- -D warnings` sạch; `cargo fmt --check` sạch; `pnpm build`/`pnpm lint` exit 0; frontend **111 file / 762 test** xanh.

### Giai đoạn 7a — Dọn nhanh, nâng 7 luật lên `error` ✅

**Kế hoạch**: `.superpowers/sdd/2026-09-28-refactor-phase7a-lint-quick-wins/` (task 1–7). GĐ7 gốc ("nâng lint từ `warn` lên `error`") bị chia thành ba lát vì hai luật `no-restricted-imports` (24 vi phạm runtime thật) và `max-lines-per-function`/`complexity`/`max-lines` (118 vi phạm) cần dọn code trước khi khoá — không thể nâng cả 11 luật cùng lúc mà không chặn merge nhiều ngày. 7a chỉ nâng bảy luật đã **sẵn 0 vi phạm**.

**Việc đã làm, theo commit:**

| Commit | Nội dung |
| --- | --- |
| `0820516` | Thêm `allowTypeImports` cho `no-restricted-imports`; loại trừ `no-console` cho `scripts/**`; loại trừ `max-lines` cho hai từ điển i18n |
| `676fd6d` | Helper `messageOf` + gõ kiểu 11 `catch` clause — dọn `no-explicit-any` |
| `ab25ad5` + `a082292` | Gõ kiểu payload REST của GitHub trong `githubService`; review bắt được `mapUserLink` thêm fallback `?? "unknown"` làm đổi dữ liệu hiển thị cho assignee/reviewer — sửa bằng kiểu raw bắt buộc field, không thêm fallback |
| `b75f465` | Nốt `any` cuối cùng — đường dẫn file kéo-thả và fixture test |
| `3089f28` | `qk.compareFileDiff` nhận một object option thay vì tham số rời; loại trừ `max-params` cho `src/ipc/**` |
| `fc37a4f` | Sửa hook dependencies, `withoutToast`, `repoUrl.ts`, xoá `console.log` debug còn sót; `useWelcomeShortcuts` giờ gọi callback **mới nhất** thay vì đóng closure ở lần render đầu — có test ghim |
| (commit của task này) | Nâng bảy luật đã 0 vi phạm lên `error`, cập nhật tài liệu này |

**Số lượt vi phạm theo luật, trước → sau (baseline 241 warning):**

| Luật | Trước | Sau | Mức mới |
| --- | --- | --- | --- |
| `no-restricted-imports` | 70 | **24** | `warn` (GĐ7b) |
| `no-console` | 9 | **0** | `error` |
| `max-lines` | 12 | **10** | `warn` (GĐ7c) |
| `typescript/no-explicit-any` | 23 | **0** | `error` |
| `react/exhaustive-deps` | 4 | **0** | `error` |
| `max-params` | 3 | **0** | `error` |
| `max-nested-callbacks` | 1 | **0** | `error` |
| `react/only-export-components` | 1 | **0** | `error` |
| `max-depth` | 0 | **0** | `error` |
| `max-lines-per-function` | 90 | **90** | `warn` (GĐ7c) |
| `complexity` | 28 | **28** | `warn` (GĐ7c) |
| **Tổng** | **241** | **152** | |

**Phát hiện quan trọng nhất không phải là dọn code mới, mà là một con số cũ bị đếm sai.** `no-restricted-imports` từng báo 70 — mốc này được mục 3/6 dùng làm thước đo tiến độ migrate `ipc/`. Thêm `allowTypeImports: true` vào hai pattern của luật (đã có từ commit `0820516`, đầu GĐ7a) làm con số rơi thẳng xuống **24**, không phải vì có 46 chỗ vừa migrate mà vì oxlint **vẫn luôn** tính cả `import type` là vi phạm — nó không phân biệt type-only như `architectureBoundaries.test.ts` (`importsIpcAtRuntime`) đã làm từ GĐ5. Xác nhận bằng ratchet probe (mục dưới): sau khi `allowTypeImports` có hiệu lực, một import kiểu thuần tuý từ `ipc/` không còn bị đếm, chỉ import giá trị mới bị đếm. Nói cách khác: **46 trong 70 dòng "còn phải migrate" trước đây chưa từng là nợ thật** — chỉ là oxlint đếm nhầm. 24 dòng còn lại mới là việc thật của GĐ7b.

**Ba ngoại lệ thêm vào cấu hình, mỗi cái có lý do:**

- `scripts/**` tắt `no-console` — script chạy bằng Node, in ra console là giao diện chính của nó, không phải debug sót.
- `src/i18n/en.ts` / `src/i18n/vi.ts` tắt `max-lines` — từ điển dịch dài theo số lượng chuỗi UI, không phải theo độ phức tạp logic; xẻ nhỏ không có ý nghĩa kiến trúc.
- `src/ipc/**` tắt `max-params` — facade IPC có nhiều hàm nhận tham số 1-1 với command Rust nhiều field; đã có 3 vi phạm hợp lệ trước khi thêm ngoại lệ, không sửa bằng cách gom object vì đó không phải chỗ mất giá trị.

**Một thay đổi hành vi có chủ đích, có test ghim:** `useWelcomeShortcuts` — sửa dependency rỗng ở GĐ5b (mục 6/12.6 từng ghi là "verbatim từ code gốc, không phải regression") giờ khiến hook gọi **callback mới nhất** ở mỗi lần render thay vì đóng (closure) callback của lần render đầu tiên. Đây **là** thay đổi hành vi, không phải thay thế cơ học — được cho phép vì mục đích của GĐ7 là khoá kiến trúc lại, và một callback đóng sai là đúng loại lỗi mà `exhaustive-deps` sinh ra để bắt. Có test ghim hành vi mới.

**Ratchet probe (Step 3, Task 7) — chứng minh luật `error` thật sự chặn:** thêm tạm `const _probe: any = 1; export { _probe };` vào `src/shared/utils/git.ts` → `pnpm lint` thoát mã **1**, dòng `src/shared/utils/git.ts:8:15: error typescript(no-explicit-any): Unexpected \`any\`.` xuất hiện. Xoá probe → `pnpm lint` thoát mã **0** trở lại. Xác nhận đã xoá sạch, `git status` chỉ còn `.oxlintrc.json` và tài liệu này trước khi commit.

**Phát hiện phụ, ghi vào mục 6:** ba test file (`useBranchMutations.test.ts:51`, `useRemoteMutations.test.ts:53`, `useStashMutations.test.ts:44`) có comment tắt luật dạng tên ESLint đứng trước `vars as any` — kết quả đo và ý nghĩa ở mục 6. Không sửa ba file này (đúng theo brief).

**Kiểm chứng đầy đủ (đo tại task này, HEAD trước commit `fc37a4f`):**

| Lệnh | Kết quả |
| --- | --- |
| `pnpm lint` | exit 0 — **152 warning** (90 `max-lines-per-function`, 28 `complexity`, 24 `no-restricted-imports`, 10 `max-lines`); 0 vi phạm ở bảy luật vừa nâng |
| `pnpm build` | exit 0 |
| `pnpm test` | PASS — **113 file / 772 test** |
| `pnpm check-comment-language` | PASS — "All comments are in English." |
| `pnpm check-query-keys` | PASS — "No query key literals found outside src/domain/queryKeys.ts." |

### Số liệu hiện tại

| Chỉ số | Khi bắt đầu | Bây giờ |
| --- | --- | --- |
| Test | 73 file / ~370 | **111 file / 762** (frontend) + **144** Rust (sau GĐ6) |
| Bản sao `emit_repo_changed` | 9 (2 chữ ký, 3 dạng payload) | **1** (`events::emit_repo_changed`) |
| `src/ipc/bindings.ts` viết tay | 486 dòng | **0** (do máy sinh) |
| `src/ipc/client.ts` | 1748 dòng | **124** (facade) |
| File IPC viết tay quá 300 dòng | 1 | **0** |
| Query key literal | 75 | **0** |
| `invalidateQueries()` trống | 23 | **1** (cố ý, có comment) |
| Cặp key lệch | 3 | **0** |
| Modal tự dựng overlay | 26 | **4** (drawer/palette/splash, cố ý) |
| Escape handler lặp | ~30 | **1** (`useEscapeKey`) |
| Nút Cancel/Submit bespoke | 13 + ~20 | **0** (dùng `Button`) |
| Component trong `src/components/` gọi thẳng `ipc/` | 36 / 60 file | **32 / 64 file** ¹ (đo cuối GĐ5 lát 2, chưa đo lại sau GĐ5b) |
| `src/components/sidebar/BranchSidebar.tsx` → `src/features/branch/components/BranchSidebar.tsx` | 1327 dòng, 25 `useState` | **247 dòng** (sau GĐ5b, xem mục 12) |
| `pnpm lint` | exit 1 | **exit 0, 152 warning** (sau GĐ7a — trước GĐ7a là 241; 7 luật giờ `error`: `no-console`, `typescript/no-explicit-any`, `react/exhaustive-deps`, `react/only-export-components`, `max-depth`, `max-params`, `max-nested-callbacks`; 4 luật còn `warn` cho GĐ7b/7c: `no-restricted-imports` 24, `max-lines-per-function` 90, `complexity` 28, `max-lines` 10) |
| `pnpm build` | exit 0 | exit 0 |
| `CROSS_FEATURE_EXCEPTIONS` | chưa tồn tại | **đã xoá hẳn khỏi codebase** (Task 0', GĐ5b) — thay bằng luật public-index + acyclicity test |

> ¹ Mẫu số vẫn đang đổi vì migrate làm file **rời khỏi** `src/components/` sang `features/`, nên so hai con số tuyệt đối qua các lát không có nhiều ý nghĩa. Chỉ số theo dõi tiến độ đáng tin hơn là warning `no-restricted-imports` (**70** sau GĐ5b, tăng nhẹ từ **68** sau GĐ5 lát 2 — feature mới (`settings`, `welcome`, `history`) tạo thêm vài chỗ import kiểu bị oxlint đếm nhầm là runtime; xem mục 12) — nó đếm đúng số chỗ còn gọi thẳng `ipc/`, ở bất kỳ thư mục nào, không phụ thuộc file đó có còn nằm trong `components/` hay không.

---

## 4. Còn lại

| GĐ | Nội dung | Rủi ro | Ghi chú |
| --- | --- | --- | --- |
| **5 lát 1** | ✅ **Xong — 11/11 task.** Hạ tầng `features/` + `tag` + `branch` đã migrate | Thấp mỗi bước | Chi tiết ở **mục 10** |
| **5 lát 2** | ✅ **Xong — 8 task triển khai + 1 task handover.** `remote` + `stash` đã migrate | Thấp mỗi bước | Chi tiết ở **mục 11**. `changes` chưa làm, để lát sau |
| **5b** | ✅ **Xong — 7 task triển khai (Task 1–4, Task 0', Task 5–7).** 5 module entry mục tiêu đều dưới 300 dòng đo được | Trung bình | Chi tiết ở **mục 12**. 4 file khác trong `features/**` vẫn trên 300 dòng — ghi trung thực, không xẻ trong phạm vi GĐ5b |
| **6** | ✅ **Xong.** Gom `emit_repo_changed` (9 → 1), dọn `map_err` trong `undo.rs`. `with_repo()` **bỏ có chủ đích** | Thấp | Chi tiết ở GĐ6, mục 3 |
| **7a** | ✅ **Xong.** Nâng 7 luật đã sẵn 0 vi phạm lên `error` (`no-console`, `typescript/no-explicit-any`, `react/exhaustive-deps`, `react/only-export-components`, `max-depth`, `max-params`, `max-nested-callbacks`) | Không | Chi tiết ở mục 3, "Giai đoạn 7a" |
| **7b** | Dọn 24 warning `no-restricted-imports` còn lại (import runtime `ipc/` trực tiếp), rồi nâng luật lên `error` | Trung bình | Việc tiếp theo |
| **7c** | Dọn 90 `max-lines-per-function` + 28 `complexity` + 10 `max-lines`, rồi nâng cả ba lên `error` | Cao — nhiều file, nhiều lượt xẻ nhỏ | Sau 7b |

---

## 5. Điều kiện tiên quyết của Giai đoạn 2 ✅ ĐÃ XONG

**`Modal` đã có focus management** (commit `4bae4be`). Trước đó không có focus trap, không tự focus khi mở, không trả focus về nút đã mở nó — người dùng bàn phím có thể Tab ra khỏi modal vào nội dung nền.

Lý do phải làm **trước** GĐ2: một khi cả 22 modal cùng kế thừa từ primitive này, sửa một chỗ là sửa cho tất cả. Làm sau nghĩa là 22 modal ship khuyết điểm trước rồi mới vá. (Khảo sát đầu GĐ2 cho thấy trong 26 file có overlay thì 4 cái không phải modal hộp thoại — xem GĐ2 ở mục 3.)

Thêm `src/shared/hooks/useFocusTrap.ts` — `useFocusTrap(containerRef, enabled)` — phủ cả ba hành vi:

| Hành vi | Chi tiết |
| --- | --- |
| Focus ban đầu | Vào phần tử `data-autofocus` nếu có, không thì phần tử focus được đầu tiên, không nữa thì chính container |
| Trap | Tab / Shift+Tab cuộn vòng trong container, không ra được nền |
| Trả focus | Khi đóng hoặc unmount, focus về đúng phần tử đã mở modal |

`Modal.tsx` gắn hook vào `modal-panel` qua ref. Để focus vào ô input thay vì nút đầu tiên, đánh dấu `data-autofocus` — GĐ2 đã dùng nó để thay 6 hack `setTimeout` focus.

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
| 152 warning lint độ phức tạp (đo sau GĐ7a, trước là 241) | Theo kế hoạch | Bảy luật đã nâng lên `error` ở GĐ7a. Còn bốn luật ở `warn`: `no-restricted-imports` **24** (đo tiến độ migrate `ipc/`, giảm từ 70 — 46 trong số đó là `import type` bị đếm nhầm, xem mục 3 "Giai đoạn 7a"), `max-lines-per-function` **90**, `complexity` **28**, `max-lines` **10**. Nâng nốt bốn luật này ở GĐ7b/7c. |
| `BranchSidebar.tsx` — **đã đạt mốc dưới 300 dòng sau GĐ5b** | Đã giải quyết | Đo được **247 dòng** sau Task 2 (GĐ5b), giảm từ 611 dòng cuối GĐ5 lát 2. Tách owner hook `useSidebarActions`/`useSidebarData` + `BranchSidebarSections`. Xem **mục 12.2**. |
| 4 file trong `src/features/**` vượt 300 dòng | Theo kế hoạch, ngoài phạm vi GĐ5b | `ManageRemotesModal.tsx` (319), `BranchSidebarSections.tsx` (313), `RemoteTreeNode.tsx` (312), `CommitGraphRows.tsx` (301) — đo bằng `wc -l`/`git show \| wc -l`, xác nhận khớp nhau. Không phải 5 module entry mục tiêu của GĐ5b nên không xẻ trong task này; ghi lại trung thực để lát sau cân nhắc. Xem **mục 12.2**. |
| `m2_watcher_test::test_watcher_debounce_consolidation` flaky | Minor, có từ trước | Test dựa vào thời gian (debounce 200ms, cửa sổ 350ms). Đỏ 1 lần khi chạy toàn bộ `cargo test` lúc máy đang tải nặng (app dev + rust-analyzer chạy song song). Chạy riêng thì 5/5 xanh, chạy lại toàn bộ cũng xanh. GĐ6 không chạm vào watcher. |
| Thư mục sót `.worktrees/phase5b-large-modules/` | Minor, dọn tay | `git worktree list` không còn liệt kê nó, nhưng thư mục vẫn trên đĩa. Nó không bị `vitest.config.ts` loại trừ, nên `pnpm test` ở máy này đếm **gấp đôi** (222 file / 1524 test). Xoá thư mục, hoặc thêm `.worktrees/**` vào `exclude`. |
| `useFocusTrap` coi phần tử là "nhìn thấy được" nếu không có `hidden`/`aria-hidden` | Minor | jsdom trả rect bằng 0 cho mọi thứ nên không dùng kích thước để xét được. Phần tử ẩn bằng CSS (`display:none`) vẫn lọt vào danh sách focus được. Chưa gặp trong thực tế vì modal ẩn nội dung bằng cách không render. |
| `useSidebarActions.ts:63`-adjacent: toast hoàn tác retained callback | Đã sửa trong GĐ5b | Task 2 tìm và sửa một regression thật (repo-switch undo dùng nhầm mutation của repo mới) trước khi commit; xem **mục 12.4**. |
| `resolveSpecifier` docblock — trường hợp null im lặng; regex trích import có thể khớp cả trong comment/string | Minor, hoãn lại | Phát hiện ở Task 0' (GĐ5b), chưa vá — guard vẫn đúng cho mọi trường hợp thực tế gặp phải, nhưng chưa chứng minh kín 100%. |
| Component settings import `HelpTooltip`/`helpDiagrams` từ `src/components/settings` | Minor, hoãn lại | Feature `settings` (GĐ5b Task 5) vẫn "thò tay" vào `components/` cũ cho hai tiện ích UI dùng chung; chưa có chỗ chuẩn trong `shared/` cho chúng. |
| `SettingsModal` vẫn truyền `onScopeChange` (không dùng) cho `GitBehaviorTab` | Minor, có từ trước | Đã tồn tại trước GĐ5b (component gốc cũng không đọc prop này); giữ nguyên vì "migrate là thay thế cơ học", không sửa hành vi cũ nhân tiện. |
| `clearRecents`/`removeRecent` nuốt lỗi qua `console.warn` | Minor, có từ trước | Có từ code gốc `WelcomeScreen.tsx`, giữ nguyên theo quy ước "migrate là thay thế cơ học". |
| `CommitDetailPanel` lắng nghe Escape trực tiếp trên `window` | Minor, hoãn lại | Nên dùng `useEscapeKey` như mọi nơi khác, nhưng làm vậy đổi hành vi: Escape hiện đóng được panel này **ngay cả khi** có modal khác đang stack đè lên, vì listener không tham gia registry cấp module của `useEscapeKey`. Ghi lại, không sửa trong phạm vi GĐ7a. |
| Comment `// eslint-disable-next-line @typescript-eslint/no-explicit-any` ở `useBranchMutations.test.ts:51`, `useRemoteMutations.test.ts:53`, `useStashMutations.test.ts:44` | Minor, có từ trước | Không phải comment chết: oxlint hiểu tên luật dạng ESLint (`@typescript-eslint/no-explicit-any`) và áp đúng luật `typescript/no-explicit-any` của nó. Xác nhận bằng cách xoá comment ở một file — `pnpm lint` báo `error typescript(no-explicit-any)` đúng dòng `vars as any`; phục hồi comment thì hết lỗi. Vậy cả ba comment đang suppress `any` thật, thứ lẽ ra bị luật `error` mới chặn. Sửa gợi ý cho sau này: gõ kiểu cho ba mock đó rồi bỏ comment, thay vì tiếp tục suppress. |

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

**8b. Test cũ phủ business logic không có nghĩa là an toàn để migrate.** GĐ2 gặp nhiều file có 3–8 test nhưng **không test nào** chạm tới Escape / nút đóng / cancel — đúng phần mà migration thay thế. Luôn đếm số assertion chạm vào phần shell trước khi bắt đầu, không chỉ đếm số test.

**8c. Ba thứ dễ mất im lặng khi đổi sang `Modal`:**

| Thứ | Vì sao mất |
| --- | --- |
| `select()` sau `focus()` | `data-autofocus` chỉ focus. Phải select lại sau khi value đã vào, **một lần mỗi lần mở** (latch), nếu không sẽ select lại mỗi keystroke. |
| Chiều cao cố định (`h-[85vh]`) | Panel của `Modal` chỉ có `max-h`. Body chia scroll bằng `flex-1`/`h-full` cần chiều cao xác định → phải đặt trên wrapper con. **jsdom không có layout engine nên không test nào bắt được.** |
| Guard bất đối xứng | Ví dụ Escape chặn khi đang submit nhưng backdrop thì không. Kiểm tra cả ba đường đóng (Escape / backdrop / nút) xem có cùng guard không. |

**8d. Thiếu gì ở primitive thì thêm vào primitive.** GĐ2 phải thêm `size="full"` và prop `label`. Lách ở từng chỗ gọi thì chỗ thứ hai gặp lại đúng vấn đề đó. Ngược lại, header có subtitle / nút phụ thì **giữ header tự dựng bên trong `Modal`** — đừng nhồi prop vào `Modal.Header`, đó là lối boolean-prop mà compound component sinh ra để tránh.

**9. Viết tiếng Anh.** Comment, mô tả test, chuỗi fixture trong test, và commit message. Ngoại lệ duy nhất: chuỗi người dùng đọc được trong app (`src/i18n/*`, `aria-label`, `title`) — giữ tiếng Việt. `pnpm check-comment-language` ép buộc, xem `AGENTS.md` → Language.

> Quy ước này thêm vào sau khi GĐ0–1 lỡ viết comment tiếng Việt. Đáng chú ý: khi bật guard lần đầu, nó phát hiện **13 comment tiếng Việt có sẵn từ trước refactor** — codebase không đồng nhất như tưởng. Đã dịch nốt.

> `check-comment-language` **chỉ quét `.ts/.tsx/.mjs/.js`**. File `.rs` không bị kiểm — GĐ3 tìm thấy comment tiếng Việt trong `lib.rs` mà guard không hề báo.

**10. Test không được chạm vào trạng thái thật của người dùng.** GĐ3 tìm thấy một test đọc/ghi token GitHub thật và in nó ra log. Điều làm nó nguy hiểm: **CI luôn xanh** vì runner không có `gh` đăng nhập — lỗi chỉ xuất hiện trên máy dev. Test nào chạm tới file cấu hình, biến môi trường hay credential thì phải trỏ vào tempdir, và phải chặn cả **đường fallback** (ở đây là `gh auth token`), không chỉ đường chính.

**11. Bindings sinh ra nghiêm ngặt hơn viết tay — mỗi lỗi kiểu là một drift thật.** Khi `pnpm build` đỏ sau khi đổi sang kiểu sinh ra, đừng ép kiểu cho qua. GĐ3 có 4 lỗi kiểu, **cả 4 đều là chỗ code TS đang nói sai về dữ liệu Rust gửi về** — trong đó một cái là bug người dùng nhìn thấy được.

**12. `pnpm build` xanh không chứng minh IPC chạy đúng.** Nó chứng minh kiểu khớp. Toàn bộ 570 test chạy mock, không test nào gọi Rust thật. Bug `ignoreWhitespace`/`ignoreWs` của GĐ3 tồn tại được lâu đúng vì thế: tên tham số sai chỉ lộ khi payload thật đi qua Tauri. Việc gì đổi tầng IPC thì phải chạy app thật mới coi là xong.

**13. Facade gom bằng spread thì phải có test đếm.** GĐ4 gom 16 object thành `invokeCommand` bằng `...`. Quên một dòng spread → **build vẫn xanh** (kiểu facade là kiểu suy ra, mất method thì call site vẫn hợp lệ theo kiểu mới), lỗi chỉ lộ lúc chạy. Mọi chỗ gom kiểu này cần một test ghim số lượng.

**14. Guard do mình viết cũng phải bị người khác soi.** GĐ5 có một guard chặn import `ipc/` sai tầng. Khi cần cho phép import **kiểu**, tôi nới guard và tự thử phá 4 hướng — thấy xanh, tin là kín. Review tìm ra **3 lỗ** tôi không nghĩ tới: `import "…"` (side-effect, không có `from`), `export { x } from "…"` (không bắt đầu bằng `import`), và `import d, { type X } from "…"` (specifier mặc định nằm ngoài `{}`). Cả 3 đều cho phụ thuộc runtime thật lọt qua.

> Hai bài học tách bạch. **(a)** Khi nới một guard, liệt kê *mọi dạng cú pháp* mà nó phải bắt, đừng chỉ thử dạng mình vừa gặp. **(b)** Guard là code — nó cần test của riêng nó. Giờ có 13 test bảng ghim thẳng hàm kiểm tra (8 dạng phải bắt, 5 dạng phải bỏ qua), thay vì dựa vào việc tôi nhớ thử tay.

**15. Luật lint phải thử trước khi tin là nó tồn tại.** GĐ5 Task 1 dựng một repo tạm để xác minh oxlint 1.83 thật sự có `no-restricted-imports` trước khi viết vào config. Đây là phản ứng trực tiếp với GĐ1: khi đó giả định `no-restricted-syntax` tồn tại, viết xong mới phát hiện oxlint không có luật đó và phải làm lại bằng script. Một lệnh thử mất 2 phút, rẻ hơn nhiều so với viết lại.

**16. Glob không diễn tả được "feature khác".** Luật "`features/a` không được import `features/b`" nghe như việc của lint, nhưng `no-restricted-imports` chỉ so khớp đường dẫn cố định — nó không biết file *đang bị kiểm tra* nằm trong feature nào, nên không viết được luật "mọi feature khác chính nó". Quy tắc này phải ghim bằng **test quét source**. Hệ quả đáng giá: test đọc được thư mục, nên nó cũng giữ được danh sách ngoại lệ có tên kèm điều kiện gỡ — thứ mà một luật lint không làm được.

**17. Khi guard báo đỏ ở chỗ trông vô lý, nghi ngờ guard trước.** GĐ5 Task 10: guard bắt 3 file chỉ import **kiểu** — đúng thứ nó được thiết kế để cho qua. Cám dỗ là thêm 3 ngoại lệ cho xanh. Nguyên nhân thật là lỗi regex: `[\s\S]*?` vượt qua ranh giới câu lệnh nên gộp `import React from "react"` với lệnh import kiểu vài dòng sau thành một. Thêm ngoại lệ ở đây là **giấu lỗi và nới luật vĩnh viễn**.

> Cách phân biệt: ngoại lệ là để ghi một phụ thuộc **có thật** chưa gỡ được. Nếu file không thật sự vi phạm mà vẫn bị bắt, đó là bug của guard, không phải trường hợp cần ngoại lệ.

**18. Hai khối JSX trông giống hệt nhau vẫn phải diff trước khi gộp.** GĐ5 tách `BranchSidebar`: leaf nhánh local và remote nhìn qua là một, gộp lại thành một component parameterised là chuyện hiển nhiên. Diff ra ba khác biệt thật — remote **luôn** checkout khi double-click (local chặn nếu `is_head`), có `aria-label`, không có styling HEAD. Gộp là đổi hành vi mà không test nào bắt được. Tương tự, header TAGS đếm danh sách **chưa lọc** còn thân render danh sách **đã lọc**; gộp thành một prop thì số trên header nhảy theo ô search.

**19. Ranh giới cross-feature gỡ bằng props, không bằng nới luật.** Khi một feature cần mở dialog/modal thuộc miền của feature khác, cám dỗ là nới `CROSS_FEATURE_EXCEPTIONS` hoặc import thẳng component đó. Cách đúng: feature giữ **quyết định khi nào mở** (state/điều kiện vẫn nằm trong feature), còn một chỗ không-phải-feature (`Shell`) cung cấp **cái gì để mở** (component thật, nhận state đó qua props). GĐ5 lát 2 Task 8 là ví dụ thực làm: `BranchSidebar` không còn import thẳng modal của `tag`/`remote` hay panel diff của `stash` — `Shell` render chúng, `BranchSidebar` chỉ phát tín hiệu qua callback/state.

**20. Chuỗi lệnh có điều kiện không gộp được thành một mutation.** `AddEditRemoteModal` (rename → `setRemoteUrl`) và `CheckoutConflictModal` (stash → checkout) đều cần gọi nhiều hook theo thứ tự, không phải một `useMutation` duy nhất. Cờ `loading` phải phủ **toàn bộ chuỗi**, không phải chỉ lệnh cuối — nút bấm được lại giữa hai lệnh (ví dụ trong lúc đang stash mà nút checkout đã sáng lại) là một bug thật, không phải chi tiết vặt.

---

## 8. Nếu muốn merge nhánh này

Nhánh đã ở trạng thái lành mạnh, có thể merge bất cứ lúc nào. Lưu ý: nhánh chứa cả 6 commit landing page (`website/`) từ công việc khác, không liên quan đến refactor.

```bash
pnpm check    # format + lint + query-keys + build + test + rust
```

*(Lưu ý: `pnpm format:check` hiện đỏ do nợ định dạng có sẵn — `main` có 193 file chưa format, nhánh này 187. Nợ này có trước, refactor không gây ra và còn làm giảm đi một ít.)*

---

## 9. Việc còn nợ của Giai đoạn 3 — chạy app thật

**Task 5 của kế hoạch GĐ3 chưa làm.** Phiên thực hiện GĐ3 không chạy được GUI nên không kiểm chứng được đầu-cuối.

Vì sao vẫn quan trọng dù mọi thứ đang xanh: `pnpm build` chứng minh **kiểu khớp**, không chứng minh **dữ liệu chạy đúng qua dây IPC thật**. Toàn bộ 570 test chạy ở mock mode hoặc mock chính `invokeCommand` — không có test nào gọi Rust thật. Đúng loại lỗi vừa tìm thấy ở GĐ3 (`ignoreWhitespace` vs `ignoreWs`) là loại chỉ lộ ra khi payload thật đi qua Tauri.

Cần làm khi có máy chạy được GUI:

```bash
pnpm tauri dev
```

Rồi xác nhận:

- [ ] Mở một repo: danh sách branch, commit graph, màn Changes, danh sách tag đều hiện đúng
- [ ] **Nút "bỏ qua khoảng trắng" ở màn Compare giờ có tác dụng thật** — đây là bug vừa sửa ở `d2c3710`, và nó chỉ kiểm chứng được qua dây IPC thật
- [ ] Tag **nhẹ** (không có tagger) hiển thị được — đó là đường đi của `timestamp_sec: null`
- [ ] Tạo/xoá tag, thêm/xoá remote, stash — các lệnh có ghi dữ liệu
- [ ] `pnpm test:e2e` (`app.spec.ts`) xanh

Nếu có gì sai, nghi ngờ trước hết ở `unwrap()` trong `client.ts` và ở các chỗ `?? null` — đó là hai điểm mà hình dạng dữ liệu bị đổi khi chuyển sang bindings sinh ra.

---

## 10. Giai đoạn 5 lát 1 — ĐÃ XONG (11/11 task)

**Kế hoạch**: `docs/superpowers/plans/2026-09-19-refactor-phase5-features-tag-branch.md`

GĐ5 được **thu hẹp phạm vi**: thay vì làm cả 4 feature trong một lượt, lát 1 chỉ gồm **hạ tầng + `tag` + `branch`**. Remote và changes để lát 2.

### 10.1 Trạng thái từng task

| Task | Nội dung | Trạng thái |
| --- | --- | --- |
| 1 | Hạ tầng `features/` + luật lint ranh giới | ✅ `451a4ef`, `1fa7653` |
| 2 | Test ghim ranh giới tầng | ✅ `5c31606`, `0a9ea30` |
| 3 | `features/tag/api` — 3 hook | ✅ `98a0a6e` |
| 4 | Chuyển 2 modal tag vào feature | ✅ `6a433a4` |
| 5 | Gỡ shim tag, thu hẹp `invalidateRepo` | ✅ `c6db636` |
| 6 | Tách logic cây nhánh ra `model/` | ✅ `8f970b7`, `7717a82` |
| 7 | Union trạng thái dialog | ✅ `70a38b4` |
| 8 | `features/branch/api` — 4 mutation + 1 query | ✅ |
| 9 | Chuyển 4 modal branch vào feature | ✅ |
| 10 | Xẻ nhỏ `BranchSidebar` | ⚠️ xong nhưng **chưa đạt mốc dòng** — xem 10.6 |
| 11 | Cập nhật tài liệu này | ✅ |

### 10.2 Số liệu hiện tại (đo thật, không ước lượng)

| Chỉ số | Đầu GĐ5 | Bây giờ |
| --- | --- | --- |
| Test | 94 file / 572 | **99 file / 618** |
| `pnpm lint` | exit 0 | exit 0 |
| `pnpm build` | exit 0 | exit 0 |
| File `components/` còn import thẳng `ipc/` | 41 | **37** |
| Warning `no-restricted-imports` | — | 76 (đo tiến độ migrate) |
| `BranchSidebar.tsx` | 1332 dòng, 25 `useState` | **619 dòng, 10 `useState`** ² |
| `src/components/sidebar/` | 6 file | **1 file** (`PullRequestsSection.tsx`) |

> **Lưu ý về mốc test:** một ghi chú trung gian từng viết "583 test" — đó là lỗi cộng nhầm. Mốc đúng trước Task 4 là **580**, đo trực tiếp tại commit `98a0a6e`.

> ² Hai con số mốc khác nhau, cả hai đều đúng: **1332** là lúc bắt đầu GĐ5, **1274** là ngay trước khi bắt đầu Task 10 (Task 6 đã rút bớt phần logic cây nhánh ra `model/`).

### 10.3 Feature `tag` — đã migrate trọn vẹn ✅

```
src/features/tag/
├─ api/          useTags, useCreateTag, useDeleteTag (+ test cạnh code)
├─ components/   CreateTagModal, DeleteTagModal
└─ index.ts      cổng public
```

`src/components/tag/` đã **xoá hẳn**, không còn tham chiếu nào.

**Đổi hành vi có chủ đích:** mutation hook tự invalidate `qk.repo.all(repoPath)` trong `onSuccess`. Trước đây modal nhận `onSuccess` và để `BranchSidebar` gọi `invalidateRepo()`. Có test ghim cả hai chiều: đúng key được invalidate, **và** mutation thất bại thì **không** invalidate gì.

**Một regression suýt xảy ra, đã chặn được:** gỡ `qk.tags` khỏi `invalidateRepo()` là đúng cho modal, nhưng `handleCheckoutTag` và `handlePushTag` cũng gọi hàm đó — hai lệnh này gọi IPC thẳng, **không có hook**. Nếu gỡ mà không bù, checkout/push tag xong danh sách tag sẽ đứng yên. Đã bù invalidate riêng trong từng handler, có comment giải thích. Gỡ được khi hai lệnh đó có hook ở lát sau.

### 10.4 Feature `branch` — đã migrate ✅

```
src/features/branch/
├─ api/          useBranches + 4 mutation (checkout/create/rename/delete)
├─ components/   BranchSidebar, BranchTreeNode, RemoteTreeNode,
│                TagSection, StashSection, 4 modal branch
├─ model/        branchTree, sidebarDialog, useStashCommands
└─ index.ts      cổng public
```

**`deleteBranch` trả undo token, không phải `void`.** `UndoIntegration.test.tsx` dựng toast hoàn tác từ giá trị đó. `mutationFn` phải `return`, không được nuốt — có test riêng ghim đúng điều này, vì một `mutationFn` quên `return` vẫn type-check và vẫn qua mọi test khác.

**Union trạng thái dialog.** 12 cờ `useState` rời rạc (cho phép hai dialog mở cùng lúc) gom về một `SidebarDialog`. Trạng thái vô nghĩa giờ **không biểu diễn được**.

### 10.5 Ba lỗi thật phát hiện trong quá trình làm

**(a) Test rỗng trong chính kế hoạch — bắt được trước khi viết code.**

Task 7 của kế hoạch ban đầu có test:

```ts
const kinds = Object.keys(dialog).filter((k) => k === "kind");
expect(kinds).toHaveLength(1);
```

Điều này **đúng với mọi object literal** có field `kind` — nó kiểm tra JavaScript, không kiểm tra union. Không implementation nào làm nó đỏ được. Đã thay bằng hai test đi qua chuyển trạng thái thật.

**(b) Lỗ hổng trong chính guard ranh giới — review bắt được, không phải tự test ra.**

Khi tách `branchTree.ts`, file này cần import **kiểu** `BranchItem` từ `ipc/`. Cách sửa đúng là phân biệt import kiểu với import giá trị — **không** phải nới danh sách ngoại lệ. Bản sửa đầu tiên **không kín**; review tìm ra 3 lỗ: `import "…/ipc/client"` (side effect), `export { x } from "…"` (re-export), và `import d, { type X } from "…"` (default ngoài `{}`). Giờ có **13 test bảng** ghim hàm `importsIpcAtRuntime`.

**(c) Guard đó còn một lỗi nữa — false positive, phát hiện ở Task 10.**

`importsIpcAtRuntime` dùng `[\s\S]*?` giữa `import` và `from`. Lazy quantifier này **vượt qua ranh giới câu lệnh**: với file mở đầu bằng `import React from "react"` rồi vài dòng sau mới `import { type TagItem } from "…/ipc/…"`, regex khớp thành **một** câu lệnh có default specifier → báo vi phạm sai.

Ba file (`RemoteTreeNode`, `StashSection`, `TagSection`) bị bắt oan. Cám dỗ ở đây là thêm chúng vào danh sách ngoại lệ — làm vậy là **giấu lỗi và nới luật**. Cách sửa đúng: đổi `[\s\S]` thành `[^;]` để match không vượt dấu chấm phẩy, và thêm test hồi quy `"a type-only ipc import preceded by other imports"`.

> Bài học: một guard tự nó cũng là code, và cũng cần bị nghi ngờ. Khi guard báo đỏ ở chỗ trông vô lý, kiểm tra guard trước khi kiểm tra ngoại lệ.

### 10.6 Nợ lại từ Task 10 — đọc trước khi làm lát 2

**`BranchSidebar` còn 619 dòng, mốc kế hoạch là dưới 300.** Đã tách 4 component + 1 hook; phần còn lại **không tách tiếp được một cách sạch sẽ** trong phạm vi lát 1, vì nó là logic của những domain chưa có feature:

- query + handler cho `remote` (chờ `features/remote`)
- query + handler cho `stash` (chờ `features/stash`) — đã gom tạm vào `model/useStashCommands.ts`
- `handleCheckoutTag` / `handlePushTag` (chờ hook cho 2 lệnh tag còn lại)
- `mergeBranch` / `rebaseBranch` gọi thẳng IPC trong modal callback

Tách thêm bây giờ chỉ là cắt cho đủ số dòng, trái với tinh thần "tách theo ranh giới trách nhiệm" của GĐ4. **Việc đúng là làm lát 2 rồi dòng tự rụng.**

**Ngoại lệ ranh giới đang mở** — mỗi cái có lý do và điều kiện gỡ, ghi trong `architectureBoundaries.test.ts`:

| File | Vi phạm | Gỡ khi |
| --- | --- | --- |
| `BranchSidebar.tsx` | import `ipc/` + import `features/tag` | có `features/remote` + `features/stash` + hook tag còn lại |
| `useStashCommands.ts` | import `ipc/` | có `features/stash` |
| `CheckoutConflictModal.tsx` | `saveStash` | có `features/stash` |
| `DeleteBranchModal.tsx` | `undoDeleteBranch` | domain undo có hook |

Có test **`every cross-feature exception still names a real import`** — nó đỏ nếu một ngoại lệ còn nằm đó sau khi import tương ứng đã biến mất. Danh sách này chỉ được **co lại**, không được phình ra.

### 10.7 Sai lệch có chủ đích so với spec — bỏ `useAsyncAction`

Spec thiết kế (`2026-09-18-frontend-architecture-refactor-design.md`, mục 4.4) có `shared/hooks/useAsyncAction` để gói cặp `loading` + `error` cho mọi thao tác bất đồng bộ. **Hook này không được viết, và sẽ không viết.**

Lý do: `useMutation` của React Query đã phủ đúng vai trò đó — `isPending` thay `loading`, `error` thay `error`, cộng thêm invalidation và trạng thái vòng đời mà `useAsyncAction` không có. Viết thêm một hook nữa nghĩa là mỗi modal phải chọn giữa hai cách làm cùng một việc, và người đọc phải biết cả hai.

Hệ quả cụ thể trong code: các modal đã migrate xoá `const [loading, setLoading] = useState(false)` và dùng `mutation.isPending`. Chỗ nào còn thấy cặp `loading`/`setLoading` thủ công là chỗ **chưa** migrate, không phải chỗ cố ý làm khác.

> Một ngoại lệ thật: `CheckoutConflictModal` giữ `isStashing` riêng. Nút đó chạy **hai** lệnh nối tiếp (`saveStash` rồi `checkoutBranch`), mà mutation chỉ phủ lệnh thứ hai — dùng `isPending` thì nút vẫn bấm được trong lúc đang stash.

### 10.8 Hai chi tiết dễ làm sai ở lát 2

**Leaf nhánh local và remote trông giống nhau nhưng KHÔNG giống nhau.** Khi tách `RemoteTreeNode`, cám dỗ là dùng chung `BranchTreeNode` với props khác. Đã diff và phát hiện khác thật: bản remote **luôn** checkout khi double-click (bản local chặn nếu `is_head`), có `aria-label`, và không có styling HEAD. Gộp lại là **đổi hành vi**. Hai component tách riêng là có chủ đích.

**Header TAGS đếm `tagItems` (chưa lọc), danh sách bên dưới render `filteredTags` (đã lọc).** Khi tách `TagSection` phải truyền **hai** prop riêng. Gộp thành một là đổi hành vi thầm lặng: gõ vào ô search thì số trên header sẽ nhảy theo, trong khi bản gốc giữ nguyên tổng số.

---

## 11. Giai đoạn 5 lát 2 — ĐÃ XONG (8 task triển khai + 1 task handover)

### 11.1 Trạng thái từng task

| Task | Nội dung | Trạng thái |
| --- | --- | --- |
| T1 | `features/stash/api` — hook stash | ✅ `0f2dac8` |
| T2 | Chuyển component stash vào feature | ✅ `8b9af10` |
| T3 | `features/remote/api` — hook remote | ✅ `3dfe742` |
| T4 | Gỡ ngoại lệ `CheckoutConflictModal`, chuyển vào `features/branch` dùng hook stash | ✅ `8840164` |
| T5 | Xoá hẳn `useStashCommands`, dùng thẳng hook stash thật | ✅ `3fa60a8` |
| T6 | Chuyển `ManageRemotesModal` + `PruneConfirmModal` vào `features/remote` | ✅ `5c44254` |
| T7 | Chuyển hai modal remote còn lại vào `features/remote` | ✅ `f01d58b` |
| T8 | Giao các dialog liên-feature cho `Shell`, gỡ import chéo component | ✅ `7fa75f7` |
| T9 | Cập nhật status handover | ✅ `267a215` |

### 11.2 Số liệu hiện tại (đo thật, không ước lượng)

| Chỉ số | Đầu lát 2 | Bây giờ |
| --- | --- | --- |
| Test | 99 file / 618 | **101 file / 634** |
| `pnpm lint` | exit 0 | **exit 0, 240 warning** |
| `no-restricted-imports` | 76 | **68** |
| `pnpm build` | exit 0 | exit 0 |
| `pnpm check-query-keys` / `check-comment-language` | pass | pass |
| `src/components/` còn import thẳng `ipc/` | 37 / 71 file | **32 / 64 file** |
| `src/components/remote/` | tồn tại | **xoá hẳn** |
| `src/components/stash/` | tồn tại | **xoá hẳn** (còn lại một thư mục rỗng chưa track trên đĩa, do `git mv`; đã `rmdir`) |
| `BranchSidebar.tsx` | 619 dòng, 10 `useState` | **611 dòng, 10 `useState`** |

### 11.3 Feature `remote` và `stash` — đã migrate

```
src/features/remote/
├─ api/          hook cho add/edit/delete remote, prune, manage
├─ components/   AddEditRemoteModal, DeleteRemoteModal, ManageRemotesModal,
│                PruneConfirmModal
└─ index.ts      cổng public

src/features/stash/
├─ api/          useApplyStash, usePopStash, useDropStash, ...
├─ components/   CreateStashModal, StashDiffView
└─ index.ts      cổng public
```

`src/components/remote/` và `src/components/stash/` đều **xoá hẳn**, không còn tham chiếu nào trong git.

**Ba trong bốn ngoại lệ `IPC_IMPORT_EXCEPTIONS` đã gỡ được:** `CheckoutConflictModal` (T4) chuyển hẳn vào `features/branch` và gọi hook stash thật thay vì `invokeCommand` trực tiếp; `useStashCommands.ts` (T5) — **xoá cả file**, không phải sửa, vì mọi thứ nó bọc giờ đã có hook thật. Còn lại ba ngoại lệ mở: `BranchSidebar`, `DeleteBranchModal`, `StashDiffView` — mỗi cái vẫn có lý do và điều kiện gỡ ghi trong `architectureBoundaries.test.ts`.

### 11.4 Ba điều phải ghi trung thực — không được giảm nhẹ

**(a) Kế hoạch sai khi kỳ vọng `CROSS_FEATURE_EXCEPTIONS` về `{}`.** Task 4 và Task 5 **cố ý** đưa hai import `stash/api` vào bên trong `features/branch` (để `BranchSidebar` và `CheckoutConflictModal` dùng `useApplyStash`/`usePopStash`/`useDropStash`), và không task nào trong lát 2 được xếp lịch để gỡ chúng — vậy nên "rỗng" **chưa từng khả thi** với phạm vi đã lập kế hoạch. Đây là lỗi lập kế hoạch, bắt được trong lúc thực thi chứ không phải trước đó.

Điều **đúng** trong kết quả: `tag` và `remote` đã gỡ khỏi danh sách, chỉ còn hai mục `["stash"]`. Coupling còn lại là **chỉ ở tầng api** — `branch` dùng *hook* của `stash`, không bao giờ dùng *component* của nó. Đó là ghép nối yếu hơn nhiều so với các import component đã gỡ (`BranchSidebar` từng render thẳng modal `tag`/`remote` và panel diff `stash`). Tiêu chí thành công đã sửa lại: "api-level only, không còn import component chéo feature" — không phải "rỗng".

**(b) `BranchSidebar` còn 611 dòng — hầu như không nhích so với 619 cuối lát 1.** Gỡ 7 khối modal (giao cho `Shell`) đúng ra phải cắt sâu, nhưng bị bù lại gần hết bởi: interface prop mới để `Shell` biết mở dialog nào, và docblock giải thích ranh giới mới. Phần cồng kềnh còn lại là các domain **chưa có feature**: 2 lệnh tag (`checkoutTag`/`pushTag`), `mergeBranch`/`rebaseBranch`, `undoDropStash`, và các query trực tiếp `getRemotes`/`getRepoStatus`/`getStashes`/`getTags`. **Không được coi việc này là đã xong** — mốc dưới 300 dòng của kế hoạch gốc còn cách rất xa, và sẽ không tự giải quyết cho tới khi các domain trên có feature riêng.

**(c) Một lỗ hổng coverage bị lộ ở Task 8, chưa vá.** Kế hoạch ban đầu định để `Shell` gọi `renderStashPanel(stash, close)`. Chữ ký đó sẽ **âm thầm phá vỡ toast hoàn tác** (undo) — và không test nào bắt được, vì **không có test nào phủ ba nút hành động của `StashDiffView`** (apply/pop/drop). Vấn đề chỉ lộ ra khi soát lại thủ công trong lúc làm Task 8. Chữ ký đã sửa thành `(stash, handlers, close)` trước khi commit, nhưng khoảng trống coverage tự nó **vẫn còn nguyên** — người làm tiếp nên viết test cho ba nút này trước khi động vào `StashDiffView` lần nữa.

### 11.5 Ngoại lệ ranh giới còn lại sau lát 2

| File | Vi phạm | Gỡ khi |
| --- | --- | --- |
| `BranchSidebar.tsx` | import `ipc/` trực tiếp | 2 lệnh tag còn lại, merge/rebase và domain undo mỗi cái có hook |
| `DeleteBranchModal.tsx` | `undoDeleteBranch` | domain undo có hook |
| `StashDiffView.tsx` | đọc chi tiết commit qua `ipc/` | domain commit có hook |
| `BranchSidebar.tsx` (cross-feature) | dùng `useApplyStash`/`usePopStash`/`useDropStash` của `stash` | có tầng action dùng chung, hoặc stash panel tự quản lý lệnh của nó |
| `CheckoutConflictModal.tsx` (cross-feature) | stash rồi checkout | tương tự trên |

Danh sách chỉ được **co lại**, không được phình ra — `architectureBoundaries.test.ts` có test đỏ nếu một ngoại lệ còn nằm đó sau khi import tương ứng đã biến mất.

---

## 12. Giai đoạn 5b — Xẻ nhỏ 5 module entry khổng lồ — ĐÃ XONG (7 task, gồm Task 0')

**Kế hoạch**: `docs/superpowers/plans/2026-09-20-refactor-phase5b-large-modules.md`
**Thiết kế**: `docs/superpowers/specs/2026-09-20-refactor-phase5b-large-modules-design.md`
**Nhánh**: `refactor/phase5b-large-modules`, rẽ từ `refactor/phase0-foundation` tại `2e01698`, sau đó hoà (merge) commit `4fe9bfb` của `refactor/phase0-foundation` vào giữa chừng (Task 0').
**Ledger đầy đủ**: `.superpowers/sdd/2026-09-20-refactor-phase5b-large-modules/progress.md` (không nằm trong `docs/`, không đi theo nhánh khi merge — chỉ tồn tại trong worktree làm việc).

### 12.1 Trạng thái từng task và commit

| Task | Nội dung | Người làm | Commit |
| --- | --- | --- | --- |
| 1 | Owner hook cho hành động sidebar (`useCheckoutTag`, `usePushTag`, `useMergeBranch`, `useRebaseBranch`, `useUndoDropStash`) | Phiên trước | `9894513 ✨ add owner hooks for sidebar actions` |
| 2 | Tách trách nhiệm `BranchSidebar` (`useSidebarActions` + `useSidebarData` + `BranchSidebarSections`) | Phiên trước | `9b8d580 ♻️ split branch sidebar responsibilities`, `4224665 🐛 preserve repository ownership for stash undo` |
| 3 | Chuyển commit graph vào `features/history` | Phiên trước | `3cf7fe9 ♻️ move commit graph into history feature` |
| 4 | Chuyển commit detail vào `features/history` | Phiên trước | `6c5d318 ♻️ move commit detail into history feature` (salvage một phiên bị ngắt quãng) |
| 0' | Hoà luật public-index + acyclicity guard từ `refactor/phase0-foundation`, xoá `CROSS_FEATURE_EXCEPTIONS`, chuyển import sâu còn sót | Phiên này | `89b77bd 🔀 merge public-index boundary rule into phase 5b`, `2cc6af3 ♻️ route cross-feature imports through public indexes` (mang theo `4fe9bfb 🔒 allow cross-feature imports only through public index` từ nhánh kia) |
| 5 | Chuyển tab git-behavior settings vào `features/settings` | Phiên này | `d6bc089 ♻️ move git behavior settings into feature` |
| 6 | Chuyển luồng welcome/mở-repo vào `features/welcome` | Phiên này | `1ffccaa ♻️ move welcome flow into feature` |
| 7 | Đóng giai đoạn, xác minh toàn bộ, ghi status handover | Phiên này | (commit này) |

Tất cả các review độc lập trong ledger đều kết luận "clean" (không có finding nào còn mở khi task đóng), ngoại trừ Task 2 có 1 vòng sửa (Important: xem mục 12.4).

### 12.2 Số liệu đo được (Task 7 — `wc -l` / `git show <rev>:<path> | wc -l`, hai cách khớp nhau)

**Năm module entry mục tiêu — tất cả dưới 300 dòng:**

| File | Trước GĐ5b | Sau GĐ5b |
| --- | --- | --- |
| `src/features/branch/components/BranchSidebar.tsx` | 611 dòng | **247 dòng** |
| `src/features/history/components/CommitGraph.tsx` | 791 dòng (`src/components/graph/CommitGraph.tsx` cũ) | **140 dòng** |
| `src/features/history/components/CommitDetailPanel.tsx` | 764 dòng (`src/components/diff/CommitDetailPanel.tsx` cũ) | **211 dòng** |
| `src/features/settings/components/GitBehaviorTab.tsx` | 597 dòng (`src/components/settings/tabs/GitBehaviorTab.tsx` cũ) | **70 dòng** |
| `src/features/welcome/components/WelcomeScreen.tsx` | 586 dòng (`src/components/welcome/WelcomeScreen.tsx` cũ) | **202 dòng** |

**Bốn file khác trong `src/features/**` hiện vượt 300 dòng — ghi trung thực, không xẻ trong phạm vi task này** (không phải entry mục tiêu của kế hoạch GĐ5b; brief Task 7 yêu cầu chỉ *ghi lại*, không tách):

| File | Dòng đo được |
| --- | --- |
| `src/features/remote/components/ManageRemotesModal.tsx` | 319 |
| `src/features/branch/components/BranchSidebarSections.tsx` | 313 |
| `src/features/branch/components/RemoteTreeNode.tsx` | 312 |
| `src/features/history/components/CommitGraphRows.tsx` | 301 |

> Ghi chú phương pháp đo: `Get-Content <file> | Measure-Object -Line` của PowerShell cho ra số **thấp hơn thực tế khoảng 10-15 dòng** trên các file này trong môi trường này (ví dụ báo 302 dòng cho `BranchSidebarSections.tsx` thay vì 313). Đối chiếu chéo bằng `wc -l` (đếm ký tự newline) và `git show HEAD:<path> | wc -l` (đọc thẳng từ object Git, không qua encoding của shell) cho kết quả **khớp nhau tuyệt đối** ở cả 9 file đo trong task này, nên các con số trong bảng trên dùng `wc -l`/`git show` làm chuẩn, không dùng `Measure-Object -Line`.

### 12.3 Quyết định ranh giới public-index (Task 0')

**Bối cảnh sai lệch bị bắt giữa chừng.** Task 2 và Task 3 của GĐ5b (làm trước khi phát hiện) đã **nới rộng** `CROSS_FEATURE_EXCEPTIONS` để `useSidebarActions.ts`/`useSidebarData.ts` import sâu vào `../../tag/api`, `../../stash/api`, `../../remote/api` — đúng cách làm của GĐ5 lát 1/2, nhưng **vi phạm ràng buộc toàn cục** ("Global Constraint") mà bản kế hoạch GĐ5b gốc đặt ra: không được nới danh sách ngoại lệ cross-feature thêm nữa.

Đồng thời, một phiên khác trên `refactor/phase0-foundation` đã độc lập làm xong đúng luật cần: "feature `a` chỉ được import feature `b` qua `index.ts` công khai của `b` — cấm import sâu vào `api/`, `components/`, `model/`, và cấm cả dạng `/index` tường minh" (commit `4fe9bfb`), kèm một test bất-chu-kỳ (`feature -> feature public imports form no cycle`) chạy DFS ba màu trên đồ thị cạnh feature→feature suy ra từ các import public.

**Quyết định của con người:** hoà commit `4fe9bfb` vào nhánh GĐ5b ngay (Task 0'), không đợi đến khi merge cuối cùng. Lý do: nếu để `CROSS_FEATURE_EXCEPTIONS` tiếp tục phình ra qua Task 5/6, việc hoà nhánh sau này sẽ phải viết lại nhiều hơn, và bản thân việc phình ra đã là vi phạm ràng buộc đang có hiệu lực.

**Cách hoà:** `git merge refactor/phase0-foundation --no-commit --no-ff`, xử lý đúng 2 xung đột — giữ nguyên code Task 1-2 của `BranchSidebar.tsx` (đã tách khỏi import sâu), lấy toàn bộ máy phân loại `crossFeatureViolation`/`extractImportSpecifiers`/`resolveSpecifier` mới từ nhánh kia cho `architectureBoundaries.test.ts` (xoá hẳn `CROSS_FEATURE_EXCEPTIONS` và test độ mới của nó). Sau merge, chạy lại test ranh giới lộ ra đúng 5 vi phạm — toàn bộ nằm trong `useSidebarActions.ts` và `useSidebarData.ts` — chuyển hết sang import qua `index.ts` công khai (không cần thêm export mới, mọi hook cần dùng đã có sẵn trong `index.ts` của feature nguồn). Xác nhận không có chu trình (cycle) nào phát sinh dù `branch` giờ có cạnh public-import tới `tag`, `stash`, `remote`, `merge`, `undo`, `history`. Có thí nghiệm phá: đổi tạm một import về dạng sâu, xác nhận test đỏ đúng thông điệp, rồi phục hồi.

**Kết quả:** `CROSS_FEATURE_EXCEPTIONS` không còn tồn tại ở bất kỳ đâu trong codebase (`grep -rn "CROSS_FEATURE_EXCEPTIONS" src/` rỗng). Toàn bộ ranh giới cross-feature giờ chỉ do hai luật ép bằng test: import chỉ qua `index.ts` công khai, và đồ thị import đó không được có chu trình.

### 12.4 Ba ruling của controller xuyên suốt GĐ5b

1. **IPC chỉ được gọi trong `api/`, kể cả khi brief không liệt kê `api/`.** Task 5 (settings) và Task 6 (welcome) có brief chỉ liệt kê `hooks/` gọi thẳng `ipc/`. Controller ra ruling: vẫn phải thêm lớp `api/` mỏng (`gitBehaviorApi.ts`, `welcome/api/index.ts`) bọc `invokeCommand`, để tuân thủ luật có sẵn "chỉ `features/*/api` được chạm `ipc/`" mà **không** cần thêm entry mới vào `IPC_IMPORT_EXCEPTIONS` — giữ đúng tinh thần "danh sách ngoại lệ chỉ co lại".
2. **Dialog liên-feature của commit graph: `Shell` cung cấp renderer cụ thể.** Nối tiếp quy ước 19 đã dùng ở GĐ5 lát 2 (Task 8): `history` giữ quyết định *khi nào* mở dialog tạo tag/tạo nhánh từ đồ thị commit (state/điều kiện nằm trong feature), còn `Shell` — không phải một feature — cung cấp *cái gì* để render (component thật của `tag`/`branch`, nhận state qua props). Nhờ vậy `history` không phải import chéo component của `tag`/`branch`.
3. **Hook trạng thái repo (`useRepoStatus`) đặt trong `features/history`, không phải feature mới.** Task 2 cần gỡ import IPC trực tiếp cho trạng thái repo trong `branch`, nhưng bản thân trạng thái repo chưa có feature riêng. Thay vì tạo một feature `repo-status` chỉ để chứa một hook, ruling đặt `useRepoStatus` vào `history` (đã là chủ sở hữu tự nhiên của luồng dữ liệu này trong UI hiện có) và để `branch` import qua `index.ts` công khai của `history`.

### 12.5 Ghi chú môi trường — `--pool=threads`

Pool mặc định của Vitest (`forks`, cấu hình trong `vitest.config.ts`) **treo hoàn toàn** trước khi bất kỳ worker nào được tạo, trong worktree Windows liên kết (linked worktree, tạo bằng `git worktree add`) này. Nguyên nhân gốc chưa xác định (nghi vấn: cách `forks` pool tạo tiến trình con tương tác xấu với worktree liên kết trên Windows), nhưng đây là vấn đề môi trường, không phải lỗi sản phẩm — `pnpm vitest run --pool=threads` chạy bình thường và xanh toàn bộ 110 file / 760 test. Mọi lệnh xác minh trong worktree này (Task 0' đến Task 7) đều dùng cờ `--pool=threads`; **không** sửa `vitest.config.ts` để đổi pool mặc định, vì máy CI và checkout thường không có vấn đề này. Người làm việc trên nhánh này ở một worktree/máy khác nên thử `pnpm test` (mặc định) trước; chỉ cần `--pool=threads` nếu gặp treo tương tự.

### 12.6 Danh sách nợ hoãn lại (deferred minors) từ ledger

Các phát hiện nhỏ, không chặn merge, được controller xác nhận và cố ý hoãn lại trong quá trình GĐ5b:

| Task | Nợ | Ghi chú |
| --- | --- | --- |
| 4 | `Shell.tsx` gộp hai import `history` thành một | Dọn dẹp ngoài yêu cầu (unrequested cleanup), không phải regression. |
| 4 | Thêm `CommitFileDiff.tsx` ngoài danh sách file của brief | Cần thiết để giữ entry dưới 300 dòng. |
| 0' | `resolveSpecifier` — docblock có trường hợp trả về `null` âm thầm; regex trích import có thể khớp nhầm bên trong comment/string | Guard vẫn đúng cho mọi trường hợp thực tế gặp phải trong codebase hiện tại, chưa chứng minh kín 100%. |
| 5 | Component settings import `HelpTooltip`/`helpDiagrams` từ `src/components/settings` cũ | Feature "thò tay" vào `components/`; chưa có vị trí chuẩn trong `shared/` cho hai tiện ích này. |
| 5 | `SettingsModal` vẫn truyền `onScopeChange` không dùng cho `GitBehaviorTab` | Có từ trước GĐ5b (component gốc cũng không đọc prop này) — giữ nguyên theo quy ước "migrate là thay thế cơ học". |
| 6 | `useWelcomeShortcuts` deps rỗng, đóng callback từ lần render đầu | Verbatim từ `useEffect` gốc, controller xác nhận không phải regression. |
| 6 | `clearRecents`/`removeRecent` nuốt lỗi qua `console.warn` | Có từ code gốc, giữ nguyên. |
| 6 | oxlint `no-restricted-imports` báo warning trên import kiểu (`import type`) của `ipc/` trong feature | Mẫu lặp lại có từ `branch`/`settings`; `architectureBoundaries.test.ts` mới là luật có thẩm quyền, đã phân biệt đúng type-only. |

**Sai lệch được con người duyệt (không phải nợ hoãn lại — đã chốt, không sửa code):** `useCheckoutTag`/`usePushTag` (`src/features/tag/api/useTagActions.ts`) invalidate `qk.repo.all(repoPath)` thay vì đúng năm khoá gốc (`branches`, `commitGraph`, `repo.status`, `repo.head`, `tags`). Kế hoạch Task 1 Bước 3 đã chủ động chọn phạm vi rộng này ("keep tag invalidation broad"), khác với spec ("retain their current invalidation rules"). Con người quyết định ngày 2026-09-28: **giữ nguyên** — nhất quán với `useCreateTag`/`useDeleteTag` (vốn đã invalidate `repo.all`), chỉ gây refetch thừa (kể cả `pushTag`, vốn không đổi state cục bộ nào), không bao giờ để cache cũ (stale). Xem review cuối GĐ5b, finding I2.

**Một regression thật đã được tìm và sửa trong lúc làm (không phải nợ hoãn lại):** Task 2, vòng review đầu tiên, tìm ra tại `useSidebarActions.ts:63` một callback toast hoàn tác (undo) bị giữ lại (retained) qua re-render nhưng trỏ tới mutation đã bị rebind sang repo **mới**, khiến hoàn tác **xoá stash** (`useUndoDropStash`/`dropStash`) sau khi chuyển repo sẽ tác động sai repo. Implementer đã thêm test hồi quy thất bại trước, rồi sửa để giữ đúng danh tính repo gốc; review vòng hai chấp thuận không còn finding.

### 12.7 Xác minh đầy đủ (đo tại HEAD `1ffccaa`, trước commit của task này)

| Lệnh | Kết quả |
| --- | --- |
| `pnpm vitest run --pool=threads src/test/architectureBoundaries.test.ts` | PASS — 1 file / 35 test |
| `pnpm check-query-keys` | PASS — "No query key literals found outside src/domain/queryKeys.ts." |
| `pnpm check-comment-language` | PASS — "All comments are in English." |
| `pnpm lint` | exit 0 — 241 warning (0 error thật; các dòng chứa chữ "error" chỉ là văn bản trợ giúp của rule `no-console`), **70** warning là `no-restricted-imports` |
| `pnpm build` | exit 0 — `tsc && vite build`, 2103 module, 1 cảnh báo chunk > 500kB (có từ trước, không liên quan) |
| `pnpm vitest run --pool=threads` (toàn bộ) | PASS — **110 file / 760 test**, ~223s |
| `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` | exit 0 — biên dịch sạch, 0 warning (build "dev" 5m33s, phần lớn thời gian là biên dịch lại dependency) |
| `cargo test --manifest-path src-tauri/Cargo.toml` | exit 0 — **140 test passed, 0 failed** trên toàn bộ binary test |

Không có lệnh nào đỏ; không cần sửa code sản phẩm ở Task 7.

### 12.8 Đối chiếu guard kiến trúc (Step 2 của Task 7)

- `CROSS_FEATURE_EXCEPTIONS`: xác nhận **không tồn tại** ở bất kỳ đâu trong `src/` (grep rỗng) — đúng như Task 0' để lại, không có cơ chế ngoại lệ cross-feature nào tái xuất hiện.
- `IPC_IMPORT_EXCEPTIONS` còn đúng 2 mục, cả hai đã kiểm tra lại và còn hợp lệ:
  - `features/branch/components/DeleteBranchModal.tsx` — gọi `invokeCommand.undoDeleteBranch(...)` thật (dòng 53), lý do "undo toast calls undoDeleteBranch", điều kiện gỡ "removed once the undo domain has a hook".
  - `features/stash/components/StashDiffView.tsx` — import giá trị `invokeCommand` từ `../../../ipc/client` (dòng 4) và dùng để đọc `CommitDetails`, lý do "reads commit details to render the stash diff", điều kiện gỡ "removed once the commit domain has a hook".
- Test `every ipc-import exception still exists` (kiểm tra file còn tồn tại trên đĩa) và `only features/*/api may import ipc/` đều PASS, xác nhận cả hai mục trên không phải ngoại lệ "chết" (stale).
- Không tìm thấy cơ chế ngoại lệ cross-feature nào khác (không có `EXCEPTIONS`, `ALLOWLIST`, hay danh sách tương tự nào ngoài `IPC_IMPORT_EXCEPTIONS`) khi quét `src/test/architectureBoundaries.test.ts` toàn văn.

---
