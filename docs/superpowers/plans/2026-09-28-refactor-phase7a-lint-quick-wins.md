# Refactor Phase 7a — Lint Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring seven oxlint rules to zero warnings and raise them from `warn` to `error`, cutting total warnings from 241 to at most 152.

**Architecture:** Phase 7 (spec `docs/superpowers/specs/2026-09-18-frontend-architecture-refactor-design.md`, §5 and §8) says a rule may only become `error` once it has zero violations. The 241 warnings are therefore split into three slices, each ending by raising the rules it cleared:

| Slice | Rules | Warnings now | Plan |
| --- | --- | --- | --- |
| **7a (this plan)** | `no-console`, `typescript/no-explicit-any`, `react/exhaustive-deps`, `max-params`, `max-nested-callbacks`, `react/only-export-components`, `max-depth`; plus the type-only share of `no-restricted-imports` | 89 | this file |
| 7b | `no-restricted-imports` (the 24 real runtime `ipc/` imports) | 24 | written after 7a lands |
| 7c | `max-lines-per-function`, `complexity`, `max-lines` | ~128 | written after 7b lands |

7b and 7c get their own plans because 7b moves 24 files behind feature `api/` hooks, and 7c needs per-function analysis of ~90 functions. Writing either one before 7a would go stale.

**Tech Stack:** oxlint 1.83 (`.oxlintrc.json`), TypeScript, React 19, Vitest + Testing Library, zustand.

## Global Constraints

- Code, comments, test descriptions, test fixture strings and commit messages in **English**. User-facing strings (i18n entries, rendered text, `aria-label`, `title`) stay **Vietnamese**, and the Vietnamese fallback strings in `catch` blocks below are user-facing, so they stay as they are. `pnpm check-comment-language` enforces this.
- Commit messages use Gitmoji: `<emoji> <short description>`, no `feat:` prefixes, no parenthesized scopes.
- Every commit ends with the trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` (REFACTOR_STATUS.md convention 7, fixed for this branch).
- Do not add or modify Playwright E2E tests (`e2e/**`).
- Every new test must pass a break experiment: break the implementation, watch the test FAIL, restore (convention 3).
- Do not change an existing test's assertions to make it pass (convention 4). Changing how a test *builds its fixtures* (for example typing an `as any` object) is allowed; changing what it *asserts* is not.
- A lint fix must not change behaviour unless the task says so explicitly and pins it with a test (convention 5).
- Verification commands (run from repo root): `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm check-comment-language`, `pnpm check-query-keys`.
- Count warnings per rule with:
  `pnpm lint 2>&1 | grep -oE "warning [a-z-]+\([a-z/-]+\)" | sort | uniq -c | sort -rn`

---

### Task 1: Lint configuration corrections

Three sets of warnings come from the config itself, not from bad code:

1. **`no-restricted-imports` flags type-only imports.** oxlint supports `allowTypeImports` per pattern. This was verified on 2026-09-28 with a probe file: `import type {…}` and `import { type X }` pass, while mixed `import { type X, value }` and side-effect `import "…/ipc/core"` are still reported. With it on, the rule drops from 70 to 24 warnings. `src/test/architectureBoundaries.test.ts` (`importsIpcAtRuntime`) already makes the same distinction; the lint rule now agrees with it.
2. **`scripts/*.mjs` are CLIs**, so printing with `console.log` is their job (8 warnings).
3. **`src/i18n/en.ts` and `src/i18n/vi.ts` are translation dictionaries** (2 `max-lines` warnings). Splitting them by line count would scatter one locale over several files for no structural gain.

**Files:**
- Modify: `.oxlintrc.json`

- [ ] **Step 1: Record the baseline**

Run: `pnpm lint 2>&1 | grep -oE "warning [a-z-]+\([a-z/-]+\)" | sort | uniq -c | sort -rn`
Expected (key lines): `70 … no-restricted-imports`, `9 … no-console`, `12 … max-lines`.

- [ ] **Step 2: Add `allowTypeImports` to both restricted-import patterns**

In `.oxlintrc.json`, the top-level `no-restricted-imports` rule becomes:

```json
    "no-restricted-imports": [
      "warn",
      {
        "patterns": [
          {
            "group": ["**/ipc/*", "**/ipc"],
            "allowTypeImports": true,
            "message": "Component phải gọi qua features/*/api, không import ipc trực tiếp."
          },
          {
            "group": ["**/features/*/components/*", "**/features/*/api/*", "**/features/*/model/*"],
            "allowTypeImports": true,
            "message": "Import qua features/<name>/index.ts, không chọc vào nội bộ feature."
          }
        ]
      }
    ],
