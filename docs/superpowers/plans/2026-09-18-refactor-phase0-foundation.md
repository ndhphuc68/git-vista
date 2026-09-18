# Giai đoạn 0: Nền tảng (domain + shared/ui + shared/hooks)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng tầng `domain/` và `shared/` với đầy đủ test, và bật lint độ phức tạp ở mức `warn` — **không sửa một dòng nào của code cũ**.

**Architecture:** Tạo mới hoàn toàn, chạy song song với code hiện tại. Kết thúc giai đoạn này, code cũ vẫn chạy y nguyên, nhưng đã có sẵn bộ primitives + hooks + constants để các giai đoạn sau migrate dần vào.

**Tech Stack:** React 19, TypeScript 7, Tailwind CSS v4, Vitest 5, Testing Library, clsx, lucide-react, oxlint 1.83.

**Spec:** `docs/superpowers/specs/2026-09-18-frontend-architecture-refactor-design.md`

## Global Constraints

- **Không sửa bất kỳ file nào trong `src/components/`, `src/store/`, `src/ipc/`** ở giai đoạn này. Chỉ tạo file mới + sửa `.oxlintrc.json`.
- `src/shared/ui/**` **cấm** import `ipc/`, `store/`, `i18n/`. Nhận mọi thứ qua props.
- `src/domain/**` **cấm** import bất kỳ thứ gì từ `src/` khác ngoài type của `ipc/bindings`.
- Mọi file mới **dưới 300 dòng**, mọi hàm **dưới 80 dòng**, complexity **dưới 15**.
- Design token lấy từ `docs/DESIGN_SYSTEM.md` mục 6: khung/card dùng `rounded-xl`, nút/input dùng `rounded-lg`.
- Test viết trước implementation (TDD). Test đặt cạnh file nguồn: `Button.tsx` → `Button.test.tsx`.
- Sau mỗi task: `pnpm test` phải xanh trước khi commit.
- Commit message dùng tiếng Việt cho phần mô tả, prefix emoji theo quy ước repo (`✨` tính năng mới, `✅` test, `🔧` cấu hình).

---

## Cấu trúc file sau Giai đoạn 0

```
src/
├─ domain/
│  ├─ queryKeys.ts            + queryKeys.test.ts
│  ├─ enums.ts                + enums.test.ts
│  └─ constants/
│     ├─ ui.ts                hằng số kích thước, thời gian
│     ├─ motion.ts            thời lượng animation
│     └─ zIndex.ts            thang bậc z-index
└─ shared/
   ├─ utils/
   │  ├─ git.ts               shortSha()          + git.test.ts
   │  └─ toError.ts           toErrorMessage()    + toError.test.ts
   ├─ hooks/
   │  ├─ useEscapeKey.ts      + useEscapeKey.test.ts
   │  └─ useCopyToClipboard.ts + useCopyToClipboard.test.ts
   └─ ui/
      ├─ Button.tsx           + Button.test.tsx
      ├─ Alert.tsx            + Alert.test.tsx
      ├─ Modal.tsx            + Modal.test.tsx
      └─ index.ts             barrel export
```

**Lý do phân chia:** `domain/` là tầng đáy không phụ thuộc gì, nên làm trước (Task 1–3). `shared/utils` và `shared/hooks` chỉ phụ thuộc `domain/` (Task 4–6). `shared/ui` phụ thuộc cả hai (Task 7–9). Thứ tự task đi từ dưới lên đúng chiều phụ thuộc.

---

## Task 1: Hằng số và thang bậc z-index

**Files:**
- Create: `src/domain/constants/ui.ts`
- Create: `src/domain/constants/motion.ts`
- Create: `src/domain/constants/zIndex.ts`

**Interfaces:**
- Consumes: không có (tầng đáy)
- Produces: `SHORT_SHA_LENGTH: number`, `COPY_FEEDBACK_MS: number`, `AUTOFOCUS_DELAY_MS: number`, `UNDO_TOAST_MS: number`, `MODAL_SIZE: Record<ModalSize, string>`, `ModalSize` type, `MOTION: { fast; normal; slow }`, `Z_INDEX: { dropdown; overlay; modal; toast }`

- [ ] **Bước 1: Tạo `src/domain/constants/ui.ts`**

Các giá trị lấy từ code hiện tại: `substring(0, 7)` (12 chỗ), `setTimeout(..., 2000)` copy feedback (6 chỗ), `setTimeout(..., 50)` autofocus (3 chỗ), `durationMs: 10000` toast undo (5 chỗ).

Chiều rộng modal chuẩn hoá về 4 bậc Tailwind, thay cho mớ `max-w-115` / `max-w-95` / `max-w-120` hiện tại:

```ts
/** Số ký tự hiển thị khi rút gọn commit SHA. */
export const SHORT_SHA_LENGTH = 7;

/** Thời gian giữ trạng thái "đã sao chép" trước khi tự tắt. */
export const COPY_FEEDBACK_MS = 2000;

/** Độ trễ trước khi focus input trong modal, chờ animation mở xong. */
export const AUTOFOCUS_DELAY_MS = 50;

/** Thời gian toast hoàn tác hiển thị, đủ dài để người dùng kịp bấm Undo. */
export const UNDO_TOAST_MS = 10000;

export type ModalSize = "sm" | "md" | "lg" | "xl";

/** Chiều rộng tối đa của modal theo từng bậc. */
export const MODAL_SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};
```

- [ ] **Bước 2: Tạo `src/domain/constants/motion.ts`**

Thay các giá trị rời rạc `duration={150}`, `{200}`, `{1800}` đang dùng trong `Transition`.

```ts
/** Thời lượng animation (ms), dùng cho Transition và CSS duration. */
export const MOTION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

export type MotionSpeed = keyof typeof MOTION;
```

