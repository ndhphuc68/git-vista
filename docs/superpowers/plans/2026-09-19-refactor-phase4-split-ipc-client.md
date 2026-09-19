# Giai đoạn 4: Tách `ipc/client.ts` theo domain

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/ipc/client.ts` (1347 dòng, 77 method trong một object) tách thành 16 file theo domain khớp với `src-tauri/src/commands/`. Mọi file production dưới 300 dòng.

**Architecture:** Đây là **di chuyển code thuần tuý**. Mỗi domain file export một object chứa các method của nó; `client.ts` gom lại thành `invokeCommand` y như cũ. 66 file gọi và 38 file test mock **không đổi một dòng**.

**Tech Stack:** TypeScript 7, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-18-frontend-architecture-refactor-design.md` mục 4.7
**Nhánh:** `refactor/phase0-foundation` (tiếp tục)

---

## Global Constraints

- **Không đổi hành vi.** Đây là move, không phải refactor logic. Không đổi chữ ký, không đổi nhánh mock, không "nhân tiện" dọn gì cả (quy ước 5).
- **Public API của `invokeCommand` giữ nguyên tuyệt đối** — cùng tên method, cùng chữ ký, cùng hành vi.
- **Không sửa 291 call site, không sửa 38 test file mock.** Nếu phải sửa, nghĩa là move đã làm đổi hành vi → dừng lại.
- **Không sửa assertion test cũ** (quy ước 4).
- Mọi file production mới phải **dưới 300 dòng**.
- `pnpm lint` giữ exit 0, số warning **phải giảm** (đây là mục tiêu chính của giai đoạn).
- Comment, mô tả test, commit message: **tiếng Anh**.
- Trailer commit: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

---

## Mốc chuẩn đầu giai đoạn — xác minh lại trước khi bắt đầu

| Lệnh | Kết quả mong đợi |
| --- | --- |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 |
| `pnpm test` | **93 file / 570 test** xanh |
| `pnpm check-bindings` | "in sync with the Rust commands" |
| `cargo test` | toàn bộ xanh |

> `pnpm format:check` vẫn đỏ vì nợ CRLF có sẵn. Không phải do giai đoạn này.

---

## Bản đồ domain — suy ra từ Rust, không phải đoán

77 command được ánh xạ về `src-tauri/src/commands/<module>.rs` bằng cách đọc `#[specta::specta]` ở phía Rust rồi đối chiếu tên lệnh trong `bindings.generated.ts`. Kết quả: **77/77 khớp, không sót cái nào.**

| Domain | Method | Dòng ước tính |
| --- | --- | --- |
| `repo` | 28 | **389** ← quá 300, phải xẻ |
| `remote` | 12 | 191 |
| `compare` | 2 | 84 |
| `tag` | 5 | 82 |
| `config` | 2 | 62 |
| `stash` | 5 | 51 |
| `merge` | 5 | 48 |
| `app` | 4 | 47 |
| `conflict` | 2 | 42 |
| `github` | 5 | 40 |
| `rebase` | 2 | 36 |
| `commitActions` | 2 | 32 |
| `undo` | 3 | 22 |

### Xẻ `repo` theo chỗ Rust uỷ quyền tới

`commands/repo.rs` gộp bốn trách nhiệm; đã truy từng lệnh xem nó gọi xuống đâu:

| File mới | Method | Uỷ quyền tới |
| --- | --- | --- |
| `repo.ts` | openRepository, closeRepository, getOpenRepositories, getRecentRepos, clearRecentRepos, removeRecentRepo, selectRepoFolder | `crate::repo::` (vòng đời) |
| `history.ts` | getBranches, getCommitGraph, getCommitDetails, getCommitFileDiff, getRepoStatus, getWorkingFileDiff, getFileBlame, getFileHistory | `crate::read::` |
| `staging.ts` | stageFile, unstageFile, stageAll, unstageAll, discardFileChanges, restoreDiscard, stageHunk, stageLines | `crate::write::staging` |
| `branch.ts` | createCommit, createBranch, checkoutBranch, renameBranch, deleteBranch | `crate::write::branch` |

Đây là ranh giới **có thật trong Rust**, không phải cắt cho đủ số dòng.

---

## Quyết định thiết kế đã chốt

1. **Xẻ `repo` theo chỗ Rust uỷ quyền** (4 file), không giữ nguyên một file 389 dòng rồi để nợ warning cho GĐ7.
2. **`invokeCommand` thành facade re-export.** Domain file giữ implementation; `client.ts` gom lại. 66 call site + 38 test mock không đổi. Code mới có thể import thẳng domain module. GĐ5 sẽ chuyển call site khi nó dời sang `features/` — làm bây giờ là làm hai lần.

---

## Tasks

### Task 1 — Tầng dùng chung `ipc/core.ts`

`isTauri()` và `unwrap()` được mọi domain dùng, phải ra trước.

