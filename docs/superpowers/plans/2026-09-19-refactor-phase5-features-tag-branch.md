# Giai đoạn 5 (lát 1): hạ tầng `features/` + migrate `tag` và `branch`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng tầng `features/` với ranh giới import được lint ép buộc, rồi migrate hai feature đầu tiên — `tag` (nhỏ, chốt mẫu) và `branch` (xẻ nhỏ `BranchSidebar` 1332 dòng) — sang cấu trúc `features/<name>/{api,components,index.ts}`.

**Architecture:** Mỗi feature tự chứa ba thứ: `api/` (React Query hooks bọc `ipc/<domain>`, sở hữu luôn việc invalidate cache), `components/` (UI thuần, không biết IPC), và `index.ts` (cổng public duy nhất). Component ngoài feature chỉ được import qua `index.ts`; luật `no-restricted-imports` của oxlint chặn mọi đường vòng. `components/` cũ và `features/` mới sống song song cho tới khi feature cuối cùng chuyển xong.

**Tech Stack:** React 19, TypeScript, React Query v5, Zustand, Tailwind v4, Vitest + Testing Library, oxlint 1.83, Tauri v2.

## Global Constraints

Những ràng buộc này áp cho **mọi task** trong kế hoạch. Chúng lấy từ `docs/superpowers/REFACTOR_STATUS.md` mục 7 và spec mục 3.3.

- **Ngôn ngữ:** code, comment, mô tả test (`describe`/`it`), chuỗi fixture và commit message viết **tiếng Anh**. Chỉ chuỗi người dùng đọc được (`src/i18n/*`, `aria-label`, `title`) giữ tiếng Việt. `pnpm check-comment-language` ép buộc và **chỉ quét `.ts/.tsx/.mjs/.js`**.
- **Không viết query key literal.** Luôn dùng `qk` từ `src/domain/queryKeys.ts`. `pnpm check-query-keys` chặn.
- **Năm quy tắc bất biến:** (1) phụ thuộc chỉ đi xuống `features → shared → domain`; (2) `features/a` không import `features/b`; (3) `shared/ui/` không import `ipc/`, `store/`, `i18n/`; (4) component không gọi `invokeCommand` trực tiếp, luôn qua `features/*/api`; (5) không query key literal.
- **Mỗi test mới phải qua thí nghiệm phá.** Cố tình làm hỏng implementation, xác nhận test **FAIL**, rồi hoàn nguyên. Ghi lại kết quả trong commit message hoặc PR note.
- **Không sửa assertion của test cũ cho nó xanh.** Ngoại lệ duy nhất: assertion đang mã hoá chính khuyết điểm; khi đó bản thay thế phải **mạnh hơn** (dựng từ `qk`, giữ đủ số lượng, không nới lỏng).
- **Test đặt ở `src/test/`** theo quy ước sẵn có của repo, **trừ** test của `shared/` và của `features/*/api` — xem Task 1 ghi chú vị trí. Không tự ý đổi quy ước chung.
- **Trailer commit:** `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- **Lệnh xác minh đầy đủ** (chạy trước mỗi commit gộp nhóm):
  ```bash
  pnpm lint                     # exit 0
  pnpm build                    # exit 0
  pnpm test                     # tất cả xanh
  pnpm check-query-keys
  pnpm check-comment-language
  ```
- **Mốc chuẩn khi bắt đầu:** 94 test file / 572 test xanh; `pnpm lint` exit 0 (175 warning độ phức tạp là theo kế hoạch).

---

## Quyết định thiết kế đã chốt

**1. Invalidate chuyển vào trong hook — đây là ĐỔI HÀNH VI CỐ Ý, không phải move cơ học.**

Hiện tại `CreateTagModal`/`DeleteTagModal` nhận prop `onSuccess` và **không** tự invalidate; `BranchSidebar` gọi `invalidateRepo()` (5 key: branches, commitGraph, repo.status, repo.head, tags). `CommitGraph` render `CreateTagModal` với `onSuccess` **riêng của nó**.

Spec mục 4.5 đặt invalidate vào trong mutation hook. Điều đó tốt hơn (call site không thể quên), nhưng **vi phạm quy ước 5** (migrate là thay thế cơ học) nên phải xử lý có chủ đích:

- Hook `useCreateTag`/`useDeleteTag` tự invalidate `qk.repo.all(repoPath)` — phủ trùm mọi key con vì mọi key đều có tiền tố `["repo", path]`.
- Prop `onSuccess` **giữ nguyên** để call site vẫn chạy được việc riêng (đóng modal, reset state).
- Mỗi hook có **test ghim phạm vi invalidate** — xác nhận đúng key được gọi, không thừa không thiếu.
- Sau khi cả `tag` migrate xong, gỡ `qk.tags(...)` khỏi `invalidateRepo()` của `BranchSidebar` **chỉ khi** đã có test chứng minh hook làm việc đó. Không gỡ mò.

**2. Không xoá `components/tag`, `components/sidebar` ngay.** Tạo `features/`, chuyển nội dung, rồi để file cũ **re-export** từ feature trong đúng task đó, và xoá file cũ ở task cuối của feature. Lý do: 291 call site và 12 test file đang trỏ vào đường cũ; đổi hết trong một task thì review không nổi.

**3. `useAsyncAction` (spec 4.4) KHÔNG làm trong kế hoạch này.** Spec đề xuất nó để gom mẫu `setLoading/try/catch/finally` lặp 16 lần. Nhưng khi đã có `useMutation` của React Query trong `features/*/api`, hook đó chồng vai trò: `useMutation` đã cho `isPending`, `error`, `onSuccess`. Dựng cả hai sẽ có hai đường làm cùng một việc. **Quyết định: dùng `useMutation`, bỏ `useAsyncAction` khỏi phạm vi.** Ghi vào status doc như một sai lệch có lý do so với spec.

**4. `CreateBranchModal` được 3 nơi dùng** (`App.tsx`, `CommitGraph`, `BranchSidebar`). Nó chuyển vào `features/branch/` và cả ba nơi import qua `features/branch` — đây là lý do cổng `index.ts` phải có ngay từ Task 1.

---

## Cấu trúc file

Kế hoạch tạo/sửa các file sau. Mỗi file một trách nhiệm rõ ràng.

### Tạo mới — hạ tầng (Task 1–2)

| File | Trách nhiệm |
| --- | --- |
| `src/features/README.md` | Giải thích quy ước feature, 5 quy tắc bất biến, cách thêm feature mới |
| `src/test/architectureBoundaries.test.ts` | Test ghim: quét source, khẳng định không có vi phạm ranh giới tầng |

### Tạo mới — feature `tag` (Task 3–5)

| File | Trách nhiệm |
| --- | --- |
| `src/features/tag/api/useTags.ts` | Query danh sách tag |
| `src/features/tag/api/useCreateTag.ts` | Mutation tạo tag + invalidate |
| `src/features/tag/api/useDeleteTag.ts` | Mutation xoá tag + invalidate |
| `src/features/tag/api/index.ts` | Gom export của `api/` |
| `src/features/tag/components/CreateTagModal.tsx` | Chuyển từ `components/tag/`, bỏ IPC trực tiếp |
| `src/features/tag/components/DeleteTagModal.tsx` | Chuyển từ `components/tag/`, bỏ IPC trực tiếp |
| `src/features/tag/index.ts` | Cổng public của feature tag |
| `src/features/tag/api/useTagMutations.test.ts` | Test ghim phạm vi invalidate của cả 3 hook |

### Tạo mới — feature `branch` (Task 6–10)

| File | Trách nhiệm |
| --- | --- |
| `src/features/branch/api/useBranches.ts` | Query danh sách nhánh |
| `src/features/branch/api/useBranchMutations.ts` | Mutation checkout/create/rename/delete + invalidate |
| `src/features/branch/api/index.ts` | Gom export |
| `src/features/branch/model/branchTree.ts` | `buildBranchTree`, `countBranchesInNode` — logic thuần, tách khỏi render |
| `src/features/branch/model/sidebarDialog.ts` | Discriminated union thay 12 cờ modal rời rạc |
| `src/features/branch/components/CreateBranchModal.tsx` | Chuyển từ `components/sidebar/` |
| `src/features/branch/components/RenameBranchModal.tsx` | Chuyển từ `components/sidebar/` |
| `src/features/branch/components/DeleteBranchModal.tsx` | Chuyển từ `components/sidebar/` |
| `src/features/branch/components/CheckoutConflictModal.tsx` | Chuyển từ `components/sidebar/` |
| `src/features/branch/components/BranchTreeNode.tsx` | Render một node cây nhánh + menu ngữ cảnh |
| `src/features/branch/components/BranchSidebar.tsx` | Vỏ mỏng: layout + điều phối, mục tiêu < 300 dòng |
| `src/features/branch/index.ts` | Cổng public của feature branch |
| `src/test/branchTree.test.ts` | Test logic dựng cây, không cần render |
| `src/test/sidebarDialog.test.ts` | Test union: trạng thái sai không biểu diễn được |

### Sửa

| File | Thay đổi |
| --- | --- |
| `.oxlintrc.json` | Thêm `no-restricted-imports` + override cho `features/*/api` và `shared/ui` |
| `src/components/tag/index.ts` | Re-export từ `features/tag` (Task 5), rồi xoá |
| `src/components/graph/CommitGraph.tsx` | Import `CreateTagModal`, `CreateBranchModal` qua `features/` |
| `src/App.tsx` | Import `CreateBranchModal` qua `features/branch` |
| `src/components/Shell.tsx` | Import `BranchSidebar` qua `features/branch` |
| `src/components/pullrequests/index.ts` | Trỏ lại `PullRequestsSection` (ở lại `components/`, chưa migrate) |
| 12 test file đang trỏ `components/tag`, `components/sidebar` | Đổi import sang `features/` |

---

## Task 1: Dựng khung `features/` và ép ranh giới bằng lint

Task này không migrate gì cả. Nó chỉ dựng luật và chứng minh luật có răng — làm trước để mọi task sau được bảo vệ.

**Files:**
- Create: `src/features/README.md`
- Modify: `.oxlintrc.json`

**Interfaces:**
- Consumes: không có (task đầu tiên)
- Produces: luật lint `no-restricted-imports` mà Task 3–10 phải tuân thủ. Thư mục `src/features/` tồn tại.

- [ ] **Step 1: Xác nhận oxlint 1.83 thật sự hỗ trợ `no-restricted-imports`**

Đây là bước bắt buộc, không được bỏ. GĐ1 từng giả định oxlint có `no-restricted-syntax` và hoá ra **không có** — mất công làm lại. Chạy thử trong thư mục tạm:

```bash
D="$TMPDIR/oxcheck" && mkdir -p "$D/src"
cat > "$D/.oxlintrc.json" <<'EOF'
{
  "plugins": ["eslint", "typescript", "import"],
  "categories": { "correctness": "off" },
  "rules": {
    "no-restricted-imports": ["error", { "patterns": [{ "group": ["**/ipc/*"], "message": "no direct ipc" }] }]
  }
}
EOF
cat > "$D/src/a.ts" <<'EOF'
import { x } from "../ipc/client";
export const y = x;
EOF
cd "$D" && /d/project-v3/node_modules/.bin/oxlint -c .oxlintrc.json src/
```

Expected: in ra `error eslint(no-restricted-imports): '../ipc/client' import is restricted... help: no direct ipc`

Nếu **không** báo lỗi: dừng lại. Không viết luật vào repo. Thay bằng script kiểm tra theo tiền lệ `scripts/check-query-keys.mjs` và ghi lại lý do trong status doc.

- [ ] **Step 2: Thêm luật vào `.oxlintrc.json`**

Thêm vào `rules` (đặt ngay sau `"import/no-duplicates"`):

```json
    "no-restricted-imports": [
      "warn",
      {
        "patterns": [
          {
            "group": ["**/ipc/*", "**/ipc"],
            "message": "Component phải gọi qua features/*/api, không import ipc trực tiếp."
          },
          {
            "group": ["**/features/*/components/*", "**/features/*/api/*", "**/features/*/model/*"],
            "message": "Import qua features/<name>/index.ts, không chọc vào nội bộ feature."
          }
        ]
      }
    ],