- [ ] **Bước 3: Tạo `src/domain/constants/zIndex.ts`**

Hiện tại có `z-[9999]` (32 chỗ), `z-[10000]` (6 chỗ), `z-50` (13 chỗ) không theo thang bậc nào. Định nghĩa thang bậc rõ ràng:

```ts
/**
 * Thang bậc z-index toàn ứng dụng. Giá trị cách nhau 10 để còn chỗ chèn
 * tầng mới mà không phải đánh số lại toàn bộ.
 */
export const Z_INDEX = {
  dropdown: 10,
  overlay: 20,
  modal: 30,
  toast: 40,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;
```

- [ ] **Bước 4: Kiểm tra TypeScript biên dịch được**

Chạy: `pnpm typecheck`
Kỳ vọng: không có lỗi.

- [ ] **Bước 5: Commit**

```bash
git add src/domain/constants/
git commit -m "✨ them hang so dung chung cho UI, motion va z-index

Thay cac so ma thuat rai rac: substring(0,7) 12 cho, setTimeout 2000ms
6 cho, z-[9999]/z-[10000]/z-50 khong theo thang bac nao.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Query keys tập trung

**Files:**
- Create: `src/domain/queryKeys.ts`
- Test: `src/domain/queryKeys.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `qk` object với các hàm trả `readonly` tuple. Giai đoạn 1 sẽ thay toàn bộ query key literal bằng object này.

**Bối cảnh:** Đây là thứ sửa bug cache ở spec mục 1.2(a). Hiện có `["repo_status"]` lẫn `["repoStatus"]`, `["commit-graph"]` lẫn `["commit_graph"]` — invalidate key này không làm mới key kia. Key phân cấp tiền tố `["repo", repoPath]` cho phép invalidate theo phạm vi.

- [ ] **Bước 1: Viết test trước**

Tạo `src/domain/queryKeys.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { qk } from "./queryKeys";

describe("queryKeys", () => {
  const REPO = "/home/user/project";

  it("mọi key của một repo đều bắt đầu bằng tiền tố repo để invalidate theo phạm vi", () => {
    const prefix = qk.repo.all(REPO);
    const keys = [
      qk.repo.status(REPO),
      qk.repo.head(REPO),
      qk.branches(REPO),
      qk.tags(REPO),
      qk.remotes(REPO),
      qk.commitGraph(REPO),
      qk.stashes(REPO),
    ];

    for (const key of keys) {
      expect(key.slice(0, prefix.length)).toEqual([...prefix]);
    }
  });

  it("hai repo khác nhau cho ra key khác nhau", () => {
    expect(qk.branches("/a")).not.toEqual(qk.branches("/b"));
  });

  it("cùng tham số thì cho ra key bằng nhau, để React Query nhận diện đúng cache", () => {
    expect(qk.commitGraph(REPO)).toEqual(qk.commitGraph(REPO));
  });

  it("key phụ thuộc tham số phụ phải phân biệt theo tham số đó", () => {
    expect(qk.fileDiff(REPO, "abc", "a.ts")).not.toEqual(qk.fileDiff(REPO, "abc", "b.ts"));
    expect(qk.fileDiff(REPO, "abc", "a.ts")).not.toEqual(qk.fileDiff(REPO, "def", "a.ts"));
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail**

Chạy: `pnpm vitest run src/domain/queryKeys.test.ts`
Kỳ vọng: FAIL — `Failed to resolve import "./queryKeys"`.

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `src/domain/queryKeys.ts`:

```ts
/**
 * Nguồn chân lý DUY NHẤT cho query key của React Query.
 *
 * Mọi key đều có tiền tố ["repo", repoPath] để invalidate được theo phạm vi:
 * làm mới toàn bộ một repo bằng qk.repo.all(path), hoặc chỉ một phần bằng
 * key cụ thể. Không viết key literal ở bất kỳ đâu khác.
 */
export const qk = {
  repo: {
    all: (repo: string) => ["repo", repo] as const,
    status: (repo: string) => ["repo", repo, "status"] as const,
    head: (repo: string) => ["repo", repo, "head"] as const,
    state: (repo: string) => ["repo", repo, "state"] as const,
  },

  branches: (repo: string) => ["repo", repo, "branches"] as const,
  tags: (repo: string) => ["repo", repo, "tags"] as const,
  remotes: (repo: string) => ["repo", repo, "remotes"] as const,
  stashes: (repo: string) => ["repo", repo, "stashes"] as const,
  commitGraph: (repo: string) => ["repo", repo, "commitGraph"] as const,

  commitDetails: (repo: string, commitId: string) =>
    ["repo", repo, "commitDetails", commitId] as const,

  fileDiff: (repo: string, commitId: string, filePath: string) =>
    ["repo", repo, "fileDiff", commitId, filePath] as const,

  fileHistory: (repo: string, filePath: string) =>
    ["repo", repo, "fileHistory", filePath] as const,

  fileBlame: (repo: string, filePath: string, commitId: string) =>
    ["repo", repo, "fileBlame", filePath, commitId] as const,

  github: {
    repoInfo: (repo: string) => ["repo", repo, "github", "repoInfo"] as const,
    pullRequests: (repo: string, state: string) =>
      ["repo", repo, "github", "pullRequests", state] as const,
    pullRequestDetail: (repo: string, number: number) =>
      ["repo", repo, "github", "pullRequestDetail", number] as const,
  },

  /** Không gắn với repo cụ thể. */
  recentRepos: () => ["recentRepos"] as const,
  githubToken: () => ["githubToken"] as const,
} as const;
```

- [ ] **Bước 4: Chạy test để xác nhận nó pass**

Chạy: `pnpm vitest run src/domain/queryKeys.test.ts`
Kỳ vọng: PASS, 4 test.

- [ ] **Bước 5: Commit**

```bash
git add src/domain/queryKeys.ts src/domain/queryKeys.test.ts
git commit -m "✨ them queryKeys tap trung cho React Query