```

Leave the `src/shared/ui/**` override exactly as it is. `shared/ui` must not depend on `ipc/`, `store/` or `i18n` even for types.

- [ ] **Step 3: Add two overrides**

Append to the `overrides` array:

```json
    {
      "files": ["scripts/**"],
      "rules": {
        "no-console": "off"
      }
    },
    {
      "files": ["src/i18n/en.ts", "src/i18n/vi.ts"],
      "rules": {
        "max-lines": "off"
      }
    }
```

- [ ] **Step 4: Verify the counts moved exactly as predicted**

Run the count command again.
Expected: `24 … no-restricted-imports`, `1 … no-console` (the `console.log` in `src/App.tsx`), `10 … max-lines`. Every other rule is unchanged. If `no-restricted-imports` is not 24, stop: the probe result no longer holds.

- [ ] **Step 5: Commit**

```bash
git add .oxlintrc.json
git commit -m "🔧 stop lint flagging type imports, CLI output and i18n size" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `messageOf` helper and typed `catch` clauses

Eleven `catch (err: any)` clauses read `err.message` / `err?.message` with a fallback. Replacing them with `toErrorMessage(err)` would **change behaviour**: for a thrown string, `err.message` is `undefined` and the fallback shows, while `toErrorMessage` would return the raw string. So add a helper that returns exactly what `err?.message` returned.

**Files:**
- Modify: `src/shared/utils/toError.ts`
- Modify: `src/shared/utils/toError.test.ts`
- Modify (the `catch` sites):
  - `src/components/pullrequests/PullRequestDetailDrawer.tsx:81`
  - `src/components/sidebar/PullRequestsSection.tsx:87`
  - `src/components/rebase/InteractiveRebaseModal.tsx:224`, `:247`
  - `src/components/settings/tabs/GitHubSettingsTab.tsx:68`, `:91`, `:105`
  - `src/components/welcome/CloneModal.tsx:97`, `:129`
  - `src/features/welcome/hooks/useRecentRepositories.ts:60`, `:70`

**Interfaces:**
- Produces: `export function messageOf(err: unknown): string | undefined` in `src/shared/utils/toError.ts`.

- [ ] **Step 1: Write the failing tests**

Append to `src/shared/utils/toError.test.ts` (import `messageOf` next to `toErrorMessage`):

```ts
describe("messageOf", () => {
  it("returns the message of an Error", () => {
    expect(messageOf(new Error("boom"))).toBe("boom");
  });

  it("returns the message field of an AppError-shaped object", () => {
    expect(messageOf({ type: "Git", message: "not a repo" })).toBe("not a repo");
  });

  it("returns undefined for a thrown string, so callers keep their fallback", () => {
    expect(messageOf("raw failure")).toBeUndefined();
  });

  it("returns undefined for null, undefined and non-string message fields", () => {
    expect(messageOf(null)).toBeUndefined();
    expect(messageOf(undefined)).toBeUndefined();
    expect(messageOf({ message: 42 })).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/shared/utils/toError.test.ts`
Expected: FAIL. `messageOf` is not exported.

- [ ] **Step 3: Implement**

Append to `src/shared/utils/toError.ts`:

```ts
/**
 * Returns `err.message` when the thrown value carries a string message
 * (an `Error`, or the `{ type, message }` shape of a Tauri `AppError`), and
 * `undefined` otherwise.
 *
 * Unlike `toErrorMessage`, a thrown string yields `undefined`. That matches
 * what `err?.message` evaluated to in the `catch (err: any)` blocks this
 * replaces, so their `|| fallback` still kicks in exactly as before.
 */