```

Đặt mức `warn` chứ **không** `error`. Lý do: `components/` cũ còn 36 file import thẳng `ipc/` và chưa migrate; để `error` thì `pnpm lint` đỏ ngay lập tức và mất mốc chuẩn "exit 0". GĐ7 sẽ nâng lên `error` khi mọi feature đã chuyển xong — đúng như bảng ở mục 4 của status doc.

Thêm vào mảng `overrides` (sau override của `src/test/**`):

```json
    {
      "files": ["src/features/*/api/**", "src/ipc/**"],
      "rules": {
        "no-restricted-imports": "off"
      }
    },
    {
      "files": ["src/shared/ui/**"],
      "rules": {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              {
                "group": ["**/ipc/*", "**/ipc", "**/store/*", "**/i18n", "**/i18n/*"],
                "message": "shared/ui phải thuần: nhận mọi thứ qua props."
              }
            ]
          }
        ]
      }
    }
```

Override cho `shared/ui` để **`error`** được, vì tầng đó hiện đã sạch — nó khoá lại thành tựu của GĐ0 thay vì đặt mục tiêu tương lai.

- [ ] **Step 3: Chứng minh luật có răng — thí nghiệm phá**

Tạm thêm import vi phạm vào `src/shared/ui/Button.tsx` (dòng đầu):

```ts
import { invokeCommand } from "../../ipc/client";
```

Run: `pnpm lint 2>&1 | grep -i "restricted"`
Expected: báo `error` với thông điệp "shared/ui phải thuần: nhận mọi thứ qua props."

Nếu **không** báo: luật không hoạt động cho đường import tương đối. Sửa `group` pattern rồi thử lại. Không đi tiếp khi chưa thấy lỗi.

Sau khi thấy lỗi, **xoá dòng vừa thêm** và xác nhận `pnpm lint` exit 0 trở lại.

- [ ] **Step 4: Viết `src/features/README.md`**

```markdown
# features/

Mỗi feature là một lát nghiệp vụ tự chứa. Cấu trúc bắt buộc:

```
features/<name>/
├─ api/          React Query hooks bọc ipc/<domain>. Nơi DUY NHẤT của feature được import ipc/.
├─ components/   UI. Không biết IPC, không biết query key.
├─ model/        (tuỳ chọn) logic thuần: dựng cây, union trạng thái, transform.
└─ index.ts      Cổng public DUY NHẤT. Ngoài feature chỉ được import từ đây.
```

## Năm quy tắc bất biến

1. Phụ thuộc chỉ đi xuống: `features → shared → domain`.
2. `features/a` KHÔNG import `features/b`. Cần dùng chung thì đẩy xuống `shared/`.
3. `shared/ui/` KHÔNG import `ipc/`, `store/`, `i18n/`. Nhận mọi thứ qua props.
4. Component KHÔNG gọi `invokeCommand` trực tiếp. Luôn đi qua `features/*/api`.
5. KHÔNG viết query key literal. Luôn dùng `domain/queryKeys`.

Quy tắc 3 và 4 được `no-restricted-imports` trong `.oxlintrc.json` ép buộc.
Quy tắc 5 được `scripts/check-query-keys.mjs` ép buộc.
Quy tắc 1 và 2 được `src/test/architectureBoundaries.test.ts` ép buộc.

## Thêm một feature mới

1. Tạo `features/<name>/{api,components}/` và `index.ts`.
2. `api/` gọi `ipc/<domain>` — tầng này đã được tách sẵn ở Giai đoạn 4.
3. Mutation hook tự invalidate `qk.repo.all(repoPath)`; call site không phải nhớ.
4. `index.ts` chỉ export những gì bên ngoài thật sự cần.

## Cache invalidation

Mutation hook sở hữu việc invalidate. Mọi query key đều có tiền tố
`["repo", repoPath]`, nên `qk.repo.all(repoPath)` phủ trùm toàn bộ một repo.
Call site không tự invalidate — nếu thấy mình đang gọi `invalidateQueries`
trong một component, logic đó thuộc về `api/`.
```

- [ ] **Step 5: Chạy xác minh và commit**

```bash
pnpm lint && pnpm check-comment-language
```
Expected: cả hai exit 0. `pnpm lint` vẫn có warning độ phức tạp cũ, nhưng **không** được có warning `no-restricted-imports` mới nào ở `src/shared/`.

```bash
git add .oxlintrc.json src/features/README.md
git commit -m "🏗️ add features/ layer boundaries enforced by lint

Add no-restricted-imports rules: components may not import ipc/ directly
(warn, since components/ has not migrated yet), and shared/ui may not
import ipc/store/i18n (error, since that layer is already clean).

Verified oxlint 1.83 supports the rule before writing it, and confirmed it
fires by temporarily adding a violating import to shared/ui/Button.tsx.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Test ghim ranh giới tầng

Luật lint chặn import `ipc/` và nội bộ feature, nhưng **không** chặn `features/a` import `features/b` (quy tắc 2) — pattern glob không diễn tả được "feature khác với feature hiện tại". Task này ghim nó bằng test.

**Files:**
- Create: `src/test/architectureBoundaries.test.ts`

**Interfaces:**
- Consumes: thư mục `src/features/` từ Task 1
- Produces: `src/test/architectureBoundaries.test.ts` — test chạy được cả khi `src/features/` còn rỗng, và tự phủ mọi feature thêm sau này.

- [ ] **Step 1: Viết test**

```ts
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(process.cwd(), "src");
const FEATURES = join(SRC, "features");

/** Recursively collect every .ts/.tsx file under dir. Returns [] if dir is absent. */
function collectSourceFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Files allowed to import ipc/ outside api/, each with its reason and exit
 * condition. Every entry is temporary — shrink this list, never grow it.
 * Task 9 adds CheckoutConflictModal here when it moves into the feature.
 */
const IPC_IMPORT_EXCEPTIONS: Record<string, string> = {};

/** Names of the feature directories that currently exist. */
function featureNames(): string[] {
  try {
    return readdirSync(FEATURES).filter((name) => statSync(join(FEATURES, name)).isDirectory());
  } catch {
    return [];
  }
}