Chuan bi sua bug cache: hien tai co repo_status lan repoStatus,
commit-graph lan commit_graph — invalidate key nay khong lam moi key kia.
Key phan cap tien to [repo, path] cho phep invalidate theo pham vi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Enum thay chuỗi ma thuật

**Files:**
- Create: `src/domain/enums.ts`
- Test: `src/domain/enums.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `CHANGE_TYPE`, `ChangeType`, `PR_STATE`, `PullRequestState`, `CHECK_STATUS`, `CheckStatus`, `CONFIG_SCOPE`, `ConfigScope`, `SCREEN_TYPE`, `ScreenType`

**Bối cảnh:** `src/ipc/bindings.ts:270` có `change_type: string; // "added" | "modified" | "deleted"` — chuỗi tự do kèm comment, không được TypeScript kiểm tra. Các union khác nằm rải rác ở `bindings.ts:217, 415, 433, 452, 462` và `types/tab.ts:3`.

Dùng `as const` object thay vì `enum` của TypeScript: `enum` sinh runtime code và không tương thích tốt với `erasableSyntaxOnly`, còn `as const` chỉ là dữ liệu thuần.

- [ ] **Bước 1: Viết test trước**

Tạo `src/domain/enums.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CHANGE_TYPE, PR_STATE, CHECK_STATUS, CONFIG_SCOPE, SCREEN_TYPE } from "./enums";

describe("enums", () => {
  it("CHANGE_TYPE khớp đúng chuỗi mà backend Rust trả về", () => {
    expect(CHANGE_TYPE.ADDED).toBe("added");
    expect(CHANGE_TYPE.MODIFIED).toBe("modified");
    expect(CHANGE_TYPE.DELETED).toBe("deleted");
    expect(CHANGE_TYPE.RENAMED).toBe("renamed");
  });

  it("PR_STATE khớp đúng chuỗi của GitHub API", () => {
    expect(PR_STATE.OPEN).toBe("open");
    expect(PR_STATE.CLOSED).toBe("closed");
    expect(PR_STATE.ALL).toBe("all");
  });

  it("CHECK_STATUS phủ đủ 5 trạng thái mà bindings khai báo", () => {
    expect(Object.values(CHECK_STATUS).sort()).toEqual(
      ["failure", "in_progress", "neutral", "queued", "success"].sort()
    );
  });

  it("CONFIG_SCOPE khớp ConfigScope trong bindings", () => {
    expect(Object.values(CONFIG_SCOPE).sort()).toEqual(["global", "local"].sort());
  });

  it("SCREEN_TYPE khớp ScreenType trong types/tab.ts", () => {
    expect(Object.values(SCREEN_TYPE).sort()).toEqual(["changes", "conflict", "history"].sort());
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail**

Chạy: `pnpm vitest run src/domain/enums.test.ts`
Kỳ vọng: FAIL — `Failed to resolve import "./enums"`.

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `src/domain/enums.ts`:

```ts
/**
 * Hằng số cho các chuỗi mà backend Rust và GitHub API trả về.
 *
 * Dùng `as const` thay vì `enum` của TypeScript: enum sinh runtime code,
 * còn as const chỉ là dữ liệu thuần và suy ra type chính xác hơn.
 *
 * Giá trị PHẢI khớp đúng chuỗi backend trả về — đổi ở đây mà không đổi
 * phía Rust sẽ gây lỗi lúc chạy.
 */

/** Loại thay đổi của một file trong diff. Nguồn: bindings.ts FileChange.change_type */
export const CHANGE_TYPE = {
  ADDED: "added",
  MODIFIED: "modified",
  DELETED: "deleted",
  RENAMED: "renamed",
} as const;
export type ChangeType = (typeof CHANGE_TYPE)[keyof typeof CHANGE_TYPE];

/** Trạng thái pull request. Nguồn: bindings.ts PullRequestState */
export const PR_STATE = {
  OPEN: "open",
  CLOSED: "closed",
  ALL: "all",
} as const;
export type PullRequestState = (typeof PR_STATE)[keyof typeof PR_STATE];

/** Trạng thái CI check. Nguồn: bindings.ts CheckStatus */
export const CHECK_STATUS = {
  SUCCESS: "success",
  FAILURE: "failure",
  IN_PROGRESS: "in_progress",
  QUEUED: "queued",
  NEUTRAL: "neutral",
} as const;
export type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];

/** Phạm vi cấu hình Git. Nguồn: bindings.ts ConfigScope */
export const CONFIG_SCOPE = {
  GLOBAL: "global",
  LOCAL: "local",
} as const;
export type ConfigScope = (typeof CONFIG_SCOPE)[keyof typeof CONFIG_SCOPE];

/** Màn hình đang hiển thị trong một tab. Nguồn: types/tab.ts ScreenType */
export const SCREEN_TYPE = {
  HISTORY: "history",
  CHANGES: "changes",
  CONFLICT: "conflict",
} as const;
export type ScreenType = (typeof SCREEN_TYPE)[keyof typeof SCREEN_TYPE];
```

- [ ] **Bước 4: Chạy test để xác nhận nó pass**

Chạy: `pnpm vitest run src/domain/enums.test.ts`
Kỳ vọng: PASS, 5 test.

- [ ] **Bước 5: Commit**

```bash
git add src/domain/enums.ts src/domain/enums.test.ts
git commit -m "✨ them enum thay chuoi ma thuat

bindings.ts dang co change_type: string kem comment thay vi union that,
nen TypeScript khong kiem tra duoc. Gom cac union rai rac ve mot cho.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Tiện ích Git và xử lý lỗi