- [ ] Tạo `src/ipc/core.ts` chứa `isTauri()` và `unwrap()`, **copy nguyên văn**, giữ nguyên comment giải thích tại sao `unwrap` ném lỗi nguyên trạng.
- [ ] `client.ts` import từ đó và **re-export `isTauri`** (đang có nơi import `isTauri` từ `client`— kiểm tra trước khi dời).
- [ ] **Kiểm chứng:** `pnpm build` exit 0, `pnpm test` 570 xanh.

Commit: `♻️ extract the shared IPC helpers into ipc/core.ts`

### Task 2 — 12 domain nhỏ

Làm theo nhóm, mỗi nhóm một commit, chạy test sau mỗi nhóm. Không gộp tất cả vào một commit — nếu hỏng thì không biết hỏng ở đâu.

- [ ] **Nhóm A** (`undo`, `commitActions`, `rebase`, `conflict`): 9 method
- [ ] **Nhóm B** (`app`, `github`, `merge`, `stash`): 19 method
- [ ] **Nhóm C** (`config`, `tag`, `compare`): 9 method
- [ ] **Nhóm D** (`remote`): 12 method

Mỗi domain file theo đúng một khuôn:

```ts
/** <domain> IPC commands. Thin wrappers over the generated bindings. */
import { commands, type ... } from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";   // chỉ khi domain đó có mock

export const <domain>Commands = {
  // ... method chép nguyên văn từ client.ts
};
```

- [ ] Sau mỗi nhóm: `pnpm build` exit 0, `pnpm test` 570 xanh, **không sửa assertion nào**.

Commit mỗi nhóm: `♻️ move the <...> commands into their own IPC modules`

### Task 3 — Xẻ `repo` thành 4 file

Rủi ro cao nhất vì nhiều method nhất.

- [ ] `repo.ts`, `history.ts`, `staging.ts`, `branch.ts` theo bảng trên.
- [ ] **Kiểm chứng:** mỗi file **dưới 300 dòng** (`wc -l`).
- [ ] `pnpm build` exit 0, `pnpm test` 570 xanh.

Commit: `♻️ split the repository commands into lifecycle, history, staging and branch modules`

### Task 4 — `client.ts` thành facade

- [ ] `client.ts` chỉ còn: import 16 domain object, gom thành `invokeCommand`, giữ `listenToRepoChanged` / `listenToTaskProgress`, giữ khối `export type`, giữ re-export `resetMock*`.
- [ ] **Kiểm chứng `invokeCommand` không sót method:** viết một test khẳng định `Object.keys(invokeCommand)` có đúng **77** phần tử. Test này bắt được lỗi quên một domain — thứ mà `pnpm build` không bắt vì call site nào cũng vẫn typecheck qua facade.
- [ ] Thí nghiệm phá (quy ước 3): bỏ một domain khỏi facade → test phải **FAIL**. Hoàn nguyên.
- [ ] `client.ts` **dưới 150 dòng**.

Commit: `♻️ reduce the IPC client to a facade over the domain modules`

### Task 5 — Chốt giai đoạn

- [ ] `pnpm lint` exit 0, **số warning giảm** so với mốc đầu (ghi con số cụ thể vào báo cáo).
- [ ] `pnpm build`, `pnpm test`, `pnpm check-bindings`, `cargo test` đều xanh.
- [ ] Xác nhận `git diff --stat` cho thấy **0 thay đổi** ở `src/components/`, `src/hooks/`, `src/store/` — bằng chứng đây là move thuần tuý.
- [ ] Cập nhật `REFACTOR_STATUS.md`.

Commit: `📝 record Phase 4 as complete in the status handover`

---

## Tiêu chí hoàn thành

- [ ] 16 file `src/ipc/*.ts`, mỗi file **dưới 300 dòng**
- [ ] `client.ts` dưới 150 dòng, chỉ làm facade
- [ ] `invokeCommand` có đủ **77 method**, có test ghim con số
- [ ] **0 thay đổi** trong `src/components/`, `src/hooks/`, `src/store/`
- [ ] `pnpm test` 570+ xanh, không sửa assertion cũ
- [ ] `pnpm lint` exit 0, warning giảm
- [ ] `pnpm build` exit 0

## Rủi ro

| Rủi ro | Giảm thiểu |
| --- | --- |
| Quên một method khi chép → facade thiếu | Test đếm 77 key ở Task 4. `pnpm build` **không** bắt được lỗi này |
| Chép nhầm thân method giữa hai domain | Làm theo nhóm nhỏ, chạy test sau mỗi nhóm |
| Import vòng giữa các domain file | Tất cả chỉ phụ thuộc `core.ts`, `bindings.generated.ts`, `mocks.ts` — không domain nào import domain khác |
| Vô tình đổi hành vi khi "dọn" lúc chép | Quy ước 5: chép nguyên văn. Thấy gì muốn sửa thì ghi lại, để GĐ sau |
