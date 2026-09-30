# Refactor Phase 7d — Stricter Lint Rules and a Suppression Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring four new oxlint rules to zero in production code and raise them to `error`: `eqeqeq`, `typescript/switch-exhaustiveness-check`, `typescript/no-unsafe-assignment` + `typescript/no-unsafe-member-access`, and `react/no-array-index-key`. Also add a guard that blocks new `eslint-disable`/`oxlint-disable` comments.

**Architecture:** This follows the phase 7 pattern. Each rule goes in at `warn`, its violations are fixed task by task, and the last task flips every rule to `error` and runs a ratchet probe. The `no-unsafe-*` pair is turned off for test files (Vitest's asymmetric matchers such as `expect.objectContaining` return `any` by design) and for untyped JavaScript (`scripts/**`, `website/**`, where every Node global resolves to an error type). Everything else is fixed, not exempted. The suppression guard is a Node script with a per-file baseline, following the `check-query-keys.mjs` precedent. Its pure logic lives in a separate module that has its own tests.

**Tech Stack:** oxlint 1.83 with `oxlint-tsgolint` (`--type-aware`), TypeScript 5 strict (`noUncheckedIndexedAccess`), React 19, zustand, Vitest + Testing Library, Node ESM scripts.

## Global Constraints

- Work on a new branch `refactor/phase7d-lint-strictness` cut from `main`.
- Code, comments, test descriptions, test fixture strings, and commit messages are in **English**. User-facing strings stay exactly as they are (this phase moves no text into i18n). `pnpm check-comment-language` enforces the comment part.
- Commit messages use Gitmoji: `<emoji> <short description>`, with no `feat:`-style prefix and no parenthesized scope. Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Do not add or modify Playwright E2E tests (`e2e/**`).
- **No new `eslint-disable` / `oxlint-disable` comments, and no threshold changes.** The only config changes allowed are the ones Task 1, Task 5, and Task 6 spell out.
- **Behavior stays the same** unless a step names a deliberate change and pins it with a test. Only Task 2 (`parseTabSession`) and Task 3/4 (React `key` values) make such changes.
- Do not change an existing test's assertions. New tests must pass a break experiment: break the code, see the test fail, restore it, and record the failing output in the report.
- Architecture rules still hold (`src/test/architectureBoundaries.test.ts`, lint at `error`). New code in `src/shared/**` must not import `ipc/`, `store/`, or `i18n/`, not even as a type, so helpers take structural parameter types.
- New files must have zero lint violations and stay under 300 lines.
- The working tree must be clean when a task is reported done.
- Verification from the repo root (Git Bash): `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm check-comment-language`, `pnpm check-query-keys`.
- Count the new rules with:
  `pnpm lint 2>&1 | grep -oE "(warning|error) [a-z]+\([a-z-]+\)" | sort | uniq -c | sort -rn`
  **Baseline after Task 1: 31 warnings.** That is 13 `no-array-index-key`, 10 `no-unsafe-assignment`, 6 `no-unsafe-member-access`, and 2 `switch-exhaustiveness-check`. Task 1 fixes the last 2, which leaves 29.

---

### Task 1: Add the rules and make every `switch` exhaustive

**Files:**
- Modify: `.oxlintrc.json`
- Modify: `src/features/history/model/commitDetails.ts:101-123` (`getTypeBadgeStyle`)
- Modify: `src/components/changes/stagingFileListHelpers.ts:14-57` (`getStatusBadge`)
- Test: `src/test/stagingFileListHelpers.test.ts`
- Test (already exists, read only): `src/features/history/model/commitDetails.test.ts:112` already pins `getTypeBadgeStyle(null)`

**Interfaces:**
- Consumes: nothing.
- Produces: the lint configuration that later tasks measure against. No code API changes.

- [ ] **Step 1: Add the rules to `.oxlintrc.json`**

In `"rules"`, after `"max-nested-callbacks": ["error", 3]`, add:

```json
    "eqeqeq": "error",
    "typescript/switch-exhaustiveness-check": "warn",
    "typescript/no-unsafe-assignment": "warn",
    "typescript/no-unsafe-member-access": "warn",
    "react/no-array-index-key": "warn"
```

`eqeqeq` goes straight to `error` because it has 0 violations. An earlier count of 1 came from a probe config outside the repo that did not apply `ignorePatterns`, so it counted `bindings.generated.ts`.

In `"overrides"`, add both `no-unsafe-*` rules to the existing test override (the one whose `files` starts with `"src/test/**"`):

```json
        "no-restricted-imports": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-member-access": "off"
```

Then add a new override after the `scripts/**` `no-console` one:

```json
    {
      "files": ["scripts/**", "website/**"],
      "rules": {
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-member-access": "off"
      }
    },
```

- [ ] **Step 2: Measure the baseline**

Run: `pnpm lint 2>&1 | grep -oE "(warning|error) [a-z]+\([a-z-]+\)" | sort | uniq -c | sort -rn`

Expected, exactly:

```
     13 warning react(no-array-index-key)
     10 warning typescript(no-unsafe-assignment)
      6 warning typescript(no-unsafe-member-access)
      2 warning typescript(switch-exhaustiveness-check)
```

`pnpm lint` still exits 0. If the numbers differ, stop and report the full list (`pnpm lint 2>&1 | grep warning`).

- [ ] **Step 3: Write the characterization test for `Typechange`**

`getStatusBadge("Typechange", …)` currently falls into `default`. Pin what it returns today. Add this inside `describe("getStatusBadge", …)` in `src/test/stagingFileListHelpers.test.ts`, reusing that file's existing `badgeDict`:

```ts
  it("renders a type change with the neutral M badge and the raw status as title", () => {
    expect(getStatusBadge("Typechange", badgeDict)).toEqual({
      label: "M",
      className: "bg-window text-secondary",
      title: "Typechange",
    });
  });
```

- [ ] **Step 4: Run it on the original code**

Run: `pnpm vitest run src/test/stagingFileListHelpers.test.ts`
Expected: PASS. This test pins current behavior; it is not a failing test.

Break experiment: temporarily change the `default:` branch's `label: "M"` to `label: "X"`, run the test again, and expect FAIL on the new test. Then restore the line.

- [ ] **Step 5: Make both switches exhaustive**

In `src/components/changes/stagingFileListHelpers.ts`, replace the final branch label only:

```ts
    case "Typechange":
      return {
        label: "M",
        className: "bg-window text-secondary",
        title: String(status),
      };
```

(`default:` becomes `case "Typechange":`. The body is unchanged. `status` is `FileStatus | "Untracked"`, and every member now has a case, so TypeScript still sees every path return.)

In `src/features/history/model/commitDetails.ts`, add a `case null:` directly above `default:` in `getTypeBadgeStyle`:

```ts
    case null:
    default:
      return "bg-accent-subtle text-accent border-accent/30";
```

- [ ] **Step 6: Verify**

Run: `pnpm vitest run src/test/stagingFileListHelpers.test.ts src/features/history/model/commitDetails.test.ts`
Expected: PASS.

Run: `pnpm lint 2>&1 | grep -c "switch-exhaustiveness-check"`
Expected: `0`.

Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add .oxlintrc.json src/components/changes/stagingFileListHelpers.ts src/features/history/model/commitDetails.ts src/test/stagingFileListHelpers.test.ts
git commit -m "🚨 add strict lint rules and make status switches exhaustive

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Remove `any` flowing in from JSON

**Files:**
- Create: `src/services/readJson.ts`
- Create: `src/services/readJson.test.ts`
- Modify: `src/services/githubService.ts` (lines 154–156, 173, 202, 231, 292, 297, plus the import block)
- Create: `src/store/tabSession.ts`
- Create: `src/store/tabSession.test.ts`
- Modify: `src/store/useTabStore.ts:163-164`
- Modify: `src/utils/wordDiff.ts:29`
- Test: `src/test/githubService.test.ts`

**Interfaces:**
- Consumes: the Task 1 config (`no-unsafe-*` at `warn`).
- Produces:
  - `readJson<T>(res: Response): Promise<T>` in `src/services/readJson.ts`.
  - `parseTabSession(raw: string): ParsedTabSession | null` and `interface ParsedTabSession { openRepoPaths: string[]; activeTabId?: string }` in `src/store/tabSession.ts`.

- [ ] **Step 1: Write characterization tests for the GitHub error and guard paths**

Add these to `src/test/githubService.test.ts`, inside the existing `describe`:

```ts
  it("fetchPullRequestDetail returns no check runs when check_runs is not an array", async () => {
    const mockPr = {
      number: 11,
      title: "No checks",
      state: "open",
      head: { ref: "topic", sha: "abc123" },
      base: { ref: "main", sha: "def456" },
      labels: [],
      assignees: [],
      requested_reviewers: [],
      html_url: "https://github.com/owner/repo/pull/11",
    };
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/check-runs")) {
        return { ok: true, json: async () => ({ total_count: 0 }) } as Response;
      }
      if (url.includes("/files")) {
        return { ok: true, json: async () => ({ message: "not a list" }) } as Response;
      }
      return { ok: true, json: async () => mockPr } as Response;
    });

    const detail = await fetchPullRequestDetail("owner", "repo", 11, "token");
    expect(detail.check_runs).toEqual([]);
    expect(detail.files).toEqual([]);
  });

  it("createPullRequest throws the API message when the request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: "Validation Failed" }),
    } as Response);

    await expect(
      createPullRequest("owner", "repo", { title: "t", body: "", head: "a", base: "b" }, "token")
    ).rejects.toThrow("Validation Failed");
  });

  it("createPullRequest falls back to the status message when the error body is not JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);

    await expect(
      createPullRequest("owner", "repo", { title: "t", body: "", head: "a", base: "b" }, "token")
    ).rejects.toThrow("(mã 500)");
  });
```

The last assertion matches only the status part of the existing Vietnamese fallback message (`Lỗi khi tạo Pull Request (mã 500)`), because that string is user-facing and must stay as it is.

- [ ] **Step 2: Run them on the original code**

Run: `pnpm vitest run src/test/githubService.test.ts`
Expected: PASS for all tests.

Break experiment: in `githubService.ts`, temporarily change `errorData.message ||` to `undefined ||`. The "throws the API message" test should FAIL. Restore it.

- [ ] **Step 3: Write the failing `readJson` test**

Create `src/services/readJson.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readJson } from "./readJson";

describe("readJson", () => {
  it("resolves with the parsed body", async () => {
    const res = { json: async () => ({ login: "octocat" }) } as Response;
    await expect(readJson<{ login: string }>(res)).resolves.toEqual({ login: "octocat" });
  });

  it("rejects when the body is not JSON", async () => {
    const res = {
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response;
    await expect(readJson(res)).rejects.toThrow("Unexpected token");
  });
});
```

Run: `pnpm vitest run src/services/readJson.test.ts`
Expected: FAIL, because `./readJson` does not exist yet.

- [ ] **Step 4: Create `src/services/readJson.ts`**

```ts
/**
 * Reads a fetch response body as JSON, typed as `T`.
 *
 * `Response.json()` returns `any`, which silently switches off type checking
 * for everything read from it. This is the single place that accepts that
 * unchecked cast. Callers name the raw shape they expect (all-optional where
 * GitHub may omit a field) and keep their own runtime guards such as
 * `Array.isArray`.
 */
export async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
```

Run: `pnpm vitest run src/services/readJson.test.ts`
Expected: PASS. Break experiment: make it return `{} as T` and expect the first test to FAIL. Restore it.

- [ ] **Step 5: Route every `res.json()` in `githubService.ts` through `readJson`**

Add the import below the existing `../ipc/githubApi` import:

```ts
import { readJson } from "./readJson";
```

Then make these replacements, each one exactly as written:

```ts
// fetchPullRequestCheckRuns (was: const checksData = await checksRes.json();)
    const checksData = await readJson<{ check_runs?: RawCheckRun[] }>(checksRes);

// fetchPullRequestFilesList (was: const filesData = await filesRes.json();)
    const filesData = await readJson<RawPullRequestFile[]>(filesRes);

// testGitHubToken (was: const data = await res.json();)
  const data = await readJson<RawGitHubUserLink>(res);

// fetchPullRequests (was: const items = (await res.json()) as RawPullRequest[];)
  const items = await readJson<RawPullRequest[]>(res);

// createPullRequest error path (was: const errorData = await res.json().catch(() => ({}));)
    const errorData = await readJson<{ message?: string }>(res).catch(
      (): { message?: string } => ({})
    );

// createPullRequest success path (was: const p = (await res.json()) as RawPullRequest;)
  const p = await readJson<RawPullRequest>(res);
```

Leave the `Array.isArray` guards in place. They are the runtime check, and the types only describe the expected shape. `RawGitHubUserLink` (all fields required) is the right shape for `/user`, since `testGitHubToken` returns those three fields as `GitHubUserSummary` without fallbacks today. Also replace any other `res.json()` / `fetchRes.json()` you find with `grep -n "\.json()" src/services/githubService.ts` in the same way, using the `Raw*` type that the code after it reads.

- [ ] **Step 6: Write the failing `parseTabSession` tests**

Create `src/store/tabSession.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseTabSession } from "./tabSession";

describe("parseTabSession", () => {
  it("returns the stored paths and active tab", () => {
    const raw = JSON.stringify({ openRepoPaths: ["/a", "/b"], activeTabId: "/b" });
    expect(parseTabSession(raw)).toEqual({ openRepoPaths: ["/a", "/b"], activeTabId: "/b" });
  });

  it("drops a non-string active tab id", () => {
    const raw = JSON.stringify({ openRepoPaths: ["/a"], activeTabId: 7 });
    expect(parseTabSession(raw)).toEqual({ openRepoPaths: ["/a"], activeTabId: undefined });
  });

  it("skips non-string paths", () => {
    const raw = JSON.stringify({ openRepoPaths: ["/a", 3, null] });
    expect(parseTabSession(raw)?.openRepoPaths).toEqual(["/a"]);
  });

  it.each([["null"], ["[]"], ['"text"'], ["{}"], ['{"openRepoPaths":"/a"}']])(
    "returns null for %s",
    (raw) => {
      expect(parseTabSession(raw)).toBeNull();
    }
  );

  it("throws on invalid JSON so the caller's catch still logs it", () => {
    expect(() => parseTabSession("{not json")).toThrow(SyntaxError);
  });
});
```

Run: `pnpm vitest run src/store/tabSession.test.ts`
Expected: FAIL, because the module does not exist yet.

- [ ] **Step 7: Create `src/store/tabSession.ts`**

```ts
import { type TabSessionData } from "../types/tab";

/** A tab session read back from storage, narrowed from untrusted JSON. */
export interface ParsedTabSession {
  openRepoPaths: string[];
  activeTabId?: TabSessionData["activeTabId"];
}

/**
 * Parses the persisted tab session. Returns null when the value is not an
 * object with an `openRepoPaths` array, so the restore is skipped instead of
 * failing halfway through. Invalid JSON still throws, which the caller logs.
 */
export function parseTabSession(raw: string): ParsedTabSession | null {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const { openRepoPaths, activeTabId } = value as Record<string, unknown>;
  if (!Array.isArray(openRepoPaths)) return null;

  return {
    openRepoPaths: openRepoPaths.filter((path): path is string => typeof path === "string"),
    activeTabId: typeof activeTabId === "string" ? activeTabId : undefined,
  };
}
```

Run: `pnpm vitest run src/store/tabSession.test.ts`
Expected: PASS. Break experiment: remove the `.filter(...)` call, expect "skips non-string paths" to FAIL, then restore it.

- [ ] **Step 8: Use it in `useTabStore.ts`**

Replace:

```ts
    const session: TabSessionData = JSON.parse(raw);
    if (!session.openRepoPaths || !Array.isArray(session.openRepoPaths)) return;
```

with:

```ts
    const session = parseTabSession(raw);
    if (!session) return;
```

Add `import { parseTabSession } from "./tabSession";`. Keep the `TabSessionData` import, which `saveSessionToStorage` still uses (line 34).

**Deliberate behavior change, pinned by the tests above.** A stored value of `null` now skips the restore silently instead of throwing a `TypeError` into the `console.warn` catch. Non-string entries are skipped instead of being passed to `openRepository`. Both only happen with corrupt storage.

- [ ] **Step 9: Type the DP table in `wordDiff.ts`**

Line 29, replace `new Array(n + 1).fill(0)` with `new Array<number>(n + 1).fill(0)`:

```ts
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
```

- [ ] **Step 10: Verify**

Run: `pnpm lint 2>&1 | grep -cE "no-unsafe-(assignment|member-access)"`
Expected: `0`.

Run: `pnpm vitest run src/test/githubService.test.ts src/test/githubServiceMappers.test.ts src/test/useTabStore.test.ts src/test/wordDiff.test.ts src/services src/store`
Expected: PASS.

Run: `pnpm build && pnpm check-comment-language`
Expected: both exit 0.

- [ ] **Step 11: Commit**

```bash
git add src/services src/store src/utils/wordDiff.ts src/test/githubService.test.ts
git commit -m "🏷️ type JSON read from GitHub and tab session storage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Stable keys for diff hunks, lines, and word tokens

**Files:**
- Create: `src/shared/utils/listKeys.ts`
- Create: `src/shared/utils/listKeys.test.ts`
- Modify: `src/components/diff/DiffLineContent.tsx:22-45`
- Modify: `src/features/history/components/FileDiffViewer.tsx:34,40,134-135`
- Modify: `src/components/compare/CompareDiffViewer.tsx:38,44,168-169`
- Modify: `src/components/changes/InteractiveDiffViewer.tsx:84-86`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, in `src/shared/utils/listKeys.ts`:
  - `hunkKey(hunk: { old_start: number; new_start: number }): string`
  - `diffLineKey(line: { old_lineno: number | null; new_lineno: number | null }): string`
  - `withOffsetKeys<T extends { text: string }>(tokens: readonly T[]): Array<{ token: T; key: number }>`

Why these keys are unique:
- **Hunks.** No two hunks in one file diff start at the same `(old_start, new_start)`.
- **Diff lines.** The Rust side (`src-tauri/src/read/diff.rs:252`) only emits `add` (new line number only), `delete` (old only), and `context` (both), and within a hunk the numbers only increase. So the `(old_lineno, new_lineno)` pair never repeats.
- **Word tokens.** `tokenize` never produces an empty token, so each token's character offset in the rendered line is unique.

- [ ] **Step 1: Write the failing tests**

Create `src/shared/utils/listKeys.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeWordDiff } from "../../utils/wordDiff";
import { diffLineKey, hunkKey, withOffsetKeys } from "./listKeys";

