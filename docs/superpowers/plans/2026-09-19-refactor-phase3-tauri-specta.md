# Giai đoạn 3: Bật tauri-specta, bỏ `bindings.ts` viết tay

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/ipc/bindings.ts` (486 dòng viết tay) được thay bằng `src/ipc/bindings.generated.ts` do `tauri-specta` sinh ra từ Rust. Khôi phục an toàn kiểu compile-time giữa 77 command Rust và tầng TS. Tách mock dev-browser ra khỏi `client.ts`.

**Architecture:** Giữ nguyên `invokeCommand` làm adapter. Bindings sinh ra chỉ thay phần **kiểu** và phần **gọi invoke**; hình dạng public của `invokeCommand` (`Promise<T>`, ném lỗi khi thất bại) **không đổi**. Nhờ vậy 291 call site và 38 test file không phải sửa. Rủi ro dồn vào đúng một file.

**Tech Stack:** Rust + tauri-specta 2.0.0-rc.25, specta-typescript 0.0.12, TypeScript 7, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-18-frontend-architecture-refactor-design.md` mục 1.2(b), 4.3, 8
**Nhánh:** `refactor/phase0-foundation` (tiếp tục)

---

## Global Constraints

- **Không đổi hành vi người dùng.** Đây là thay thế tầng kiểu, không phải đổi logic.
- **Không sửa `bindings.generated.ts` bằng tay.** File do máy sinh, có header cảnh báo, được miễn lint.
- **Public API của `invokeCommand` giữ nguyên:** trả `Promise<T>`, ném lỗi khi Rust trả `Err`. Không được để `{status}` rò ra ngoài `client.ts`.
- **Không sửa 291 call site.** Nếu một call site phải sửa, đó là tín hiệu kiểu sinh ra lệch với kiểu viết tay → dừng lại, ghi nhận, xử lý có chủ đích (xem Task 4).
- `pnpm build` là **cổng chặn chính** của giai đoạn này — chính nó là phép kiểm chứng "an toàn kiểu đã khôi phục".
- `pnpm lint` giữ exit 0, số warning không tăng.
- Comment, mô tả test, commit message: **tiếng Anh**.
- Trailer commit: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

---

## Mốc chuẩn đầu giai đoạn — đã xác minh 2026-09-19

Chạy lại và xác nhận đủ 5 lệnh trước khi viết code:

| Lệnh | Kết quả đã xác minh |
| --- | --- |
| `pnpm lint` | exit 0 (175 warning độ phức tạp, theo kế hoạch) |
| `pnpm build` | exit 0 |
| `pnpm test` | **93 file / 569 test** xanh |
| `cargo test` | **toàn bộ xanh, 0 failed** |
| `cargo clippy --all-targets -- -D warnings` | exit 0 |

> `pnpm format:check` vẫn đỏ vì nợ CRLF có sẵn (mọi file `.rs` đều bị báo `Incorrect newline style`). Nợ này có trước giai đoạn này. Đã kiểm tra: ngoài newline **không có** khác biệt định dạng thật.

> **Đã sửa trước khi bắt đầu** (commit `591c23e`): `test_github_token_storage_lifecycle` đọc/ghi token GitHub thật của người dùng và khẳng định `None` sau khi xoá. Vì `get_github_token()` có fallback `gh auth token`, trên máy dev đã đăng nhập `gh` thì assertion nhận token thật và **in token đó ra log test**. CI không thấy vì runner không đăng nhập `gh`.

---

## Phát hiện khi khảo sát — đọc kỹ trước khi làm

Bốn điều dưới đây đã **xác minh bằng thực nghiệm**, không phải suy đoán. Chúng quyết định hình dạng của kế hoạch.

### a) Rust đã sẵn sàng, chỉ thiếu bước xuất

`create_specta_builder()` đã tồn tại ở `src-tauri/src/lib.rs:12` và liệt kê đủ 77 command; mọi command đã có `#[specta::specta]`. Không thiếu annotation nào. Việc còn lại thuần tuý là **gọi `.export(...)`** và tiêu thụ kết quả.

### b) Binary nào link `tauri::Wry` đều không chạy được trên Windows nếu thiếu manifest

Đây là cái bẫy lớn nhất của giai đoạn này. Đã mất nhiều vòng thử mới ra nguyên nhân:

- Xuất bindings cần một binary Rust **chạy được** (`cargo test` hoặc `--example`), vì `.export()` là lệnh chạy lúc runtime chứ không phải macro biên dịch.
- Mọi binary link `tauri_specta::Builder` đều phụ thuộc `comctl32.dll`. Tauri chỉ nhúng manifest **Common-Controls v6** vào exe của *ứng dụng*, không nhúng vào test binary.
- Thiếu manifest đó → exe **không khởi động được**, thoát `0xc0000139 STATUS_ENTRYPOINT_NOT_FOUND`, không in ra bất kỳ thông báo nào. Rất dễ hiểu nhầm thành lỗi code.
- `tauri::test::MockRuntime` **không cứu được** — đã thử, vẫn hỏng y hệt, vì phụ thuộc đến từ khâu link chứ không phải runtime nào được chọn.

**Cách sửa đã kiểm chứng chạy được**, đặt trong `src-tauri/build.rs`:

```rust
#[cfg(windows)]
{
    let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("common-controls.manifest");
    println!("cargo:rustc-link-arg-tests=/MANIFEST:EMBED");
    println!("cargo:rustc-link-arg-tests=/MANIFESTINPUT:{}", manifest.display());
}
```

Hai điểm bắt buộc, cả hai đều đã sai một lần khi thử:

1. **Đường dẫn manifest phải tuyệt đối** (`CARGO_MANIFEST_DIR`). Dùng đường dẫn tương đối trong `.cargo/config.toml` thì mọi crate phụ thuộc cũng nhận flag đó và đi tìm file trong thư mục của chính nó → `getrandom` gãy khi link.
2. Dùng `rustc-link-arg-tests` (chỉ test binary), **không** dùng `rustc-link-arg` (đụng cả exe ứng dụng vốn đã có manifest riêng).

### c) Kiểu sinh ra **nghiêm ngặt hơn** kiểu viết tay — và bắt được drift thật

Xuất thử rồi so sánh, có ba khác biệt. Không cái nào là lỗi của specta:

| Khác biệt | Nguyên nhân | Xử lý |
| --- | --- | --- |
| Số 64-bit bị từ chối xuất | specta chặn `usize`/`i64`/`u64` để tránh mất chính xác | `.dangerously_cast_bigints_to_number()` — đúng ngữ nghĩa mà bindings viết tay vẫn đang giả định. Mọi giá trị ở đây là timestamp/count/index, đều xa dưới 2^53 |
| `f64` ra `number \| null` | JSON không tải được `NaN`/`Infinity` | `.semantic_types(Configuration::default().enable_lossless_floats())` — đưa về `number`. Đã xác minh: sau khi bật, chỉ còn lại đúng 4 chỗ `number \| null`, **cả 4 đều là `Option<...>` thật trong Rust** |
| `CommitDetails` tách `_Serialize` / `_Deserialize` | specta phân biệt hai chiều serde | Alias về biến thể **`_Deserialize`** — đó là thứ IPC thực sự trả về cho TS |

**Drift thật mà bindings viết tay đang giấu** — đây chính là lý do giai đoạn này tồn tại:

| Field | Rust | `bindings.ts` viết tay | Hậu quả |
| --- | --- | --- | --- |
| `TagItem.timestamp_sec` | `Option<f64>` (`read/tags.rs:17`) | `number` | Tag không có tagger (tag nhẹ) trả `null`, TS tin là luôn có số |

Đây là ca thứ hai cùng loại với `bindings.ts:270` đã ghi trong nợ kỹ thuật. Bằng chứng trực tiếp cho luận điểm "bindings viết tay trôi khỏi Rust".

### d) `client.ts` trộn ba việc trong một file 1748 dòng

Ba việc: (1) dữ liệu mock cho dev-browser, (2) phát hiện môi trường `isTauri()`, (3) 81 hàm gọi IPC. Mỗi hàm đều có nhánh `if (!isTauri())` nội tuyến. Task 6 chỉ tách phần (1) ra; tách theo domain là GĐ4.

---

## Quyết định thiết kế đã chốt

Bốn quyết định này đã được duyệt trước khi lập kế hoạch:

1. **Giữ adapter, chỉ đổi kiểu.** `invokeCommand` vẫn là public API; nó gọi xuống `commands.*` sinh ra rồi unwrap `{status}`. 291 call site và 38 test file không đổi. *Lý do:* GĐ5 dù sao cũng sẽ đưa component đi qua `features/*/api`; viết lại call site bây giờ là làm hai lần, lại chồng rủi ro lên giai đoạn vốn đã rủi ro nhất.
2. **Sửa drift, không che.** Nhận kiểu sinh ra nguyên trạng, sửa chỗ hỏng thật, mỗi chỗ ghim một test. Không thêm alias làm mềm kiểu — làm vậy là dựng lại đúng tầng viết tay mà giai đoạn này muốn xoá.
3. **Xuất bằng `cargo test`, commit file sinh ra.** `pnpm build` không phụ thuộc toolchain Rust; một check trong CI bảo đảm sinh lại không tạo diff.
4. **Tách mock thành commit riêng.** Cùng giai đoạn nhưng revert được độc lập, đúng như mục 8 của spec yêu cầu.

