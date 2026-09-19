# Giai đoạn 5 lát 2 — `features/remote` và `features/stash`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa hai domain `remote` và `stash` vào `features/`, và nhờ đó gỡ hết ngoại lệ ranh giới mà lát 1 phải mở tạm cho `BranchSidebar`.

**Architecture:** Lặp lại đúng khuôn mẫu đã chạy được ở lát 1: `api/` giữ toàn bộ tiếp xúc với `ipc/` và tự lo invalidation; `components/` chỉ gọi hook; `model/` chứa logic thuần. Không phát minh khuôn mẫu mới. Khác biệt duy nhất so với lát 1: `remote` có các lệnh chạy dài kèm tiến trình (`fetch`/`pull`/`push`) đã có sẵn `useRemoteTask` — hook đó **chuyển vào** feature chứ không viết lại.

**Tech Stack:** React 19, TanStack Query v5, Vitest + Testing Library, oxlint, Tauri v2 + tauri-specta.

## Global Constraints

- Ngôn ngữ: code, comment, mô tả test, commit message viết **tiếng Anh**. Chuỗi người dùng đọc được (`src/i18n/*`, `aria-label`, `title`) giữ **tiếng Việt**. `pnpm check-comment-language` ép buộc.
- Trailer commit cố định: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- Mọi query key phải lấy từ `src/domain/queryKeys.ts` (`qk`). Không viết literal. `pnpm check-query-keys` ép buộc.
- Mốc kiểm chứng mỗi task: `pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language` — tất cả phải xanh, **và tổng số test không được giảm**.
- Mốc đầu lát 2, đo thật tại commit `f7bbc8b`: **99 file / 618 test**, `pnpm lint` exit 0, `pnpm build` exit 0.
- Không sửa assertion của test cũ cho nó xanh. Chỉ được sửa **đường import** và bọc `QueryClientProvider` khi thiếu.
- Mỗi test mới phải qua **thí nghiệm phá**: cố tình làm hỏng implementation, xác nhận test FAIL, rồi hoàn nguyên.
- `pnpm format:check` hiện đang đỏ sẵn trên toàn repo (lệch CRLF, ~189 file) — **không** nằm trong mốc kiểm chứng. Chỉ chạy `npx prettier --write` trên đúng file mình sửa.

---

## Bối cảnh: nợ từ lát 1 mà lát này phải trả

`architectureBoundaries.test.ts` đang giữ 4 ngoại lệ. Đây là danh sách việc thật của lát 2 — xong lát này phải **xoá được 3 dòng đầu**:

| File | Vi phạm | Task gỡ |
| --- | --- | --- |
| `features/branch/model/useStashCommands.ts` | import `ipc/` | Task 5 (xoá hẳn file) |
| `features/branch/components/CheckoutConflictModal.tsx` | `saveStash` | Task 4 |
| `features/branch/components/BranchSidebar.tsx` | import `ipc/` + import `features/tag` | Task 8 (gỡ được phần remote + stash; phần `features/tag` **còn lại**, xem Task 8) |
| `features/branch/components/DeleteBranchModal.tsx` | `undoDeleteBranch` | **Ngoài phạm vi** — chờ domain undo |

Lát này **thêm** một ngoại lệ mới, có chủ đích: `features/stash/components/StashDiffView.tsx` gọi `getCommitDetails` (domain commit, chưa có feature). Cuối lát 2, `IPC_IMPORT_EXCEPTIONS` còn đúng **3** entry: `BranchSidebar`, `DeleteBranchModal`, `StashDiffView` — và `CROSS_FEATURE_EXCEPTIONS` **rỗng**.

---

## Cấu trúc file sau khi xong

```
src/features/remote/
├─ api/
│  ├─ useRemotes.ts            query danh sách remote
│  ├─ useRemoteMutations.ts    add/rename/remove/setUrl/prune
│  ├─ useRemoteTask.ts         fetch/pull/push có tiến trình (chuyển từ src/hooks/)
│  └─ index.ts
├─ components/
│  ├─ ManageRemotesModal.tsx
│  ├─ AddEditRemoteModal.tsx
│  ├─ DeleteRemoteModal.tsx
│  └─ PruneConfirmModal.tsx
└─ index.ts

src/features/stash/
├─ api/
│  ├─ useStashes.ts            query danh sách stash
│  ├─ useStashMutations.ts     save/apply/pop/drop
│  └─ index.ts
├─ components/
│  ├─ CreateStashModal.tsx
│  └─ StashDiffView.tsx
└─ index.ts
```

Sau khi xong, `src/components/remote/` và `src/components/stash/` **xoá hẳn**, `src/hooks/useRemoteTask.ts` **xoá hẳn**.

---

## Task 1: `features/stash/api`

Làm `stash` trước vì nó nhỏ hơn và gỡ được ngoại lệ sớm nhất.

**Files:**
- Create: `src/features/stash/api/useStashes.ts`
- Create: `src/features/stash/api/useStashMutations.ts`
- Create: `src/features/stash/api/index.ts`
- Test: `src/features/stash/api/useStashMutations.test.ts`

**Interfaces:**
- Consumes: `invokeCommand`, `qk`, type `StashItem` từ `src/ipc/bindings.generated`.
- Produces — Task 2–5 dùng đúng các tên này:
  - `useStashes(repoPath): UseQueryResult<StashItem[]>`
  - `useSaveStash(repoPath)` — vars `{ message?: string | null; includeUntracked?: boolean }`, **resolve ra `string`** (commit id)
  - `useApplyStash(repoPath)` — vars `{ index: number }`, resolve `void`
  - `usePopStash(repoPath)` — vars `{ index: number }`, resolve `void`
  - `useDropStash(repoPath)` — vars `{ index: number }`, **resolve ra `string`** (undo receipt)

> **Hai hook trả giá trị, không phải `void`.** `invokeCommand.saveStash` trả `Promise<string>` (commit id) và `invokeCommand.dropStash` trả `Promise<string>` (receipt cho toast hoàn tác). `mutationFn` phải **return**, không được nuốt — giống hệt bẫy `deleteBranch` ở lát 1. Một `mutationFn` quên `return` vẫn type-check và vẫn qua mọi test khác, nên phải có assertion riêng.

*Trước khi viết:* xác nhận chữ ký thật, **không đoán**:
```bash
grep -n "getStashes\|saveStash\|applyStash\|popStash\|dropStash" src/ipc/stash.ts
```
Chữ ký đúng tại thời điểm lập kế hoạch:
```
getStashes(repoPath)                                          -> Promise<StashItem[]>
saveStash(repoPath, message?: string|null, includeUntracked?) -> Promise<string>
applyStash(repoPath, index)                                   -> Promise<void>
popStash(repoPath, index)                                     -> Promise<void>
dropStash(repoPath, index)                                    -> Promise<string>
```

### Invalidation — quyết định và lý do

Stash thay đổi ảnh hưởng **hai** thứ: danh sách stash, và trạng thái working tree.