**Files:**
- Create: `src/shared/utils/git.ts`
- Test: `src/shared/utils/git.test.ts`
- Create: `src/shared/utils/toError.ts`
- Test: `src/shared/utils/toError.test.ts`

**Interfaces:**
- Consumes: `SHORT_SHA_LENGTH` từ `domain/constants/ui`
- Produces: `shortSha(sha: string): string`, `toErrorMessage(err: unknown): string`

**Bối cảnh:** `substring(0, 7)` lặp 12 chỗ; `err instanceof Error ? err.message : String(err)` lặp 17 chỗ.

- [ ] **Bước 1: Viết test cho `shortSha`**

Tạo `src/shared/utils/git.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { shortSha } from "./git";

describe("shortSha", () => {
  it("rút gọn SHA đầy đủ về 7 ký tự", () => {
    expect(shortSha("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0")).toBe("a1b2c3d");
  });

  it("giữ nguyên chuỗi ngắn hơn 7 ký tự", () => {
    expect(shortSha("abc")).toBe("abc");
  });

  it("trả chuỗi rỗng khi đầu vào rỗng", () => {
    expect(shortSha("")).toBe("");
  });
});
```

- [ ] **Bước 2: Viết test cho `toErrorMessage`**

Tạo `src/shared/utils/toError.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toErrorMessage } from "./toError";

describe("toErrorMessage", () => {
  it("lấy message từ Error", () => {
    expect(toErrorMessage(new Error("hỏng rồi"))).toBe("hỏng rồi");
  });

  it("chuyển chuỗi thành chính nó", () => {
    expect(toErrorMessage("lỗi dạng chuỗi")).toBe("lỗi dạng chuỗi");
  });

  it("chuyển giá trị lạ thành chuỗi thay vì ném lỗi tiếp", () => {
    expect(toErrorMessage(404)).toBe("404");
    expect(toErrorMessage(null)).toBe("null");
    expect(toErrorMessage(undefined)).toBe("undefined");
  });

  it("lấy trường message của object giống Error do Tauri trả về", () => {
    expect(toErrorMessage({ message: "loi tu Rust" })).toBe("loi tu Rust");
  });
});
```

- [ ] **Bước 3: Chạy test để xác nhận cả hai fail**

Chạy: `pnpm vitest run src/shared/utils/`
Kỳ vọng: FAIL — không resolve được `./git` và `./toError`.

- [ ] **Bước 4: Viết implementation**

Tạo `src/shared/utils/git.ts`:

```ts
import { SHORT_SHA_LENGTH } from "../../domain/constants/ui";

/** Rút gọn commit SHA để hiển thị, ví dụ "a1b2c3d4e5..." thành "a1b2c3d". */
export function shortSha(sha: string): string {
  return sha.slice(0, SHORT_SHA_LENGTH);
}
```

Tạo `src/shared/utils/toError.ts`:

```ts
/**
 * Chuyển giá trị lỗi bất kỳ thành chuỗi hiển thị được.
 *
 * Tauri có thể ném ra Error, chuỗi, hoặc object có trường message tuỳ
 * cách lỗi phát sinh, nên phải xử lý cả ba dạng.
 */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const { message } = err as { message: unknown };
    if (typeof message === "string") return message;
  }
  return String(err);
}
```

- [ ] **Bước 5: Chạy test để xác nhận pass**

Chạy: `pnpm vitest run src/shared/utils/`
Kỳ vọng: PASS, 7 test.

- [ ] **Bước 6: Commit**

```bash
git add src/shared/utils/
git commit -m "✨ them shortSha va toErrorMessage dung chung

Thay substring(0,7) lap 12 cho va err instanceof Error lap 17 cho.
toErrorMessage xu ly them dang object co truong message ma Tauri tra ve.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Hook `useEscapeKey`

**Files:**
- Create: `src/shared/hooks/useEscapeKey.ts`
- Test: `src/shared/hooks/useEscapeKey.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `useEscapeKey(enabled: boolean, onEscape: () => void): void`. Task 9 (`Modal`) dùng hook này.

**Bối cảnh:** Mẫu `useEffect` bắt phím Escape lặp ~30 lần, giống hệt nhau tới từng dòng.

Tham số `enabled` đứng trước để khớp cách dùng thực tế (`if (!isOpen) return;`), và để hook tự lo việc gỡ listener khi modal đóng.

- [ ] **Bước 1: Viết test trước**

Tạo `src/shared/hooks/useEscapeKey.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useEscapeKey } from "./useEscapeKey";

describe("useEscapeKey", () => {
  it("gọi callback khi bấm Escape lúc đang bật", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("không gọi callback khi đang tắt", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(false, onEscape));

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("bỏ qua các phím khác", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "a" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("gỡ listener khi unmount, tránh rò rỉ", () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(true, onEscape));

    unmount();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("dùng callback mới nhất mà không cần gắn lại listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useEscapeKey(true, cb), {
      initialProps: { cb: first },
    });

    rerender({ cb: second });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail**

Chạy: `pnpm vitest run src/shared/hooks/useEscapeKey.test.ts`
Kỳ vọng: FAIL — không resolve được `./useEscapeKey`.

- [ ] **Bước 3: Viết implementation**

Tạo `src/shared/hooks/useEscapeKey.ts`:

```ts
import { useEffect, useRef } from "react";