---

## Tasks

### Task 1 — Cho phép test binary khởi động được trên Windows

- [ ] Thêm `src-tauri/common-controls.manifest` (nội dung ở mục (b) trên; chép từ resource Tauri tự sinh).
- [ ] Sửa `src-tauri/build.rs` phát `rustc-link-arg-tests` như mục (b). Giữ `tauri_build::build()` ở cuối.
- [ ] Comment trong `build.rs` giải thích **vì sao** cần (thiếu nó thì lần sau có người xoá đi và mất nửa ngày để tìm lại).
- [ ] Thêm `tauri = { version = "2", features = ["test"] }` vào `[dev-dependencies]`.
- [ ] **Kiểm chứng:** viết một test tạm dựng `Builder::<MockRuntime>` rồi `cargo test` — phải chạy, không được thoát `0xc0000139`. Xoá test tạm sau khi xác nhận.
- [ ] `cargo test` toàn bộ vẫn xanh; `cargo clippy --all-targets -- -D warnings` exit 0.

Commit: `🔧 embed the common-controls manifest into Rust test binaries`

### Task 2 — Sinh bindings từ Rust

- [ ] Thêm `src-tauri/tests/export_bindings.rs`: dựng builder từ `create_specta_builder()`, áp `.dangerously_cast_bigints_to_number()` và `.enable_lossless_floats()`, xuất ra `../src/ipc/bindings.generated.ts`.
- [ ] Trong test, khẳng định file xuất ra **không rỗng** và chứa đủ 77 command — để test thất bại thành tiếng nếu builder mất command, thay vì lặng lẽ ghi file cụt.
- [ ] Xoá khối comment tiếng Việt ở `lib.rs:98-101` (nói bindings viết tay cố ý) — không còn đúng nữa. Thay bằng comment tiếng Anh trỏ tới test xuất bindings.
- [ ] Miễn `bindings.generated.ts` khỏi mọi luật lint (spec mục 6.2) và khỏi `prettier`.
- [ ] **Kiểm chứng:** chạy `cargo test --test export_bindings` hai lần liên tiếp → lần hai `git diff` phải rỗng (sinh ra ổn định, không phụ thuộc thứ tự).

Commit: `✨ generate the IPC bindings from Rust with tauri-specta`

### Task 3 — Chặn drift bằng CI

- [ ] Thêm script `pnpm check-bindings`: sinh lại rồi `git diff --exit-code src/ipc/bindings.generated.ts`.
- [ ] Nối vào `pnpm check` và vào job Rust của `.github/workflows/ci.yml` (job này đã có toolchain Rust; job frontend thì không).
- [ ] **Kiểm chứng (thí nghiệm phá, quy ước 3):** sửa tay một field trong `bindings.generated.ts`, chạy check → **phải đỏ**. Hoàn nguyên.

Commit: `👷 fail CI when the generated bindings drift from Rust`

### Task 4 — Chuyển `client.ts` sang dùng bindings sinh ra

Đây là task rủi ro nhất. Làm từng bước, không gộp.

- [ ] Thêm helper `unwrap()` trong `client.ts`: nhận `{status:"ok",data} | {status:"error",error}`, trả `data` hoặc `throw`. Ném đúng hình dạng lỗi mà code hiện tại đang bắt — **kiểm tra các `catch` hiện có trước khi chọn hình dạng**, đừng giả định.
- [ ] Đổi mọi `import type` trong `client.ts` từ `./bindings` sang `./bindings.generated`.
- [ ] Đổi thân từng hàm: `invoke<T>("cmd", args)` → `unwrap(await commands.cmd(args))`. Giữ nguyên chữ ký, giữ nguyên nhánh mock.
- [ ] Chuyển 43 file đang `import ... from "ipc/bindings"` sang `ipc/bindings.generated`.
- [ ] Alias `CommitDetails` về biến thể `_Deserialize`.
- [ ] Xoá `src/ipc/bindings.ts`.
- [ ] **Xử lý drift `TagItem.timestamp_sec`:** kiểu giờ là `number | null`. Sửa chỗ dùng trong `BranchSidebar.tsx` để chịu được `null`, và **ghim một test** cho tag không có timestamp (`BranchSidebarTags.test.tsx`). Test này phải qua thí nghiệm phá.
- [ ] Nếu `pnpm build` báo lỗi kiểu ở đâu khác: **mỗi lỗi là một drift thật, ghi lại vào mục nợ kỹ thuật trước khi sửa.** Không ép kiểu cho qua.
- [ ] **Cổng chặn:** `pnpm build` exit 0. `pnpm test` phải **569 test xanh, không sửa một assertion nào** (ngoài test mới cho tag null). Phải sửa assertion cũ nghĩa là hành vi đã đổi → dừng lại xem xét (quy ước 4).