- `saveStash` / `applyStash` / `popStash` → invalidate `qk.repo.all(repoPath)`. Lý do: stash lấy thay đổi ra khỏi (hoặc trả về) working tree, nên `qk.repo.status` phải làm mới. `qk.repo.all` phủ cả `qk.stashes` vì mọi key đều bắt đầu bằng `["repo", repoPath]`.
- `dropStash` → **chỉ** invalidate `qk.stashes(repoPath)`. Lý do: xoá một stash entry không đụng tới working tree. Đây là **khác biệt có chủ đích** so với ba hook kia, và có test ghim.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/stash/api/useStashMutations.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useApplyStash, useDropStash, usePopStash, useSaveStash } from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getStashes: vi.fn().mockResolvedValue([]),
    saveStash: vi.fn().mockResolvedValue("commit-id"),
    applyStash: vi.fn().mockResolvedValue(undefined),
    popStash: vi.fn().mockResolvedValue(undefined),
    dropStash: vi.fn().mockResolvedValue("receipt"),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("stash mutation hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it.each([
    ["useSaveStash", useSaveStash, { message: "wip" }],
    ["useApplyStash", useApplyStash, { index: 0 }],
    ["usePopStash", usePopStash, { index: 0 }],
  ] as const)("%s refreshes the whole repo scope", async (_label, hook, vars) => {
    const { result } = renderHook(() => hook(REPO), { wrapper: makeWrapper(client) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.mutate(vars as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("useDropStash refreshes only the stash list", async () => {
    // Dropping an entry does not touch the working tree, so widening this to
    // qk.repo.all would refetch the status, graph and branches for nothing.
    const { result } = renderHook(() => useDropStash(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ index: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.stashes(REPO) });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("does not invalidate when the command fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.applyStash).mockRejectedValueOnce(new Error("CONFLICT"));

    const { result } = renderHook(() => useApplyStash(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ index: 0 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("useDropStash resolves with the undo receipt", async () => {
    // The undo toast is built from this value. A mutationFn that forgets to
    // return it still type-checks and still passes every other test here.
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.dropStash).mockResolvedValueOnce("receipt-42");

    const { result } = renderHook(() => useDropStash(REPO), { wrapper: makeWrapper(client) });
    const receipt = await result.current.mutateAsync({ index: 0 });

    expect(receipt).toBe("receipt-42");
  });

  it("useSaveStash resolves with the new commit id and forwards its flags", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.saveStash).mockResolvedValueOnce("stash-commit");

    const { result } = renderHook(() => useSaveStash(REPO), { wrapper: makeWrapper(client) });
    const id = await result.current.mutateAsync({ message: "wip", includeUntracked: true });

    expect(id).toBe("stash-commit");
    expect(invokeCommand.saveStash).toHaveBeenCalledWith(REPO, "wip", true);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `pnpm vitest run src/features/stash/api/useStashMutations.test.ts`
Expected: FAIL — không resolve được `./index`.

- [ ] **Step 3: Viết implementation**

`src/features/stash/api/useStashes.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Stash entries of a repository, newest first. */
export function useStashes(repoPath: string) {
  return useQuery({
    queryKey: qk.stashes(repoPath),
    queryFn: () => invokeCommand.getStashes(repoPath),
    enabled: Boolean(repoPath),
  });
}
```

`src/features/stash/api/useStashMutations.ts`:

```ts
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/**
 * Saving, applying and popping a stash all move changes in or out of the
 * working tree, so the repo status and graph have to be refetched too.
 * qk.repo.all covers them because every key starts with ["repo", repoPath].
 */
function invalidateRepoScope(queryClient: QueryClient, repoPath: string) {
  queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
}

export interface SaveStashVars {
  message?: string | null;
  includeUntracked?: boolean;
}

/** Creates a stash and resolves with the commit id the backend returns. */
export function useSaveStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<string, unknown, SaveStashVars>({
    mutationFn: (vars) =>
      invokeCommand.saveStash(repoPath, vars.message, vars.includeUntracked),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

export interface StashIndexVars {
  index: number;
}

export function useApplyStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: StashIndexVars) => invokeCommand.applyStash(repoPath, vars.index),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

export function usePopStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: StashIndexVars) => invokeCommand.popStash(repoPath, vars.index),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

/**
 * Drops a stash entry and resolves with the receipt the undo toast needs.
 *
 * Unlike the three above, this only refreshes the stash list: removing an
 * entry leaves the working tree untouched, so widening the scope would
 * refetch the status, graph and branches for nothing.
 */
export function useDropStash(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<string, unknown, StashIndexVars>({
    mutationFn: (vars) => invokeCommand.dropStash(repoPath, vars.index),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stashes(repoPath) });
    },
  });
}
```

`src/features/stash/api/index.ts`:

```ts
export { useStashes } from "./useStashes";
export {
  useSaveStash,
  useApplyStash,
  usePopStash,
  useDropStash,
  type SaveStashVars,
  type StashIndexVars,
} from "./useStashMutations";
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `pnpm vitest run src/features/stash/api/useStashMutations.test.ts`
Expected: 7 test PASS (3 từ `it.each` + 4 test riêng).

- [ ] **Step 5: Thí nghiệm phá**

Đổi `onSuccess` của `useDropStash` thành `invalidateRepoScope(queryClient, repoPath)`.
Run lại. Expected: **FAIL** ở "useDropStash refreshes only the stash list".
Hoàn nguyên, xác nhận xanh.

- [ ] **Step 6: Xác minh và commit**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```

```bash
git add -A
git commit -m "✨ add features/stash/api

Five hooks covering the stash list and its four commands. saveStash and
dropStash return their values rather than swallowing them — the commit id and
the undo receipt are both read by callers.

dropStash deliberately invalidates only qk.stashes: removing an entry does not
touch the working tree. A test pins that narrower scope.

Break experiment: widening dropStash to qk.repo.all failed that test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Chuyển hai component stash vào feature

**Files:**
- Create: `src/features/stash/components/CreateStashModal.tsx` (từ `components/stash/`)
- Create: `src/features/stash/components/StashDiffView.tsx` (từ `components/stash/`)
- Create: `src/features/stash/index.ts`
- Modify: `src/features/branch/components/BranchSidebar.tsx` (đổi đường import `StashDiffView`)
- Modify: `src/components/changes/ChangesScreen.tsx` (dùng `useSaveStash`)
- Modify: `src/test/architectureBoundaries.test.ts` (thêm ngoại lệ `StashDiffView`, đổi `CROSS_FEATURE_EXCEPTIONS` sang mảng)
- Modify: `src/test/CreateStashModal.test.tsx`, `src/test/StashUI.test.tsx`
- Delete: `src/components/stash/`

**Interfaces:**
- Consumes: hook từ Task 1.
- Produces: `features/stash` export `CreateStashModal`, `StashDiffView`, props type của cả hai, và `useStashes`. **Props giữ nguyên chữ ký cũ.**

- [ ] **Step 1: Đọc hai file trước khi đụng vào**

```bash
cat src/components/stash/CreateStashModal.tsx
cat src/components/stash/StashDiffView.tsx
grep -n "CreateStashModal\|StashDiffView" src/test/CreateStashModal.test.tsx src/test/StashUI.test.tsx
```

Ghi lại với mỗi file: gọi lệnh `invokeCommand` nào, có prop `onSuccess` không, quản `loading` ra sao, có `data-autofocus` không.

**Hai điều đã kiểm trước, đừng làm sai:**

1. **`StashDiffView` nhận `onApply`/`onPop`/`onDrop` qua props** (`(index: number) => void`) — không tự gọi ba lệnh đó. Đừng nhét mutation hook vào nó.
2. **Nhưng nó *có* gọi `invokeCommand.getCommitDetails`** trong một `useEffect` để lấy nội dung diff của stash. Đây là lệnh thuộc domain **commit**, không phải stash — `features/stash/api` không có hook cho nó, và lát này **không** dựng `features/commit`. Vì vậy `StashDiffView` sẽ vi phạm luật "chỉ `api/` được chạm `ipc/`" sau khi chuyển vào feature.

   Xử lý: giữ nguyên lời gọi, thêm comment giải thích, và thêm một entry vào `IPC_IMPORT_EXCEPTIONS`:
   ```ts
   "features/stash/components/StashDiffView.tsx":
     "reads commit details to render the stash diff; removed once the commit domain has a hook",
   ```

**Cả hai props interface đều KHÔNG được export** (`interface StashDiffViewProps` và `interface CreateStashModalProps`, không có `export`). Quyết định: thêm `export` vào cả hai khi chuyển file, để barrel ở Step 4 export được type. Đây là thay đổi an toàn — thêm `export` không đổi hành vi.

- [ ] **Step 2: Di chuyển file**

```bash
mkdir -p src/features/stash/components
git mv src/components/stash/CreateStashModal.tsx src/features/stash/components/CreateStashModal.tsx
git mv src/components/stash/StashDiffView.tsx src/features/stash/components/StashDiffView.tsx
```

Trong cả hai, đường import lùi thêm một cấp: `../../i18n` → `../../../i18n`, `../../shared/ui` → `../../../shared/ui`, v.v.

Kiểm tra không còn file nào trong `src/components/stash/`; nếu rỗng thì thư mục tự biến mất khỏi git.

- [ ] **Step 3: KHÔNG thay gì trong `CreateStashModal` — đã kiểm, nó vốn sạch**

`CreateStashModal` **không gọi IPC**. Nó nhận `onSaveStash: (message: string, includeUntracked: boolean) => Promise<string>` qua props, và `src/components/changes/ChangesScreen.tsx:303` mới là chỗ gọi lệnh thật.

Việc duy nhất phải làm với file này: thêm `export` vào `interface CreateStashModalProps` (hiện chưa export). **Không** nhét hook vào nó — làm vậy là đổi kiến trúc một component vốn đã đúng, và 15 test của nó đều dựng quanh prop `onSaveStash`.

Đổi chỗ gọi trong `ChangesScreen` sang hook:

```ts
import { useSaveStash } from "../../features/stash/api";
```

```ts
  const saveStash = useSaveStash(repoPath);
```

Thân hàm hiện tại (`ChangesScreen.tsx:303`) là:

```ts
        onSaveStash={async (message, includeUntracked) => {
          const id = await invokeCommand.saveStash(currentRepo.path, message, includeUntracked);
          queryClient.invalidateQueries({ queryKey: qk.stashes(currentRepo.path) });
          setShowCreateStash(false);
          return id;
        }}
```

Đổi thành:

```ts
        onSaveStash={async (message, includeUntracked) => {
          // useSaveStash invalidates qk.repo.all, which covers qk.stashes.
          const id = await saveStash.mutateAsync({ message, includeUntracked });
          setShowCreateStash(false);
          return id;
        }}
```

**Ba điểm phải giữ:**
1. `return id` — prop khai báo `Promise<string>`, bỏ `return` là đổi hợp đồng.
2. `setShowCreateStash(false)` — đóng modal, không liên quan tới cache.
3. Dòng `invalidateQueries({ queryKey: qk.stashes })` **xoá được**, vì hook đã invalidate `qk.repo.all` (phủ rộng hơn: stash save còn đổi cả working tree status). Ghi việc này vào commit message.

`ChangesScreen` nằm ở `src/components/`, không phải feature, nên import `features/stash/api` là **hợp lệ** — không cần ngoại lệ.

- [ ] **Step 4: Viết `src/features/stash/index.ts`**

```ts
export { CreateStashModal, type CreateStashModalProps } from "./components/CreateStashModal";
export { StashDiffView, type StashDiffViewProps } from "./components/StashDiffView";
export { useStashes } from "./api";
```

Tên props type phải khớp đúng những gì file thật export — kiểm lại từ Step 1. Nếu một file **không** export props type, bỏ dòng type đó đi thay vì bịa ra.

- [ ] **Step 5: Đổi import ở mọi call site**

```bash
grep -rn "components/stash" src e2e
```

Sửa từng chỗ:
- `src/features/branch/components/BranchSidebar.tsx`: `import { StashDiffView } from "../../../features/stash";`
- `src/test/CreateStashModal.test.tsx` và `src/test/StashUI.test.tsx`: trỏ `"../features/stash"`

> **Lưu ý:** `BranchSidebar` (feature `branch`) import `features/stash` là **vi phạm cross-feature mới**. Đây là bước trung gian có chủ đích — Task 8 gỡ nó bằng cách đẩy `StashDiffView` lên `Shell`. Trong lúc đó, thêm một dòng vào `CROSS_FEATURE_EXCEPTIONS` của `src/test/architectureBoundaries.test.ts`:
>
> ```ts
>   "features/branch/components/BranchSidebar.tsx": "stash",
> ```
>
> **Chú ý:** map này là một-key-một-giá-trị, mà `BranchSidebar` đã có entry `"tag"` rồi. Nếu cần excuse **hai** feature cho cùng một file, đổi kiểu giá trị thành `string[]` và sửa cả hai chỗ dùng (vòng lặp `continue` và test staleness) cho khớp. Làm gọn:
>
> ```ts
> const CROSS_FEATURE_EXCEPTIONS: Record<string, string[]> = {
>   "features/branch/components/BranchSidebar.tsx": ["tag", "stash"],
> };
> ```
> — vòng lặp đổi thành `if (CROSS_FEATURE_EXCEPTIONS[rel]?.includes(other)) continue;`, test staleness lặp qua từng phần tử của mảng.

- [ ] **Step 6: Bọc provider cho test nếu cần**

`CreateStashModal` **không** đổi sang hook nên 16 test của nó nhiều khả năng chỉ cần đổi đường import. Nhưng `ChangesScreen` giờ gọi `useSaveStash` — chạy test của nó và bọc provider nếu thiếu. Tiền lệ ở `src/test/CreateTagModal.test.tsx`:

```tsx
function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
```

Đổi `render(` thành `renderWithClient(` ở các chỗ render modal. **Không đổi assertion.**

- [ ] **Step 7: Xác minh**

```bash
pnpm vitest run src/test/CreateStashModal.test.tsx src/test/StashUI.test.tsx src/test/ChangesScreen.test.tsx src/test/architectureBoundaries.test.ts
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```
Expected: tất cả xanh, tổng số test **không giảm** (16 test của hai file stash phải còn nguyên).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "♻️ move the stash components into features/stash

CreateStashModal and StashDiffView leave components/stash. The modal was
already presentational — it takes onSaveStash as a prop — so it keeps its
shape; ChangesScreen, the real caller, now goes through useSaveStash and
drops its manual qk.stashes invalidation because the hook covers it.

StashDiffView reads commit details to render the diff, which is a command
from the commit domain. That stays on invokeCommand as a named exception
until a commit feature exists.

BranchSidebar now imports features/stash, a cross-feature violation recorded
as a named exception — Task 8 removes it by handing the panel to Shell.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `features/remote/api` — query và 5 mutation

**Files:**
- Create: `src/features/remote/api/useRemotes.ts`
- Create: `src/features/remote/api/useRemoteMutations.ts`
- Create: `src/features/remote/api/index.ts`
- Test: `src/features/remote/api/useRemoteMutations.test.ts`

**Interfaces:**
- Consumes: `invokeCommand`, `qk`, type `RemoteItem`, `PruneResult` từ `src/ipc/bindings.generated`.
- Produces — Task 4, 6, 7, 8 dùng đúng các tên này:
  - `useRemotes(repoPath): UseQueryResult<RemoteItem[]>`
  - `useAddRemote(repoPath)` — vars `{ name: string; url: string }`, resolve `RemoteItem`
  - `useRenameRemote(repoPath)` — vars `{ oldName: string; newName: string }`, resolve `void`
  - `useRemoveRemote(repoPath)` — vars `{ name: string }`, resolve `void`
  - `useSetRemoteUrl(repoPath)` — vars `{ name: string; fetchUrl: string; pushUrl?: string | null }`, resolve `void`
  - `usePruneRemote(repoPath)` — vars `{ remote: string; taskId?: string }`, resolve `PruneResult`

*Trước khi viết:* xác nhận chữ ký thật, **không đoán**:
```bash
grep -n "getRemotes\|addRemote\|renameRemote\|removeRemote\|setRemoteUrl\|pruneRemote" src/ipc/remote.ts
```
Chữ ký đúng tại thời điểm lập kế hoạch:
```
getRemotes(repoPath)                                   -> Promise<RemoteItem[]>
addRemote(repoPath, name, url)                         -> Promise<RemoteItem>
renameRemote(repoPath, oldName, newName)               -> Promise<void>
removeRemote(repoPath, name)                           -> Promise<void>
setRemoteUrl(repoPath, name, fetchUrl, pushUrl?)       -> Promise<void>
pruneRemote(repoPath, remote, taskId?)                 -> Promise<PruneResult>
```

### Invalidation — quyết định và lý do

Mọi thay đổi remote đều ảnh hưởng **hai** key, và đây là chỗ khác với `branch`:

```ts
queryClient.invalidateQueries({ queryKey: qk.remotes(repoPath) });
queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
```

**Tại sao không dùng `qk.repo.all`?** Đổi remote không đụng working tree, không đổi HEAD, không đổi đồ thị commit. Dùng `qk.repo.all` sẽ refetch status + graph vô ích mỗi lần sửa URL. Nhưng **phải** có `qk.branches` vì danh sách nhánh remote-tracking đổi theo.

> `ManageRemotesModal` hiện còn invalidate thêm `qk.github.repoInfo(repoPath)` sau khi sửa remote — thông tin GitHub suy ra từ URL remote. **Giữ lại** hành vi đó ở Task 6, không đưa vào hook chung: chỉ modal đó cần, và `github` là domain khác.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/remote/api/useRemoteMutations.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import {
  useAddRemote,
  usePruneRemote,
  useRemoveRemote,
  useRenameRemote,
  useSetRemoteUrl,
} from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getRemotes: vi.fn().mockResolvedValue([]),
    addRemote: vi.fn().mockResolvedValue({ name: "origin" }),
    renameRemote: vi.fn().mockResolvedValue(undefined),
    removeRemote: vi.fn().mockResolvedValue(undefined),
    setRemoteUrl: vi.fn().mockResolvedValue(undefined),
    pruneRemote: vi
      .fn()
      .mockResolvedValue({ remote: "origin", pruned_branches: [], message: "" }),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("remote mutation hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it.each([
    ["useAddRemote", useAddRemote, { name: "origin", url: "git@x:y.git" }],
    ["useRenameRemote", useRenameRemote, { oldName: "a", newName: "b" }],
    ["useRemoveRemote", useRemoveRemote, { name: "origin" }],
    ["useSetRemoteUrl", useSetRemoteUrl, { name: "origin", fetchUrl: "git@x:y.git" }],
    ["usePruneRemote", usePruneRemote, { remote: "origin" }],
  ] as const)("%s refreshes remotes and branches", async (_label, hook, vars) => {
    const { result } = renderHook(() => hook(REPO), { wrapper: makeWrapper(client) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.mutate(vars as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.remotes(REPO) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.branches(REPO) });
  });

  it("does not widen invalidation to the whole repo scope", async () => {
    // Changing a remote touches neither the working tree nor HEAD, so pulling
    // in qk.repo.all would refetch the status and the commit graph for nothing.
    const { result } = renderHook(() => useSetRemoteUrl(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "origin", fetchUrl: "git@x:y.git" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("does not invalidate when the command fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.addRemote).mockRejectedValueOnce(new Error("REMOTE_EXISTS"));

    const { result } = renderHook(() => useAddRemote(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "origin", url: "git@x:y.git" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("useSetRemoteUrl forwards the optional push url", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useSetRemoteUrl(REPO), { wrapper: makeWrapper(client) });

    await result.current.mutateAsync({
      name: "origin",
      fetchUrl: "git@x:y.git",
      pushUrl: "git@x:z.git",
    });

    expect(invokeCommand.setRemoteUrl).toHaveBeenCalledWith(
      REPO,
      "origin",
      "git@x:y.git",
      "git@x:z.git"
    );
  });

  it("usePruneRemote resolves with the prune result", async () => {
    // The modal renders the pruned branch names from this value; a mutationFn
    // that forgets to return it still type-checks.
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.pruneRemote).mockResolvedValueOnce({
      remote: "origin",
      pruned_branches: ["origin/gone"],
      message: "1 branch pruned",
    });

    const { result } = renderHook(() => usePruneRemote(REPO), { wrapper: makeWrapper(client) });
    const res = await result.current.mutateAsync({ remote: "origin" });

    expect(res.pruned_branches).toEqual(["origin/gone"]);
  });
});
```

> `PruneResult` là `{ remote: string; pruned_branches: string[]; message: string }` — đã kiểm tại `src/ipc/bindings.generated.ts:336`. Nếu kiểu đổi, sửa test cho khớp kiểu thật, đừng ép kiểu để test xanh.

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `pnpm vitest run src/features/remote/api/useRemoteMutations.test.ts`
Expected: FAIL — không resolve được `./index`.

- [ ] **Step 3: Viết implementation**

`src/features/remote/api/useRemotes.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Remotes configured for a repository. */
export function useRemotes(repoPath: string) {
  return useQuery({
    queryKey: qk.remotes(repoPath),
    queryFn: () => invokeCommand.getRemotes(repoPath),
    enabled: Boolean(repoPath),
  });
}
```

`src/features/remote/api/useRemoteMutations.ts`:

```ts
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";
import { type PruneResult, type RemoteItem } from "../../../ipc/bindings.generated";

/**
 * Remote edits change two things: the remote list itself, and the
 * remote-tracking branches derived from it.
 *
 * Deliberately narrower than qk.repo.all — a remote change touches neither
 * the working tree nor HEAD, so refetching the status and the commit graph
 * would be wasted work.
 */
function invalidateRemoteScope(queryClient: QueryClient, repoPath: string) {
  queryClient.invalidateQueries({ queryKey: qk.remotes(repoPath) });
  queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
}

export interface AddRemoteVars {
  name: string;
  url: string;
}

export function useAddRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<RemoteItem, unknown, AddRemoteVars>({
    mutationFn: (vars) => invokeCommand.addRemote(repoPath, vars.name, vars.url),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface RenameRemoteVars {
  oldName: string;
  newName: string;
}

export function useRenameRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: RenameRemoteVars) =>
      invokeCommand.renameRemote(repoPath, vars.oldName, vars.newName),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface RemoveRemoteVars {
  name: string;
}

export function useRemoveRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: RemoveRemoteVars) => invokeCommand.removeRemote(repoPath, vars.name),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface SetRemoteUrlVars {
  name: string;
  fetchUrl: string;
  pushUrl?: string | null;
}

export function useSetRemoteUrl(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: SetRemoteUrlVars) =>
      invokeCommand.setRemoteUrl(repoPath, vars.name, vars.fetchUrl, vars.pushUrl),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface PruneRemoteVars {
  remote: string;
  taskId?: string;
}

/** Prunes stale remote-tracking branches and resolves with what was removed. */
export function usePruneRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<PruneResult, unknown, PruneRemoteVars>({
    mutationFn: (vars) => invokeCommand.pruneRemote(repoPath, vars.remote, vars.taskId),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}
```

`src/features/remote/api/index.ts`:

```ts
export { useRemotes } from "./useRemotes";
export {
  useAddRemote,
  useRenameRemote,
  useRemoveRemote,
  useSetRemoteUrl,
  usePruneRemote,
  type AddRemoteVars,
  type RenameRemoteVars,
  type RemoveRemoteVars,
  type SetRemoteUrlVars,
  type PruneRemoteVars,
} from "./useRemoteMutations";
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `pnpm vitest run src/features/remote/api/useRemoteMutations.test.ts`
Expected: 9 test PASS (5 từ `it.each` + 4 test riêng).

- [ ] **Step 5: Thí nghiệm phá**

Trong `invalidateRemoteScope`, xoá dòng `qk.branches`.
Run lại. Expected: **FAIL** ở cả 5 case của `it.each`.
Hoàn nguyên, xác nhận xanh.

- [ ] **Step 6: Xác minh và commit**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```

```bash
git add -A
git commit -m "✨ add features/remote/api

The remote list plus five mutations. All invalidate qk.remotes and
qk.branches — deliberately narrower than qk.repo.all, because a remote change
touches neither the working tree nor HEAD.

addRemote and pruneRemote return their results rather than swallowing them.

Break experiment: dropping qk.branches from the scope failed all five cases.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Chuyển `useRemoteTask` vào feature và gỡ ngoại lệ `saveStash`

Task này gộp hai việc nhỏ vì cùng chạm một nhóm file và cùng là "đưa lệnh chạy dài về đúng chỗ".

**Files:**
- Move: `src/hooks/useRemoteTask.ts` → `src/features/remote/api/useRemoteTask.ts`
- Modify: `src/features/remote/api/index.ts`
- Modify: `src/features/branch/components/CheckoutConflictModal.tsx`
- Modify: `src/test/architectureBoundaries.test.ts` (xoá 1 ngoại lệ)
- Modify: mọi file import `hooks/useRemoteTask`

**Interfaces:**
- Consumes: `useSaveStash` từ Task 1.
- Produces: `features/remote` export `useRemoteTask` với **chữ ký không đổi**: `useRemoteTask(repoPath: string | undefined, hasUpstream: boolean)`.

- [ ] **Step 1: Tìm mọi chỗ dùng**

```bash
grep -rn "useRemoteTask" src e2e
grep -c "it(" src/test/RemoteProgressBanner.test.tsx src/test/RepoHeader.remote.test.tsx
```

Ghi lại danh sách. Hai file test này là lưới an toàn — sau khi chuyển, chúng phải xanh **chỉ với thay đổi đường import**.

- [ ] **Step 2: Di chuyển**

```bash
git mv src/hooks/useRemoteTask.ts src/features/remote/api/useRemoteTask.ts
```

Trong file mới, đường import lùi thêm hai cấp: `../ipc/client` → `../../../ipc/client`, `../domain/queryKeys` → `../../../domain/queryKeys`, v.v. Sửa cho tới khi `npx tsc --noEmit` sạch.

**Không đổi logic bên trong.** Hook này đã tự invalidate `qk.repo.all` sau khi fetch/pull/push xong — đúng, vì ba lệnh đó đổi cả HEAD lẫn working tree. Giữ nguyên.

Thêm vào `src/features/remote/api/index.ts`:
```ts
export { useRemoteTask } from "./useRemoteTask";
```

- [ ] **Step 3: Đổi import ở mọi call site**

Sửa từng chỗ tìm được ở Step 1 thành `from ".../features/remote"` (đường tương đối đúng với vị trí file gọi).

Run: `pnpm vitest run src/test/RemoteProgressBanner.test.tsx src/test/RepoHeader.remote.test.tsx`
Expected: xanh, **không sửa assertion nào**.

- [ ] **Step 4: Gỡ `saveStash` khỏi `CheckoutConflictModal`**

File: `src/features/branch/components/CheckoutConflictModal.tsx`

Xoá khối comment + import `invokeCommand`:
```ts
// Stash has no feature hook yet — features/stash arrives in the next slice.
// Until then saveStash stays on invokeCommand directly.
import { invokeCommand } from "../../../ipc/client";
```

Thêm: `import { useSaveStash } from "../../stash/api";`

> **Dùng `../../stash/api`, không phải `../../stash`.** Import qua barrel của feature kia kéo theo cả component; đi thẳng vào `api/` giữ phụ thuộc ở mức nhỏ nhất. Dù vậy đây **vẫn** là cross-feature, nên vẫn cần entry ngoại lệ — xem Step 5.

Khai báo hook cạnh hook checkout đã có:
```ts
  const saveStash = useSaveStash(repoPath ?? "");
```

Trong `handleStashAndCheckout`, đổi lời gọi:
```ts
      await saveStash.mutateAsync({
        message: t.modals.checkoutConflict.autoStashMessage.replace("{target}", targetBranch),
        includeUntracked: true,
      });
      await checkoutBranch.mutateAsync({ name: targetBranch });
```

**Thứ tự hai lệnh phải giữ nguyên: stash trước, checkout sau.** Đảo lại là mất thay đổi chưa commit của người dùng.

**Giữ nguyên** `isStashing` là state riêng. Nó phủ **cả hai** lệnh nối tiếp; dùng `saveStash.isPending` thì nút vẫn bấm được trong lúc đang checkout.

- [ ] **Step 5: Cập nhật ngoại lệ ranh giới**

Trong `src/test/architectureBoundaries.test.ts`:

- **Xoá** khỏi `IPC_IMPORT_EXCEPTIONS`:
  ```ts
  "features/branch/components/CheckoutConflictModal.tsx":
    "calls saveStash; removed once features/stash exists",
  ```
- **Thêm** vào `CROSS_FEATURE_EXCEPTIONS` (theo kiểu mảng đã đổi ở Task 2):
  ```ts
  "features/branch/components/CheckoutConflictModal.tsx": ["stash"],
  ```
  Kèm lý do trong comment: modal này thuộc luồng checkout nhánh nhưng phải stash trước; gỡ được khi luồng "stash rồi checkout" có chỗ ở riêng.

- [ ] **Step 6: Xác minh và commit**

```bash
pnpm vitest run src/test/CheckoutConflictModal.test.tsx src/test/architectureBoundaries.test.ts
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```
Expected: tất cả xanh. Entry `CheckoutConflictModal` biến mất khỏi `IPC_IMPORT_EXCEPTIONS`; danh sách còn `BranchSidebar`, `DeleteBranchModal`, `useStashCommands` (Task 5 xoá), và `StashDiffView` (thêm ở Task 2).

```bash
git add -A
git commit -m "♻️ move useRemoteTask into features/remote and drop the saveStash exception

useRemoteTask leaves src/hooks for features/remote/api with its signature and
its internals unchanged — it already owned invalidation for fetch/pull/push.

CheckoutConflictModal now calls useSaveStash instead of invokeCommand, which
removes one ipc exception. The stash still runs before the checkout, and
isStashing stays a real flag because it spans both calls.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Xoá `useStashCommands`, `BranchSidebar` dùng hook stash thật

**Files:**
- Delete: `src/features/branch/model/useStashCommands.ts`
- Modify: `src/features/branch/components/BranchSidebar.tsx`
- Modify: `src/test/architectureBoundaries.test.ts` (xoá 1 ngoại lệ)

**Interfaces:**
- Consumes: `useApplyStash`, `usePopStash`, `useDropStash` từ Task 1.
- Produces: không có export mới. `BranchSidebar` vẫn truyền `onApply`/`onPop`/`onDrop` xuống `StashSection` và `StashDiffView` với **chữ ký prop không đổi** (`(index: number) => void`).

> `useStashCommands` ở lát 1 là chỗ trọ tạm, có ghi rõ "moves to features/stash in slice 2". Đây là lúc trả.

- [ ] **Step 1: Đọc file sắp xoá**

```bash
cat src/features/branch/model/useStashCommands.ts
```

Ghi lại **ba** thứ phải giữ nguyên, vì chúng là hành vi người dùng thấy được:
1. `dropStash` hỏi `window.confirm("Xoa stash nay?")` **trước** khi gọi IPC.
2. `dropStash` dựng toast hoàn tác có `durationMs: 10000` và `undoAction` gọi `invokeCommand.undoDropStash(repoPath, receipt)`.
3. `applyStash` / `popStash` báo lỗi bằng `alert(...)`; `dropStash` báo lỗi bằng `useToastStore.showError(mapGitError(err))`.

- [ ] **Step 2: Thay bằng hook trong `BranchSidebar`**

Xoá `import { useStashCommands } from "../model/useStashCommands";`, thêm:

```ts
import { useApplyStash, useDropStash, usePopStash } from "../../stash/api";
```

Thay khối `useStashCommands(...)` bằng:

```ts
  // Stash commands come from features/stash. The wrappers below keep the
  // confirm prompt, the undo toast and the error style that the sidebar had
  // before — none of that belongs in a mutation hook.
  const applyStashMutation = useApplyStash(currentRepo?.path ?? "");
  const popStashMutation = usePopStash(currentRepo?.path ?? "");
  const dropStashMutation = useDropStash(currentRepo?.path ?? "");

  const handleApplyStash = async (index: number) => {
    try {
      await applyStashMutation.mutateAsync({ index });
    } catch (err: unknown) {
      alert(`Khong the ap dung stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePopStash = async (index: number) => {
    try {
      await popStashMutation.mutateAsync({ index });
      setSelectedStash(null);
    } catch (err: unknown) {
      alert(`Khong the pop stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDropStash = async (index: number) => {
    if (!window.confirm("Xoa stash nay?")) return;
    const stashToDrop = stashes[index];
    try {
      const receipt = await dropStashMutation.mutateAsync({ index });
      setSelectedStash(null);
      if (stashToDrop) {
        useToastStore.getState().showToast({
          message: `Đã xoá stash@{${index}}`,
          type: "success",
          durationMs: 10000,
          undoAction: async () => {
            await invokeCommand.undoDropStash(currentRepo.path, receipt);
            queryClient.invalidateQueries({ queryKey: qk.stashes(currentRepo.path) });
          },
        });
      }
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };
```

**Ba hook phải gọi trước `if (!currentRepo) return null;`** — thứ tự hook không được phụ thuộc điều kiện. Lát 1 đã vấp đúng lỗi này (`react-hooks/rules-of-hooks`), đừng lặp lại.

> `invokeCommand.undoDropStash` **vẫn ở lại** trong `BranchSidebar`. Nó thuộc domain undo, cùng cảnh với `undoDeleteBranch` — ngoài phạm vi lát này. Đây là lý do ngoại lệ ipc của `BranchSidebar` **chưa** xoá được ở task này (xem Task 8).

Xoá file: `git rm src/features/branch/model/useStashCommands.ts`

- [ ] **Step 3: Cập nhật ngoại lệ ranh giới**

Xoá khỏi `IPC_IMPORT_EXCEPTIONS`:
```ts
"features/branch/model/useStashCommands.ts":
  "stash commands lifted out of the sidebar verbatim; moves to features/stash in slice 2",
```

Test `every ipc-import exception still exists` sẽ **đỏ** nếu quên bước này — đó là đúng ý đồ của nó.

- [ ] **Step 4: Chạy lưới an toàn — không sửa test**

```bash
pnpm vitest run src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx
```
Expected: 12 test PASS, **không sửa một chữ nào trong test**.

Nếu một assertion đỏ, đó là **bug do thay hook**, không phải test sai — sửa code.

- [ ] **Step 5: Xác minh và commit**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
pnpm vitest run src/test/architectureBoundaries.test.ts
```

```bash
git add -A
git commit -m "🔥 drop useStashCommands for the real stash hooks

The temporary lodger from slice 1 is gone: BranchSidebar now calls
useApplyStash, usePopStash and useDropStash from features/stash. Thin wrappers
keep the confirm prompt, the undo toast and the per-command error style, none
of which belong in a mutation hook.

Removes the second ipc exception. undoDropStash stays on invokeCommand — it
belongs to the undo domain, same as undoDeleteBranch.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Chuyển `ManageRemotesModal` và `PruneConfirmModal` vào feature

Chia đôi việc chuyển 4 modal remote: task này làm 2 cái phức tạp hơn, Task 7 làm 2 cái còn lại. Lý do chia: `ManageRemotesModal` render 3 modal con và quản 6 `useState`, đủ lớn để đáng một lượt review riêng.

**Files:**
- Create: `src/features/remote/components/ManageRemotesModal.tsx` (từ `components/remote/`)
- Create: `src/features/remote/components/PruneConfirmModal.tsx` (từ `components/remote/`)
- Modify: `src/test/ManageRemotesModal.test.tsx`, `src/test/PruneConfirmModal.test.tsx`

**Interfaces:**
- Consumes: `useRemotes`, `usePruneRemote` từ Task 3.
- Produces: hai component với **props type và chữ ký không đổi** (`ManageRemotesModalProps`, `PruneConfirmModalProps`).

- [ ] **Step 1: Đọc hai file trước khi đụng vào**

```bash
sed -n '1,60p' src/components/remote/ManageRemotesModal.tsx
grep -n "invokeCommand\.\|useQuery\|qk\.\|useState" src/components/remote/ManageRemotesModal.tsx
cat src/components/remote/PruneConfirmModal.tsx
```

Ghi lại: `ManageRemotesModal` có `useQuery` cho `qk.remotes`, 6 `useState` cho modal con, một hàm invalidate gồm **ba** key (`qk.remotes`, `qk.branches`, `qk.github.repoInfo`), và một `copiedKey` cho nút copy.

- [ ] **Step 2: Di chuyển**

```bash
mkdir -p src/features/remote/components
git mv src/components/remote/ManageRemotesModal.tsx src/features/remote/components/ManageRemotesModal.tsx
git mv src/components/remote/PruneConfirmModal.tsx src/features/remote/components/PruneConfirmModal.tsx
```

Đường import lùi một cấp. Import 3 modal con (`AddEditRemoteModal`, `DeleteRemoteModal`) tạm thời trỏ ngược về `../../../components/remote/...` — Task 7 sẽ sửa thành `./`.

- [ ] **Step 3: `ManageRemotesModal` dùng `useRemotes`**

Thay `useQuery` thủ công bằng:
```ts
  const { data: remotes = [], isLoading, refetch } = useRemotes(repoPath);
```

> Đọc kỹ tên biến destructure **thật** trong file (có thể là `data: remotes`, `isPending`, `error`...) và giữ đúng những gì phần JSX bên dưới đang dùng. Nếu file dùng `isLoading` mà `useRemotes` trả `isPending`, giữ `isLoading` bằng cách destructure đúng tên React Query v5 cung cấp — **không** đổi JSX.

**Giữ nguyên** hàm invalidate ba key trong file, kèm comment giải thích tại sao có `qk.github.repoInfo`:

```ts
  // GitHub repo info is derived from the remote URL, so it goes stale when a
  // remote changes. Only this modal needs it — the shared hook stays narrow.
```

- [ ] **Step 4: `PruneConfirmModal` dùng `usePruneRemote`**

Xoá import `invokeCommand`, thêm `import { usePruneRemote } from "../api";`.

Đổi lời gọi IPC thành `await pruneRemote.mutateAsync({ remote: remoteName })`, giữ `loading` bằng `pruneRemote.isPending`. **Giữ nguyên văn** chuỗi toast, `setError`, `onSuccess`, `onClose`.

> Nếu modal hiện truyền `taskId` để theo dõi tiến trình, truyền tiếp qua vars: `{ remote: remoteName, taskId }`. Đọc từ Step 1.

- [ ] **Step 5: Đổi import ở test, bọc provider nếu cần**

```bash
grep -rn "components/remote/ManageRemotesModal\|components/remote/PruneConfirmModal" src e2e
```

Đổi sang `"../features/remote/components/ManageRemotesModal"` (chưa có barrel — Task 7 mới tạo). Chạy từng test, thiếu provider thì bọc như Task 2 Step 6. **Không đổi assertion.**

- [ ] **Step 6: Xác minh và commit**

```bash
pnpm vitest run src/test/ManageRemotesModal.test.tsx src/test/PruneConfirmModal.test.tsx
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```

```bash
git add -A
git commit -m "♻️ move ManageRemotesModal and PruneConfirmModal into features/remote

Both leave components/remote. The list comes from useRemotes and the prune
runs through usePruneRemote.

ManageRemotesModal keeps invalidating qk.github.repoInfo itself: GitHub info is
derived from the remote URL, and only this modal needs it — putting it in the
shared hook would widen every remote mutation.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Chuyển `AddEditRemoteModal` và `DeleteRemoteModal`, xoá `components/remote/`

**Files:**
- Create: `src/features/remote/components/AddEditRemoteModal.tsx` (từ `components/remote/`)
- Create: `src/features/remote/components/DeleteRemoteModal.tsx` (từ `components/remote/`)
- Create: `src/features/remote/index.ts`
- Modify: `src/features/remote/components/ManageRemotesModal.tsx` (sửa import modal con về `./`)
- Modify: `src/App.tsx`, `src/features/branch/components/BranchSidebar.tsx`
- Modify: `src/test/AddEditRemoteModal.test.tsx`, `src/test/DeleteRemoteModal.test.tsx`, `src/test/ManageRemotesModal.test.tsx`
- Delete: `src/components/remote/`

**Interfaces:**
- Consumes: `useAddRemote`, `useRenameRemote`, `useSetRemoteUrl`, `useRemoveRemote` từ Task 3.
- Produces: `features/remote` export cả 4 modal + props type + `useRemotes` + `useRemoteTask`.

### `AddEditRemoteModal` là ca khó nhất của lát này — đọc kỹ

Nó **không** phải một lệnh, mà là một **chuỗi có điều kiện**:

```
Sửa (initialRemote khác null):
  nếu tên đổi      -> renameRemote(repoPath, oldName, newName)
  luôn luôn        -> setRemoteUrl(repoPath, currentName, fetchUrl, effectivePush)

Thêm mới:
  addRemote(repoPath, name, fetchUrl)
  nếu có pushUrl   -> setRemoteUrl(repoPath, name, fetchUrl, pushUrl)
```

Hệ quả cho việc migrate:

- **Không gộp thành một mutation.** Dùng nhiều hook, gọi tuần tự trong cùng handler — giống `CheckoutConflictModal`.
- **Thứ tự phải giữ nguyên**: rename trước rồi mới setUrl, vì `setRemoteUrl` dùng **tên sau khi đổi**. Đảo lại là sửa URL cho một remote không còn tồn tại.
- **`loading` phải phủ cả chuỗi**, không phải một mutation. Giữ `loading` là `useState` thật như hiện tại, hoặc dùng `mutationA.isPending || mutationB.isPending` — chọn cách nào cũng được, nhưng phải đảm bảo nút disabled suốt cả hai lệnh. Ghi lựa chọn vào comment.

- [ ] **Step 1: Đọc hai file, ghi lại đúng nhánh điều kiện**

```bash
sed -n '85,130p' src/components/remote/AddEditRemoteModal.tsx
cat src/components/remote/DeleteRemoteModal.tsx
```

Chép lại **nguyên văn** logic nhánh (`trimmedName`, `effectivePush`, điều kiện `initialRemote`) ra giấy nháp trước khi sửa. Đây là chỗ dễ đổi hành vi nhất trong cả lát.

- [ ] **Step 2: Di chuyển**

```bash
git mv src/components/remote/AddEditRemoteModal.tsx src/features/remote/components/AddEditRemoteModal.tsx
git mv src/components/remote/DeleteRemoteModal.tsx src/features/remote/components/DeleteRemoteModal.tsx
git rm src/components/remote/index.ts
```

Sau bước này `src/components/remote/` phải rỗng.

- [ ] **Step 3: `AddEditRemoteModal` dùng hook**

Xoá import `invokeCommand`, thêm:
```ts
import { useAddRemote, useRenameRemote, useSetRemoteUrl } from "../api";
```

Khai báo:
```ts
  const addRemote = useAddRemote(repoPath);
  const renameRemote = useRenameRemote(repoPath);
  const setRemoteUrl = useSetRemoteUrl(repoPath);
```

Thay thân handler, **giữ đúng thứ tự và đúng nhánh**:
```ts
      if (initialRemote) {
        if (trimmedName !== initialRemote.name) {
          // Rename first: setRemoteUrl below addresses the remote by its new name.
          await renameRemote.mutateAsync({
            oldName: initialRemote.name,
            newName: trimmedName,
          });
        }
        await setRemoteUrl.mutateAsync({
          name: currentName,
          fetchUrl: trimmedFetch,
          pushUrl: effectivePush,
        });
      } else {
        await addRemote.mutateAsync({ name: trimmedName, url: trimmedFetch });
        if (trimmedPush) {
          await setRemoteUrl.mutateAsync({
            name: trimmedName,
            fetchUrl: trimmedFetch,
            pushUrl: trimmedPush,
          });
        }
      }
```

> Tên biến (`currentName`, `effectivePush`, `trimmedPush`) phải khớp đúng file thật — lấy từ Step 1, đừng chép mù từ đây.

**Giữ nguyên** `setError`, toast, `onSuccess?.()`, `onClose()`.

- [ ] **Step 4: `DeleteRemoteModal` dùng `useRemoveRemote`**

Đổi lời gọi thành `await removeRemote.mutateAsync({ name: remote.name })`, `loading` = `removeRemote.isPending`. Giữ nguyên toast và `onSuccess`.

- [ ] **Step 5: Viết `src/features/remote/index.ts`**

```ts
export { ManageRemotesModal, type ManageRemotesModalProps } from "./components/ManageRemotesModal";
export { AddEditRemoteModal, type AddEditRemoteModalProps } from "./components/AddEditRemoteModal";
export { DeleteRemoteModal, type DeleteRemoteModalProps } from "./components/DeleteRemoteModal";
export { PruneConfirmModal, type PruneConfirmModalProps } from "./components/PruneConfirmModal";
export { useRemotes, useRemoteTask } from "./api";
```

Trong `ManageRemotesModal`, sửa import 3 modal con thành `./AddEditRemoteModal`, `./DeleteRemoteModal`, `./PruneConfirmModal` — **không** qua `../index`, tránh vòng lặp (cùng lý do như `BranchSidebar` ở lát 1).

- [ ] **Step 6: Đổi import ở mọi call site**

```bash
grep -rn "components/remote" src e2e
```

Sửa:
- `src/App.tsx`: `import { ManageRemotesModal } from "./features/remote";`
- `src/features/branch/components/BranchSidebar.tsx`: gom 4 modal về một dòng `from "../../remote"`
- Các file test: trỏ `"../features/remote"`

> `BranchSidebar` import `features/remote` là cross-feature — thêm `"remote"` vào mảng ngoại lệ của nó. Task 8 gỡ.

- [ ] **Step 7: Xác minh**

```bash
pnpm vitest run src/test/AddEditRemoteModal.test.tsx src/test/DeleteRemoteModal.test.tsx src/test/ManageRemotesModal.test.tsx src/test/PruneConfirmModal.test.tsx
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
ls src/components/remote 2>&1   # phải báo không tồn tại
```
Expected: tất cả xanh, **56 test** của bốn file remote còn nguyên (26 + 11 + 9 + 10, đo thật).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "♻️ move the last two remote modals into features/remote

components/remote is gone. AddEditRemoteModal keeps its conditional sequence
rather than collapsing into one mutation: rename still runs before setRemoteUrl,
because setRemoteUrl addresses the remote by its new name.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Gỡ cross-feature khỏi `BranchSidebar` bằng props từ `Shell`

Task cuối và khó nhất về mặt thiết kế. Làm sau cùng vì cần cả `remote` lẫn `stash` đã sẵn sàng.

**Vấn đề:** `BranchSidebar` (feature `branch`) đang render modal của **ba** feature khác: `tag` (2 modal), `remote` (4 modal), `stash` (`StashDiffView`). Mỗi cái là một vi phạm `no feature imports another feature`.

**Cách sửa** (Step 9 của kế hoạch lát 1 đã chỉ ra): **nhận qua props từ `Shell`**. `Shell` nằm ở `src/components/`, không thuộc feature nào, nên nó được phép biết cả bốn.

**Files:**
- Modify: `src/features/branch/components/BranchSidebar.tsx`
- Modify: `src/components/Shell.tsx`
- Modify: `src/test/BranchSidebar.test.tsx`, `src/test/BranchSidebarTags.test.tsx`
- Modify: `src/test/architectureBoundaries.test.ts`

- [ ] **Step 1: Quyết định ranh giới trước khi sửa**

`BranchSidebar` mở dialog cho 3 domain khác. Hai lựa chọn:

| Cách | Ưu | Nhược |
| --- | --- | --- |
| **(A)** Truyền component qua props (`renderTagModals?: (dialog, close) => ReactNode`) | Gỡ hết import, sidebar không cần biết modal nào | Props khó đọc, `Shell` phải biết cả `SidebarDialog` |
| **(B)** Nâng toàn bộ dialog state lên `Shell` | Ranh giới sạch nhất | Đổi lớn, chạm mọi chỗ mở dialog |

**Chọn (A).** Lý do: (B) là đổi kiến trúc lớn, xứng đáng một lát riêng; (A) gỡ đúng vi phạm đang có với thay đổi nhỏ nhất và không đụng tới `SidebarDialog` union.

> Nếu khi làm thấy (A) khiến `Shell` phải import `SidebarDialog` — **đó là chấp nhận được**: `Shell` không phải feature nên nó import `features/branch` là hợp lệ. Chiều bị cấm là feature → feature.

- [ ] **Step 2: Thêm props vào `BranchSidebar`**

```ts
export interface BranchSidebarProps {
  /**
   * Dialogs owned by other features. The sidebar decides *when* they open —
   * it holds the dialog slot — but must not import them: a feature importing
   * another feature is what the boundary test forbids. Shell supplies them.
   */
  renderForeignDialog?: (dialog: SidebarDialog, close: () => void) => React.ReactNode;
  /** Panel shown beside the sidebar for the selected stash. */
  renderStashPanel?: (stash: StashItem, close: () => void) => React.ReactNode;
}
```

Trong phần render, thay 7 khối modal của `tag`/`remote` bằng:
```tsx
      {renderForeignDialog?.(dialog, closeDialog)}
```

và thay khối `StashDiffView` bằng:
```tsx
      {selectedStash && renderStashPanel?.(selectedStash, () => setSelectedStash(null))}
```

Xoá các import: `CreateTagModal`, `DeleteTagModal`, 4 modal remote, `StashDiffView`.

> `CompareModal`, `MergeBranchModal`, `RebaseBranchModal` **ở lại** — chúng vẫn nằm trong `src/components/`, không phải feature, nên không vi phạm.

- [ ] **Step 3: `Shell` cung cấp các dialog đó**

Trong `src/components/Shell.tsx`, import 4 modal remote + 2 modal tag + `StashDiffView`, rồi truyền xuống. Viết đầy đủ từng nhánh `isDialog` cho các dialog ngoại lai (`createTag`, `deleteTag`, `manageRemotes`, `addRemote`, `editRemote`, `deleteRemote`, `pruneRemote`) — chép nguyên văn JSX từ `BranchSidebar` trước khi xoá, chỉ đổi nguồn `repoPath` sang giá trị `Shell` có sẵn.

**Giữ nguyên** mọi `onSuccess` đang có. Nếu một modal đang gọi `invalidateRepo` của sidebar, thay bằng invalidate tương đương trong `Shell` — **đừng bỏ đi**.

- [ ] **Step 4: Chạy lưới an toàn — đây là bước quyết định**

```bash
pnpm vitest run src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx
```

Hai test sẽ **đỏ** vì chúng render `<BranchSidebar />` trần, không có props mới — ví dụ test mở `CreateTagModal` từ menu tag. Đây là **đỏ đúng**, không phải bug.

Sửa bằng cách cho test render đúng thứ nó đang kiểm: truyền `renderForeignDialog` thật vào. **Không** xoá hay nới assertion. Nếu một test chỉ kiểm phần branch (không chạm tag/remote), để nguyên không props.

- [ ] **Step 5: Gỡ ngoại lệ**

Trong `src/test/architectureBoundaries.test.ts`:
- Xoá `"features/branch/components/BranchSidebar.tsx"` khỏi `CROSS_FEATURE_EXCEPTIONS` (cả `tag`, `stash`, `remote`).
- Trong `IPC_IMPORT_EXCEPTIONS`, **sửa lý do** của `BranchSidebar` cho khớp thực tế còn lại — sau lát này nó chỉ còn gọi thẳng `ipc/` cho: `getRepoStatus`, `getTags`, `checkoutTag`, `pushTag`, `mergeBranch`, `rebaseBranch`, `undoDropStash`. Viết đúng danh sách đó vào lý do, và ghi điều kiện gỡ là "khi 2 lệnh tag còn lại, merge/rebase và domain undo có hook".

> **Không** xoá entry ipc của `BranchSidebar` — nó vẫn vi phạm thật. Xoá là nói dối.

- [ ] **Step 6: Kiểm số dòng**

```bash
wc -l src/features/branch/components/BranchSidebar.tsx
pnpm lint 2>&1 | grep "BranchSidebar"
```

Ghi lại con số. Mốc kế hoạch lát 1 là dưới 300 dòng; sau khi gỡ 7 khối modal, kỳ vọng còn **khoảng 450–500**. Nếu vẫn trên 300, **ghi vào status doc** chứ đừng cắt bừa cho đủ số.

- [ ] **Step 7: Xác minh đầy đủ và commit**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
pnpm vitest run src/test/architectureBoundaries.test.ts
```
Expected: tất cả xanh. `CROSS_FEATURE_EXCEPTIONS` **rỗng**.

```bash
git add -A
git commit -m "♻️ hand the foreign dialogs to Shell, clearing every cross-feature import

BranchSidebar no longer imports features/tag, features/remote or
features/stash. It still decides when those dialogs open — it owns the dialog
slot — but Shell supplies them through renderForeignDialog and
renderStashPanel. Shell is not a feature, so it may know all four.

CROSS_FEATURE_EXCEPTIONS is now empty. The ipc exception stays, narrowed to
what actually remains: the two tag commands, merge/rebase and undoDropStash.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Cập nhật tài liệu tình trạng

**Files:**
- Modify: `docs/superpowers/REFACTOR_STATUS.md`

- [ ] **Step 1: Đo số liệu thật, không ước lượng**

```bash
pnpm test 2>&1 | grep -E "Test Files|Tests"
wc -l src/features/branch/components/BranchSidebar.tsx
pnpm lint 2>&1 | grep -c "warning"
pnpm lint 2>&1 | grep -c "no-restricted-imports"
ls src/components/remote src/components/stash 2>&1
```

- [ ] **Step 2: Cập nhật status doc**

- Header: `Tiến độ` → GĐ5 lát 2 xong; `Việc tiếp theo` → "GĐ5b hoặc GĐ6"
- Mục 1: cập nhật số test trong khối lệnh kiểm chứng
- Mục 3: thêm phần "Giai đoạn 5 lát 2" theo văn phong các giai đoạn trước
- Mục 4: đánh dấu lát 2 xong
- Mục 6: cập nhật dòng `BranchSidebar` còn bao nhiêu dòng
- **Mục 10.6**: cập nhật bảng ngoại lệ — còn đúng những gì, gỡ được gì
- Mục 7: thêm quy ước rút ra, nếu có. Ứng viên đã thấy trước:
  - **Ranh giới cross-feature gỡ bằng props, không bằng nới luật.** Feature giữ *quyết định khi nào mở*, chỗ không-phải-feature (`Shell`) cung cấp *cái gì để mở*.
  - **Chuỗi lệnh có điều kiện không gộp được thành một mutation.** `AddEditRemoteModal` (rename→setUrl) và `CheckoutConflictModal` (stash→checkout) đều phải giữ nhiều hook gọi tuần tự, và cờ `loading` phải phủ cả chuỗi chứ không phải một lệnh.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/REFACTOR_STATUS.md
git commit -m "📝 record Phase 5 slice 2 in the status handover

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Những gì KHÔNG nằm trong kế hoạch này

Ghi ra để người làm không tự mở rộng phạm vi:

- **`features/changes`.** Kế hoạch gốc xếp `changes` vào lát 2; đã đổi sang `stash` theo quyết định của người dùng, vì `stash` mới là thứ `BranchSidebar` đang phụ thuộc. `changes` để lát 3.
- **Domain `undo`.** `undoDeleteBranch` và `undoDropStash` vẫn gọi thẳng `invokeCommand`. Cả hai là ngoại lệ có ghi nhận.
- **Hai lệnh tag còn lại** (`checkoutTag`, `pushTag`) và **merge/rebase**. Chúng giữ `BranchSidebar` còn ngoại lệ ipc sau lát này — có chủ đích.
- **Đưa `BranchSidebar` xuống dưới 300 dòng.** Sau Task 8 sẽ còn ~450–500. Phần dư phụ thuộc bốn thứ ở trên; cắt thêm bây giờ là cắt cho đủ số.
- **Sửa `pnpm format:check`.** Đang đỏ sẵn toàn repo vì lệch CRLF, không liên quan lát này.
- **`useAsyncAction`.** Đã quyết bỏ ở lát 1 — `useMutation` phủ vai trò đó. Đừng dựng lại.
