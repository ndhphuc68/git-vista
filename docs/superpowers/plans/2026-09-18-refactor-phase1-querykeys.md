# Giai đoạn 1: Chuẩn hoá query key và sửa bug cache

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay toàn bộ 75 query key literal bằng `qk` từ `src/domain/queryKeys.ts`, sửa dứt điểm bug key lệch tên, và thay 23 lời gọi `invalidateQueries()` trống bằng invalidate đúng phạm vi.

**Architecture:** Đây là giai đoạn ĐẦU TIÊN chạm vào code ứng dụng. Khác hẳn GĐ0 về rủi ro. Chiến lược: migrate theo từng nhóm màn hình, mỗi nhóm chạy test riêng của nó, không gộp nhiều màn hình vào một commit. Lưới an toàn là 73 test file sẵn có.

**Tech Stack:** React 19, TanStack Query v5, TypeScript 7, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-18-frontend-architecture-refactor-design.md` mục 1.2(a) và 4.1
**Nhánh:** `refactor/phase0-foundation` (tiếp tục, không tạo nhánh mới)

## Global Constraints

- **Không đổi hành vi người dùng**, trừ chỗ đang là bug (dữ liệu cũ không được làm mới). Mọi thay đổi khác phải giữ nguyên hành vi.
- **Không viết query key literal mới.** Sau giai đoạn này, chuỗi `queryKey: ["` không được còn trong `src/components/`, `src/hooks/`, `src/App.tsx`.
- **Không được dùng `invalidateQueries()` không tham số** trong code production sau khi xong.
- Mỗi task chạy test của chính màn hình đó trước khi commit; `pnpm test` đầy đủ ở task cuối.
- `pnpm lint` phải giữ exit 0. Số warning **không được tăng** so với mốc đầu giai đoạn.
- Comment tiếng Việt.
- Trailer commit chính xác: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

## Bug đang sửa — đã xác minh trực tiếp

Ba cặp key cùng nghĩa khác chữ:

| Cặp | Số lần dùng | Số lần invalidate |
| --- | --- | --- |
| `repo_status` / `repoStatus` | 16 / 4 | 8 / 2 |
| `commit-graph` / `commit_graph` | 8 / 3 | 5 / 3 |
| `repo_head_info` / `repoHeadInfo` | 1 / 1 | 1 / 0 |

**Đường đi của lỗi, đã truy vết cụ thể:**

- `ChangesScreen.tsx:29` và `RepoHeader.tsx:36` **đọc** `["repoStatus", path]`
- `CommitGraph.tsx:675, 692, 699, 726` **invalidate** `["repo_status"]`

Hai chuỗi khác nhau → React Query không coi là một → sau khi checkout/revert/cherry-pick từ đồ thị commit, **màn hình Changes và header vẫn hiện trạng thái cũ**.

Một phần bị che bởi 23 lời gọi `invalidateQueries()` trống (xoá sạch cache nên "có vẻ đúng"), nhưng `CommitGraph.tsx:675` thì **không được che** — đó là lỗi thật người dùng gặp được.

---

## Thứ tự task và lý do

Đi từ nơi ít phụ thuộc đến nơi nhiều phụ thuộc, mỗi task là một nhóm màn hình có test riêng:

| Task | Phạm vi | Số key | Test bảo vệ |
| --- | --- | --- | --- |
| 1 | Bổ sung 4 key thiếu vào `qk` | — | `queryKeys.test.ts` |
| 2 | `BranchSidebar` + sidebar | 19+5 | `BranchSidebar*.test.tsx`, `PullRequestsSidebar.test.tsx` |
| 3 | `CommitGraph` | 24 | `CommitGraph*.test.tsx` |
| 4 | `ChangesScreen` + changes | 3 | `ChangesScreen.test.tsx`, `StagingFileList.test.tsx` |
| 5 | `RepoHeader` + `App.tsx` + welcome | 6 | `RepoHeader*.test.tsx`, `App.test.tsx`, `WelcomeScreen.test.tsx` |
| 6 | Diff/inspector/compare/conflict/rebase | 7 | các test tương ứng |
| 7 | Pull requests + remotes | 10 | `PullRequest*.test.tsx`, `ManageRemotesModal.test.tsx` |
| 8 | Quét sạch + chốt chặn | — | `pnpm check` đầy đủ |

---

## Task 1: Bổ sung 4 key còn thiếu vào `qk`

**Files:**

- Modify: `src/domain/queryKeys.ts`
- Test: `src/domain/queryKeys.test.ts`

**Interfaces:**

- Consumes: `qk` hiện có
- Produces: thêm `qk.workingFileDiff`, `qk.conflictFile`, `qk.compareSummary`, `qk.rebaseCommits`

**Bối cảnh:** Khảo sát cho thấy code thật dùng 4 key mà `qk` chưa có. Phải bổ sung trước, nếu không các task sau sẽ bí và có thể tự chế key literal mới.

- [ ] **Bước 1: Xem các key thật đang dùng**

Chạy để thấy hình dạng thật:

```bash
grep -rn 'queryKey: \["workingFileDiff\|queryKey: \["conflict_file_data\|queryKey: \["compare-summary\|queryKey: \["rebase-commits' src --include=*.tsx
```

Ghi lại đúng danh sách tham số của từng key — key mới phải nhận đủ các tham số đó, nếu không cache sẽ trộn lẫn dữ liệu của các file/commit khác nhau.

- [ ] **Bước 2: Viết test trước**

Thêm vào `src/domain/queryKeys.test.ts`, bên trong `describe` sẵn có:

```ts
it("key mới cũng mang tiền tố repo để invalidate theo phạm vi", () => {
  const prefix = qk.repo.all(REPO);
  const keys = [
    qk.workingFileDiff(REPO, "a.ts", true, false),
    qk.conflictFile(REPO, "a.ts"),
    qk.compareSummary(REPO, "main", "dev", "twodot"),
    qk.rebaseCommits(REPO, "abc123"),
  ];
  for (const key of keys) {
    expect(key.slice(0, prefix.length)).toEqual([...prefix]);
  }
});

it("workingFileDiff phân biệt theo trạng thái staged và tuỳ chọn khoảng trắng", () => {
  expect(qk.workingFileDiff(REPO, "a.ts", true, false)).not.toEqual(
    qk.workingFileDiff(REPO, "a.ts", false, false)
  );
  expect(qk.workingFileDiff(REPO, "a.ts", true, false)).not.toEqual(
    qk.workingFileDiff(REPO, "a.ts", true, true)
  );
});

it("compareSummary phân biệt theo từng tham số so sánh", () => {
  expect(qk.compareSummary(REPO, "main", "dev", "twodot")).not.toEqual(
    qk.compareSummary(REPO, "main", "dev", "threedot")
  );
  expect(qk.compareSummary(REPO, "main", "dev", "twodot")).not.toEqual(
    qk.compareSummary(REPO, "main", "other", "twodot")
  );
});
```

- [ ] **Bước 3: Chạy test để xác nhận fail**

Chạy: `pnpm vitest run src/domain/queryKeys.test.ts`
Kỳ vọng: FAIL — `qk.workingFileDiff is not a function`.

- [ ] **Bước 4: Bổ sung vào `qk`**

Thêm vào object `qk` trong `src/domain/queryKeys.ts`, đặt cạnh các key cùng nhóm. Tham số phải khớp đúng những gì bước 1 tìm được:

```ts
  /** Diff của file trong thư mục làm việc. Phân biệt staged và tuỳ chọn bỏ qua khoảng trắng. */
  workingFileDiff: (repo: string, filePath: string, isStaged: boolean, ignoreWhitespace: boolean) =>
    ["repo", repo, "workingFileDiff", filePath, isStaged, ignoreWhitespace] as const,

  /** Nội dung file đang xung đột khi merge/rebase. */
  conflictFile: (repo: string, filePath: string) =>
    ["repo", repo, "conflictFile", filePath] as const,

  /** Kết quả so sánh hai nhánh/commit. */
  compareSummary: (repo: string, baseRev: string, targetRev: string, mode: string) =>
    ["repo", repo, "compareSummary", baseRev, targetRev, mode] as const,

  /** Danh sách commit sẽ được rebase tương tác. */
  rebaseCommits: (repo: string, baseCommitId: string) =>
    ["repo", repo, "rebaseCommits", baseCommitId] as const,
```

- [ ] **Bước 5: Chạy test để xác nhận pass**

Chạy: `pnpm vitest run src/domain/queryKeys.test.ts`
Kỳ vọng: PASS, 7 test.

- [ ] **Bước 6: Commit**

```bash
git add src/domain/queryKeys.ts src/domain/queryKeys.test.ts
git commit -m "$(cat <<'EOF'
✨ bo sung 4 query key con thieu vao qk

Khao sat code that cho thay dang dung workingFileDiff, conflict_file_data,
compare-summary, rebase-commits — qk chua co. Bo sung truoc khi migrate
de cac task sau khong phai tu che key literal moi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Sidebar (`BranchSidebar`, `PullRequestsSection`)

**Files:**

- Modify: `src/components/sidebar/BranchSidebar.tsx` (19 chỗ)
- Modify: `src/components/sidebar/PullRequestsSection.tsx` (5 chỗ)
- Test: `src/test/BranchSidebar.test.tsx`, `src/test/BranchSidebarTags.test.tsx`, `src/test/PullRequestsSidebar.test.tsx`

**Interfaces:**

- Consumes: `qk` từ `src/domain/queryKeys` (Task 1)
- Produces: không có API mới — chỉ đổi cách gọi

**Bối cảnh:** `BranchSidebar` có nhiều key nhất (19) và cũng là nơi dùng `repoStatus` camelCase ở dòng 325, 335 — một nửa của cặp lệch.

- [ ] **Bước 1: Liệt kê mọi key trong hai file**

```bash
grep -n "queryKey:" src/components/sidebar/BranchSidebar.tsx src/components/sidebar/PullRequestsSection.tsx
```

Ghi lại từng dòng. Mỗi key literal sẽ được thay bằng một lời gọi `qk.*` tương ứng.

- [ ] **Bước 2: Chạy test TRƯỚC khi sửa, ghi lại mốc**

Chạy: `pnpm vitest run src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx src/test/PullRequestsSidebar.test.tsx`
Ghi lại số test pass. Sau khi sửa phải đúng bằng con số này.

- [ ] **Bước 3: Thay thế từng key**

Thêm import: `import { qk } from "../../domain/queryKeys";`

Quy tắc ánh xạ (áp dụng cho mọi task migrate trong giai đoạn này):

| Literal cũ | Thay bằng |
| --- | --- |
| `["branches", path]` | `qk.branches(path)` |
| `["tags", path]` | `qk.tags(path)` |
| `["remotes", path]` | `qk.remotes(path)` |
| `["stashes", path]` | `qk.stashes(path)` |
| `["repo_status", path]` hoặc `["repoStatus", path]` | `qk.repo.status(path)` |
| `["repo_head", path]` | `qk.repo.head(path)` |
| `["repo_state", path]` | `qk.repo.state(path)` |
| `["commit-graph", path]` hoặc `["commit_graph", path]` | `qk.commitGraph(path)` |

**Quan trọng — xử lý key thiếu `path`:** một số chỗ viết `["repo_status"]` không kèm đường dẫn repo (ví dụ `CommitGraph.tsx:675`). Đó chính là lỗi. Khi thay, phải truyền đúng đường dẫn repo hiện tại. Nếu trong ngữ cảnh đó không có sẵn biến repo path, DỪNG LẠI và báo cho người điều phối — đừng đoán.

- [ ] **Bước 4: Chạy lại test của sidebar**

Chạy: `pnpm vitest run src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx src/test/PullRequestsSidebar.test.tsx`
Kỳ vọng: PASS, đúng bằng số ở bước 2.

**Nếu một test fail:** đọc kỹ nó khẳng định gì. Test fail ở đây thường nghĩa là hành vi đã đổi — phải dừng lại xem xét, KHÔNG được sửa assertion cho nó xanh.

- [ ] **Bước 5: Xác nhận không còn key literal trong hai file**

```bash
grep -n 'queryKey: \["' src/components/sidebar/BranchSidebar.tsx src/components/sidebar/PullRequestsSection.tsx
```

Kỳ vọng: không có kết quả.

- [ ] **Bước 6: Commit**

```bash
git add src/components/sidebar/
git commit -m "$(cat <<'EOF'
♻️ sidebar dung qk thay cho query key literal

BranchSidebar 19 cho, PullRequestsSection 5 cho. Bao gom sua mot nua
cua cap lech repoStatus/repo_status (dong 325, 335).

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `CommitGraph` — nơi bug lộ rõ nhất

**Files:**

- Modify: `src/components/graph/CommitGraph.tsx` (24 chỗ)
- Test: `src/test/CommitGraph.test.tsx`, `src/test/CommitGraphContextMenu.test.tsx`

**Interfaces:**

- Consumes: `qk` (Task 1)
- Produces: không có API mới

**Bối cảnh — đây là task quan trọng nhất của giai đoạn.** `CommitGraph.tsx:675, 692, 699, 726` invalidate `["repo_status"]` **không kèm đường dẫn repo**, trong khi `ChangesScreen` và `RepoHeader` đọc `["repoStatus", path]`. Đây là đường đi của bug người dùng gặp: sau checkout/revert/cherry-pick từ đồ thị, màn hình Changes không cập nhật.

File này cũng có `invalidateQueries()` trống ở dòng ~686.

- [ ] **Bước 1: Chạy test trước, ghi mốc**

Chạy: `pnpm vitest run src/test/CommitGraph.test.tsx src/test/CommitGraphContextMenu.test.tsx`
Ghi lại số test pass.

- [ ] **Bước 2: Liệt kê toàn bộ 24 key**

```bash
grep -n "queryKey:\|invalidateQueries" src/components/graph/CommitGraph.tsx
```

- [ ] **Bước 3: Thay key literal bằng `qk`, BỔ SUNG đường dẫn repo**

Dùng bảng ánh xạ ở Task 2 bước 3.

Với các key thiếu đường dẫn (`["repo_status"]`, `["commit-graph"]`, `["branches"]`, `["repo_head"]`, `["tags"]`, `["repo_state"]`): tìm biến repo path đang có trong component (thường là `currentRepo?.path` hoặc `repoPath`) và truyền vào. **Đây chính là phần sửa bug** — key không có path thì không bao giờ khớp với key có path.

Nếu một lời gọi nằm ở chỗ không có repo path trong tầm với, dừng lại và hỏi.

- [ ] **Bước 4: Thay `invalidateQueries()` trống**

Tìm dòng `queryClient.invalidateQueries();` (khoảng dòng 686). Thay bằng invalidate đúng phạm vi:

```ts
queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
```

`qk.repo.all(path)` làm mới mọi thứ thuộc repo đó — đúng ý định ban đầu của lời gọi trống, nhưng không đụng tới cache của repo khác hay dữ liệu toàn cục như `recentRepos`.

- [ ] **Bước 5: Chạy lại test**

Chạy: `pnpm vitest run src/test/CommitGraph.test.tsx src/test/CommitGraphContextMenu.test.tsx`
Kỳ vọng: PASS, đúng số ở bước 1.

- [ ] **Bước 6: Viết test khẳng định bug đã hết**

Đây là test quan trọng nhất của cả giai đoạn — nó chứng minh việc sửa có tác dụng thật.

Thêm vào `src/test/CommitGraphContextMenu.test.tsx` một test: sau khi thực hiện một thao tác Git từ context menu (ví dụ checkout), khẳng định `invalidateQueries` được gọi với key **khớp đúng** key mà `ChangesScreen` dùng để đọc.

Cách làm gợi ý — so khớp qua chính `qk` thay vì chuỗi cứng, để test không bị lệch lần nữa:

```ts
const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
// ... thực hiện thao tác checkout từ context menu ...
const calls = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
const statusKey = qk.repo.status(REPO_PATH);
const matched = calls.some(
  (k) => Array.isArray(k) && statusKey.slice(0, k.length).every((seg, i) => seg === k[i])
);
expect(matched).toBe(true);
```

Giải thích phép so khớp: React Query invalidate theo tiền tố, nên một lời gọi với `["repo", path]` cũng làm mới `["repo", path, "status"]`. Test phải chấp nhận cả hai, nên nó kiểm tra key được gọi có phải tiền tố của key trạng thái hay không.

- [ ] **Bước 7: Chứng minh test mới có hiệu lực**

Tạm sửa một lời gọi invalidate trong `CommitGraph.tsx` về lại dạng cũ không có path (`queryKey: ["repo_status"]`), chạy lại test mới — nó **phải FAIL**. Rồi hoàn nguyên.

Báo cáo output thật của cả hai chiều. Không có bước này thì không biết test xanh vì code đúng hay vì test rỗng.

- [ ] **Bước 8: Commit**

```bash
git add src/components/graph/CommitGraph.tsx src/test/CommitGraphContextMenu.test.tsx
git commit -m "$(cat <<'EOF'
🐛 sua bug cache: CommitGraph invalidate sai key nen Changes khong cap nhat

CommitGraph invalidate ["repo_status"] khong kem duong dan repo, trong khi
ChangesScreen va RepoHeader doc ["repoStatus", path]. Hai chuoi khac nhau
nen React Query khong coi la mot — sau checkout/revert/cherry-pick tu do thi,
man hinh Changes va header van hien trang thai cu.

Thay toan bo 24 key bang qk (co day du duong dan repo), thay
invalidateQueries() trong bang invalidate dung pham vi repo.

Them test khoa lai hanh vi: kiem tra key invalidate thuc su khop voi key
ma ChangesScreen dung de doc.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Màn hình Changes

**Files:**

- Modify: `src/components/changes/ChangesScreen.tsx` (2 key + **12 lời gọi `invalidateQueries()` trống**)
- Modify: `src/components/changes/InteractiveDiffViewer.tsx` (1 key)
- Test: `src/test/ChangesScreen.test.tsx`, `src/test/StagingFileList.test.tsx`, `src/test/InteractiveDiffViewer.test.tsx`

**Interfaces:**

- Consumes: `qk` (Task 1)

**Bối cảnh:** File này chứa **12 trong số 23** lời gọi `invalidateQueries()` trống — nhiều nhất toàn dự án. Mỗi lần stage/unstage/discard một file là xoá sạch toàn bộ cache và fetch lại mọi thứ, kể cả dữ liệu của repo khác đang mở ở tab khác.

- [ ] **Bước 1: Chạy test trước, ghi mốc**

Chạy: `pnpm vitest run src/test/ChangesScreen.test.tsx src/test/StagingFileList.test.tsx src/test/InteractiveDiffViewer.test.tsx`

- [ ] **Bước 2: Thay 3 key literal**

Theo bảng ánh xạ ở Task 2. `ChangesScreen.tsx:29` dùng `["repoStatus", currentRepo?.path]` → `qk.repo.status(currentRepo.path)`.

**Lưu ý về `?.`:** nhiều key hiện dùng `currentRepo?.path` (có thể `undefined`). `qk.*` nhận `string`. Xử lý bằng cách giữ nguyên `enabled` guard sẵn có của `useQuery` và truyền `currentRepo.path` khi đã chắc chắn có, hoặc dùng `currentRepo?.path ?? ""`. Chọn cách nào thì áp dụng nhất quán; nếu component đã có `enabled: !!currentRepo` thì truyền thẳng là an toàn.

- [ ] **Bước 3: Thay 12 lời gọi `invalidateQueries()` trống**

Mỗi lời gọi nằm sau một thao tác Git (stage, unstage, discard, commit...). Thay bằng:

```ts
await queryClient.invalidateQueries({ queryKey: qk.repo.all(currentRepo.path) });
```

Điều này vẫn làm mới toàn bộ dữ liệu của repo hiện tại — đúng ý định ban đầu — nhưng không còn xoá cache của repo khác.

**Không tối ưu quá tay:** đừng cố chọn lọc chỉ invalidate `status` cho thao tác stage. Giữ phạm vi `repo.all` để hành vi không đổi. Thu hẹp phạm vi là việc của giai đoạn sau, có đo đạc.

- [ ] **Bước 4: Chạy lại test**

Kỳ vọng: PASS, đúng số ở bước 1.

- [ ] **Bước 5: Xác nhận sạch**

```bash
grep -n 'invalidateQueries()' src/components/changes/
```

Kỳ vọng: không có kết quả.

- [ ] **Bước 6: Commit**

```bash
git add src/components/changes/
git commit -m "$(cat <<'EOF'
♻️ Changes dung qk va invalidate dung pham vi

Thay 12 loi goi invalidateQueries() trong — moi lan stage/unstage/discard
mot file dang xoa sach toan bo cache, ke ca du lieu cua repo khac dang mo
o tab khac. Nay chi lam moi du lieu cua repo hien tai.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Header, App, Welcome

**Files:**

- Modify: `src/components/header/RepoHeader.tsx` (2 key + 1 invalidate trống)
- Modify: `src/App.tsx` (1 key + **6 invalidate trống**)
- Modify: `src/components/welcome/WelcomeScreen.tsx` (3 key)
- Test: `src/test/RepoHeader.test.tsx`, `src/test/RepoHeader.remote.test.tsx`, `src/test/App.test.tsx`, `src/test/AppMode.test.tsx`, `src/test/WelcomeScreen.test.tsx`, `src/test/Shell.test.tsx`

**Interfaces:**

- Consumes: `qk` (Task 1)

**Bối cảnh:** `RepoHeader.tsx:36` là nửa còn lại của cặp `repoStatus`. `App.tsx` có 6 invalidate trống, một số nằm ở chỗ đổi repo/tab — nơi xoá sạch cache có thể là **cố ý**.

- [ ] **Bước 1: Chạy test trước, ghi mốc**

Chạy: `pnpm vitest run src/test/RepoHeader.test.tsx src/test/RepoHeader.remote.test.tsx src/test/App.test.tsx src/test/AppMode.test.tsx src/test/WelcomeScreen.test.tsx src/test/Shell.test.tsx`

- [ ] **Bước 2: Thay key literal**

Theo bảng ánh xạ. `WelcomeScreen` dùng `["recent-repos"]` → `qk.recentRepos()` (không thuộc repo nào, đúng như thiết kế).

- [ ] **Bước 3: Xem xét từng invalidate trống trong `App.tsx` — KHÔNG máy móc**

Đọc ngữ cảnh từng chỗ trước khi thay:

- Nếu nằm sau một thao tác Git trên repo hiện tại → thay bằng `qk.repo.all(path)`.
- Nếu nằm ở chỗ **đóng repo, đổi tab, hoặc mở repo mới** → xoá sạch cache có thể là chủ ý. Giữ nguyên `invalidateQueries()` và **thêm comment tiếng Việt giải thích vì sao ở đây cố tình xoá tất cả**.

Ghi vào báo cáo: mỗi chỗ trong 6 chỗ đã xử lý thế nào và vì sao.

- [ ] **Bước 4: Chạy lại test**

Kỳ vọng: PASS, đúng số ở bước 1.

- [ ] **Bước 5: Commit**

```bash
git add src/App.tsx src/components/header/ src/components/welcome/
git commit -m "$(cat <<'EOF'
♻️ header, App va welcome dung qk

RepoHeader:36 la nua con lai cua cap lech repoStatus/repo_status.
Voi 6 invalidate trong trong App.tsx: nhung cho sau thao tac Git da doi
sang pham vi repo; nhung cho doi/dong repo giu nguyen xoa sach cache va
them comment giai thich vi sao co y.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Diff, inspector, compare, conflict, rebase

**Files:**

- Modify: `src/components/diff/CommitDetailPanel.tsx`, `src/components/diff/FileDiffViewer.tsx`
- Modify: `src/components/inspector/BlameView.tsx`, `src/components/inspector/FileHistoryView.tsx`
- Modify: `src/components/compare/CompareModal.tsx`, `src/components/compare/CompareDiffViewer.tsx`
- Modify: `src/components/conflict/ConflictResolverScreen.tsx`
- Modify: `src/components/rebase/InteractiveRebaseModal.tsx`
- Test: `src/test/CommitDetailPanel.test.tsx`, `src/test/FileInspector.test.tsx`, `src/test/FileInspectorEntryPoints.test.tsx`, `src/test/CompareModal.test.tsx`, `src/test/ConflictResolverScreen.test.tsx`, `src/test/InteractiveRebaseModal.test.tsx`, `src/test/DiffViewerWordDiff.test.tsx`

**Interfaces:**

- Consumes: `qk` (Task 1), gồm cả 4 key mới

**Bối cảnh:** Nhóm này dùng các key nhiều tham số — chính là 4 key vừa thêm ở Task 1. Đây là nơi dễ sai nhất: thiếu một tham số thì cache trộn dữ liệu của file/commit khác nhau, hiển thị sai nội dung.

- [ ] **Bước 1: Chạy test trước, ghi mốc**

Chạy: `pnpm vitest run src/test/CommitDetailPanel.test.tsx src/test/FileInspector.test.tsx src/test/FileInspectorEntryPoints.test.tsx src/test/CompareModal.test.tsx src/test/ConflictResolverScreen.test.tsx src/test/InteractiveRebaseModal.test.tsx src/test/DiffViewerWordDiff.test.tsx`

- [ ] **Bước 2: Thay key, giữ ĐỦ mọi tham số**

Ánh xạ bổ sung cho nhóm này:

| Literal cũ | Thay bằng |
| --- | --- |
| `["commit-details", path, commitId]` | `qk.commitDetails(path, commitId)` |
| `["file-diff", path, commitId, filePath, ignoreWs]` | `qk.fileDiff(path, commitId, filePath)` — xem lưu ý dưới |
| `["file-history", path, filePath]` | `qk.fileHistory(path, filePath)` |
| `["file-blame", path, filePath, commitId]` | `qk.fileBlame(path, filePath, commitId)` |
| `["workingFileDiff", ...]` | `qk.workingFileDiff(path, filePath, isStaged, ignoreWs)` |
| `["conflict_file_data", path, filePath]` | `qk.conflictFile(path, filePath)` |
| `["compare-summary", path, base, target, mode]` | `qk.compareSummary(path, base, target, mode)` |
| `["rebase-commits", path, baseCommitId]` | `qk.rebaseCommits(path, baseCommitId)` |

**Lưu ý quan trọng về `file-diff`:** key literal hiện tại có thêm tham số `diffIgnoreWhitespace`, nhưng `qk.fileDiff` (viết ở GĐ0) chỉ nhận 3 tham số. Nếu bỏ tham số đó, hai chế độ hiển thị khoảng trắng sẽ dùng chung một ô cache và hiển thị sai.

**Xử lý:** mở rộng `qk.fileDiff` thêm tham số thứ tư, kèm test tương tự Task 1 bước 2. Đừng bỏ tham số để cho khớp chữ ký cũ. Nếu thấy còn key nào khác rơi vào tình huống tương tự, xử lý cùng cách và báo lại.

- [ ] **Bước 3: Chạy lại test**

Kỳ vọng: PASS, đúng số ở bước 1.

- [ ] **Bước 4: Commit**

```bash
git add src/components/diff/ src/components/inspector/ src/components/compare/ src/components/conflict/ src/components/rebase/ src/domain/queryKeys.ts src/domain/queryKeys.test.ts
git commit -m "$(cat <<'EOF'
♻️ diff, inspector, compare, conflict, rebase dung qk

Nhom nay dung key nhieu tham so. Mo rong qk.fileDiff them tham so
ignoreWhitespace — thieu no thi hai che do hien thi khoang trang dung chung
mot o cache va hien sai noi dung.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Pull requests và remotes

**Files:**

- Modify: `src/components/pullrequests/PullRequestDetailDrawer.tsx` (5 key)
- Modify: `src/components/pullrequests/CreatePullRequestModal.tsx` (2 key)
- Modify: `src/components/remote/ManageRemotesModal.tsx` (3 key)
- Test: `src/test/PullRequestDetailDrawer.test.tsx`, `src/test/CreatePullRequestModal.test.tsx`, `src/test/ManageRemotesModal.test.tsx`, `src/test/GitHubSettingsTab.test.tsx`

**Interfaces:**

- Consumes: `qk` (Task 1)

**Bối cảnh:** Nhóm GitHub có cặp lệch thứ ba: `github_repo_info` (2 lần) và `github-repo-info` (1 lần).

- [ ] **Bước 1: Chạy test trước, ghi mốc**

Chạy: `pnpm vitest run src/test/PullRequestDetailDrawer.test.tsx src/test/CreatePullRequestModal.test.tsx src/test/ManageRemotesModal.test.tsx src/test/GitHubSettingsTab.test.tsx`

- [ ] **Bước 2: Thay key**

| Literal cũ | Thay bằng |
| --- | --- |
| `["github_repo_info", path]` hoặc `["github-repo-info", path]` | `qk.github.repoInfo(path)` |
| `["github_prs", path, owner, repo, state]` | `qk.github.pullRequests(path, state)` — xem lưu ý |
| `["github_pr_detail", path, owner, repo, number]` | `qk.github.pullRequestDetail(path, number)` — xem lưu ý |
| `["github_token"]` | `qk.githubToken()` |
| `["remotes", path]` | `qk.remotes(path)` |

**Lưu ý về `owner`/`repo`:** key cũ chứa `owner` và `repo` của GitHub; `qk.github.*` (viết ở GĐ0) không nhận chúng. Vì `owner`/`repo` được suy ra từ chính `repoPath`, bỏ chúng thường an toàn — nhưng phải **kiểm chứng**: nếu cùng một repoPath có thể ứng với nhiều owner/repo (ví dụ khi đổi remote), thì bỏ đi sẽ gây lẫn cache.

Kiểm tra cách `repoInfo` được lấy trong `PullRequestsSection.tsx` và `githubService.ts`. Nếu thấy có khả năng lẫn, mở rộng `qk.github.*` để nhận thêm owner/repo thay vì bỏ. Báo lại kết luận và lý do.

- [ ] **Bước 3: Chạy lại test**

Kỳ vọng: PASS, đúng số ở bước 1.

- [ ] **Bước 4: Commit**

```bash
git add src/components/pullrequests/ src/components/remote/
git commit -m "$(cat <<'EOF'
♻️ pull requests va remotes dung qk

Sua cap lech thu ba: github_repo_info vs github-repo-info.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Quét sạch và chốt chặn

**Files:**

- Modify: bất kỳ file nào còn sót (dự kiến không còn)
- Modify: `.oxlintrc.json` (thêm luật chặn tái phạm)

**Interfaces:**

- Consumes: toàn bộ kết quả Task 1–7

**Bối cảnh:** Đây là bước khoá lại. Không có nó, key literal sẽ quay lại trong vài tuần.

- [ ] **Bước 1: Quét key literal còn sót**

```bash
grep -rn 'queryKey: \["' src --include=*.tsx --include=*.ts | grep -v "src/test\|src/domain"
```

Kỳ vọng: **không có kết quả**. Nếu còn, migrate nốt theo bảng ánh xạ ở các task trên.

- [ ] **Bước 2: Quét `invalidateQueries()` trống còn sót**

```bash
grep -rn 'invalidateQueries()' src --include=*.tsx --include=*.ts | grep -v src/test
```

Kỳ vọng: chỉ còn những chỗ **cố ý** trong `App.tsx` (đổi/đóng repo), và mỗi chỗ phải có comment giải thích. Nếu có chỗ nào không comment, hoặc là thêm comment, hoặc là đổi sang phạm vi repo.

- [ ] **Bước 3: Quét ba cặp key lệch — phải biến mất hoàn toàn**

```bash
grep -rn 'repo_status\|repoStatus\|commit-graph\|commit_graph\|repo_head_info\|repoHeadInfo\|github-repo-info\|github_repo_info' src --include=*.tsx --include=*.ts | grep -v "src/test\|src/domain"
```

Kỳ vọng: không có kết quả. Đây là bằng chứng bug đã hết.

- [ ] **Bước 4: Thêm luật lint chặn tái phạm**

Vào `.oxlintrc.json`, thêm vào `rules` (giữ nguyên mọi luật sẵn có):

```jsonc
"no-restricted-syntax": [
  "warn",
  {
    "selector": "Property[key.name='queryKey'] > ArrayExpression > Literal[value=/^[a-z]/i]",
    "message": "Không viết query key literal. Dùng qk từ src/domain/queryKeys.ts."
  }
]
```

Đặt mức `warn` cho nhất quán với các luật khác của giai đoạn này; GĐ7 sẽ nâng tất cả lên `error` cùng lúc.

- [ ] **Bước 5: Xác nhận luật lint thật sự bắt được**

Tạm thêm vào một file component bất kỳ một dòng `queryKey: ["test_vi_pham"]`, chạy `pnpm lint`, xác nhận nó **bị cảnh báo**. Rồi xoá dòng đó đi.

Báo cáo output thật. Một luật lint không được kiểm chứng thì không khác gì không có.

- [ ] **Bước 6: Chạy đầy đủ kiểm tra**

```bash
pnpm lint && pnpm build && pnpm test
```

Kỳ vọng:

- `lint` exit 0, số warning **không tăng** so với mốc đầu giai đoạn (ngoại trừ cảnh báo từ luật mới nếu còn sót key, mà lẽ ra không còn).
- `build` exit 0.
- `test` **430 test xanh** (bằng cuối GĐ0), cộng các test mới thêm ở Task 1 và Task 3.

- [ ] **Bước 7: Commit**

```bash
git add .oxlintrc.json
git commit -m "$(cat <<'EOF'
🔧 chan query key literal tai pham bang lint

Da xac minh luat bat duoc bang cach co tinh them mot key literal va thay
no bi canh bao. De muc warn cho nhat quan; GD7 se nang tat ca len error.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Điểm dừng kiểm tra — Giai đoạn 1

Sau Task 8, **dừng lại và báo cáo**. Không tự ý làm tiếp Giai đoạn 2.

Báo cáo phải có:

1. Output thật của `pnpm lint`, `pnpm build`, `pnpm test`.
2. Kết quả ba lệnh quét ở Task 8 bước 1–3 (phải rỗng).
3. Số test trước và sau giai đoạn.
4. Với mỗi chỗ `invalidateQueries()` trống còn giữ lại: ở đâu và vì sao.
5. Kết luận về `owner`/`repo` trong key GitHub (Task 7 bước 2).

## Tiêu chí hoàn thành Giai đoạn 1

- [ ] Không còn `queryKey: ["` trong `src/components/`, `src/hooks/`, `src/App.tsx`
- [ ] Ba cặp key lệch biến mất hoàn toàn
- [ ] 23 lời gọi `invalidateQueries()` trống: đã thay, hoặc giữ lại có comment giải thích
- [ ] Có test khoá lại hành vi invalidate đúng key (Task 3), đã chứng minh bằng thí nghiệm phá
- [ ] Lint chặn key literal tái phạm, đã kiểm chứng
- [ ] `pnpm lint` exit 0, warning không tăng
- [ ] `pnpm build` xanh
- [ ] Toàn bộ test xanh, không sửa assertion nào của test cũ