Commit: `♻️ point the IPC client at the generated bindings`

### Task 5 — Xác minh đầu-cuối trong app thật

`pnpm build` chỉ chứng minh kiểu khớp, **không** chứng minh dữ liệu chạy đúng qua dây IPC thật.

- [ ] Chạy app Tauri thật (không phải browser mock). Mở một repo, xác nhận: danh sách branch, commit graph, trạng thái Changes, danh sách tag đều hiện đúng.
- [ ] Riêng tag: xác nhận tag **nhẹ** (không có tagger) hiển thị được — đó chính là đường đi của `timestamp_sec: null`.
- [ ] `pnpm test:e2e` (`app.spec.ts`) xanh.

Không tạo commit nếu không phải sửa gì.

### Task 6 — Tách mock ra khỏi `client.ts`

Commit riêng, revert được độc lập.

- [ ] Chuyển toàn bộ dữ liệu mock và các hàm `resetMock*` sang `src/ipc/mocks/`.
- [ ] `client.ts` import từ đó; **giữ nguyên hành vi mock từng chữ** (spec mục 8 nêu rõ rủi ro làm hỏng browser dev mode).
- [ ] Giữ các export `resetMock*` ở vị trí cũ hoặc cập nhật nơi dùng — kiểm tra test nào đang gọi chúng trước khi di chuyển.
- [ ] **Kiểm chứng:** `pnpm dev` trong browser, xác nhận mock vẫn chạy như trước. `pnpm test` xanh, không sửa assertion.

Commit: `♻️ move the browser dev mocks out of the IPC client`

### Task 7 — Chốt giai đoạn

- [ ] `pnpm check` (trừ `format:check` vốn đã đỏ sẵn — ghi rõ trong báo cáo).
- [ ] Cập nhật `REFACTOR_STATUS.md`: GĐ3 xong, số liệu mới, drift đã sửa, việc tiếp theo là GĐ4.
- [ ] Gỡ dòng `bindings.ts:270` khỏi bảng nợ kỹ thuật (file đã bị xoá).

Commit: `📝 record Phase 3 as complete in the status handover`

---

## Tiêu chí hoàn thành

- [ ] `src/ipc/bindings.ts` không còn tồn tại
- [ ] `src/ipc/bindings.generated.ts` do `tauri-specta` sinh, có header cảnh báo, không sửa tay
- [ ] Sinh lại bindings không tạo diff; CI chặn drift
- [ ] `invokeCommand` giữ nguyên public API; **0 / 291 call site phải sửa**
- [ ] Drift `TagItem.timestamp_sec` đã sửa, có test ghim
- [ ] Mock nằm ngoài `client.ts`
- [ ] `pnpm build` exit 0 — an toàn kiểu compile-time đã khôi phục
- [ ] `pnpm test` 569+ test xanh, không sửa assertion cũ
- [ ] `cargo test` + `cargo clippy -- -D warnings` xanh
- [ ] App Tauri thật chạy đúng, kể cả tag nhẹ

## Rủi ro

| Rủi ro | Giảm thiểu |
| --- | --- |
| Test binary không khởi động trên Windows | Task 1 làm trước và **kiểm chứng riêng**. Triệu chứng là `0xc0000139` câm lặng — biết trước thì không mất thời gian |
| Kiểu sinh ra làm vỡ call site | Adapter hấp thụ. Mỗi lỗi kiểu là drift thật, phải ghi nhận chứ không ép kiểu |
| Hình dạng lỗi đổi, `catch` hiện có không bắt được | `unwrap()` phải ném đúng hình dạng cũ. Kiểm tra `catch` hiện có **trước** khi viết |
| Mock tách ra làm hỏng browser dev mode | Commit riêng, revert độc lập, kiểm chứng thủ công bằng `pnpm dev` |
| `pnpm build` xanh nhưng runtime sai | Task 5 chạy app thật — build chỉ chứng minh kiểu, không chứng minh dây IPC |