/**
 * Gọi `onEscape` khi người dùng bấm Escape, chỉ khi `enabled` là true.
 *
 * Callback được giữ trong ref nên đổi callback không làm gắn lại listener —
 * người gọi không cần bọc `useCallback`.
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void): void {
  const callbackRef = useRef(onEscape);

  useEffect(() => {
    callbackRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
```

- [ ] **Bước 4: Chạy test để xác nhận pass**

Chạy: `pnpm vitest run src/shared/hooks/useEscapeKey.test.ts`
Kỳ vọng: PASS, 5 test.

- [ ] **Bước 5: Commit**

```bash
git add src/shared/hooks/useEscapeKey.ts src/shared/hooks/useEscapeKey.test.ts
git commit -m "✨ them hook useEscapeKey

Thay mau useEffect bat phim Escape lap ~30 lan. Giu callback trong ref
nen doi callback khong lam gan lai listener.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Hook `useCopyToClipboard`

**Files:**
- Create: `src/shared/hooks/useCopyToClipboard.ts`
- Test: `src/shared/hooks/useCopyToClipboard.test.ts`

**Interfaces:**
- Consumes: `COPY_FEEDBACK_MS` từ `domain/constants/ui`
- Produces: `useCopyToClipboard(): { copied: boolean; copy: (text: string) => Promise<void> }`

**Bối cảnh:** Mẫu `navigator.clipboard.writeText()` + `setState(true)` + `setTimeout(() => setState(false), 2000)` lặp 6 lần.

- [ ] **Bước 1: Viết test trước**

Tạo `src/shared/hooks/useCopyToClipboard.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "./useCopyToClipboard";

describe("useCopyToClipboard", () => {
  const writeText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockClear();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ban đầu chưa ở trạng thái đã sao chép", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("ghi đúng nội dung vào clipboard", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("a1b2c3d");
    });

    expect(writeText).toHaveBeenCalledWith("a1b2c3d");
  });

  it("bật cờ copied sau khi sao chép", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("nội dung");
    });

    expect(result.current.copied).toBe(true);
  });

  it("tự tắt cờ copied sau COPY_FEEDBACK_MS", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("nội dung");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("huỷ timer khi unmount, tránh setState trên component đã gỡ", async () => {
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("nội dung");
    });

    unmount();

    expect(() => {
      vi.advanceTimersByTime(2000);
    }).not.toThrow();
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail**

Chạy: `pnpm vitest run src/shared/hooks/useCopyToClipboard.test.ts`
Kỳ vọng: FAIL — không resolve được `./useCopyToClipboard`.

- [ ] **Bước 3: Viết implementation**

Tạo `src/shared/hooks/useCopyToClipboard.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { COPY_FEEDBACK_MS } from "../../domain/constants/ui";

/**
 * Sao chép văn bản vào clipboard và bật cờ `copied` trong COPY_FEEDBACK_MS
 * để UI hiển thị phản hồi "đã sao chép".
 *
 * Timer được huỷ khi unmount để không setState trên component đã gỡ.
 */
export function useCopyToClipboard(): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, []);

  return { copied, copy };
}
```

- [ ] **Bước 4: Chạy test để xác nhận pass**

Chạy: `pnpm vitest run src/shared/hooks/useCopyToClipboard.test.ts`
Kỳ vọng: PASS, 5 test.

- [ ] **Bước 5: Commit**

```bash
git add src/shared/hooks/useCopyToClipboard.ts src/shared/hooks/useCopyToClipboard.test.ts
git commit -m "✨ them hook useCopyToClipboard

Thay mau writeText + setTimeout 2000ms lap 6 lan. Huy timer khi unmount
de khong setState tren component da go.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Primitive `Button`

**Files:**
- Create: `src/shared/ui/Button.tsx`
- Test: `src/shared/ui/Button.test.tsx`

**Interfaces:**
- Consumes: không có (chỉ `clsx`, `lucide-react`)
- Produces: `Button` component, `ButtonProps`, `ButtonVariant = "primary" | "secondary" | "danger" | "ghost"`. Task 9 (`Modal`) dùng trong test của mình.

**Bối cảnh:** 13 nút Cancel (3 biến thể lệch nhau) và ~20 biến thể nút submit `bg-accent`. Theo `docs/DESIGN_SYSTEM.md` mục 6, nút dùng `rounded-lg`.

- [ ] **Bước 1: Viết test trước**

Tạo `src/shared/ui/Button.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("hiển thị nội dung con", () => {
    render(<Button>Lưu lại</Button>);
    expect(screen.getByRole("button", { name: "Lưu lại" })).toBeInTheDocument();
  });

  it("gọi onClick khi bấm", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Bấm</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("bị vô hiệu hoá và không gọi onClick khi loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Đang lưu
      </Button>
    );

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();

    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("hiện spinner khi loading", () => {
    const { container } = render(<Button loading>Đang lưu</Button>);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("không hiện spinner khi không loading", () => {
    const { container } = render(<Button>Bình thường</Button>);
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("bị vô hiệu hoá khi truyền disabled", () => {
    render(<Button disabled>Không bấm được</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("variant khác nhau cho ra class khác nhau", () => {
    const { rerender, container } = render(<Button variant="primary">X</Button>);
    const primaryClass = container.querySelector("button")?.className;

    rerender(<Button variant="danger">X</Button>);
    const dangerClass = container.querySelector("button")?.className;

    expect(primaryClass).not.toBe(dangerClass);
  });

  it("mặc định type là button để không submit form ngoài ý muốn", () => {
    render(<Button>X</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("cho phép ghi đè type thành submit", () => {
    render(<Button type="submit">Gửi</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail**

Chạy: `pnpm vitest run src/shared/ui/Button.test.tsx`
Kỳ vọng: FAIL — không resolve được `./Button`.

- [ ] **Bước 3: Viết implementation**

Tạo `src/shared/ui/Button.tsx`:

```tsx
import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

const BASE =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold " +
  "cursor-pointer transition-all active:scale-[0.98] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-contrast border-none hover:bg-accent-hover",
  secondary:
    "bg-transparent text-primary border border-border-subtle hover:bg-surface-hover font-medium",
  danger: "bg-diff-remove-text text-white border-none hover:opacity-90",
  ghost: "bg-transparent text-secondary border-none hover:text-primary hover:bg-surface-hover",
};