describe("architecture boundaries", () => {
  it("no feature imports another feature", () => {
    const names = featureNames();
    const violations: string[] = [];

    for (const name of names) {
      const files = collectSourceFiles(join(FEATURES, name));
      for (const file of files) {
        const source = readFileSync(file, "utf8");
        for (const other of names) {
          if (other === name) continue;
          // Matches both "../<other>" relative hops and "features/<other>" paths.
          const pattern = new RegExp(`from\\s+["'][^"']*(?:\\.\\./${other}|features/${other})(?:/|["'])`);
          if (pattern.test(source)) {
            violations.push(`${relative(SRC, file)} imports feature "${other}"`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("only features/*/api may import ipc/", () => {
    const violations: string[] = [];

    for (const name of featureNames()) {
      const files = collectSourceFiles(join(FEATURES, name));
      for (const file of files) {
        const rel = relative(SRC, file).replace(/\\/g, "/");
        if (rel.includes(`features/${name}/api/`)) continue;
        if (rel.replace(/^features\//, "features/") in IPC_IMPORT_EXCEPTIONS) continue;
        const source = readFileSync(file, "utf8");
        if (/from\s+["'][^"']*\/ipc\//.test(source)) {
          violations.push(`${rel} imports ipc/ outside of api/`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("every ipc-import exception still exists", () => {
    // An exception left behind after its file moved or was cleaned up would
    // silently widen the rule. Each entry must name a real file.
    for (const rel of Object.keys(IPC_IMPORT_EXCEPTIONS)) {
      expect(() => statSync(join(SRC, rel)), `stale exception: ${rel}`).not.toThrow();
    }
  });

  it("shared/ui does not import ipc, store, or i18n", () => {
    const files = collectSourceFiles(join(SRC, "shared", "ui"));
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (/from\s+["'][^"']*\/(ipc|store|i18n)(\/|["'])/.test(source)) {
        violations.push(relative(SRC, file));
      }
    }

    expect(violations).toEqual([]);
    // Guard against the check silently passing because the glob found nothing.
    expect(files.length).toBeGreaterThan(0);
  });
});
```

Chú ý assertion cuối: `expect(files.length).toBeGreaterThan(0)`. Không có nó, test sẽ **xanh khi quét trượt thư mục** — đúng loại test rỗng mà quy ước 3 nhắm tới.

- [ ] **Step 2: Chạy test, xác nhận xanh**

Run: `pnpm vitest run src/test/architectureBoundaries.test.ts`
Expected: 4 test PASS. Ba test đầu xanh tầm thường vì `src/features/` còn rỗng — đó là đúng, chúng sẽ có việc từ Task 3. Test thứ tư xanh vì danh sách ngoại lệ còn rỗng.

- [ ] **Step 3: Thí nghiệm phá — chứng minh test bắt được vi phạm**

Tạo tạm hai file:

```bash
mkdir -p src/features/alpha/components src/features/beta/api
cat > src/features/beta/api/thing.ts <<'EOF'
export const thing = 1;
EOF
cat > src/features/alpha/components/Bad.tsx <<'EOF'
import { thing } from "../../beta/api/thing";
export const Bad = () => thing;
EOF
```

Run: `pnpm vitest run src/test/architectureBoundaries.test.ts`
Expected: test "no feature imports another feature" **FAIL**, in ra `features/alpha/components/Bad.tsx imports feature "beta"`.

Giờ thử vi phạm ipc:

```bash
cat > src/features/alpha/components/Bad.tsx <<'EOF'
import { invokeCommand } from "../../../ipc/client";
export const Bad = () => invokeCommand;
EOF
```

Run lại. Expected: test "only features/*/api may import ipc/" **FAIL**.

Dọn sạch:

```bash
rm -rf src/features/alpha src/features/beta
```

Run lại: cả 3 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/test/architectureBoundaries.test.ts
git commit -m "✅ pin architecture boundaries with a source-scanning test

Lint globs cannot express \"feature a must not import feature b\", so the
cross-feature rule and the ipc/-outside-api rule are pinned by a test that
scans source files instead.

Break experiment: a temporary alpha->beta import failed the first test, and
a temporary ipc/ import in a component failed the second.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `features/tag/api` — ba hook với invalidate của riêng chúng

Tag là feature nhỏ nhất (2 modal, 3 lệnh IPC) nên nó là chỗ chốt mẫu trước khi đụng `BranchSidebar`.

**Files:**
- Create: `src/features/tag/api/useTags.ts`
- Create: `src/features/tag/api/useCreateTag.ts`
- Create: `src/features/tag/api/useDeleteTag.ts`
- Create: `src/features/tag/api/index.ts`
- Test: `src/features/tag/api/useTagMutations.test.ts`

**Interfaces:**
- Consumes: `invokeCommand` từ `src/ipc/client` (đã có từ GĐ4); `qk` từ `src/domain/queryKeys`; type `TagItem` từ `src/ipc/bindings.generated`.
- Produces:
  - `useTags(repoPath: string): UseQueryResult<TagItem[]>`
  - `useCreateTag(repoPath: string): UseMutationResult<void, unknown, CreateTagVars>` với `CreateTagVars = { name: string; targetCommitId: string; message?: string }`
  - `useDeleteTag(repoPath: string): UseMutationResult<void, unknown, DeleteTagVars>` với `DeleteTagVars = { name: string; deleteRemote: boolean }`
  - Task 4 dùng đúng ba tên này.

*Ghi chú vị trí test:* test của `features/*/api` đặt **cạnh code** (`src/features/tag/api/*.test.ts`) chứ không vào `src/test/`, theo đúng tiền lệ `shared/` đã có (`src/shared/ui/Modal.test.tsx`). Test render component vẫn vào `src/test/`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/tag/api/useTagMutations.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useCreateTag, useDeleteTag } from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getTags: vi.fn().mockResolvedValue([]),
    createTag: vi.fn().mockResolvedValue(undefined),
    deleteTag: vi.fn().mockResolvedValue(undefined),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("tag mutation hooks", () => {
  let client: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.spyOn(client, "invalidateQueries");
  });

  it("useCreateTag invalidates the whole repo scope after success", async () => {
    const { result } = renderHook(() => useCreateTag(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "v1.0.0", targetCommitId: "abc123" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("useDeleteTag invalidates the whole repo scope after success", async () => {
    const { result } = renderHook(() => useDeleteTag(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "v1.0.0", deleteRemote: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("does not invalidate when the mutation fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.deleteTag).mockRejectedValueOnce(new Error("tag not found"));

    const { result } = renderHook(() => useDeleteTag(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "missing", deleteRemote: false });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("passes the deleteRemote flag through to ipc", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useDeleteTag(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "v2.0.0", deleteRemote: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeCommand.deleteTag).toHaveBeenCalledWith(REPO, "v2.0.0", true);
  });
});
```

Test thứ ba (`does not invalidate when the mutation fails`) là cái đáng giá nhất — nó ghim rằng invalidate nằm trong `onSuccess` chứ không phải `onSettled`.

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `pnpm vitest run src/features/tag/api/useTagMutations.test.ts`
Expected: FAIL — `Failed to resolve import "./index"` (chưa có file nào).

- [ ] **Step 3: Viết implementation**

`src/features/tag/api/useTags.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Tags of a repository. Disabled while no repository is open. */
export function useTags(repoPath: string) {
  return useQuery({
    queryKey: qk.tags(repoPath),
    queryFn: () => invokeCommand.getTags(repoPath),
    enabled: Boolean(repoPath),
  });
}
```

`src/features/tag/api/useCreateTag.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface CreateTagVars {
  name: string;
  targetCommitId: string;
  /** Present only for annotated tags. */
  message?: string;
}

/**
 * Creates a tag and refreshes the repository.
 *
 * The hook owns invalidation so no call site has to remember it. Every query
 * key is prefixed with ["repo", repoPath], so qk.repo.all covers the tag list,
 * the commit graph and anything else that shows tags.
 */
export function useCreateTag(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: CreateTagVars) =>
      invokeCommand.createTag(repoPath, vars.name, vars.targetCommitId, vars.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}
```

`src/features/tag/api/useDeleteTag.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

export interface DeleteTagVars {
  name: string;
  deleteRemote: boolean;
}

/** Deletes a tag locally, and on the remote when deleteRemote is set. */
export function useDeleteTag(repoPath: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: DeleteTagVars) =>
      invokeCommand.deleteTag(repoPath, vars.name, vars.deleteRemote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    },
  });
}
```

`src/features/tag/api/index.ts`:

```ts
export { useTags } from "./useTags";
export { useCreateTag, type CreateTagVars } from "./useCreateTag";
export { useDeleteTag, type DeleteTagVars } from "./useDeleteTag";
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `pnpm vitest run src/features/tag/api/useTagMutations.test.ts`
Expected: 4 test PASS.

- [ ] **Step 5: Thí nghiệm phá**

Đổi `onSuccess` thành `onSettled` trong `useDeleteTag.ts`.
Run lại. Expected: test "does not invalidate when the mutation fails" **FAIL**.
Hoàn nguyên, xác nhận xanh lại.

Tiếp: đổi `qk.repo.all(repoPath)` thành `qk.tags(repoPath)` trong `useCreateTag.ts`.
Run lại. Expected: test "useCreateTag invalidates the whole repo scope" **FAIL**.
Hoàn nguyên, xác nhận xanh lại.

- [ ] **Step 6: Commit**

```bash
git add src/features/tag/api
git commit -m "✨ add features/tag/api with self-owned cache invalidation

Three hooks wrap the tag IPC commands. Mutations invalidate qk.repo.all in
onSuccess, so call sites no longer have to remember to refresh — this is a
deliberate behavior change from the onSuccess-callback pattern, pinned by
tests that assert the exact invalidated key and that a failed mutation
invalidates nothing.

Break experiment: switching onSuccess to onSettled failed the failure test;
narrowing qk.repo.all to qk.tags failed the scope test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Chuyển hai modal tag sang `features/tag/components`

**Files:**
- Create: `src/features/tag/components/CreateTagModal.tsx` (chuyển từ `src/components/tag/CreateTagModal.tsx`)
- Create: `src/features/tag/components/DeleteTagModal.tsx` (chuyển từ `src/components/tag/DeleteTagModal.tsx`)
- Create: `src/features/tag/index.ts`

**Interfaces:**
- Consumes: `useCreateTag`, `useDeleteTag`, `CreateTagVars`, `DeleteTagVars` từ Task 3.
- Produces: `features/tag` export `CreateTagModal`, `DeleteTagModal`, `CreateTagModalProps`, `DeleteTagModalProps`, `useTags`. **Props giữ nguyên chữ ký cũ** để call site không phải đổi gì ngoài đường import.

- [ ] **Step 1: Copy nguyên trạng và chỉ đổi đường import**

```bash
mkdir -p src/features/tag/components
git mv src/components/tag/CreateTagModal.tsx src/features/tag/components/CreateTagModal.tsx
git mv src/components/tag/DeleteTagModal.tsx src/features/tag/components/DeleteTagModal.tsx
```

Trong cả hai file, đường import lùi thêm một cấp (`../../` → `../../../`):

```ts
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { Modal, Button, Alert } from "../../../shared/ui";
```

Xoá dòng `import { invokeCommand } from "../../ipc/client";` — Step 2 thay nó.

- [ ] **Step 2: Thay lời gọi IPC trực tiếp bằng hook**

Trong `CreateTagModal.tsx`, thêm import:

```ts
import { useCreateTag } from "../api";
```

Thay thân `handleSubmit`. Trước:

```ts
    setLoading(true);
    setError(null);

    try {
      await invokeCommand.createTag(
        repoPath,
        trimmedName,
        targetCommitId,
        isAnnotated ? message : undefined
      );
      useToastStore.getState().showToast({
        message: t.modals.createTag.successToast.replace("{name}", trimmedName),
        type: "success",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    } finally {
      setLoading(false);
    }
```

Sau:

```ts
    setError(null);

    try {
      await createTag.mutateAsync({
        name: trimmedName,
        targetCommitId,
        message: isAnnotated ? message : undefined,
      });
      useToastStore.getState().showToast({
        message: t.modals.createTag.successToast.replace("{name}", trimmedName),
        type: "success",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    }
```

Khai báo hook ngay dưới `const { t } = useTranslation();`:

```ts
  const createTag = useCreateTag(repoPath);
```

Xoá `const [loading, setLoading] = useState(false);` và thay mọi chỗ đọc `loading` bằng `createTag.isPending`. Có 6 chỗ đọc: `disabled={loading}` ở input tên, checkbox annotated, textarea message, nút Cancel; `loading={loading}` ở nút submit; và `{loading ? ... : ...}` trong nhãn nút.

Trong `useEffect` reset khi mở, xoá dòng `setLoading(false);` — React Query tự quản trạng thái đó.

Làm tương tự cho `DeleteTagModal.tsx` với `useDeleteTag`:

```ts
  const deleteTag = useDeleteTag(repoPath);
```

`handleDelete` gọi `await deleteTag.mutateAsync({ name: tagName, deleteRemote });`, bỏ `setLoading`/`finally`, và 4 chỗ đọc `loading` đổi sang `deleteTag.isPending` (checkbox, nút Cancel, nút Delete `loading=`, nhãn nút).

- [ ] **Step 3: Viết `src/features/tag/index.ts`**

```ts
export { CreateTagModal, type CreateTagModalProps } from "./components/CreateTagModal";
export { DeleteTagModal, type DeleteTagModalProps } from "./components/DeleteTagModal";
export { useTags } from "./api";
```

Chỉ export những gì bên ngoài thật sự dùng. `useCreateTag`/`useDeleteTag` **không** export — chúng là nội bộ của feature, hai modal đã bọc rồi.

- [ ] **Step 4: Đổi import ở call site và test**

Hai test file:

```bash
sed -i 's#"../components/tag/CreateTagModal"#"../features/tag"#' src/test/CreateTagModal.test.tsx
sed -i 's#"../components/tag/DeleteTagModal"#"../features/tag"#' src/test/DeleteTagModal.test.tsx
```

Test hiện mock `../ipc/client`. Mock đó **vẫn đúng** vì hook gọi qua `invokeCommand` — không phải sửa.

Nhưng test giờ render component có `useMutation` bên trong, nên cần `QueryClientProvider`. Kiểm tra: `grep -n "QueryClientProvider" src/test/CreateTagModal.test.tsx`. Nếu chưa có, bọc render:

```tsx
const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

render(
  <QueryClientProvider client={client}>
    <CreateTagModal {...props} />
  </QueryClientProvider>
);
```

Đây **không** phải nới lỏng assertion — nó chỉ cung cấp context mà component mới cần. Mọi assertion về hành vi giữ nguyên từng chữ.

`BranchSidebar.tsx` và `CommitGraph.tsx` đổi import:

```ts
import { CreateTagModal, DeleteTagModal } from "../../features/tag";   // BranchSidebar
import { CreateTagModal } from "../../features/tag";                   // CommitGraph
```

- [ ] **Step 5: Biến `components/tag/index.ts` thành re-export**

```ts
/**
 * Compatibility shim: tag UI moved to features/tag.
 * Import from "features/tag" instead. Removed once no call site uses this.
 */
export { CreateTagModal, DeleteTagModal } from "../../features/tag";
export type { CreateTagModalProps, DeleteTagModalProps } from "../../features/tag";
```

- [ ] **Step 6: Chạy toàn bộ xác minh**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```

Expected: tất cả exit 0; số test **≥ 572 + 4** (4 test mới từ Task 3) + 3 (Task 2) = **579**.

Nếu `CreateTagModal.test.tsx` đỏ vì thiếu provider, sửa như Step 4 — không sửa assertion.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "♻️ move tag modals into features/tag

Both modals now call useCreateTag/useDeleteTag instead of invokeCommand, so
their loading state comes from React Query and cache invalidation happens in
the hook. Props keep their previous signatures; call sites only changed the
import path. components/tag/index.ts stays as a re-export shim for now.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Gỡ shim của tag và thu hẹp `invalidateRepo`

**Files:**
- Delete: `src/components/tag/index.ts` (và thư mục rỗng còn lại)
- Modify: `src/components/sidebar/BranchSidebar.tsx`

**Interfaces:**
- Consumes: `features/tag` từ Task 4.
- Produces: `src/components/tag/` biến mất. `invalidateRepo()` trong `BranchSidebar` không còn invalidate `qk.tags`.

- [ ] **Step 1: Xác nhận không còn ai dùng shim**

```bash
grep -rn "components/tag" src e2e
```
Expected: không có kết quả nào ngoài chính `src/components/tag/index.ts`.

Nếu còn: đổi chúng sang `features/tag` trước, rồi quay lại.

- [ ] **Step 2: Xoá shim**

```bash
git rm src/components/tag/index.ts
```

- [ ] **Step 3: Viết test ghim rằng hook lo việc refresh tag**

Thêm vào `src/test/BranchSidebarTags.test.tsx` (file đã tồn tại, phủ tag trong sidebar):

```tsx
  it("refreshes the tag list after a tag is deleted without the sidebar invalidating it", async () => {
    // The tag list refresh is owned by useDeleteTag, not by the sidebar's
    // invalidateRepo. This test fails if that ownership moves back.
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderSidebar();

    // ...open the tag menu and confirm deletion using the file's existing helpers...

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO_PATH) });
    });
  });
```

Đọc các helper sẵn có trong file (`renderSidebar`, tên `REPO_PATH`, cách mở menu tag) và dùng lại đúng chúng thay vì dựng mới — file đó đã có mẫu.

- [ ] **Step 4: Gỡ `qk.tags` khỏi `invalidateRepo`**

Trong `BranchSidebar.tsx`:

```ts
  const invalidateRepo = () => {
    queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
    queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
    queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
    queryClient.invalidateQueries({ queryKey: qk.repo.head(currentRepo.path) });
  };
```

**Chỉ** xoá dòng `qk.tags`. `handleCheckoutTag` và `handlePushTag` vẫn gọi `invalidateRepo()` và vẫn cần làm mới tag — nhưng hai lệnh đó **chưa** có hook riêng, nên chúng phải tự invalidate. Thêm ngay trong hai hàm đó:

```ts
      queryClient.invalidateQueries({ queryKey: qk.tags(currentRepo.path) });
```

Bỏ sót bước này là làm hỏng checkout/push tag. Task 6+ sẽ đưa hai lệnh đó vào `features/tag/api` và xoá dòng thừa.

- [ ] **Step 5: Chạy xác minh**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```
Expected: tất cả xanh.

- [ ] **Step 6: Thí nghiệm phá**

Xoá `onSuccess` trong `useDeleteTag.ts`.
Run: `pnpm vitest run src/test/BranchSidebarTags.test.tsx`
Expected: test mới ở Step 3 **FAIL** — chứng minh sidebar thật sự không còn tự làm việc đó.
Hoàn nguyên.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "🔥 drop the tag compatibility shim and narrow invalidateRepo

Nothing imports components/tag any more, so the shim is gone. invalidateRepo
no longer refreshes tags, because useCreateTag/useDeleteTag now own that.
checkoutTag and pushTag still invalidate the tag list themselves — they have
no feature hook yet.

Break experiment: removing onSuccess from useDeleteTag failed the new
sidebar test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Tách logic cây nhánh ra `features/branch/model`

Bắt đầu feature branch từ phần **không có UI** — logic thuần, test không cần render.

**Files:**
- Create: `src/features/branch/model/branchTree.ts`
- Test: `src/test/branchTree.test.ts`
- Modify: `src/components/sidebar/BranchSidebar.tsx` (import thay vì tự định nghĩa)

**Interfaces:**
- Consumes: type `BranchItem` từ `src/ipc/bindings.generated`.
- Produces:
  - `interface BranchTreeNode { isFolder: boolean; name: string; fullPath: string; branch?: BranchItem; children: BranchTreeNode[] }`
  - `buildBranchTree(branches: BranchItem[]): BranchTreeNode[]`
  - `countBranchesInNode(node: BranchTreeNode): number`
  - Task 9 và 10 dùng đúng ba tên này.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/test/branchTree.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildBranchTree, countBranchesInNode } from "../features/branch/model/branchTree";
import { type BranchItem } from "../ipc/bindings.generated";

function branch(name: string, isHead = false): BranchItem {
  return {
    name,
    is_head: isHead,
    target_commit_id: "abc1234",
    upstream: null,
    ahead: 0,
    behind: 0,
  };
}

describe("buildBranchTree", () => {
  it("keeps a flat branch at the root", () => {
    const tree = buildBranchTree([branch("main")]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.isFolder).toBe(false);
    expect(tree[0]!.name).toBe("main");
    expect(tree[0]!.fullPath).toBe("main");
  });

  it("nests a slash-separated branch under a folder", () => {
    const tree = buildBranchTree([branch("feature/login")]);

    expect(tree).toHaveLength(1);
    const folder = tree[0]!;
    expect(folder.isFolder).toBe(true);
    expect(folder.name).toBe("feature");
    expect(folder.children).toHaveLength(1);
    expect(folder.children[0]!.name).toBe("login");
    // The leaf keeps the full branch name, which is what checkout needs.
    expect(folder.children[0]!.fullPath).toBe("feature/login");
  });

  it("groups branches that share a folder prefix", () => {
    const tree = buildBranchTree([branch("feature/a"), branch("feature/b")]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.children.map((c) => c.name)).toEqual(["a", "b"]);
  });

  it("builds nested folders for multi-level names", () => {
    const tree = buildBranchTree([branch("team/web/login")]);

    const team = tree[0]!;
    expect(team.name).toBe("team");
    const web = team.children[0]!;
    expect(web.isFolder).toBe(true);
    expect(web.name).toBe("web");
    expect(web.fullPath).toBe("team/web");
    expect(web.children[0]!.fullPath).toBe("team/web/login");
  });

  it("returns an empty tree for no branches", () => {
    expect(buildBranchTree([])).toEqual([]);
  });
});

describe("countBranchesInNode", () => {
  it("counts a leaf as one", () => {
    const tree = buildBranchTree([branch("main")]);
    expect(countBranchesInNode(tree[0]!)).toBe(1);
  });

  it("counts every leaf beneath a folder", () => {
    const tree = buildBranchTree([branch("feature/a"), branch("feature/b")]);
    expect(countBranchesInNode(tree[0]!)).toBe(2);
  });

  it("counts across nested folders", () => {
    const tree = buildBranchTree([branch("team/web/a"), branch("team/api/b"), branch("team/api/c")]);
    expect(countBranchesInNode(tree[0]!)).toBe(3);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `pnpm vitest run src/test/branchTree.test.ts`
Expected: FAIL — `Failed to resolve import ".../features/branch/model/branchTree"`.

- [ ] **Step 3: Chuyển code sang file mới**

Tạo `src/features/branch/model/branchTree.ts`. Copy **nguyên văn** `BranchTreeNode`, `buildBranchTree`, `countBranchesInNode` từ `src/components/sidebar/BranchSidebar.tsx:52-119`. Không sửa logic — đây là move thuần.

Thêm đầu file:

```ts
/**
 * Turns the flat branch list from git into the folder tree the sidebar shows.
 * Branch names use "/" as a separator, so "feature/login" becomes a "feature"
 * folder holding a "login" leaf. Pure logic: no React, no IPC.
 */
import { type BranchItem } from "../../../ipc/bindings.generated";
```

Xuất cả ba: `export interface BranchTreeNode`, `export function buildBranchTree`, `export function countBranchesInNode`.

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `pnpm vitest run src/test/branchTree.test.ts`
Expected: 8 test PASS.

- [ ] **Step 5: Bỏ bản cũ trong `BranchSidebar.tsx`**

Xoá định nghĩa `BranchTreeNode`, `buildBranchTree`, `countBranchesInNode` (dòng ~52–119) và thay bằng import:

```ts
import {
  buildBranchTree,
  countBranchesInNode,
  type BranchTreeNode,
} from "../../features/branch/model/branchTree";
```

**Cẩn thận:** `buildBranchTree` và `countBranchesInNode` đang được `export` từ `BranchSidebar.tsx`. Kiểm tra ai đang import chúng:

```bash
grep -rn "buildBranchTree\|countBranchesInNode" src e2e
```

Nếu có test import từ `BranchSidebar`, đổi chúng sang đường mới. Nếu không ai dùng, bỏ `export` đi luôn.

- [ ] **Step 6: Thí nghiệm phá**

Trong `branchTree.ts`, đổi `if (!node.isFolder) return 1;` thành `return 0;`.
Run: `pnpm vitest run src/test/branchTree.test.ts`
Expected: cả 3 test của `countBranchesInNode` **FAIL**.
Hoàn nguyên.

Tiếp: đổi `currentPath ? \`${currentPath}/${part}\` : part` thành `part`.
Run lại. Expected: test "builds nested folders for multi-level names" **FAIL** ở assertion `web.fullPath`.
Hoàn nguyên.

- [ ] **Step 7: Xác minh và commit**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-comment-language
```

```bash
git add -A
git commit -m "♻️ extract the branch tree builder into features/branch/model

buildBranchTree and countBranchesInNode leave BranchSidebar for a pure module
with no React or IPC, so the tree logic is testable without rendering. Eight
tests cover flat names, folder grouping and nested folders.

Break experiment: making countBranchesInNode return 0 for leaves failed its
three tests; dropping the path prefix failed the nested-folder test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Union trạng thái dialog thay 12 cờ rời rạc

**Files:**
- Create: `src/features/branch/model/sidebarDialog.ts`
- Test: `src/test/sidebarDialog.test.ts`

**Interfaces:**
- Consumes: `TagItem`, `RemoteItem` từ `src/ipc/bindings.generated`.
- Produces:
  - `type SidebarDialog` — union có `kind: "none" | "createBranch" | "renameBranch" | "deleteBranch" | "createTag" | "deleteTag" | "merge" | "rebase" | "compare" | "checkoutConflict" | "manageRemotes" | "addRemote" | "editRemote" | "deleteRemote" | "pruneRemote"`
  - `const NO_DIALOG: SidebarDialog`
  - `isDialog<K>(dialog, kind)` — type guard thu hẹp union
  - Task 10 dùng đúng các tên này.

*Ghi chú:* union bao cả nhánh remote vì `BranchSidebar` hiện quản lý chúng. Feature `remote` sẽ tách ở kế hoạch sau; tới lúc đó các nhánh remote rời khỏi union này.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/test/sidebarDialog.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { NO_DIALOG, isDialog, type SidebarDialog } from "../features/branch/model/sidebarDialog";
import { type TagItem } from "../ipc/bindings.generated";

describe("SidebarDialog", () => {
  it("starts closed", () => {
    expect(NO_DIALOG.kind).toBe("none");
  });

  it("isDialog narrows to the matching variant", () => {
    const dialog: SidebarDialog = { kind: "renameBranch", name: "feature/login" };

    expect(isDialog(dialog, "renameBranch")).toBe(true);
    if (isDialog(dialog, "renameBranch")) {
      // Compiles only because the guard narrowed the union.
      expect(dialog.name).toBe("feature/login");
    }
  });

  it("isDialog rejects a different variant", () => {
    const dialog: SidebarDialog = { kind: "deleteBranch", name: "old" };
    expect(isDialog(dialog, "renameBranch")).toBe(false);
  });

  it("carries the payload each dialog needs", () => {
    const merge: SidebarDialog = { kind: "merge", targetBranch: "develop" };
    const compare: SidebarDialog = { kind: "compare", baseRev: "main", targetRev: "feature" };
    const conflict: SidebarDialog = {
      kind: "checkoutConflict",
      targetBranch: "main",
      errorMessage: "CHECKOUT_CONFLICT",
    };

    expect(isDialog(merge, "merge") && merge.targetBranch).toBe("develop");
    expect(isDialog(compare, "compare") && compare.baseRev).toBe("main");
    expect(isDialog(conflict, "checkoutConflict") && conflict.errorMessage).toBe(
      "CHECKOUT_CONFLICT"
    );
  });

  it("replacing the dialog closes the previous one", () => {
    // The sidebar held one useState per dialog, so two could be open at once.
    // With a single union-typed slot, opening one necessarily closes the
    // other — this is the invariant that replaces the old flag juggling.
    let dialog: SidebarDialog = { kind: "createTag", commitId: "abc123" };
    expect(isDialog(dialog, "createTag")).toBe(true);

    dialog = { kind: "deleteTag", tag: { name: "v1" } as TagItem };

    expect(isDialog(dialog, "createTag")).toBe(false);
    expect(isDialog(dialog, "deleteTag")).toBe(true);
  });

  it("returns to the closed state", () => {
    let dialog: SidebarDialog = { kind: "merge", targetBranch: "develop" };
    dialog = NO_DIALOG;
    expect(isDialog(dialog, "merge")).toBe(false);
    expect(dialog.kind).toBe("none");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `pnpm vitest run src/test/sidebarDialog.test.ts`
Expected: FAIL — không resolve được import.

- [ ] **Step 3: Viết implementation**

```ts
/**
 * Every dialog the branch sidebar can open, as one discriminated union.
 *
 * The sidebar used twelve independent useState flags for this, which allowed
 * meaningless states such as two dialogs open at once. A union makes those
 * states unrepresentable: a value has exactly one kind, and each kind carries
 * exactly the payload its dialog needs.
 *
 * Adding a dialog means adding one branch here — TypeScript then forces every
 * exhaustive switch to handle it.
 */
import { type TagItem, type RemoteItem } from "../../../ipc/bindings.generated";

export type SidebarDialog =
  | { kind: "none" }
  | { kind: "createBranch"; fromRef: string | null }
  | { kind: "renameBranch"; name: string }
  | { kind: "deleteBranch"; name: string }
  | { kind: "createTag"; commitId: string; summary?: string }
  | { kind: "deleteTag"; tag: TagItem }
  | { kind: "merge"; targetBranch: string }
  | { kind: "rebase"; upstreamBranch: string }
  | { kind: "compare"; baseRev: string; targetRev: string }
  | { kind: "checkoutConflict"; targetBranch: string; errorMessage: string }
  | { kind: "manageRemotes" }
  | { kind: "addRemote" }
  | { kind: "editRemote"; remote: RemoteItem }
  | { kind: "deleteRemote"; remote: RemoteItem }
  | { kind: "pruneRemote"; remoteName: string };

/** The closed state. Shared so call sites don't re-spell the literal. */
export const NO_DIALOG: SidebarDialog = { kind: "none" };

/** Narrows a dialog to one variant, for use in render guards. */
export function isDialog<K extends SidebarDialog["kind"]>(
  dialog: SidebarDialog,
  kind: K
): dialog is Extract<SidebarDialog, { kind: K }> {
  return dialog.kind === kind;
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `pnpm vitest run src/test/sidebarDialog.test.ts`
Expected: 6 test PASS.

- [ ] **Step 5: Thí nghiệm phá**

Đổi thân `isDialog` thành `return true;`.
Run lại. Expected: **FAIL** ở "isDialog rejects a different variant", "replacing the dialog closes the previous one", và "returns to the closed state".
Hoàn nguyên, xác nhận xanh lại.

- [ ] **Step 6: Xác minh và commit**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-comment-language
```

```bash
git add -A
git commit -m "✨ model sidebar dialogs as one discriminated union

Twelve independent useState flags allowed two dialogs to be open at once. The
union makes that unrepresentable and gives each dialog exactly the payload it
needs. Task 10 wires the sidebar to it.

Break experiment: making isDialog always return true failed two tests.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `features/branch/api`

**Files:**
- Create: `src/features/branch/api/useBranches.ts`
- Create: `src/features/branch/api/useBranchMutations.ts`
- Create: `src/features/branch/api/index.ts`
- Test: `src/features/branch/api/useBranchMutations.test.ts`

**Interfaces:**
- Consumes: `invokeCommand`, `qk`, type `BranchListResult` từ `src/ipc/bindings.generated`.
- Produces:
  - `useBranches(repoPath): UseQueryResult<BranchListResult>`
  - `useCheckoutBranch(repoPath)` — vars `{ name: string }`
  - `useCreateBranch(repoPath)` — vars `{ name: string; targetCommit?: string | null; checkout?: boolean }`
  - `useRenameBranch(repoPath)` — vars `{ oldName: string; newName: string }`
  - `useDeleteBranch(repoPath)` — vars `{ name: string; force?: boolean }`, **resolve ra `string`** (undo token)
  - Task 9 và 10 dùng đúng các tên này.

> **`deleteBranch` trả về undo token, không phải `void`.** `invokeCommand.deleteBranch` có kiểu `Promise<string>` và `UndoIntegration.test.tsx` phụ thuộc vào giá trị đó để dựng toast hoàn tác. `mutationFn` phải **return** kết quả, không được nuốt. Ba hook kia trả `void`.

*Trước khi viết:* xác nhận chữ ký thật của các lệnh IPC — **không đoán**:
```bash
grep -n "checkoutBranch\|createBranch\|renameBranch\|deleteBranch\|getBranches" src/ipc/branch.ts src/ipc/repo.ts
```
Nếu chữ ký khác với bên dưới, sửa `mutationFn` cho khớp thực tế và ghi lại sai khác.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/branch/api/useBranchMutations.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useCheckoutBranch, useCreateBranch, useDeleteBranch, useRenameBranch } from "./index";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getBranches: vi.fn().mockResolvedValue({
      current_branch: "main",
      is_detached: false,
      local: [],
      remote: [],
      tags: [],
    }),
    checkoutBranch: vi.fn().mockResolvedValue(undefined),
    createBranch: vi.fn().mockResolvedValue(undefined),
    renameBranch: vi.fn().mockResolvedValue(undefined),
    deleteBranch: vi.fn().mockResolvedValue(undefined),
  },
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("branch mutation hooks", () => {
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
    ["useCheckoutBranch", useCheckoutBranch, { name: "develop" }],
    ["useCreateBranch", useCreateBranch, { name: "feature/x" }],
    ["useRenameBranch", useRenameBranch, { oldName: "a", newName: "b" }],
    ["useDeleteBranch", useDeleteBranch, { name: "old" }],
  ] as const)("%s invalidates the whole repo scope after success", async (_label, hook, vars) => {
    const { result } = renderHook(() => hook(REPO), { wrapper: makeWrapper(client) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.mutate(vars as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
  });

  it("useCheckoutBranch does not invalidate when checkout fails", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.checkoutBranch).mockRejectedValueOnce(new Error("CHECKOUT_CONFLICT"));

    const { result } = renderHook(() => useCheckoutBranch(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "develop" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("useCheckoutBranch surfaces the original error so conflict detection still works", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.checkoutBranch).mockRejectedValueOnce(new Error("CHECKOUT_CONFLICT"));

    const { result } = renderHook(() => useCheckoutBranch(REPO), { wrapper: makeWrapper(client) });
    result.current.mutate({ name: "develop" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain("CHECKOUT_CONFLICT");
  });

  it("useDeleteBranch forwards the force flag", async () => {
    const { invokeCommand } = await import("../../../ipc/client");
    const { result } = renderHook(() => useDeleteBranch(REPO), { wrapper: makeWrapper(client) });

    result.current.mutate({ name: "old", force: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeCommand.deleteBranch).toHaveBeenCalledWith(REPO, "old", true);
  });

  it("useDeleteBranch resolves with the undo token", async () => {
    // delete_branch returns a token the undo toast needs. A mutationFn that
    // forgets to return it still type-checks and still passes every other
    // test here, so this assertion is the only thing guarding it.
    const { invokeCommand } = await import("../../../ipc/client");
    vi.mocked(invokeCommand.deleteBranch).mockResolvedValueOnce("undo-token-123");

    const { result } = renderHook(() => useDeleteBranch(REPO), { wrapper: makeWrapper(client) });
    const token = await result.current.mutateAsync({ name: "old" });

    expect(token).toBe("undo-token-123");
  });
});
```

Test "surfaces the original error" rất quan trọng: `BranchSidebar.handleCheckout` phân biệt xung đột bằng cách đọc `msg.includes("CHECKOUT_CONFLICT")`. Nếu hook bọc lỗi lại, tính năng phát hiện xung đột chết âm thầm.

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `pnpm vitest run src/features/branch/api/useBranchMutations.test.ts`
Expected: FAIL — không resolve được `./index`.

- [ ] **Step 3: Viết implementation**

`src/features/branch/api/useBranches.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Local and remote branches of a repository. */
export function useBranches(repoPath: string) {
  return useQuery({
    queryKey: qk.branches(repoPath),
    queryFn: () => invokeCommand.getBranches(repoPath),
    enabled: Boolean(repoPath),
  });
}
```

`src/features/branch/api/useBranchMutations.ts`:

```ts
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/**
 * Every branch mutation refreshes the same scope: a branch change moves HEAD,
 * the commit graph and the working tree status all at once. qk.repo.all covers
 * them because every key is prefixed with ["repo", repoPath].
 *
 * Errors are deliberately NOT wrapped — callers read the message to tell a
 * checkout conflict apart from other failures.
 */
function invalidateRepoScope(queryClient: QueryClient, repoPath: string) {
  queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
}

export interface CheckoutBranchVars {
  name: string;
}

export function useCheckoutBranch(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: CheckoutBranchVars) => invokeCommand.checkoutBranch(repoPath, vars.name),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

export interface CreateBranchVars {
  name: string;
  targetCommit?: string | null;
  checkout?: boolean;
}

export function useCreateBranch(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: CreateBranchVars) =>
      invokeCommand.createBranch(repoPath, vars.name, vars.targetCommit, vars.checkout),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

export interface RenameBranchVars {
  oldName: string;
  newName: string;
}

export function useRenameBranch(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: RenameBranchVars) =>
      invokeCommand.renameBranch(repoPath, vars.oldName, vars.newName),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}

export interface DeleteBranchVars {
  name: string;
  force?: boolean;
}

/**
 * Deletes a branch and resolves with the undo token the backend returns.
 * The token must be passed through — the undo toast is built from it.
 */
export function useDeleteBranch(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<string, unknown, DeleteBranchVars>({
    mutationFn: (vars) => invokeCommand.deleteBranch(repoPath, vars.name, vars.force),
    onSuccess: () => invalidateRepoScope(queryClient, repoPath),
  });
}
```

`src/features/branch/api/index.ts`:

```ts
export { useBranches } from "./useBranches";
export {
  useCheckoutBranch,
  useCreateBranch,
  useRenameBranch,
  useDeleteBranch,
  type CheckoutBranchVars,
  type CreateBranchVars,
  type RenameBranchVars,
  type DeleteBranchVars,
} from "./useBranchMutations";
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `pnpm vitest run src/features/branch/api/useBranchMutations.test.ts`
Expected: 8 test PASS (4 từ `it.each` + 4 test riêng).

- [ ] **Step 5: Thí nghiệm phá**

Trong `useCheckoutBranch`, bọc lỗi lại:
```ts
    mutationFn: async (vars: CheckoutBranchVars) => {
      try {
        return await invokeCommand.checkoutBranch(repoPath, vars.name);
      } catch {
        throw new Error("checkout failed");
      }
    },
```
Run lại. Expected: test "surfaces the original error" **FAIL**.
Hoàn nguyên, xác nhận xanh.

- [ ] **Step 6: Xác minh và commit**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```

```bash
git add -A
git commit -m "✨ add features/branch/api

Four mutation hooks plus the branch query, all invalidating qk.repo.all on
success. Errors pass through unwrapped so the sidebar can still recognise a
CHECKOUT_CONFLICT by message.

Break experiment: wrapping the checkout error failed the pass-through test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Chuyển bốn modal branch sang `features/branch/components`

**Files:**
- Create: `src/features/branch/components/CreateBranchModal.tsx` (từ `components/sidebar/`)
- Create: `src/features/branch/components/RenameBranchModal.tsx` (từ `components/sidebar/`)
- Create: `src/features/branch/components/DeleteBranchModal.tsx` (từ `components/sidebar/`)
- Create: `src/features/branch/components/CheckoutConflictModal.tsx` (từ `components/sidebar/`)
- Create: `src/features/branch/index.ts`
- Modify: `src/App.tsx`, `src/components/graph/CommitGraph.tsx`, `src/components/sidebar/BranchSidebar.tsx`
- Modify: 5 test file trỏ vào đường cũ

**Interfaces:**
- Consumes: hook từ Task 8.
- Produces: `features/branch` export bốn modal + props type + `useBranches`. **Props giữ nguyên chữ ký cũ.**

- [ ] **Step 1: Đọc bốn modal trước khi đụng vào**

```bash
sed -n '1,40p' src/components/sidebar/CreateBranchModal.tsx
sed -n '1,40p' src/components/sidebar/RenameBranchModal.tsx
sed -n '1,40p' src/components/sidebar/DeleteBranchModal.tsx
sed -n '1,40p' src/components/sidebar/CheckoutConflictModal.tsx
```

Ghi lại với mỗi file: nó gọi lệnh `invokeCommand` nào, có prop `onSuccess` không, quản `loading` ra sao. `DeleteBranchModal` có dính `UndoIntegration.test.tsx` nên đặc biệt cẩn thận với luồng undo token.

**`RenameBranchModal` cần chú ý riêng:** GĐ2 ghi nhận nó có latch `focus()` + `select()` chạy **một lần mỗi lần mở**. Đừng động vào logic đó. Nếu vô tình đổi, test `RenameBranchModal.test.tsx` sẽ bắt được.

- [ ] **Step 2: Di chuyển file**

```bash
mkdir -p src/features/branch/components
git mv src/components/sidebar/CreateBranchModal.tsx src/features/branch/components/CreateBranchModal.tsx
git mv src/components/sidebar/RenameBranchModal.tsx src/features/branch/components/RenameBranchModal.tsx
git mv src/components/sidebar/DeleteBranchModal.tsx src/features/branch/components/DeleteBranchModal.tsx
git mv src/components/sidebar/CheckoutConflictModal.tsx src/features/branch/components/CheckoutConflictModal.tsx
```

Trong cả bốn, đường import lùi thêm một cấp: `../../i18n` → `../../../i18n`, `../../shared/ui` → `../../../shared/ui`, v.v.

- [ ] **Step 3: Thay IPC trực tiếp bằng hook, từng file một**

Mẫu áp dụng cho cả bốn file. Lấy `CreateBranchModal` làm ví dụ đầy đủ.

Xoá dòng `import { invokeCommand } from "../../ipc/client";`, thêm:

```ts
import { useCreateBranch } from "../api";
```

Khai báo hook ngay dưới `const { t } = useTranslation();`:

```ts
  const createBranch = useCreateBranch(repoPath);
```

Xoá `const [loading, setLoading] = useState(false);`.

Thân handler, trước:

```ts
    setLoading(true);
    setError(null);
    try {
      await invokeCommand.createBranch(repoPath, trimmedName, targetCommit, checkout);
      useToastStore.getState().showToast({ message: ..., type: "success" });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    } finally {
      setLoading(false);
    }
```

Sau:

```ts
    setError(null);
    try {
      await createBranch.mutateAsync({ name: trimmedName, targetCommit, checkout });
      useToastStore.getState().showToast({ message: ..., type: "success" });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    }
```

Chuỗi toast và nhánh `setError` giữ **nguyên văn** như bản gốc — chép lại từ file, đừng viết lại.

Mọi chỗ đọc `loading` đổi sang `createBranch.isPending`: `disabled={loading}` ở các input và nút Cancel, `loading={loading}` ở nút submit, và `{loading ? ... : ...}` trong nhãn nút. Trong `useEffect` reset khi mở, xoá dòng `setLoading(false);`.

Ba file còn lại dùng hook tương ứng, các bước y hệt:

| File | Hook | Vars truyền vào `mutateAsync` |
| --- | --- | --- |
| `RenameBranchModal` | `useRenameBranch` | `{ oldName, newName: trimmedName }` |
| `DeleteBranchModal` | `useDeleteBranch` | `{ name: branchName, force }` |
| `CheckoutConflictModal` | `useCheckoutBranch` + `invokeCommand.saveStash` | xem ghi chú dưới |

**Giữ nguyên** toast, `mapGitError`, `setError`, `onSuccess`, `onClose` ở cả bốn file.

**`CheckoutConflictModal` là ngoại lệ — đọc kỹ.** Nó gọi **hai** lệnh theo thứ tự: `invokeCommand.saveStash(...)` rồi `invokeCommand.checkoutBranch(repoPath, targetBranch)`. `saveStash` thuộc domain **stash**, mà kế hoạch này **không** dựng `features/stash`.

Xử lý:

- `checkoutBranch` → đổi sang `useCheckoutBranch` như các modal khác.
- `saveStash` → **giữ nguyên `invokeCommand.saveStash`** trong file, kèm comment giải thích. Đây là vi phạm quy tắc 4 có chủ đích và có thời hạn, gỡ khi `features/stash` ra đời ở lát sau.

```ts
// Stash has no feature hook yet — features/stash arrives in the next slice.
// Until then this call stays on invokeCommand directly.
import { invokeCommand } from "../../../ipc/client";
```

Thứ tự hai lệnh **phải giữ nguyên**: stash trước, checkout sau. Đảo lại là mất thay đổi chưa commit của người dùng.

Vì file này giữ một import `ipc/`, test `architectureBoundaries.test.ts` ở Task 2 sẽ **đỏ** ("only features/*/api may import ipc/"). Thêm ngoại lệ có tên vào test đó, đừng nới lỏng luật:

```ts
/**
 * Files allowed to import ipc/ outside api/, with the reason and the exit
 * condition. Every entry here is temporary — shrink this list, never grow it.
 */
const IPC_IMPORT_EXCEPTIONS: Record<string, string> = {
  "features/branch/components/CheckoutConflictModal.tsx":
    "calls saveStash; removed once features/stash exists",
};
```

...và trong vòng lặp, bỏ qua file có trong danh sách đó. Báo cho tôi biết nếu cần thêm bất kỳ ngoại lệ nào **ngoài** cái này — đó là dấu hiệu phạm vi đã trượt.

Chạy test của từng modal ngay sau khi sửa xong file đó, trước khi sang file kế:

```bash
pnpm vitest run src/test/CreateBranchModal.test.tsx
pnpm vitest run src/test/RenameBranchModal.test.tsx
pnpm vitest run src/test/DeleteBranchModal.test.tsx src/test/UndoIntegration.test.tsx
pnpm vitest run src/test/CheckoutConflictModal.test.tsx
```

- [ ] **Step 4: Viết `src/features/branch/index.ts`**

```ts
export { CreateBranchModal, type CreateBranchModalProps } from "./components/CreateBranchModal";
export { RenameBranchModal, type RenameBranchModalProps } from "./components/RenameBranchModal";
export { DeleteBranchModal, type DeleteBranchModalProps } from "./components/DeleteBranchModal";
export {
  CheckoutConflictModal,
  type CheckoutConflictModalProps,
} from "./components/CheckoutConflictModal";
export { useBranches } from "./api";
export {
  buildBranchTree,
  countBranchesInNode,
  type BranchTreeNode,
} from "./model/branchTree";
export { NO_DIALOG, isDialog, type SidebarDialog } from "./model/sidebarDialog";
```

Tên props type phải khớp đúng những gì file thật export — kiểm lại từ Step 1, đừng chép mù.

- [ ] **Step 5: Đổi import ở mọi call site**

```bash
grep -rn "sidebar/CreateBranchModal\|sidebar/RenameBranchModal\|sidebar/DeleteBranchModal\|sidebar/CheckoutConflictModal" src e2e
```

Sửa từng chỗ:
- `src/App.tsx`: `import { CreateBranchModal } from "./features/branch";`
- `src/components/graph/CommitGraph.tsx`: `import { CreateBranchModal } from "../../features/branch";`
- `src/components/sidebar/BranchSidebar.tsx`: gom cả bốn về một dòng từ `"../../features/branch"`
- 5 test file trong `src/test/`: trỏ `"../features/branch"`

- [ ] **Step 6: Bọc provider cho test nếu cần**

Modal giờ dùng `useMutation` nên cần `QueryClientProvider`. Chạy từng test, file nào báo `No QueryClient set` thì bọc như Task 4 Step 4. Không đổi assertion.

- [ ] **Step 7: Xác minh đầy đủ**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
```
Expected: tất cả xanh, tổng số test không giảm.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "♻️ move the branch modals into features/branch

Four modals leave components/sidebar for features/branch/components and call
the branch hooks instead of invokeCommand. Props keep their signatures, so
App.tsx, CommitGraph and BranchSidebar only changed import paths.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Xẻ nhỏ `BranchSidebar` và chuyển sang `features/branch`

Task cuối và lớn nhất: 1332 dòng → vỏ dưới 300 dòng. Làm sau cùng vì mọi mảnh nó cần (model, api, modal) đã sẵn sàng.

**Files:**
- Create: `src/features/branch/components/BranchTreeNode.tsx`
- Create: `src/features/branch/components/BranchSidebar.tsx` (từ `components/sidebar/BranchSidebar.tsx`)
- Modify: `src/features/branch/index.ts`, `src/components/Shell.tsx`
- Modify: `src/test/BranchSidebar.test.tsx`, `src/test/BranchSidebarTags.test.tsx`
- Delete: `src/components/sidebar/BranchSidebar.tsx`

**Interfaces:**
- Consumes: mọi thứ từ Task 6–9.
- Produces: `features/branch` export `BranchSidebar`. `src/components/sidebar/` chỉ còn `PullRequestsSection.tsx`.

- [ ] **Step 1: Ghim hành vi hiện tại trước khi xẻ**

Trước khi di chuyển một dòng nào, đếm xem test hiện có phủ tới đâu — quy ước 8b: test phủ business logic không có nghĩa là an toàn để migrate.

```bash
grep -c "it(" src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx
grep -n "contextmenu\|MoreVertical\|Menu thao tác" src/test/BranchSidebar.test.tsx
```

Nếu **không** có test nào chạm vào menu ngữ cảnh của nhánh (mở menu, chọn checkout/merge/rebase/rename/delete), viết chúng **trước** trên code hiện tại và xác nhận xanh. Ít nhất ba test:

```tsx
  it("opens the branch action menu from the three-dots button", async () => {
    renderSidebar();
    const menuButton = await screen.findByLabelText("Menu thao tác nhánh develop");
    await userEvent.click(menuButton);
    expect(screen.getByText(/checkout/i)).toBeInTheDocument();
  });

  it("closes the open menu when Escape is pressed", async () => {
    renderSidebar();
    await userEvent.click(await screen.findByLabelText("Menu thao tác nhánh develop"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText(/checkout/i)).not.toBeInTheDocument();
  });

  it("opens only one menu at a time", async () => {
    renderSidebar();
    await userEvent.click(await screen.findByLabelText("Menu thao tác nhánh develop"));
    await userEvent.click(await screen.findByLabelText("Menu thao tác nhánh main"));
    expect(screen.getAllByText(/checkout/i)).toHaveLength(1);
  });
```

Dùng đúng tên nhánh có trong fixture của file. Ba test này là lưới an toàn cho việc xẻ — không có chúng thì không biết bản tách có giữ hành vi hay không.

- [ ] **Step 2: Chạy lưới an toàn trên code gốc, xác nhận xanh**

Run: `pnpm vitest run src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx`
Expected: PASS hết. Đây là mốc — sau khi xẻ, **chính những test này, không sửa một chữ**, phải vẫn xanh.

Commit riêng lưới an toàn:

```bash
git add src/test/BranchSidebar.test.tsx
git commit -m "✅ cover the branch context menu before splitting the sidebar

These pin menu open/close behaviour on the current implementation so the
split that follows is provably behaviour-preserving.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Tách `BranchTreeNode.tsx`**

Chuyển `renderTreeNode` (dòng ~377–565 của bản gốc) thành component riêng.

```tsx
/**
 * One node of the branch tree: either a collapsible folder or a branch row
 * with its context menu. Purely presentational — every action arrives as a
 * callback so the sidebar keeps ownership of dialog state.
 */
import React from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Folder, MoreVertical, Check, GitMerge, GitCommit, GitCompare, Edit3, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { countBranchesInNode, type BranchTreeNode as TreeNode } from "../model/branchTree";

export interface BranchTreeNodeProps {
  node: TreeNode;
  isSearching: boolean;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  openMenuBranch: string | null;
  onOpenMenu: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentBranchName: string;
  onCheckout: (name: string) => void;
  onMerge: (name: string) => void;
  onRebase: (name: string) => void;
  onCompare: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: (name: string) => void;
}

export const BranchTreeNode: React.FC<BranchTreeNodeProps> = ({ node, ...props }) => {
  // Move the body of renderTreeNode here verbatim, replacing the closed-over
  // variables with the props above. Recursive children render <BranchTreeNode>.
};
```

Chuyển thân hàm **nguyên văn**, chỉ thay biến đóng (`search`, `selectedBranch`, `menuBranch`, `handleCheckout`...) bằng prop tương ứng. Lời gọi đệ quy `renderTreeNode(child)` thành `<BranchTreeNode key={...} node={child} {...props} />`.

Sau bước này chạy ngay: `pnpm vitest run src/test/BranchSidebar.test.tsx` — phải xanh **không sửa test**.

- [ ] **Step 4: Chuyển `BranchSidebar.tsx` sang feature và nối union**

```bash
git mv src/components/sidebar/BranchSidebar.tsx src/features/branch/components/BranchSidebar.tsx
```

Sửa trong file mới:

1. Đường import lùi một cấp; model/api/modal import qua đường tương đối nội bộ (`../model/branchTree`, `../api`, `./CreateBranchModal`) — **không** qua `../index` để tránh vòng lặp.
2. Thay 12 `useState` modal bằng một:
   ```ts
   const [dialog, setDialog] = useState<SidebarDialog>(NO_DIALOG);
   const closeDialog = () => setDialog(NO_DIALOG);
   ```
   Xoá: `isCreateOpen`, `createBranchTarget`, `createTagModalOpen`, `createTagTarget`, `deleteTagItem`, `renameBranchName`, `deleteBranchName`, `mergeModal`, `rebaseModal`, `compareModal`, `conflictInfo`, `manageRemotesOpen`, `addRemoteOpen`, `pruneTargetRemote`, `editTargetRemote`, `deleteTargetRemote`.
3. Mỗi chỗ mở modal đổi sang `setDialog({ kind: "...", ... })`; mỗi chỗ render đổi sang `isDialog(dialog, "...")`:
   ```tsx
   {isDialog(dialog, "renameBranch") && (
     <RenameBranchModal
       isOpen
       onClose={closeDialog}
       repoPath={currentRepo.path}
       currentName={dialog.name}
       onSuccess={closeDialog}
     />
   )}
   ```
4. `useQuery` thủ công cho branches đổi sang `useBranches(currentRepo?.path ?? "")`.
5. `handleCheckout` dùng `useCheckoutBranch`, **giữ nguyên** logic bắt `CHECKOUT_CONFLICT`:
   ```ts
   const checkoutBranch = useCheckoutBranch(currentRepo?.path ?? "");

   const handleCheckout = async (branchName: string) => {
     setActiveMenu(null);
     try {
       await checkoutBranch.mutateAsync({ name: branchName });
       setSelectedBranch(branchName);
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : String(err);
       if (msg.includes("CHECKOUT_CONFLICT") || msg.toLowerCase().includes("conflict")) {
         setDialog({ kind: "checkoutConflict", targetBranch: branchName, errorMessage: msg });
       } else {
         alert(`Không thể chuyển nhánh: ${msg}`);
       }
     }
   };
   ```
   `invalidateRepo()` biến mất khỏi đây — hook lo rồi.
6. `renderTreeNode` đổi thành `<BranchTreeNode ... />`.

- [ ] **Step 5: Chạy lưới an toàn — không sửa test**

Run: `pnpm vitest run src/test/BranchSidebar.test.tsx src/test/BranchSidebarTags.test.tsx`

Chỉ được sửa **đường import** và thêm `QueryClientProvider` nếu thiếu. Nếu một assertion hành vi đỏ, đó là **bug do xẻ**, không phải test sai — sửa code, đừng sửa test (quy ước 4).

- [ ] **Step 6: Cập nhật `index.ts` và `Shell.tsx`**

Thêm vào `src/features/branch/index.ts`:
```ts
export { BranchSidebar } from "./components/BranchSidebar";
```

`src/components/Shell.tsx`:
```ts
import { BranchSidebar } from "../features/branch";
```

Kiểm tra `src/components/pullrequests/index.ts` còn trỏ đúng `../sidebar/PullRequestsSection` (file đó ở lại `components/`, chưa migrate).

- [ ] **Step 7: Kiểm số dòng và warning độ phức tạp**

```bash
wc -l src/features/branch/components/*.tsx
pnpm lint 2>&1 | grep "features/branch"
```

Mục tiêu: `BranchSidebar.tsx` dưới 300 dòng. Nếu còn vượt, tách tiếp phần còn to nhất — nhiều khả năng là `renderRemoteTreeNode` (nhánh remote) hoặc khối stash. Tách theo **ranh giới trách nhiệm**, không cắt cho đủ số dòng (đúng tinh thần GĐ4 khi xẻ `repo.ts`).

Ghi lại số warning `features/branch` trước/sau để cập nhật status doc.

- [ ] **Step 8: Xác minh đầy đủ**

```bash
pnpm lint && pnpm build && pnpm test && pnpm check-query-keys && pnpm check-comment-language
pnpm vitest run src/test/architectureBoundaries.test.ts
```

Expected: tất cả xanh. Test ranh giới giờ có việc thật: nó khẳng định `features/branch` không import `features/tag` và chỉ `api/` chạm `ipc/`.

- [ ] **Step 9: Thí nghiệm phá trên test ranh giới**

Thêm tạm vào `src/features/branch/components/BranchSidebar.tsx`:
```ts
import { useTags } from "../../tag";
```
Run: `pnpm vitest run src/test/architectureBoundaries.test.ts`
Expected: **FAIL** — `features/branch/... imports feature "tag"`.

Đây là tình huống thật sẽ gặp: `BranchSidebar` render modal tag. Cách đúng là **nhận chúng qua props từ `Shell`**, hoặc đẩy phần dùng chung xuống `shared/`. Ghi lại lựa chọn đã dùng trong commit message.

Hoàn nguyên và xác nhận xanh.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "♻️ split BranchSidebar and move it into features/branch

The 1332-line component becomes a shell under 300 lines plus BranchTreeNode.
Twelve modal useState flags collapse into one SidebarDialog union, branch
queries and mutations come from features/branch/api, and invalidateRepo is
gone because the hooks own invalidation.

The context-menu safety net committed beforehand still passes unchanged,
which is the evidence that the split preserved behaviour.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Cập nhật tài liệu tình trạng

**Files:**
- Modify: `docs/superpowers/REFACTOR_STATUS.md`

- [ ] **Step 1: Đo số liệu thật, không ước lượng**

```bash
pnpm test 2>&1 | grep -E "Test Files|Tests"
wc -l src/features/branch/components/BranchSidebar.tsx
grep -c "useState" src/features/branch/components/BranchSidebar.tsx
pnpm lint 2>&1 | grep -c "warning"
grep -rln "invokeCommand" src/components | wc -l
```

- [ ] **Step 2: Cập nhật status doc**

Sửa các mục:
- Header: `Tiến độ`, `Việc tiếp theo` → "Giai đoạn 5 (lát 2): remote → changes"
- Mục 3: thêm phần "Giai đoạn 5 (lát 1)" theo văn phong các giai đoạn trước — gồm cả những lỗi thật phát hiện được và quyết định đáng ghi
- Bảng "Số liệu hiện tại": thêm dòng `BranchSidebar.tsx`, `useState` trong sidebar, số file `components/` còn import thẳng `ipc/`
- Mục 4: đánh dấu GĐ5 lát 1 xong, ghi rõ lát 2 còn lại
- Mục 7: thêm quy ước rút ra từ giai đoạn này. Ít nhất hai cái đáng ghi:
  - **Luật lint phải thử trước khi tin.** Task 1 xác minh oxlint 1.83 có `no-restricted-imports` bằng một repo tạm trước khi viết vào config — GĐ1 từng mất công vì giả định `no-restricted-syntax` tồn tại.
  - **Glob không diễn tả được "feature khác".** Quy tắc `features/a` không import `features/b` phải ghim bằng test quét source, không ghim được bằng lint.
- Ghi rõ **sai lệch có chủ đích so với spec**: bỏ `useAsyncAction` vì `useMutation` đã phủ vai trò đó.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/REFACTOR_STATUS.md
git commit -m "📝 record Phase 5 slice 1 in the status handover

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Những gì KHÔNG nằm trong kế hoạch này

Ghi rõ để người làm tiếp không tưởng là bỏ sót:

| Việc | Vì sao hoãn |
| --- | --- |
| `features/remote` | Lát 2. 4 modal + phần remote trong sidebar. Union ở Task 7 đã chừa sẵn nhánh cho nó. |
| `features/changes` | Lát 2. `ChangesScreen` (312) + `StagingFileList` (406) + `CommitBox` (212). |
| Xẻ `CommitGraph` (790), `CommitDetailPanel` (763), `GitBehaviorTab` (597), `WelcomeScreen` (585) | GĐ5b cho các feature tương ứng, theo thứ tự ưu tiên ở spec. |
| Nâng `no-restricted-imports` lên `error` | GĐ7, khi `components/` không còn file nào import thẳng `ipc/`. |
| `useAsyncAction` của spec 4.4 | Bỏ hẳn — `useMutation` đã phủ. Xem "Quyết định thiết kế đã chốt" mục 3. |
| Việc nợ của GĐ3: chạy `pnpm tauri dev` kiểm chứng đầu-cuối | Vẫn nợ, xem mục 9 của status doc. Kế hoạch này không đụng tầng IPC nên không làm nợ đó nặng thêm — nhưng nó **đổi đường invalidate**, nên khi chạy app thật nhớ kiểm cả việc UI có tự làm mới sau khi tạo/xoá tag và đổi nhánh không. |