describe("hunkKey", () => {
  it("combines both start positions", () => {
    expect(hunkKey({ old_start: 10, new_start: 12 })).toBe("10:12");
  });

  it("tells apart hunks that share only one start", () => {
    expect(hunkKey({ old_start: 1, new_start: 5 })).not.toBe(hunkKey({ old_start: 5, new_start: 1 }));
  });
});

describe("diffLineKey", () => {
  it("gives unique keys to the lines of a mixed hunk", () => {
    const lines = [
      { old_lineno: 1, new_lineno: 1 },
      { old_lineno: 2, new_lineno: null },
      { old_lineno: null, new_lineno: 2 },
      { old_lineno: 3, new_lineno: 3 },
    ];
    const keys = lines.map(diffLineKey);
    expect(new Set(keys).size).toBe(lines.length);
  });

  it("does not confuse a deleted and an added line with the same number", () => {
    expect(diffLineKey({ old_lineno: 2, new_lineno: null })).not.toBe(
      diffLineKey({ old_lineno: null, new_lineno: 2 })
    );
  });
});

describe("withOffsetKeys", () => {
  it("keys each token by its character offset", () => {
    const tokens = [{ text: "ab" }, { text: " " }, { text: "c" }];
    expect(withOffsetKeys(tokens).map((t) => t.key)).toEqual([0, 2, 3]);
  });

  it("keeps the original token objects", () => {
    const tokens = [{ text: "x" }];
    expect(withOffsetKeys(tokens)[0]?.token).toBe(tokens[0]);
  });

  it("produces unique keys for a real word diff", () => {
    const { oldTokens, newTokens } = computeWordDiff("const a = 1;", "const b = 1; // x");
    for (const tokens of [oldTokens, newTokens]) {
      const keys = withOffsetKeys(tokens).map((t) => t.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
```

Run: `pnpm vitest run src/shared/utils/listKeys.test.ts`
Expected: FAIL, because the module does not exist.

- [ ] **Step 2: Create `src/shared/utils/listKeys.ts`**

```ts
// React keys for lists whose items have no id of their own. Parameters are
// structural so `shared/` does not depend on `ipc/` types.

/** Key for a diff hunk: no two hunks in one file diff share both start positions. */
export function hunkKey(hunk: { old_start: number; new_start: number }): string {
  return `${hunk.old_start}:${hunk.new_start}`;
}

/**
 * Key for a line within one hunk. Context lines carry both numbers, added
 * lines only the new one, deleted lines only the old one, and both counters
 * only increase inside a hunk, so the pair is unique.
 */
export function diffLineKey(line: { old_lineno: number | null; new_lineno: number | null }): string {
  return `${line.old_lineno ?? "-"}:${line.new_lineno ?? "-"}`;
}

/**
 * Pairs each word diff token with its character offset in the rendered line.
 * Tokens are never empty, so offsets are unique and stable for a given text.
 */
export function withOffsetKeys<T extends { text: string }>(
  tokens: readonly T[]
): Array<{ token: T; key: number }> {
  let offset = 0;
  return tokens.map((token) => {
    const key = offset;
    offset += token.text.length;
    return { token, key };
  });
}
```

Run: `pnpm vitest run src/shared/utils/listKeys.test.ts`
Expected: PASS. Break experiment: change `diffLineKey` to return `` `${line.old_lineno ?? line.new_lineno}` `` and expect both `diffLineKey` tests to FAIL. Restore it.

- [ ] **Step 3: Use the keys in `DiffLineContent.tsx`**

Add the import `import { withOffsetKeys } from "../../shared/utils/listKeys";`.

Replace `{tokens.map((token, i) => {` with:

```tsx
      {withOffsetKeys(tokens).map(({ token, key }) => {
```

Then change the three `key={i}` to `key={key}`. Nothing else in the file changes.

- [ ] **Step 4: Use the keys in the three diff viewers**

`src/features/history/components/FileDiffViewer.tsx`: add `import { diffLineKey, hunkKey } from "../../../shared/utils/listKeys";`.
- Line 40: `key={lIdx}` → `key={diffLineKey(line)}`. **Keep** `lIdx` as the map's second parameter, because line 75 (`tokenMap.get(lIdx)`) still reads it.
- Line 134: `diff.hunks.map((hunk, hIdx) => (` → `diff.hunks.map((hunk) => (`
- Line 135: `key={hIdx}` → `key={hunkKey(hunk)}`

`src/components/compare/CompareDiffViewer.tsx`: add `import { diffLineKey, hunkKey } from "../../shared/utils/listKeys";`, then make the same three edits at lines 44, 168, and 169. Keep `lIdx` for `tokenMap.get(lIdx)` at line 79.

`src/components/changes/InteractiveDiffViewer.tsx`: add `import { hunkKey } from "../../shared/utils/listKeys";`, then change line 86 from `` key={`hunk-${hIdx}`} `` to `key={hunkKey(hunk)}`. **Keep** `hIdx={hIdx}` on line 88: it is the hunk index sent to the staging command, not a key.

**Deliberate behavior change.** `InteractiveHunk` holds `hoveredLineKey` state. With index keys, staging hunk 1 made hunk 2 inherit hunk 1's hover state. With data keys, each hunk keeps its own. No test needs to pin this, because hover state is transient, but say so in the report.

- [ ] **Step 5: Verify**

Run: `pnpm vitest run src/test/DiffViewerWordDiff.test.tsx src/test/InteractiveDiffViewer.test.tsx src/features/history/components/FileDiffViewer.test.tsx src/shared/utils`
Expected: PASS.

Run: `pnpm lint 2>&1 | grep "no-array-index-key" | grep -cE "DiffLineContent|FileDiffViewer|CompareDiffViewer|InteractiveDiffViewer"`
Expected: `0`. The total `no-array-index-key` count drops from 13 to 5.

Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/shared/utils/listKeys.ts src/shared/utils/listKeys.test.ts src/components/diff/DiffLineContent.tsx src/features/history/components/FileDiffViewer.tsx src/components/compare/CompareDiffViewer.tsx src/components/changes/InteractiveDiffViewer.tsx
git commit -m "🐛 key diff hunks, lines and word tokens by their content

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Stable keys for graph edges, rebase preview, and branch pills

**Files:**
- Modify: `src/components/graph/GraphSvgLane.tsx:44-45`
- Modify: `src/components/rebase/RebaseLivePreviewDropped.tsx:26-28`
- Modify: `src/components/rebase/RebaseLivePreviewTimeline.tsx:48`
- Modify: `src/components/rebase/RebaseLivePreviewTimelineItem.tsx:66-68`
- Modify: `src/features/history/components/CommitGraphBranchPills.tsx:98-100`
- Test: `src/test/RebaseLivePreview.test.tsx`, `src/test/CommitGraphBranchPills.test.tsx` (extended); `src/components/graph/GraphSvgLane.test.tsx` (run only)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing new. These are inline template keys, each used once.

Why each key is unique:
- **Graph edges.** In `src-tauri/src/read/graph.rs:130-200`, `straight` edges run `i → i`, `merge` edges run `j → col` with `j ≠ col`, and `fork` edges run `col → k`, with at most one per target lane. So `(edge_type, from_col, to_col)` never repeats within a row.
- **Rebase items.** `ProjectedCommit.id` is the step's `commit_id`, and each commit appears in a rebase plan once. Dropped and squashed entries only carry `short_id`, which is unique within one rebase range.
- **Refs.** A ref is unique by `(ref_type, name)`. A branch and a tag may share a name, so the type is part of the key.

- [ ] **Step 1: Add a duplicate-key check to the existing component tests**

React reports duplicate keys through `console.error("Encountered two children with the same key…")`.

In `src/test/CommitGraphBranchPills.test.tsx` (which already imports `vi`, and whose popover list renders without hovering), add this inside `describe("CommitGraphBranchPills", …)`:

```tsx
  it("renders a branch and a tag with the same name without duplicate keys", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const refs: RefBadge[] = [
      { name: "main", ref_type: "head" },
      { name: "v1", ref_type: "local" },
      { name: "v1", ref_type: "tag" },
    ];
    render(<CommitGraphBranchPills refs={refs} />);

    expect(screen.getAllByText("v1").length).toBeGreaterThanOrEqual(2);
    const keyWarnings = errorSpy.mock.calls.filter((args) => String(args[0]).includes("same key"));
    expect(keyWarnings).toEqual([]);
    errorSpy.mockRestore();
  });
```

In `src/test/RebaseLivePreview.test.tsx`, change the vitest import to `import { describe, it, expect, vi } from "vitest";` and add this inside `describe("RebaseLivePreview", …)`. The fixture has two squashes into one commit and two drops, so both inner lists render more than one row:

```tsx
  it("renders squashed and dropped rows without duplicate keys", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const commits = [
      makeCommit("c1", "1111111", "Commit One"),
      makeCommit("c2", "2222222", "Commit Two"),
      makeCommit("c3", "3333333", "Commit Three"),
      makeCommit("c4", "4444444", "Commit Four"),
      makeCommit("c5", "5555555", "Commit Five"),
    ];
    const steps: RebasePlanStep[] = [
      { commit_id: "c1", action: "Pick", new_message: null },
      { commit_id: "c2", action: "Squash", new_message: null },
      { commit_id: "c3", action: "Fixup", new_message: null },
      { commit_id: "c4", action: "Drop", new_message: null },
      { commit_id: "c5", action: "Drop", new_message: null },
    ];

    render(
      <RebaseLivePreview
        baseCommitId="0000000000000000000000000000000000000000"
        baseCommitSummary="Base"
        steps={steps}
        commitMap={new Map(commits.map((c) => [c.id, c]))}
      />
    );

    const keyWarnings = errorSpy.mock.calls.filter((args) => String(args[0]).includes("same key"));
    expect(keyWarnings).toEqual([]);
    errorSpy.mockRestore();
  });
```

(`"Fixup"` is a member of `RebaseActionKind`.)

- [ ] **Step 2: Run them on the original code**

Run: `pnpm vitest run src/test/RebaseLivePreview.test.tsx src/test/CommitGraphBranchPills.test.tsx`
Expected: PASS, since index keys are unique too.

Break experiment: temporarily set a constant key (`key="x"`) at `CommitGraphBranchPills.tsx:100`, run the test, and expect the new test to FAIL. Restore it. This proves the spy catches duplicate keys.

- [ ] **Step 3: Replace the index keys**

`GraphSvgLane.tsx`:

```tsx
      {lines.map((edge) => (
        <GraphSvgEdge
          key={`${edge.edge_type}:${edge.from_col}:${edge.to_col}`}
          edge={edge}
          colWidth={colWidth}
          rowHeight={rowHeight}
          nodeY={nodeY}
        />
      ))}
```

`RebaseLivePreviewDropped.tsx`: `droppedCommits.map((d, idx) => (` → `droppedCommits.map((d) => (`, and `key={idx}` → `key={d.short_id}`.

`RebaseLivePreviewTimeline.tsx`: `key={item.id + idx}` → `key={item.id}`. **Keep** `idx`, because `isLastItem={idx === projectedCommits.length - 1}` reads it.

`RebaseLivePreviewTimelineItem.tsx`: `item.squashedSubCommits.map((sub, sIdx) => (` → `item.squashedSubCommits.map((sub) => (`, and `key={sIdx}` → `key={sub.short_id}`.

`CommitGraphBranchPills.tsx`: `sortedRefs.map((r, idx) => (` → `sortedRefs.map((r) => (`, and `key={idx}` → `` key={`${r.ref_type}:${r.name}`} ``.

- [ ] **Step 4: Verify**

Run: `pnpm lint 2>&1 | grep -c "no-array-index-key"`
Expected: `0`.

Run the full suite, `pnpm test`.
Expected: PASS. It includes the graph tests: `grep -rln "GraphSvgLane\|CommitGraphRows" src --include=*.test.tsx`.

Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/graph/GraphSvgLane.tsx src/components/rebase src/features/history/components/CommitGraphBranchPills.tsx src/test/RebaseLivePreview.test.tsx src/test/CommitGraphBranchPills.test.tsx
git commit -m "🐛 key graph edges, rebase preview rows and ref pills by identity

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Guard against new lint suppression comments

**Files:**
- Create: `scripts/lintSuppressions.mjs` (pure logic)
- Create: `scripts/lintSuppressions.test.mjs`
- Create: `scripts/check-lint-suppressions.mjs` (walks files and reports)
- Modify: `package.json` (`lint`, `check`, and a new `check-lint-suppressions` script)
- Modify: `.github/workflows/ci.yml` (a new step after "Frontend lint")

**Interfaces:**
- Consumes: nothing.
- Produces, from `scripts/lintSuppressions.mjs`:
  - `SUPPRESSION_BASELINE: Record<string, number>`, keyed by repo-relative paths with forward slashes
  - `countSuppressions(content: string): number`
  - `findSuppressionViolations(counts: Record<string, number>, baseline: Record<string, number>): Array<{ file: string; found: number; allowed: number }>`

Design: every file may hold at most its baseline count, and files not in the baseline hold 0. A file that ends up with **fewer** directives than its baseline also fails, so the baseline can only shrink, the same way as "every ipc-import exception still exists" in `architectureBoundaries.test.ts`. The three script files contain the directive text themselves (in the regex, docs, and fixtures), so the walker skips them by path.

- [ ] **Step 1: Write the failing tests**

Create `scripts/lintSuppressions.test.mjs`:

```js
import { describe, expect, it } from "vitest";
import { countSuppressions, findSuppressionViolations } from "./lintSuppressions.mjs";

// Directive text is assembled so this file does not match its own pattern.
const ESLINT = "eslint" + "-disable";
const OXLINT = "oxlint" + "-disable";

describe("countSuppressions", () => {
  it.each([
    [`// ${ESLINT}-next-line no-console`, 1],
    [`foo(); // ${OXLINT}-line`, 1],
    [`/* ${ESLINT} */`, 1],
    [`/* ${OXLINT} max-lines */\n// ${ESLINT}-next-line x`, 2],
  ])("counts %j as %i", (content, expected) => {
    expect(countSuppressions(content)).toBe(expected);
  });

  it.each([["// eslint is great"], ["const disable = true;"], ["// eslint-enable"]])(
    "ignores %j",
    (content) => {
      expect(countSuppressions(content)).toBe(0);
    }
  );
});

describe("findSuppressionViolations", () => {
  const baseline = { "src/a.test.ts": 1 };

  it("passes when every file matches its baseline", () => {
    expect(findSuppressionViolations({ "src/a.test.ts": 1 }, baseline)).toEqual([]);
  });

  it("flags a file that is not in the baseline", () => {
    expect(findSuppressionViolations({ "src/a.test.ts": 1, "src/b.ts": 1 }, baseline)).toEqual([
      { file: "src/b.ts", found: 1, allowed: 0 },
    ]);
  });

  it("flags a file that exceeds its baseline", () => {
    expect(findSuppressionViolations({ "src/a.test.ts": 2 }, baseline)).toEqual([
      { file: "src/a.test.ts", found: 2, allowed: 1 },
    ]);
  });

  it("flags a stale baseline entry so the baseline only shrinks", () => {
    expect(findSuppressionViolations({}, baseline)).toEqual([
      { file: "src/a.test.ts", found: 0, allowed: 1 },
    ]);
  });
});
```

Run: `pnpm vitest run scripts/lintSuppressions.test.mjs`
Expected: FAIL, because the module does not exist.

- [ ] **Step 2: Create `scripts/lintSuppressions.mjs`**

```js
/**
 * Pure logic for `check-lint-suppressions.mjs`, kept separate so it can be
 * unit tested without touching the file system.
 */

/**
 * The only suppression comments allowed in the repo, per file. Each one hides
 * an `any` in a mocked mutation variable. Remove an entry when you type that
 * mock properly; never add one.
 */
export const SUPPRESSION_BASELINE = {
  "src/features/branch/api/useBranchMutations.test.ts": 1,
  "src/features/remote/api/useRemoteMutations.test.ts": 1,
  "src/features/stash/api/useStashMutations.test.ts": 1,
};

/** Matches `eslint-disable`, `-line` and `-next-line`, and the oxlint spellings. */
const SUPPRESSION = /\b(?:eslint|oxlint)-disable(?:-next-line|-line)?\b/g;

export function countSuppressions(content) {
  return content.match(SUPPRESSION)?.length ?? 0;
}

/** Files whose count differs from the baseline, in either direction. */
export function findSuppressionViolations(counts, baseline) {
  const files = new Set([...Object.keys(counts), ...Object.keys(baseline)]);
  const violations = [];
  for (const file of [...files].sort()) {
    const found = counts[file] ?? 0;
    const allowed = baseline[file] ?? 0;
    if (found !== allowed) violations.push({ file, found, allowed });
  }
  return violations;
}
```

Run: `pnpm vitest run scripts/lintSuppressions.test.mjs`
Expected: PASS. Break experiment: change `found !== allowed` to `found > allowed` and expect the "stale baseline entry" test to FAIL. Restore it.

- [ ] **Step 3: Create `scripts/check-lint-suppressions.mjs`**

```js
#!/usr/bin/env node

/**
 * Blocks new lint suppression comments.
 *
 * Every size, complexity and boundary rule in `.oxlintrc.json` is at `error`.
 * A single suppression comment switches one of them off for a line or a file
 * without anyone noticing in review, so the repo keeps an explicit per-file
 * baseline (see `lintSuppressions.mjs`) and this script fails on any
 * difference from it. oxlint's `--report-unused-disable-directives` (wired
 * into `pnpm lint`) covers the other half: a suppression that no longer
 * suppresses anything.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  SUPPRESSION_BASELINE,
  countSuppressions,
  findSuppressionViolations,
} from "./lintSuppressions.mjs";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "e2e", "scripts", "website"];
const SKIP_DIRS = new Set(["node_modules", "dist"]);
const EXTENSIONS = /\.(?:ts|tsx|js|mjs|cjs)$/;

/** These files spell out the directive text on purpose. */
const SELF = new Set([
  "scripts/check-lint-suppressions.mjs",
  "scripts/lintSuppressions.mjs",
  "scripts/lintSuppressions.test.mjs",
]);

function collectFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collectFiles(full));
    } else if (EXTENSIONS.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

const counts = {};
for (const dir of SCAN_DIRS) {
  for (const file of collectFiles(join(ROOT, dir))) {
    const rel = relative(ROOT, file).split(sep).join("/");
    if (SELF.has(rel)) continue;
    const count = countSuppressions(readFileSync(file, "utf8"));
    if (count > 0) counts[rel] = count;
  }
}

const violations = findSuppressionViolations(counts, SUPPRESSION_BASELINE);

if (violations.length > 0) {
  console.error(`\nLint suppression comments differ from the baseline:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}: found ${v.found}, allowed ${v.allowed}`);
  }
  console.error(
    `\nFix the code instead of suppressing the rule. If you removed a` +
      `\nsuppression, lower its entry in scripts/lintSuppressions.mjs.\n`
  );
  process.exit(1);
}

console.log("Lint suppression comments match the baseline.");
```

- [ ] **Step 4: Run it, then break it**

Run: `node scripts/check-lint-suppressions.mjs`
Expected: `Lint suppression comments match the baseline.` and exit 0.

Break experiment: add `// eslint-disable-next-line no-console` above any line in `src/shared/utils/git.ts`, run the script, and expect exit 1 with the line `src/shared/utils/git.ts: found 1, allowed 0`. Restore the file with `git checkout -- src/shared/utils/git.ts`.

- [ ] **Step 5: Wire it in**

In `package.json`:

```json
    "lint": "oxlint . --type-aware --report-unused-disable-directives-severity=error",
    "check-lint-suppressions": "node scripts/check-lint-suppressions.mjs",
```

In `"check"`, insert `pnpm check-lint-suppressions && ` directly after `pnpm check-comment-language && `.

In `.github/workflows/ci.yml`, add this step directly after the `Frontend lint` step:

```yaml
      - name: No new lint suppressions
        run: pnpm check-lint-suppressions
```

- [ ] **Step 6: Verify**

Run: `pnpm lint`
Expected: exit 0. The three existing directives are all in use (confirmed on 2026-09-30).

Unused-directive probe: in `src/shared/utils/git.ts`, add `// eslint-disable-next-line no-console` above a line that does not call `console`, run `pnpm lint`, and expect exit 1 with an unused-directive error on that line. Restore it with `git checkout -- src/shared/utils/git.ts`.

Run: `pnpm check-comment-language && pnpm test`
Expected: both pass. The Vitest count goes up by the new `scripts/lintSuppressions.test.mjs` file.

- [ ] **Step 7: Commit**

```bash
git add scripts/lintSuppressions.mjs scripts/lintSuppressions.test.mjs scripts/check-lint-suppressions.mjs package.json .github/workflows/ci.yml
git commit -m "🔒 block new lint suppression comments

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Raise the rules to `error` and update the docs

**Files:**
- Modify: `.oxlintrc.json`
- Modify: `docs/CODING_RULES.md` (sections 5 and 6)
- Modify: `docs/superpowers/REFACTOR_STATUS.md` (header lines 5–10, a new "Giai đoạn 7d" subsection in section 3, and the section 6 debt rows)

**Interfaces:**
- Consumes: Tasks 1–5 (0 warnings for the four rules, and the suppression guard).
- Produces: nothing new in code.

- [ ] **Step 1: Confirm zero**

Run: `pnpm lint 2>&1 | grep -oE "(warning|error) [a-z]+\([a-z-]+\)" | sort | uniq -c`
Expected: no output.

- [ ] **Step 2: Flip the severities**

In `.oxlintrc.json`, change the four `"warn"` values that Task 1 added to `"error"`:

```json
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-member-access": "error",
    "react/no-array-index-key": "error"
```

- [ ] **Step 3: Ratchet probe**

Add this temporarily to the end of `src/shared/utils/git.ts`:

```ts
export function _probe(items: string[], flag: "a" | "b", raw: string) {
  const parsed = JSON.parse(raw);
  switch (flag) {
    case "a":
      return items.map((item, index) => ({ key: index, item, parsed }));
  }
  return [];
}
```

Run: `pnpm lint`
Expected: exit 1, with `error typescript(no-unsafe-assignment)` on the `JSON.parse` line and `error typescript(switch-exhaustiveness-check)` on the `switch`. The probe has no JSX, so `no-array-index-key` will not fire here; Task 4's duplicate-key tests cover that rule. Record the output verbatim.

Remove the probe with `git checkout -- src/shared/utils/git.ts`, run `pnpm lint`, and expect exit 0. Then run `git status --short` and expect only `.oxlintrc.json` to be modified.

- [ ] **Step 4: Update `docs/CODING_RULES.md`**

In section 6, delete the "Adopted, enforcement pending" subsection and add these bullets to the enforced list above it:

```markdown
- `eqeqeq`: use `===` / `!==`.
- `typescript/switch-exhaustiveness-check`: a `switch` over a union names
  every member (`case null:` included). A `default` does not count, so adding
  a member to the union points at every `switch` that must handle it.
- `typescript/no-unsafe-assignment` and `typescript/no-unsafe-member-access`:
  never let `any` flow in. Read fetch bodies with `readJson<RawShape>(res)`
  from `src/services/readJson.ts` and keep the runtime guards (`Array.isArray`,
  `typeof`). Parse stored JSON into `unknown` and narrow it with a tested
  parser (see `parseTabSession`). Off in tests (Vitest matchers return `any`)
  and in untyped `scripts/**` / `website/**`.
- `react/no-array-index-key`: key list items by identity (SHA, path,
  `ref_type:name`). For diffs use `hunkKey`, `diffLineKey`, and
  `withOffsetKeys` from `src/shared/utils/listKeys.ts`.
```

In section 5, replace the bracketed "[not enforced yet: …]" sentence with:

```markdown
  [enforced: `pnpm check-lint-suppressions` holds a per-file baseline in
  `scripts/lintSuppressions.mjs` that can only shrink, and `pnpm lint` fails
  on a suppression that no longer suppresses anything]
```

In section 1's command block, add `pnpm check-lint-suppressions` after `pnpm check-comment-language`.

- [ ] **Step 5: Update `docs/superpowers/REFACTOR_STATUS.md`**

This document is written in Vietnamese; keep its language for new text in it.
- Header: set **Cập nhật** to the current date and add one line to **Tiến độ** noting that GĐ7d is done.
- In section 3, after "Giai đoạn 7c", add a subsection "Giai đoạn 7d — Luật lint chặt hơn và guard chống suppress" with: the plan path, a commit table (Tasks 1–6), the before/after count (31 → 0 per rule), the two deliberate behavior changes (`parseTabSession`, key-based hunk state), the ratchet probe output from Step 3, and the full verification table (`pnpm lint`, `pnpm build`, `pnpm test` with file/test counts, `pnpm check-comment-language`, `pnpm check-query-keys`, `pnpm check-lint-suppressions`).
- In section 6, mark two rows as resolved ("Đã giải quyết"): "Không có gì canh gác comment `eslint-disable`/`oxlint-disable` mới" and "`res.json()` trong `src/services/githubService.ts` trả về `any`".

- [ ] **Step 6: Full verification**

Run: `pnpm lint && pnpm build && pnpm test && pnpm check-comment-language && pnpm check-query-keys && pnpm check-lint-suppressions && npx prettier --check docs/CODING_RULES.md docs/superpowers/REFACTOR_STATUS.md .oxlintrc.json`
Expected: every command exits 0, and `pnpm lint` reports 0 warnings and 0 errors.

- [ ] **Step 7: Commit**

```bash
git add .oxlintrc.json docs/CODING_RULES.md docs/superpowers/REFACTOR_STATUS.md
git commit -m "🚨 raise strict type and key rules to error

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