/**
 * Nút bấm dùng chung. Không biết gì về nghiệp vụ Git — nhận mọi thứ qua props.
 *
 * `loading` tự vô hiệu hoá nút và hiện spinner, nên nơi gọi không phải tự
 * quản lý hai thứ đó riêng.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(BASE, VARIANT[variant], className)}
      {...rest}
    >
      {loading && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};
```

- [ ] **Bước 4: Chạy test để xác nhận pass**

Chạy: `pnpm vitest run src/shared/ui/Button.test.tsx`
Kỳ vọng: PASS, 9 test.

- [ ] **Bước 5: Commit**

```bash
git add src/shared/ui/Button.tsx src/shared/ui/Button.test.tsx
git commit -m "✨ them primitive Button

Thay 13 nut Cancel (3 bien the lech nhau) va ~20 bien the nut submit.
Dung rounded-lg theo DESIGN_SYSTEM muc 6. loading tu vo hieu hoa nut.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Primitive `Alert`

**Files:**
- Create: `src/shared/ui/Alert.tsx`
- Test: `src/shared/ui/Alert.test.tsx`

**Interfaces:**
- Consumes: không có
- Produces: `Alert` component, `AlertProps`, `AlertVariant = "error" | "warning" | "info" | "success"`

**Bối cảnh:** Khối hiển thị lỗi `flex items-start gap-1.5 p-2 bg-diff-remove-bg border ... AlertCircle` lặp ở hầu hết modal, kèm biến thể cảnh báo dùng `AlertTriangle` và biến thể an toàn dùng `ShieldCheck`.

- [ ] **Bước 1: Viết test trước**

Tạo `src/shared/ui/Alert.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("hiển thị nội dung", () => {
    render(<Alert variant="error">Không xoá được nhánh</Alert>);
    expect(screen.getByText("Không xoá được nhánh")).toBeInTheDocument();
  });

  it("dùng role=alert cho lỗi để trình đọc màn hình thông báo ngay", () => {
    render(<Alert variant="error">Hỏng rồi</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("không dùng role=alert cho thông tin thường", () => {
    render(<Alert variant="info">Chỉ là thông tin</Alert>);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("variant khác nhau cho ra class khác nhau", () => {
    const { rerender, container } = render(<Alert variant="error">X</Alert>);
    const errorClass = container.firstElementChild?.className;

    rerender(<Alert variant="success">X</Alert>);
    const successClass = container.firstElementChild?.className;

    expect(errorClass).not.toBe(successClass);
  });

  it("hiện icon mặc định theo variant", () => {
    const { container } = render(<Alert variant="warning">X</Alert>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("ẩn được icon khi không cần", () => {
    const { container } = render(
      <Alert variant="info" showIcon={false}>
        X
      </Alert>
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail**

Chạy: `pnpm vitest run src/shared/ui/Alert.test.tsx`
Kỳ vọng: FAIL — không resolve được `./Alert`.

- [ ] **Bước 3: Viết implementation**

Tạo `src/shared/ui/Alert.tsx`:

```tsx
import React from "react";
import clsx from "clsx";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export type AlertVariant = "error" | "warning" | "info" | "success";

export interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

const VARIANT_STYLE: Record<AlertVariant, string> = {
  error: "bg-diff-remove-bg border-diff-remove-text/30 text-diff-remove-text",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  info: "bg-accent-subtle/40 border-accent-subtle text-secondary",
  success: "bg-diff-add-bg border-diff-add-border text-diff-add-text",
};

const VARIANT_ICON: Record<AlertVariant, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

/**
 * Khối thông báo trong modal và form.
 *
 * Chỉ variant "error" mang role="alert" — trình đọc màn hình sẽ đọc ngay
 * khi nó xuất hiện. Các variant khác là thông tin bổ trợ nên không cắt
 * ngang người dùng.
 */
export const Alert: React.FC<AlertProps> = ({ variant, children, showIcon = true, className }) => {
  const Icon = VARIANT_ICON[variant];

  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={clsx(
        "flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-normal",
        VARIANT_STYLE[variant],
        className
      )}
    >
      {showIcon && <Icon size={14} className="shrink-0 mt-0.5" aria-hidden="true" />}
      <span className="min-w-0">{children}</span>
    </div>
  );
};
```

- [ ] **Bước 4: Chạy test để xác nhận pass**

Chạy: `pnpm vitest run src/shared/ui/Alert.test.tsx`
Kỳ vọng: PASS, 6 test.

- [ ] **Bước 5: Commit**

```bash
git add src/shared/ui/Alert.tsx src/shared/ui/Alert.test.tsx
git commit -m "✨ them primitive Alert

Thay khoi hien thi loi/canh bao lap o hau het modal. Chi variant error
mang role=alert de trinh doc man hinh doc ngay.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Primitive `Modal` (compound component)

**Files:**
- Create: `src/shared/ui/Modal.tsx`
- Test: `src/shared/ui/Modal.test.tsx`
- Create: `src/shared/ui/index.ts`

**Interfaces:**
- Consumes: `Transition` từ `components/common/Transition` (chỉ import, không sửa), `useEscapeKey` (Task 5), `MODAL_SIZE`/`ModalSize` (Task 1), `MOTION` (Task 1), `Z_INDEX` (Task 1), `Button` (Task 7)
- Produces: `Modal` với `Modal.Header`, `Modal.Body`, `Modal.Footer`; `ModalProps`, `ModalHeaderProps`

**Bối cảnh:** 26 modal tự dựng overlay. Spec mục 4.2 chọn compound component thay vì boolean props, vì thân của 26 modal rất khác nhau và dùng props kiểu `showCheckbox`/`showWarning` sẽ đẻ ra hơn 15 boolean.