export function messageOf(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "message" in err) {
    const { message } = err as { message: unknown };
    if (typeof message === "string") return message;
  }
  return undefined;
}
```

- [ ] **Step 4: Run to verify pass, then break experiment**

Run: `pnpm vitest run src/shared/utils/toError.test.ts` → PASS.
Break it: make `messageOf` return `String(err)` as its final line. Rerun and confirm the "thrown string" and "null" tests FAIL. Restore.

- [ ] **Step 5: Replace each `catch (err: any)`**

Change every listed clause to `catch (err: unknown)` and replace `err.message` / `err?.message` with `messageOf(err)`. Import `messageOf` from `shared/utils/toError` using the relative path the file already uses for other `shared/` imports. Exact rewrites:

| File:line | Before | After |
| --- | --- | --- |
| `PullRequestDetailDrawer.tsx:82` | `showError(err.message \|\| "Lỗi khi checkout nhánh PR");` | `showError(messageOf(err) \|\| "Lỗi khi checkout nhánh PR");` |
| `PullRequestsSection.tsx:88` | `showError(err.message \|\| "Lỗi khi checkout nhánh PR");` | `showError(messageOf(err) \|\| "Lỗi khi checkout nhánh PR");` |
| `InteractiveRebaseModal.tsx:225` | `…showError(err?.message \|\| "Failed to undo rebase");` | `…showError(messageOf(err) \|\| "Failed to undo rebase");` |
| `InteractiveRebaseModal.tsx:248` | `setError(err?.message \|\| t.modals.interactiveRebase.errorToast.replace("{msg}", String(err)));` | `setError(messageOf(err) \|\| t.modals.interactiveRebase.errorToast.replace("{msg}", String(err)));` |
| `GitHubSettingsTab.tsx` ×3 | `setErrorMessage(err.message \|\| "…");` | `setErrorMessage(messageOf(err) \|\| "…");` (keep each Vietnamese fallback verbatim) |
| `CloneModal.tsx:97` | `} catch (err: any) {` + `console.warn("Folder picker error:", err);` | `} catch (err: unknown) {`, body unchanged |
| `CloneModal.tsx:130` | `setError(typeof err === "string" ? err : err?.message \|\| t.cloneModal.defaultError);` | `setError(typeof err === "string" ? err : messageOf(err) \|\| t.cloneModal.defaultError);` |
| `useRecentRepositories.ts:61` | `setError(err?.message \|\| t.welcome.errorOpen);` | `setError(messageOf(err) \|\| t.welcome.errorOpen);` |
| `useRecentRepositories.ts:71` | `setError(err?.message \|\| \`${t.welcome.errorRecent}${path}\`);` | `setError(messageOf(err) \|\| \`${t.welcome.errorRecent}${path}\`);` |

Line numbers are from commit `5f0cc40`; confirm each with `grep -n "catch (err: any)" <file>` before editing.

- [ ] **Step 6: Verify**

Run: `grep -rn "catch (err: any)" src` → no output.
Run: `pnpm build` → exit 0.
Run: `pnpm vitest run src/test/PullRequestDetailDrawer.test.tsx src/test/PullRequestsSidebar.test.tsx src/test/InteractiveRebaseModal.test.tsx src/test/GitHubSettingsTab.test.tsx src/features/welcome` → PASS, no assertion edits.
Run the count command: `no-explicit-any` drops by 11 (23 → 12).

- [ ] **Step 7: Commit**

```bash
git add src/shared/utils src/components src/features/welcome
git commit -m "🏷️ type catch clauses with messageOf" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Type the GitHub REST payloads in `githubService.ts`

`src/services/githubService.ts` maps GitHub JSON with eight `(x: any)` callbacks, and the label mapping is written out twice (lines ~85 and ~262). Describe the raw payload once and map through small functions.

**Files:**
- Modify: `src/services/githubService.ts`
- Test: `src/test/githubService.test.ts` (existing; must stay green unchanged)

- [ ] **Step 1: Run the existing tests as the baseline**

Run: `pnpm vitest run src/test/githubService.test.ts` → PASS. Note the test count.

- [ ] **Step 2: Add raw payload types and mappers**

Near the top of `githubService.ts`, after the imports, add:

```ts
// Minimal shapes of the GitHub REST payloads this service reads. Every field
// is optional because GitHub omits fields freely; the mappers below apply the
// same `?? default` fallbacks the inline code used.
interface RawGitHubUser {
  login?: string;
  avatar_url?: string;
  html_url?: string;
}

interface RawGitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface RawCheckRun {
  name: string;
  status?: string;
  conclusion?: string | null;
  html_url?: string | null;
}

interface RawPullRequestFile {
  filename: string;
  status: string;
  additions?: number;
  deletions?: number;
  changes?: number;
}

function mapLabel(l: RawGitHubLabel): GitHubLabel {
  return { id: l.id, name: l.name, color: l.color, description: l.description };
}

function mapUserLink(u: RawGitHubUser) {
  return { login: u.login, avatar_url: u.avatar_url, html_url: u.html_url };
}
```

Import `GitHubLabel` from `../ipc/githubApi` with the other `githubApi` types (use `type`). Open `src/ipc/githubApi.ts` and check `GitHubLabel` and `GitHubUserSummary`. If a raw field above does not match the target type (for example `description` is `string` rather than `string | null` there), make the raw type match the **target**, not the other way round, and keep the mapper returning exactly the fields the inline code returned.

- [ ] **Step 3: Replace the `any` callbacks**

- Both `(p.labels || []).map((l: any) => ({ id: l.id, name: l.name, color: l.color, description: l.description }))` → `(p.labels || []).map(mapLabel)`
- `(p.assignees || []).map((a: any) => ({ login: a.login, avatar_url: a.avatar_url, html_url: a.html_url }))` → `(p.assignees || []).map(mapUserLink)`
- `(p.requested_reviewers || []).map((r: any) => ({ … }))` → `(p.requested_reviewers || []).map(mapUserLink)`
- `checksData.check_runs.map((c: any) => {` → `checksData.check_runs.map((c: RawCheckRun) => {` (body unchanged)
- `filesData.map((f: any) => ({` → `filesData.map((f: RawPullRequestFile) => ({` (body unchanged)
- `items.map((p: any) => ({` at ~63: type the list response. Add

  ```ts
  interface RawPullRequest {
    number: number;
    title: string;
    state: string;
    merged_at?: string | null;
    draft?: boolean;
    user?: RawGitHubUser;
    created_at: string;
    updated_at: string;
    head?: { ref?: string; sha?: string };
    base?: { ref?: string; sha?: string };
    comments?: number;
    labels?: RawGitHubLabel[];
    html_url: string;
    body?: string | null;
    mergeable?: boolean | null;
    assignees?: RawGitHubUser[];
    requested_reviewers?: RawGitHubUser[];
  }
  ```

  and write `const items = (await res.json()) as RawPullRequest[];` then `items.map((p) => ({`. Where the detail function reads `const p = await res.json()`, write `const p = (await res.json()) as RawPullRequest;`.

  If `state` must be `PullRequestState`-typed in `GitHubPullRequest`, keep the cast the original code relied on. Check the build error, and if one appears, map with `state: p.state as GitHubPullRequest["state"]`. That keeps the old runtime behaviour: the inline code passed the string through unchecked.

- [ ] **Step 4: Verify**

Run: `grep -n "any" src/services/githubService.ts` → no `: any` / `as any`.
Run: `pnpm build` → exit 0.
Run: `pnpm vitest run src/test/githubService.test.ts src/test/PullRequestDetailDrawer.test.tsx src/test/PullRequestsSidebar.test.tsx src/test/CreatePullRequestModal.test.tsx` → PASS, same counts, no assertion edits.
Count: `no-explicit-any` 12 → 4.

- [ ] **Step 5: Commit**

```bash
git add src/services/githubService.ts
git commit -m "🏷️ type GitHub REST payloads in githubService" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Remaining `any` — dropped file path and test fixtures

**Files:**
- Modify: `src/features/welcome/components/WelcomeScreen.tsx:69`
- Modify: `src/test/InteractiveRebaseModal.test.tsx:62`
- Modify: `src/test/UndoIntegration.test.tsx:19`
- Modify: `src/test/websiteApp.test.ts:21`

- [ ] **Step 1: WelcomeScreen**

Tauri's webview adds a non-standard `path` to dropped `File` objects. Replace

```ts
        const droppedPath = (file as any).path || file.name;
```

with

```ts
        // Tauri's webview adds a non-standard absolute `path` to dropped files.
        const droppedPath = (file as File & { path?: string }).path || file.name;
```

- [ ] **Step 2: InteractiveRebaseModal.test.tsx**

Replace `currentRepo: { path: "/mock/repo", name: "mock-repo" } as any,` with a complete `RepoSummary`:

```ts
      currentRepo: {
        path: "/mock/repo",
        name: "mock-repo",
        is_bare: false,
        head_branch: "main",
        head_commit_id: null,
      },
```

Add `import { type RepoSummary } from "../ipc/bindings.generated";` only if TypeScript needs it for inference (it should not; the store type is enough).

- [ ] **Step 3: UndoIntegration.test.tsx**

`invokeCommand.createCommit` resolves to `CommitDetails` (see `src/ipc/bindings.generated.ts`, `CommitDetails_Serialize`). Replace the `{ id: "oid123", undo_token: "receipt-123" } as any` fixture with a complete object:

```ts
    vi.spyOn(invokeCommand, "createCommit").mockResolvedValue({
      id: "oid123",
      undo_token: "receipt-123",
      full_message: "Add feature",
      author_name: "Test User",
      author_email: "test@example.com",
      author_timestamp_sec: 0,
      parent_ids: [],
      files: [],
      total_additions: 0,
      total_deletions: 0,
    });
```

If `pnpm build` reports a missing or extra field, match the generated type exactly. The fixture must type-check without a cast.

- [ ] **Step 4: websiteApp.test.ts**

The fake window is handed to `new Function(...)` / `vm` to run `website/app.js`. Replace `const fakeWindow: any = {` with `const fakeWindow: Record<string, unknown> = {`. If later lines read nested properties off `fakeWindow` (for example `fakeWindow.document.foo`), declare a local interface with exactly the properties the test touches instead, for example:

```ts
interface FakeWindow {
  navigator: { userAgent: string };
  document: Record<string, unknown>;
  localStorage: Record<string, unknown>;
  I18N_DATA: Record<string, Record<string, string>>;
  [key: string]: unknown;
}
```

- [ ] **Step 5: Verify**

Run: `pnpm build` → exit 0.
Run: `pnpm vitest run src/test/InteractiveRebaseModal.test.tsx src/test/UndoIntegration.test.tsx src/test/websiteApp.test.ts src/features/welcome` → PASS, no assertion edits.
Count: `no-explicit-any` → **0**.

- [ ] **Step 6: Commit**

```bash
git add src/features/welcome src/test
git commit -m "🏷️ remove the last explicit any types" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `max-params` — object key for `compareFileDiff`, exempt `ipc/` wrappers

Three warnings:
- `src/domain/queryKeys.ts:54`: `qk.compareFileDiff` takes 6 positional params. Five of them are strings or booleans, so swapping two by accident type-checks. Convert to `(repo, opts)`.
- `src/ipc/compare.ts:34` `getCompareFileDiff` and `src/ipc/remote.ts:169` `pushRepo`: these wrappers mirror the generated positional bindings 1:1 (`commands.getCompareFileDiff(repoPath, baseRev, …)`), and the Rust command signature decides their arity. Exempt `src/ipc/**` from `max-params` rather than invent an object layer the generated side does not have.

**Files:**
- Modify: `src/domain/queryKeys.ts:50-70`
- Modify: `src/domain/queryKeys.test.ts:100-116`
- Modify: `src/components/compare/CompareDiffViewer.tsx:107`
- Modify: `.oxlintrc.json`

**Interfaces:**
- Produces: `qk.compareFileDiff(repo: string, opts: { baseRev: string; targetRev: string; filePath: string; mode: string; ignoreWhitespace: boolean })`. It returns **the same array** as before: `["repo", repo, "compareFileDiff", baseRev, targetRev, filePath, mode, ignoreWhitespace]`.

- [ ] **Step 1: Update the tests first (call shape only, assertions unchanged)**

In `src/domain/queryKeys.test.ts` (~lines 100–116), rewrite each `qk.compareFileDiff(R, a, b, c, d, e)` call as `qk.compareFileDiff(R, { baseRev: a, targetRev: b, filePath: c, mode: d, ignoreWhitespace: e })`. Keep every `expect(...)` line, and the values compared, exactly as they are. Then add one test pinning the array layout, so the refactor cannot silently reorder the key:

```ts
  it("keeps the compareFileDiff key layout stable", () => {
    expect(
      qk.compareFileDiff(REPO, {
        baseRev: "main",
        targetRev: "dev",
        filePath: "a.ts",
        mode: "twodot",
        ignoreWhitespace: true,
      })
    ).toEqual(["repo", REPO, "compareFileDiff", "main", "dev", "a.ts", "twodot", true]);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/domain/queryKeys.test.ts` → FAIL (type or arity mismatch).

- [ ] **Step 3: Implement**

In `src/domain/queryKeys.ts` replace the `compareFileDiff` entry with:

```ts
  compareFileDiff: (
    repo: string,
    {
      baseRev,
      targetRev,
      filePath,
      mode,
      ignoreWhitespace,
    }: {
      baseRev: string;
      targetRev: string;
      filePath: string;
      mode: string;
      ignoreWhitespace: boolean;
    }
  ) =>
    [
      "repo",
      repo,
      "compareFileDiff",
      baseRev,
      targetRev,
      filePath,
      mode,
      ignoreWhitespace,
    ] as const,
```

Keep the docblock above it. Keep `as const` only if the original entry had it; match the original's return form exactly.

In `src/components/compare/CompareDiffViewer.tsx:107`:

```ts
    queryKey: qk.compareFileDiff(repoPath, {
      baseRev,
      targetRev,
      filePath,
      mode,
      ignoreWhitespace: diffIgnoreWhitespace,
    }),
```

Run `grep -rn "compareFileDiff(" src` and update any other caller the same way.

- [ ] **Step 4: Exempt `src/ipc/**` from `max-params`**

Do not reuse the existing override whose `files` is `["src/features/*/api/**", "src/ipc/**"]`: it also covers `features/*/api`, which must keep `max-params`. Add a separate override to `.oxlintrc.json`:

```json
    {
      "files": ["src/ipc/**"],
      "rules": {
        "max-params": "off"
      }
    }
```

- [ ] **Step 5: Verify, break experiment, commit**

Run: `pnpm vitest run src/domain/queryKeys.test.ts src/components/compare` → PASS.
Break experiment: swap `baseRev` and `targetRev` in the returned array. The layout test must FAIL. Restore.
Run: `pnpm build` → exit 0; `pnpm check-query-keys` → clean. Count: `max-params` → **0**.

```bash
git add src/domain .oxlintrc.json src/components/compare
git commit -m "♻️ pass compareFileDiff key options as an object" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Hook dependency, nesting, export and console fixes

Seven warnings, each fixed so that behaviour stays the same:

| Warning | File | Fix |
| --- | --- | --- |
| `exhaustive-deps` | `src/features/history/components/CommitDetailPanel.tsx:47-55` | Wrap `handleClose` in `useCallback`, depend on it |
| `exhaustive-deps` | `src/components/pullrequests/CreatePullRequestModal.tsx:72-89` | Add the two read values to deps. The `prevOpenRef` transition guard makes re-runs no-ops |
| `exhaustive-deps` | `src/features/history/components/CommitGraph.tsx:76-78` | Memoise `commits` on `data` |
| `exhaustive-deps` | `src/features/welcome/hooks/useWelcomeShortcuts.ts` | Latest-callbacks ref |
| `max-nested-callbacks` | `src/store/useToastStore.ts:107-113` | Hoist the filter into a module function |
| `only-export-components` | `src/components/welcome/CloneModal.tsx:16` | Move `extractRepoNameFromUrl` to its own module |
| `no-console` | `src/App.tsx:279` | Delete the debug `console.log` |

**Files:**
- Modify: the seven files above
- Create: `src/components/welcome/repoUrl.ts`
- Create: `src/components/welcome/repoUrl.test.ts`
- Test: `src/features/welcome/hooks/useWelcomeShortcuts.test.ts` (create if absent; check with `ls src/features/welcome/hooks`)

- [ ] **Step 1: `extractRepoNameFromUrl` — write the failing test**

Create `src/components/welcome/repoUrl.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractRepoNameFromUrl } from "./repoUrl";

describe("extractRepoNameFromUrl", () => {
  it("takes the last path segment of an https URL and drops .git", () => {
    expect(extractRepoNameFromUrl("https://github.com/acme/widget.git")).toBe("widget");
  });

  it("handles scp-style SSH URLs", () => {
    expect(extractRepoNameFromUrl("git@github.com:acme/widget.git")).toBe("widget");
  });

  it("ignores trailing slashes and surrounding whitespace", () => {
    expect(extractRepoNameFromUrl("  https://github.com/acme/widget/  ")).toBe("widget");
  });

  it("returns an empty string for an empty URL", () => {
    expect(extractRepoNameFromUrl("")).toBe("");
  });
});
```

Run: `pnpm vitest run src/components/welcome/repoUrl.test.ts` → FAIL (module missing).

- [ ] **Step 2: Move the function**

Create `src/components/welcome/repoUrl.ts`, moving the body verbatim from `CloneModal.tsx:16-22`:

```ts
/** Derives the folder name a clone of `url` would get (`…/widget.git` → `widget`). */
export const extractRepoNameFromUrl = (url: string): string => {
  const cleanUrl = url.trim().replace(/\/+$/, "");
  const withoutGit = cleanUrl.endsWith(".git") ? cleanUrl.slice(0, -4) : cleanUrl;
  const parts = withoutGit.split(/[/:]/);
  const lastPart = parts.pop();
  return lastPart ? lastPart.trim() : "";
};
```

In `CloneModal.tsx` delete the old definition and add `import { extractRepoNameFromUrl } from "./repoUrl";`. Run `grep -rn "extractRepoNameFromUrl" src` and repoint any other importer.
Run the test → PASS. Break experiment: remove the `.git` stripping, confirm the first two tests FAIL, restore.

- [ ] **Step 3: `CommitDetailPanel` Escape handler**

`handleClose` is a new function every render, and the effect only lists `[onClose]`. It works today because the other things `handleClose` reads (`setDetailPanelOpen`, `setSelectedCommit`) are stable store setters, but the lint rule cannot know that. Make it explicit without changing behaviour:

```tsx
  const handleClose = useCallback(() => {
    // body unchanged from the current handleClose
  }, [onClose, setDetailPanelOpen, setSelectedCommit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);
```

List exactly the identifiers the current `handleClose` body reads in the `useCallback` deps. Add `useCallback` to the React import. Do **not** switch to `useEscapeKey`: that would make the panel ignore Escape while a modal is stacked above it, which is a behaviour change this task does not make (record it as a candidate improvement in the status doc instead).

- [ ] **Step 4: `CreatePullRequestModal` reset effect**

The effect body only acts on the open/close **transition**, which `prevOpenRef` tracks, so re-running it when data changes is a no-op. Change the dependency list from `[isOpen]` to:

```tsx
  }, [isOpen, repoInfo?.default_branch, branchData?.current_branch]);
```

Keep the existing comment `// Reset form only when modal opens`.

- [ ] **Step 5: `CommitGraph` commits array**

Replace

```tsx
  const commits = data ? data.pages.flatMap((page) => page.commits) : [];
```

with

```tsx
  const commits = useMemo(
    () => (data ? data.pages.flatMap((page) => page.commits) : []),
    [data]
  );
```

This also makes the existing `maxCols` memo effective; previously it recomputed on every render.

- [ ] **Step 6: `useWelcomeShortcuts` — write the failing test**

The effect registers once (`[]`) and calls the callbacks captured on the first render. REFACTOR_STATUS.md §6 records this as verbatim-from-original. The fix keeps the single registration but always calls the **latest** callbacks, and a test pins that. If `src/features/welcome/hooks/useWelcomeShortcuts.test.ts` exists, add this case to it; otherwise create the file:

```ts
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWelcomeShortcuts } from "./useWelcomeShortcuts";

describe("useWelcomeShortcuts", () => {
  it("calls the latest openFolder after a re-render", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const noop = () => {};
    const { rerender } = renderHook(
      ({ openFolder }) =>
        useWelcomeShortcuts({ openFolder, openClone: noop, focusSearch: noop, clearSearch: noop }),
      { initialProps: { openFolder: first } }
    );

    rerender({ openFolder: latest });
    fireEvent.keyDown(window, { key: "o", ctrlKey: true });

    expect(latest).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });
});
```

Run: `pnpm vitest run src/features/welcome/hooks` → the new test FAILS (`first` is called).

- [ ] **Step 7: Implement the latest-callbacks ref**

In `useWelcomeShortcuts.ts`:

```ts
import { useEffect, useRef } from "react";

// …interface unchanged…

export function useWelcomeShortcuts(options: UseWelcomeShortcutsOptions): void {
  // Read through a ref so the listener registers once but always calls the
  // callbacks from the latest render.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { openFolder, openClone, focusSearch, clearSearch } = optionsRef.current;
      // …rest of the handler body unchanged…
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
```

Keep the existing docblock. Update the sentence "Moved intact from the old `WelcomeScreen` component." to add: "It always calls the latest callbacks; the original captured the first render's."
Run the test → PASS. Break experiment: read `options` directly instead of `optionsRef.current` inside the handler, confirm FAIL, restore.

- [ ] **Step 8: `useToastStore.removeToast`**

Add above `create(...)`:

```ts
function withoutToast(toasts: ToastItem[], id: string): ToastItem[] {
  return toasts.filter((t) => t.id !== id);
}
```

and change the body of `removeToast` to:

```ts
  removeToast: (id) => {
    safeFlushSync(() => {
      set((state) => ({ toasts: withoutToast(state.toasts, id) }));
    });
  },
```

- [ ] **Step 9: `App.tsx` console.log**

Delete line 279, `console.log("🔔 [Event] repo-changed payload:", payload);`. Leave the rest of the listener unchanged.

- [ ] **Step 10: Verify**

Run: `pnpm build` → exit 0.
Run: `pnpm test` → all green. The file count goes up by 1–2 for the new test files.
Count: `exhaustive-deps`, `max-nested-callbacks`, `only-export-components`, `no-console` all **0**.

- [ ] **Step 11: Commit**

```bash
git add src
git commit -m "🐛 fix hook dependencies and remaining small lint warnings" -m "useWelcomeShortcuts now calls the latest callbacks instead of the first render's; pinned by a test. The other fixes preserve behaviour." -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Raise the cleared rules to `error` and record status

**Files:**
- Modify: `.oxlintrc.json`
- Modify: `docs/superpowers/REFACTOR_STATUS.md`

- [ ] **Step 1: Confirm zero for every rule being raised**

Run the count command. None of these may appear: `no-console`, `no-explicit-any`, `exhaustive-deps`, `max-params`, `max-nested-callbacks`, `only-export-components`, `max-depth`. If any does, fix it before continuing. Do not raise a rule that is not at zero.

- [ ] **Step 2: Raise them**

In `.oxlintrc.json` `rules`:

```json
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "typescript/no-explicit-any": "error",
    "react/exhaustive-deps": "error",
    "react/only-export-components": ["error", { "allowConstantExport": true }],
    "max-depth": ["error", 4],
    "max-params": ["error", 5],
    "max-nested-callbacks": ["error", 3],
```

Leave `no-restricted-imports`, `max-lines`, `max-lines-per-function` and `complexity` at `warn` (slices 7b and 7c).

- [ ] **Step 3: Prove the ratchet bites**

Temporarily add `const _probe: any = 1; export { _probe };` to `src/shared/utils/git.ts`, run `pnpm lint`, and confirm **exit code 1** with an `error typescript(no-explicit-any)` line. Remove the probe and run `pnpm lint` again → exit 0.

- [ ] **Step 4: Full verification**

Run: `pnpm lint` → exit 0; record the total warning count (expected ≤ 152: `no-restricted-imports` 24, `max-lines-per-function` ≤ 90, `complexity` ≤ 28, `max-lines` ≤ 10).
Run: `pnpm build`, `pnpm test`, `pnpm check-comment-language`, `pnpm check-query-keys` → all green. Record the test file/test counts.

- [ ] **Step 5: Update REFACTOR_STATUS.md**

- Header: under **Tiến độ**, note that GĐ7 is split into 7a/7b/7c and 7a is done. **Việc tiếp theo** → GĐ7b (the 24 runtime `ipc/` imports) with this plan's roadmap table.
- §3: add a "Giai đoạn 7a" subsection. Include the rule-by-rule before/after counts; the `allowTypeImports` finding (70 → 24, verified by probe; oxlint had been counting type imports all along, so the "70" progress metric in §3/§6 overstated the remaining work by 46); the exemptions and their reasons (`scripts/**` no-console, i18n dictionaries max-lines, `src/ipc/**` max-params); and the one intended behaviour change (`useWelcomeShortcuts`).
- §3 metrics table: update the `pnpm lint` row with the new warning count and the rules now at `error`.
- §4: split row 7 into 7a ✅ / 7b / 7c.
- §6: remove the `useWelcomeShortcuts` stale-closure row and the "oxlint `no-restricted-imports` counts type imports" row (both resolved). Add "`CommitDetailPanel` listens for Escape on `window` directly, so Escape closes it even under a stacked modal; `useEscapeKey` would fix this, but it is a behaviour change" as a Minor, deferred item.

- [ ] **Step 6: Commit**

```bash
git add .oxlintrc.json docs/superpowers/REFACTOR_STATUS.md
git commit -m "🔧 raise seven cleared lint rules to error" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```