Theo `docs/DESIGN_SYSTEM.md` mục 6, khung modal dùng `rounded-xl`.

**Lưu ý về z-index:** `Z_INDEX.modal` là 30, thấp hơn nhiều so với `z-[9999]` hiện tại. Ở Giai đoạn 0 không sao vì chưa có modal cũ nào dùng `Modal` mới. Giai đoạn 2 sẽ migrate đồng loạt nên toàn bộ modal cùng nằm trong một thang bậc.

- [ ] **Bước 1: Viết test trước**

Tạo `src/shared/ui/Modal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";
import { Button } from "./Button";

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <Modal isOpen onClose={onClose} labelledBy="test-title" {...props}>
      <Modal.Header title="Tiêu đề thử" onClose={onClose} titleId="test-title" />
      <Modal.Body>
        <p>Nội dung thân modal</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Huỷ</Button>
      </Modal.Footer>
    </Modal>
  );
  return { ...utils, onClose };
}

describe("Modal", () => {
  it("hiển thị nội dung khi mở", () => {
    renderModal();
    expect(screen.getByText("Nội dung thân modal")).toBeInTheDocument();
    expect(screen.getByText("Tiêu đề thử")).toBeInTheDocument();
  });

  it("không hiển thị gì khi đóng", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Nội dung thân modal")).not.toBeInTheDocument();
  });

  it("có role=dialog và aria-modal cho trợ năng", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("liên kết tiêu đề qua aria-labelledby", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "test-title");
  });

  it("gọi onClose khi bấm Escape", () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gọi onClose khi bấm ra ngoài vùng nội dung", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("KHÔNG đóng khi bấm bên trong vùng nội dung", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByText("Nội dung thân modal"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("gọi onClose khi bấm nút X trên header", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByLabelText("Đóng"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("không bắt Escape khi modal đang đóng", () => {
    const { onClose } = renderModal({ isOpen: false });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("size khác nhau cho ra class chiều rộng khác nhau", () => {
    const { rerender } = renderModal({ size: "sm" });
    const smallPanel = screen.getByTestId("modal-panel").className;

    rerender(
      <Modal isOpen onClose={vi.fn()} size="xl" labelledBy="test-title">
        <Modal.Body>X</Modal.Body>
      </Modal>
    );
    const largePanel = screen.getByTestId("modal-panel").className;

    expect(smallPanel).not.toBe(largePanel);
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail**

Chạy: `pnpm vitest run src/shared/ui/Modal.test.tsx`
Kỳ vọng: FAIL — không resolve được `./Modal`.

- [ ] **Bước 3: Viết implementation**

Tạo `src/shared/ui/Modal.tsx`:

```tsx
import React from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { Transition } from "../../components/common/Transition";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { MODAL_SIZE, type ModalSize } from "../../domain/constants/ui";
import { MOTION } from "../../domain/constants/motion";
import { Z_INDEX } from "../../domain/constants/zIndex";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  /** id của phần tử tiêu đề, gắn vào aria-labelledby. */
  labelledBy?: string;
  /** Chặn đóng modal khi đang có thao tác dở dang. */
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  titleId?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "default" | "danger";
}

interface ModalComposition {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Footer: React.FC<{ children: React.ReactNode; className?: string }>;
}

/**
 * Khung modal dùng chung cho toàn ứng dụng.
 *
 * Tự lo backdrop, phím Escape, role/aria, chặn sự kiện click lan ra ngoài
 * và z-index — modal con chỉ việc mô tả nội dung.
 *
 * Dùng compound component (Modal.Header/Body/Footer) thay vì boolean props,
 * vì thân của các modal rất khác nhau; nếu dùng props thì sẽ phải thêm cờ
 * mới cho mỗi biến thể.
 */
const ModalRoot: React.FC<ModalProps> & ModalComposition = ({
  isOpen,
  onClose,
  children,
  size = "md",
  labelledBy,
  closeOnBackdrop = true,
  closeOnEscape = true,
}) => {
  useEscapeKey(isOpen && closeOnEscape, onClose);

  return (
    <Transition
      show={isOpen}
      duration={MOTION.fast}
      className="fixed inset-0"
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-150 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: Z_INDEX.modal }}
        onClick={closeOnBackdrop ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        <div
          data-testid="modal-panel"
          className={clsx(
            "w-full max-h-[90vh] bg-surface border border-border-subtle rounded-xl",
            "shadow-2xl overflow-hidden flex flex-col animate-scale-in",
            MODAL_SIZE[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Transition>
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  titleId,
  icon: Icon,
  tone = "default",
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
    <div className="flex items-center gap-2">
      {Icon && (
        <Icon
          size={16}
          className={tone === "danger" ? "text-diff-remove-text" : "text-accent"}
        />
      )}
      <h3 id={titleId} className="text-xs font-semibold text-primary m-0">
        {title}
      </h3>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng"
      className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1 rounded-md transition-colors"
    >
      <X size={16} />
    </button>
  </div>
);

const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={clsx("p-4 flex flex-col gap-3 overflow-y-auto min-h-0", className)}>
    {children}
  </div>
);

const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      "flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-surface shrink-0",
      className
    )}
  >
    {children}
  </div>
);

ModalRoot.Header = ModalHeader;
ModalRoot.Body = ModalBody;
ModalRoot.Footer = ModalFooter;

export const Modal = ModalRoot;
```

- [ ] **Bước 4: Chạy test để xác nhận pass**

Chạy: `pnpm vitest run src/shared/ui/Modal.test.tsx`
Kỳ vọng: PASS, 10 test.

- [ ] **Bước 5: Tạo barrel export**

Tạo `src/shared/ui/index.ts`:

```ts
export { Button, type ButtonProps, type ButtonVariant } from "./Button";
export { Alert, type AlertProps, type AlertVariant } from "./Alert";
export { Modal, type ModalProps, type ModalHeaderProps } from "./Modal";
```

- [ ] **Bước 6: Chạy toàn bộ test để xác nhận không vỡ gì**

Chạy: `pnpm test`
Kỳ vọng: toàn bộ test cũ (73 file) vẫn xanh + test mới xanh.

- [ ] **Bước 7: Commit**

```bash
git add src/shared/ui/Modal.tsx src/shared/ui/Modal.test.tsx src/shared/ui/index.ts
git commit -m "✨ them primitive Modal dang compound component

Thay 26 modal tu dung overlay. Modal tu lo backdrop, Escape, role/aria,
stopPropagation va z-index. Dung compound thay vi boolean props vi than
cac modal rat khac nhau.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Bật lint độ phức tạp ở mức `warn`

**Files:**
- Modify: `.oxlintrc.json`

**Interfaces:**
- Consumes: không có
- Produces: cấu hình lint. Giai đoạn 7 sẽ nâng từ `warn` lên `error`.

**Bối cảnh:** Spec mục 6.2. Đã kiểm chứng 6 luật này chạy được trên oxlint 1.83 của dự án. Code production hiện có **131 vi phạm**, nên bắt buộc để `warn` — bật `error` ngay sẽ vỡ CI.

- [ ] **Bước 1: Ghi lại số vi phạm hiện tại làm mốc**

Chạy: `pnpm lint 2>&1 | tail -5`
Ghi lại số warning tổng. Con số này sẽ giảm dần qua các giai đoạn sau.

- [ ] **Bước 2: Thêm 6 luật vào `.oxlintrc.json`**

Thêm vào object `rules` (giữ nguyên các luật đang có):

```jsonc
"max-lines": ["warn", { "max": 300, "skipBlankLines": true, "skipComments": true }],
"max-lines-per-function": ["warn", { "max": 80, "skipBlankLines": true, "skipComments": true }],
"complexity": ["warn", 15],
"max-depth": ["warn", 4],
"max-params": ["warn", 5],
"max-nested-callbacks": ["warn", 3]
```

- [ ] **Bước 3: Miễn trừ cho file test**

File test dài là bình thường (`describe` lồng nhiều `it`). Thêm mục `overrides` ở cấp cao nhất của `.oxlintrc.json`:

```jsonc
"overrides": [
  {
    "files": ["src/test/**", "**/*.test.ts", "**/*.test.tsx", "e2e/**"],
    "rules": {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off"
    }
  }
]
```

- [ ] **Bước 4: Xác nhận lint chạy được và KHÔNG chặn CI**

Chạy: `pnpm lint; echo "exit=$?"`
Kỳ vọng: hiện các warning về `max-lines`/`complexity`, nhưng `exit=0` — vì là `warn` chứ không phải `error`.

Nếu `exit` khác 0, kiểm tra lại xem có luật nào bị đặt nhầm thành `error` không.

- [ ] **Bước 5: Xác nhận file mới của Giai đoạn 0 không vi phạm**

Chạy: `pnpm lint 2>&1 | grep -E "src/(domain|shared)/" || echo "Không có vi phạm trong code mới"`
Kỳ vọng: `Không có vi phạm trong code mới`.

Nếu có vi phạm, sửa file đó cho dưới ngưỡng trước khi commit — code mới phải sạch ngay từ đầu.

- [ ] **Bước 6: Chạy đầy đủ kiểm tra**

Chạy: `pnpm format:check && pnpm lint && pnpm build && pnpm test`
Kỳ vọng: tất cả xanh.

Nếu `format:check` báo lỗi, chạy `pnpm format` rồi commit kèm.

- [ ] **Bước 7: Commit**

```bash
git add .oxlintrc.json
git commit -m "🔧 bat lint do phuc tap o muc warn

Them max-lines 300, max-lines-per-function 80, complexity 15, max-depth 4,
max-params 5, max-nested-callbacks 3. De muc warn vi code hien co 131
vi pham — se nang len error o giai doan 7 khi da ve 0.

File test duoc mien tru vi test dai la binh thuong.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Điểm dừng kiểm tra — Giai đoạn 0

Sau Task 10, **dừng lại và báo cáo cho người dùng**. Không tự ý làm tiếp Giai đoạn 1.

Báo cáo phải nêu rõ:

1. Kết quả `pnpm check` (dán output thật, không tóm tắt).
2. Số test mới đã thêm và tổng số test đang xanh.
3. Số warning lint hiện tại làm mốc cho các giai đoạn sau.
4. Xác nhận **không có file nào trong `src/components/`, `src/store/`, `src/ipc/` bị sửa** — kiểm bằng:

```bash
git diff --stat main..HEAD -- src/components src/store src/ipc
```

Kỳ vọng: output rỗng.

## Tiêu chí hoàn thành Giai đoạn 0

- [ ] `src/domain/` có `queryKeys.ts`, `enums.ts`, `constants/{ui,motion,zIndex}.ts`
- [ ] `src/shared/utils/` có `git.ts`, `toError.ts`
- [ ] `src/shared/hooks/` có `useEscapeKey.ts`, `useCopyToClipboard.ts`
- [ ] `src/shared/ui/` có `Button.tsx`, `Alert.tsx`, `Modal.tsx`, `index.ts`
- [ ] Mỗi file mới đều có test đi kèm, tổng cộng **51 test mới**
- [ ] `src/shared/ui/**` không import `ipc/`, `store/`, `i18n/`
- [ ] Lint độ phức tạp bật ở mức `warn`, `pnpm lint` thoát mã 0
- [ ] Không file nào trong `src/components/`, `src/store/`, `src/ipc/` bị sửa
- [ ] `pnpm check` xanh
