# Shared Enum Constants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bare status/kind string literals in production code with shared `as const` constants in `src/domain/enums/`, and give each concept a single type declaration.

**Architecture:** `src/domain/enums.ts` becomes a folder split by where a value comes from (`git.ts`, `github.ts`, `app.ts`) behind an `index.ts` barrel, so `import … from "…/domain/enums"` keeps resolving. Each later task adds the constants it needs, pins behavior with tests, then swaps literals mechanically. Duplicate types become aliases or re-exports of the `domain` type.

**Tech Stack:** TypeScript, React, Vitest (`expectTypeOf`), Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-05-shared-enum-constants-design.md`

## Global Constraints

- Pattern: `export const X = { KEY: "value" } as const;` plus `export type T = (typeof X)[keyof typeof X];`. No TypeScript `enum`.
- Production files under `src/domain/` import nothing. Only `src/domain/enums/enums.test.ts` imports from `ipc/`, and only with `import type`.
- Do not change the Rust side.
- Do not touch UI variants (`AlertVariant`, toast types, `ButtonVariant`, sizes) even when they spell `"success"` / `"error"`.
- Test assertions keep literal strings. Do not rewrite existing assertions to use constants.
- IPC mock fixtures (`src/ipc/history.ts` mock data, `src/ipc/mocks/**`) keep literals; they are fixtures.
- A refactor is mechanical: no logic change. Pin behavior with a test first where none exists.
- Lint limits are fixed (300 lines/file, 80 lines/function, complexity 15). No `eslint-disable` / `oxlint-disable`. If a file hits a limit, stop and report.
- All code and comments in English. Commit messages use Gitmoji, no scopes, and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No Playwright E2E changes.
- Every commit passes `pnpm check`. Run `pnpm format` before it (Prettier wraps lines that grow).
- Do not stage `src/ipc/bindings.generated.ts` (it has an unrelated line-ending change in the working tree).

## File Structure

| File | Responsibility |
|---|---|
| `src/domain/enums/git.ts` (create) | Values produced by the Rust backend |
| `src/domain/enums/github.ts` (create) | Values produced by the GitHub API |
| `src/domain/enums/app.ts` (create) | Frontend-only values compared across modules |
| `src/domain/enums/index.ts` (create) | Barrel |
| `src/domain/enums/enums.test.ts` (move from `src/domain/enums.test.ts`) | Wire-value and binding-sync tests |
| `src/domain/constants/app.ts` (modify) | Add `HOME_TAB_ID` |
| `docs/CODING_RULES.md` (modify) | Point "String unions" to the folder, add the comparison rule |

## Additions over the spec

Found while mapping call sites. Task 8 records them in the spec.

- `CHECK_RUN_CONCLUSION` (`success`): the raw GitHub `conclusion` read by `mapCheckRunStatus`, distinct from the mapped `CHECK_STATUS`.
- `PR_FILE_STATUS` (`added`, `modified`, `removed`, `renamed`): the GitHub PR file status, which differs from git's `CHANGE_TYPE`.
- `HOME_TAB_ID` (`"home"`) in `domain/constants/app.ts`: the home tab's id, compared in several places. Not the same thing as `TAB_TYPE.HOME`.
- Settings scope is split from screen/tab, so there are 8 commits instead of 7.

## Explicitly out of scope (look alike, different concept)

- `InspectorTab` `"history"` (`openInspector(path, "history")`, `FileInspectorHeader`).
- `WordDiffType` `"added"` / `"removed"` in `components/diff/DiffLineContent.tsx`.
- Branch menu `activeMenu.type === "remote" | "tag"` in `features/branch/hooks/useBranchSectionsView.ts`.
- Sidebar dialog kinds `"merge"` / `"rebase"` (`features/branch/model/sidebarDialog.ts`, `RemoteBranchMenu.tsx`, `BranchSidebarMergeDialogs.tsx`).
- `GraphSvgEdge` `edge_type === "merge"`.
- Graph dialog `{ type: "closed" }`.
- The frontend-only `"Untracked"` pseudo-status in `components/changes/`.
- `commandRegistry.ts` `navigate` type and keyword strings.
- `useRemoteTask` `status: "success"` (remote task UI state, not CI).

---

### Task 1: Split `domain/enums` into a folder and add binding-sync checks

**Files:**
- Create: `src/domain/enums/git.ts`, `src/domain/enums/github.ts`, `src/domain/enums/app.ts`, `src/domain/enums/index.ts`
- Move: `src/domain/enums.test.ts` → `src/domain/enums/enums.test.ts`
- Delete: `src/domain/enums.ts`

**Interfaces:**
- Produces: `CHANGE_TYPE`, `ChangeType`, `CONFIG_SCOPE`, `ConfigScope` from `git.ts`; `PR_STATE`, `PullRequestState`, `CHECK_STATUS`, `CheckStatus` from `github.ts`; `SCREEN_TYPE`, `ScreenType` from `app.ts`; all re-exported by `index.ts`.

- [ ] **Step 1: Create the folder with the existing constants moved verbatim**

Move the file-level doc comment into `index.ts` and each constant (with its comment) into its file, unchanged.

`src/domain/enums/git.ts`:

```ts
/**
 * Values produced by the Rust backend. They MUST match the backend's strings
 * exactly; changing one here without changing Rust causes runtime bugs.
 */

/**
 * The kind of change a file underwent in a diff (Git diff).
 * Source: bindings.ts FileChange.change_type, from src-tauri/src/read/diff.rs
 *
 * WARNING: the GitHub API uses different wording for the same concept.
 * PullRequestFileItem.status uses "removed" instead of "deleted".
 * Do NOT use CHANGE_TYPE to compare against a GitHub status; use PR_FILE_STATUS.
 */
export const CHANGE_TYPE = {
  ADDED: "added",
  MODIFIED: "modified",
  DELETED: "deleted",
  RENAMED: "renamed",
} as const;
export type ChangeType = (typeof CHANGE_TYPE)[keyof typeof CHANGE_TYPE];

/** Git config scope. Source: bindings.ts ConfigScope */
export const CONFIG_SCOPE = {
  GLOBAL: "global",
  LOCAL: "local",
} as const;
export type ConfigScope = (typeof CONFIG_SCOPE)[keyof typeof CONFIG_SCOPE];
```

`src/domain/enums/github.ts`:

```ts
/** Values produced by the GitHub REST API (see src/ipc/githubApi.ts). */

/** Pull request state, as sent to and returned by the GitHub API. */
export const PR_STATE = {
  OPEN: "open",
  CLOSED: "closed",
  ALL: "all",
} as const;
export type PullRequestState = (typeof PR_STATE)[keyof typeof PR_STATE];

/** CI check status after mapping a GitHub check run (see mapCheckRunStatus). */
export const CHECK_STATUS = {
  SUCCESS: "success",
  FAILURE: "failure",
  IN_PROGRESS: "in_progress",
  QUEUED: "queued",
  NEUTRAL: "neutral",
} as const;
export type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];
```

`src/domain/enums/app.ts`:

```ts
/** Frontend-only values compared in more than one module. */

/** The screen currently shown in a repo tab. */
export const SCREEN_TYPE = {
  HISTORY: "history",
  CHANGES: "changes",
  CONFLICT: "conflict",
  PULL_REQUESTS: "pull-requests",
} as const;
export type ScreenType = (typeof SCREEN_TYPE)[keyof typeof SCREEN_TYPE];
```

`src/domain/enums/index.ts`:

```ts
/**
 * Constants for string values compared across the app.
 *
 * Uses `as const` instead of a TypeScript `enum`: an enum generates runtime
 * code, whereas `as const` is plain data and infers a more precise type.
 *
 * - git.ts: values produced by the Rust backend
 * - github.ts: values produced by the GitHub API
 * - app.ts: frontend-only values
 */
export * from "./git";
export * from "./github";
export * from "./app";
```

Delete `src/domain/enums.ts`.

- [ ] **Step 2: Move the test and fix its import**

```bash
git mv src/domain/enums.test.ts src/domain/enums/enums.test.ts
```

In the moved file change `from "./enums"` to `from "."`. Keep every existing `it(...)` unchanged.

- [ ] **Step 3: Add the compile-time binding-sync check for `CONFIG_SCOPE`**

Append to `src/domain/enums/enums.test.ts` (merge `expectTypeOf` into the existing `vitest` import and `type ConfigScope` into the `"."` import):

```ts
import type { ConfigScope as BindingConfigScope } from "../../ipc/bindings.generated";

describe("enums stay in sync with generated bindings", () => {
  // These are compile-time checks: `pnpm build` runs tsc over test files, so a
  // variant added or removed in Rust fails the build once bindings regenerate.
  it("CONFIG_SCOPE matches ConfigScope", () => {
    expectTypeOf<ConfigScope>().toEqualTypeOf<BindingConfigScope>();
  });
});
```

- [ ] **Step 4: Prove the sync check fails when it should**

Temporarily change `LOCAL: "local"` to `LOCAL: "locall"` in `git.ts`.
Run: `pnpm typecheck`
Expected: a type error in `src/domain/enums/enums.test.ts` on the `toEqualTypeOf` line. Revert the change.

- [ ] **Step 5: Run checks**

Run: `pnpm typecheck && pnpm test src/domain`
Expected: PASS. `rg -n "domain/enums" src` shows only paths that now resolve to the folder.

- [ ] **Step 6: Commit**

```bash
pnpm format
pnpm check
git add src/domain
git commit -F - <<'EOF'
♻️ split domain enums into git, github and app modules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: `REBASE_ACTION` in interactive rebase

**Files:**
- Modify: `src/domain/enums/git.ts`, `src/domain/enums/enums.test.ts`
- Modify: `src/components/rebase/InteractiveRebaseModal.actions.ts:75`, `rebaseActionColor.ts:9-17`, `RebaseActionPills.tsx:26-62`, `RebaseCommitRow.tsx:41-43`, `rebaseProjection.ts:38,49,80,85,91`, `RebaseSquashFixupPills.tsx:26-51`, `rebaseStepsHelpers.ts:7,26,29-30,35`, `useInteractiveRebase.handlers.ts:58`, `useInteractiveRebase.ts:80`
- Existing tests that pin behavior: `src/test/rebaseActionColor.test.ts`, `src/test/rebaseProjection.test.ts`, `src/test/rebaseStepsHelpers.test.ts`, `src/test/RebaseCommitRow.test.tsx`, `src/test/InteractiveRebaseModal.test.tsx` (covers the pills: Squash/Fixup disabled on first commit, Reword textarea, Drop metric)

**Interfaces:**
- Produces: `REBASE_ACTION = { PICK: "Pick", REWORD: "Reword", SQUASH: "Squash", FIXUP: "Fixup", DROP: "Drop" }`, `type RebaseActionKind`.

- [ ] **Step 1: Write the failing test**

Add to `src/domain/enums/enums.test.ts` (extend imports with `REBASE_ACTION`, `type RebaseActionKind`, and `type RebaseActionKind as BindingRebaseActionKind` from bindings):

```ts
it("REBASE_ACTION matches RebaseActionKind", () => {
  expectTypeOf<RebaseActionKind>().toEqualTypeOf<BindingRebaseActionKind>();
});
```

Put it inside the `"enums stay in sync with generated bindings"` block.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm typecheck`
Expected: FAIL, `REBASE_ACTION` / `RebaseActionKind` not exported from `"."`.

- [ ] **Step 3: Add the constant to `git.ts`**

```ts
/** Interactive rebase step action. Source: bindings.ts RebaseActionKind */
export const REBASE_ACTION = {
  PICK: "Pick",
  REWORD: "Reword",
  SQUASH: "Squash",
  FIXUP: "Fixup",
  DROP: "Drop",
} as const;
export type RebaseActionKind = (typeof REBASE_ACTION)[keyof typeof REBASE_ACTION];
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm typecheck && pnpm test src/domain`
Expected: PASS.

- [ ] **Step 5: Confirm the pinning tests pass before the swap**

Run: `pnpm test src/test/rebaseActionColor.test.ts src/test/rebaseProjection.test.ts src/test/rebaseStepsHelpers.test.ts src/test/RebaseCommitRow.test.tsx src/test/InteractiveRebaseModal.test.tsx`
Expected: PASS.

- [ ] **Step 6: Swap literals**

In each listed file add `import { REBASE_ACTION } from "<relative>/domain/enums";` (from `src/components/rebase/` the path is `../../domain/enums`) and replace:

| Literal | Replacement |
|---|---|
| `"Pick"` | `REBASE_ACTION.PICK` |
| `"Reword"` | `REBASE_ACTION.REWORD` |
| `"Squash"` | `REBASE_ACTION.SQUASH` |
| `"Fixup"` | `REBASE_ACTION.FIXUP` |
| `"Drop"` | `REBASE_ACTION.DROP` |

This applies to comparisons, `case` labels, `onActionChange(...)` arguments, `getRebaseActionColor(...)` first arguments and object fields such as `action: "Pick"`. Example from `rebaseActionColor.ts`:

```ts
switch (action) {
  case REBASE_ACTION.PICK:
    // unchanged body
  case REBASE_ACTION.REWORD:
```

Do not touch `src/i18n/*.ts` (user-facing labels that happen to spell the same words).

- [ ] **Step 7: Verify no literals remain and tests pass**

Run: `rg -n "\"(Pick|Reword|Squash|Fixup|Drop)\"" src/components/rebase --glob "!*.test.*"`
Expected: no output.
Run: `pnpm typecheck && pnpm lint && pnpm test src/test src/domain`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
pnpm format
pnpm check
git add src/domain src/components/rebase
git commit -F - <<'EOF'
♻️ use REBASE_ACTION in interactive rebase

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: `OPERATION_STATUS` for merge, rebase, cherry-pick and revert results

**Files:**
- Modify: `src/domain/enums/git.ts`, `src/domain/enums/enums.test.ts`
- Modify: `src/components/merge/RebaseBranchModal.tsx:46`, `src/components/merge/useMergeBranchModal.ts:36`, `src/components/rebase/InteractiveRebaseModal.actions.ts:91`, `src/features/history/components/CherryPickModal.tsx:60`, `src/features/history/components/RevertModal.tsx:57`, `src/features/history/components/CommitGraphDialogs.actions.ts:32,45,49`, `src/ipc/commitActions.ts:19,36` (browser fallback that returns wire values)
- Test: `src/test/MergeRebaseModals.test.tsx` (strengthen), existing `CherryPickModal.test.tsx`, `RevertModal.test.tsx`, `CommitGraphDialogs.actions.test.ts`, `InteractiveRebaseModal.test.tsx`

**Interfaces:**
- Produces: `OPERATION_STATUS = { COMMITTED: "Committed", STAGED: "Staged", CONFLICT: "Conflict", ERROR: "Error" }`, `type OperationStatus`.

Only the values the frontend compares or produces are included. Rust also returns `Merged`, `FastForward`, `AlreadyUpToDate`, `Success`; nothing compares them, so they are not added.

- [ ] **Step 1: Write the failing wire-value test**

Add to `src/domain/enums/enums.test.ts`:

```ts
it("OPERATION_STATUS matches the status strings Rust returns", () => {
  // String in Rust: src-tauri/src/exec/commit_actions.rs, src-tauri/src/exec/merge.rs,
  // src-tauri/src/exec/rebase.rs. Not a generated union, so tsc cannot check it.
  expect(OPERATION_STATUS).toEqual({
    COMMITTED: "Committed",
    STAGED: "Staged",
    CONFLICT: "Conflict",
    ERROR: "Error",
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/domain`
Expected: FAIL, `OPERATION_STATUS` is undefined / not exported.

- [ ] **Step 3: Add the constant to `git.ts`**

```ts
/**
 * Result status of merge, rebase, cherry-pick and revert commands.
 * Rust returns these as a plain String (exec/commit_actions.rs, exec/merge.rs,
 * exec/rebase.rs), so bindings type the field as `string`.
 */
export const OPERATION_STATUS = {
  COMMITTED: "Committed",
  STAGED: "Staged",
  CONFLICT: "Conflict",
  ERROR: "Error",
} as const;
export type OperationStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/domain`
Expected: PASS.

- [ ] **Step 5: Strengthen the conflict pins in `MergeRebaseModals.test.tsx`**

The existing merge test `"surfaces a conflict result and stays open"` asserts only that the modal stays open. Add an assertion that the conflict message is the one shown, and add the same test for the rebase modal inside `describe("RebaseBranchModal", ...)`:

```ts
// in "surfaces a conflict result and stays open" (MergeBranchModal), after the existing expects:
expect(
  await screen.findByText(
    "Xung đột khi gộp nhánh. Vui lòng giải quyết xung đột trước khi tiếp tục."
  )
).toBeInTheDocument();
```

```ts
it("shows the conflict message when rebase reports a conflict", async () => {
  const onClose = vi.fn();
  const onRebase = vi.fn().mockResolvedValue({ success: false, status: "Conflict", output: "" });
  render(<RebaseBranchModal {...rebaseProps} onClose={onClose} onRebase={onRebase} />);

  fireEvent.click(screen.getByRole("button", { name: /Rebase/i }));

  expect(
    await screen.findByText("Rebase bị xung đột. Hãy giải quyết conflict rồi dùng Continue.")
  ).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});
```

If `getByRole("button", { name: /Rebase/i })` matches more than one button, use the same submit-button query the other `RebaseBranchModal` tests in this file use.

- [ ] **Step 6: Run the pins against the current code**

Run: `pnpm test src/test/MergeRebaseModals.test.tsx src/features/history/components/CherryPickModal.test.tsx src/features/history/components/RevertModal.test.tsx src/features/history/components/CommitGraphDialogs.actions.test.ts src/test/InteractiveRebaseModal.test.tsx`
Expected: PASS (the code already behaves this way).

- [ ] **Step 7: Swap literals**

Add `import { OPERATION_STATUS } from "<relative>/domain/enums";` to each listed file and replace `"Committed"`, `"Staged"`, `"Conflict"` with `OPERATION_STATUS.COMMITTED`, `.STAGED`, `.CONFLICT`. Example (`useMergeBranchModal.ts`):

```ts
if (res.status === OPERATION_STATUS.CONFLICT) {
```

`src/ipc/commitActions.ts` (both places):

```ts
status: autoCommit ? OPERATION_STATUS.COMMITTED : OPERATION_STATUS.STAGED,
```

Relative paths: from `src/components/merge/` and `src/components/rebase/` use `../../domain/enums`; from `src/features/history/components/` use `../../../domain/enums`; from `src/ipc/` use `../domain/enums`.

- [ ] **Step 8: Verify and run tests**

Run: `rg -n "\"(Committed|Staged|Conflict)\"" src --glob "!*.test.*" --glob "!src/test/**" --glob "!src/domain/**" --glob "!src/i18n/**"`
Expected: no output.
Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
pnpm format
pnpm check
git add src/domain src/components/merge src/components/rebase src/features/history src/ipc/commitActions.ts src/test/MergeRebaseModals.test.tsx
git commit -F - <<'EOF'
♻️ use OPERATION_STATUS for merge, rebase, cherry-pick and revert results

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: `CHECK_STATUS`, `PR_STATE`, `PR_STATUS` and GitHub file status in pull requests

**Files:**
- Modify: `src/domain/enums/github.ts`, `src/domain/enums/enums.test.ts`
- Modify: `src/ipc/githubApi.ts:10,28,47,57`
- Modify: `src/services/githubService.ts:120-125,217`
- Modify: `src/components/pullrequests/PullRequestCiChecks.tsx:27-31`
- Modify: `src/features/pullrequests/components/PullRequestConversationView.tsx:30-36`
- Modify: `src/components/pullrequests/pullRequestStatusKey.ts:3,20-25`
- Modify: `src/features/pullrequests/model/pullRequestStatus.ts:3,8-11`
- Modify: `src/features/pullrequests/hooks/usePullRequestsScreen.ts:11`, `src/features/pullrequests/hooks/usePullRequestsScreen.actions.ts:55`, `src/features/pullrequests/api/usePullRequests.ts:7`
- Modify: `src/features/pullrequests/components/PullRequestsMasterPane.tsx:89-121`
- Modify: `src/features/pullrequests/components/PullRequestFilesChangedView.tsx:21-36`
- Create: `src/components/pullrequests/PullRequestCiChecks.test.tsx`
- Existing pins: `src/test/githubServiceMappers.test.ts`, `src/features/pullrequests/components/PullRequestConversationView.test.tsx`, `src/components/pullrequests/pullRequestStatusKey.test.ts`, `src/features/pullrequests/model/pullRequestStatus.test.ts`, `src/features/pullrequests/components/PullRequestFilesChangedView.test.tsx`, `src/features/pullrequests/hooks/usePullRequestsScreen.actions.test.ts`

**Interfaces:**
- Consumes: `CHECK_STATUS`, `CheckStatus`, `PR_STATE`, `PullRequestState` (Task 1).
- Produces: `CHECK_RUN_STATE = { COMPLETED: "completed", IN_PROGRESS: "in_progress", QUEUED: "queued" }`; `CHECK_RUN_CONCLUSION = { SUCCESS: "success" }`; `PR_STATUS = { MERGED: "merged", CLOSED: "closed", DRAFT: "draft", OPEN: "open" }`, `type PullRequestStatus`; `PR_FILE_STATUS = { ADDED: "added", MODIFIED: "modified", REMOVED: "removed", RENAMED: "renamed" }`, `type PullRequestFileStatus`.

- [ ] **Step 1: Write the failing wire-value tests**

Add to `src/domain/enums/enums.test.ts`:

```ts
it("CHECK_RUN_STATE and CHECK_RUN_CONCLUSION match GitHub check-run fields", () => {
  expect(CHECK_RUN_STATE).toEqual({
    COMPLETED: "completed",
    IN_PROGRESS: "in_progress",
    QUEUED: "queued",
  });
  expect(CHECK_RUN_CONCLUSION).toEqual({ SUCCESS: "success" });
});

it("PR_STATUS lists the badge statuses", () => {
  expect(Object.values(PR_STATUS).sort()).toEqual(["closed", "draft", "merged", "open"]);
});

it("PR_FILE_STATUS matches GitHub's pull request file status", () => {
  expect(Object.values(PR_FILE_STATUS).sort()).toEqual([
    "added",
    "modified",
    "removed",
    "renamed",
  ]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/domain`
Expected: FAIL, the new constants are not exported.

- [ ] **Step 3: Add the constants to `github.ts`**

```ts
/** Raw `status` of a GitHub check run, before mapCheckRunStatus maps it. */
export const CHECK_RUN_STATE = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
  QUEUED: "queued",
} as const;

/** Raw `conclusion` of a completed GitHub check run that the app reads. */
export const CHECK_RUN_CONCLUSION = {
  SUCCESS: "success",
} as const;

/** Badge status of a pull request, derived from merged_at, state and draft. */
export const PR_STATUS = {
  MERGED: "merged",
  CLOSED: "closed",
  DRAFT: "draft",
  OPEN: "open",
} as const;
export type PullRequestStatus = (typeof PR_STATUS)[keyof typeof PR_STATUS];

/** `status` of a file in a GitHub pull request. GitHub says "removed", git says "deleted". */
export const PR_FILE_STATUS = {
  ADDED: "added",
  MODIFIED: "modified",
  REMOVED: "removed",
  RENAMED: "renamed",
} as const;
export type PullRequestFileStatus = (typeof PR_FILE_STATUS)[keyof typeof PR_FILE_STATUS];
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/domain`
Expected: PASS.

- [ ] **Step 5: Write the pin test for `PullRequestCiChecks` (no test exists)**

Create `src/components/pullrequests/PullRequestCiChecks.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PullRequestCiChecks } from "./PullRequestCiChecks";
import { vi as viTranslations } from "../../i18n/vi";
import type { CheckRunItem } from "../../ipc/githubApi";

function renderRun(status: CheckRunItem["status"]) {
  return render(
    <PullRequestCiChecks checkRuns={[{ name: "build", status, details_url: null }]} t={viTranslations} />
  );
}

describe("PullRequestCiChecks", () => {
  it("renders nothing without check runs", () => {
    const { container } = render(<PullRequestCiChecks checkRuns={[]} t={viTranslations} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks a successful run green", () => {
    const { container } = renderRun("success");
    expect(container.querySelector(".text-emerald-500")).not.toBeNull();
  });

  it("marks a failed run red", () => {
    const { container } = renderRun("failure");
    expect(container.querySelector(".text-red-500")).not.toBeNull();
  });

  it.each(["in_progress", "queued"] as const)("marks a %s run amber", (status) => {
    const { container } = renderRun(status);
    expect(container.querySelector(".text-amber-500")).not.toBeNull();
  });

  it("shows no status icon for a neutral run", () => {
    const { container } = renderRun("neutral");
    expect(
      container.querySelector(".text-emerald-500, .text-red-500, .text-amber-500")
    ).toBeNull();
  });
});
```


- [ ] **Step 6: Run all pull request pins against the current code**

Run: `pnpm test src/components/pullrequests src/features/pullrequests src/test/githubServiceMappers.test.ts src/test/PullRequestDetailDrawer.test.tsx`
Expected: PASS.

- [ ] **Step 7: Merge the duplicate types**

`src/ipc/githubApi.ts`: delete the local `PullRequestState` (line 10) and `CheckStatus` (line 47) declarations and add near the top:

```ts
import type { CheckStatus, PullRequestFileStatus } from "../domain/enums";

export type { CheckStatus, PullRequestState } from "../domain/enums";
```

Line 57 becomes `status: PullRequestFileStatus;`. Line 28 (`state: "open" | "closed";`) becomes `state: Exclude<PullRequestState, "all">;` — add `PullRequestState` to the `import type` above.

`src/components/pullrequests/pullRequestStatusKey.ts`:

```ts
import { PR_STATE, PR_STATUS, type PullRequestStatus } from "../../domain/enums";

/** @deprecated alias kept so existing imports compile; use PullRequestStatus. */
export type StatusKey = PullRequestStatus;
// ...STATUS_BADGE_STYLES / STATUS_BADGE_LABELS unchanged...
export function getStatusKey(pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">): StatusKey {
  if (pr.merged_at) return PR_STATUS.MERGED;
  if (pr.state === PR_STATE.CLOSED) return PR_STATUS.CLOSED;
  if (pr.draft) return PR_STATUS.DRAFT;
  return PR_STATUS.OPEN;
}
```

Drop the `@deprecated` line if `rg -n "StatusKey" src` shows the alias is only used in this file and `pullRequestStatusBadge.tsx`; then use `PullRequestStatus` directly in both and remove the alias.

`src/features/pullrequests/model/pullRequestStatus.ts`:

```ts
import type { GitHubPullRequest } from "../../../ipc/githubApi";
import { PR_STATE, PR_STATUS, type PullRequestStatus } from "../../../domain/enums";

export type { PullRequestStatus };

export function getPullRequestStatus(
  pr: Pick<GitHubPullRequest, "merged_at" | "state" | "draft">
): PullRequestStatus {
  if (pr.merged_at) return PR_STATUS.MERGED;
  if (pr.state === PR_STATE.CLOSED) return PR_STATUS.CLOSED;
  if (pr.draft) return PR_STATUS.DRAFT;
  return PR_STATUS.OPEN;
}
```

`usePullRequestsScreen.ts:11`: `export type PullRequestFilterState = PullRequestState;` (import type from domain). Replace the inline `"open" | "closed" | "all"` in `usePullRequestsScreen.actions.ts:55`, `usePullRequests.ts:7` and `githubService.ts:217` with `PullRequestState`, and their `= "open"` defaults with `= PR_STATE.OPEN`.

- [ ] **Step 8: Swap the remaining literals**

`src/services/githubService.ts`:

```ts
export function mapCheckRunStatus(status?: string, conclusion?: string | null): CheckStatus {
  if (status === CHECK_RUN_STATE.COMPLETED) {
    return conclusion === CHECK_RUN_CONCLUSION.SUCCESS ? CHECK_STATUS.SUCCESS : CHECK_STATUS.FAILURE;
  }
  if (status === CHECK_RUN_STATE.IN_PROGRESS) return CHECK_STATUS.IN_PROGRESS;
  if (status === CHECK_RUN_STATE.QUEUED) return CHECK_STATUS.QUEUED;
  return CHECK_STATUS.NEUTRAL;
}
```

`PullRequestCiChecks.tsx` and `PullRequestConversationView.tsx`: replace `"success"`, `"failure"`, `"in_progress"`, `"queued"` in comparisons with `CHECK_STATUS.*`. Leave the `aria-label="success" | "failure" | "neutral"` attributes untouched (follow-up debt: they belong in i18n).

`PullRequestsMasterPane.tsx`: `filterState === "open" | "closed" | "all"` → `PR_STATE.OPEN | CLOSED | ALL`.

`PullRequestFilesChangedView.tsx`: `case "added" | "modified" | "removed" | "renamed"` → `case PR_FILE_STATUS.ADDED` etc.

- [ ] **Step 9: Verify and run tests**

Run: `rg -n "\"(in_progress|queued|failure|completed|merged|draft)\"" src --glob "!*.test.*" --glob "!src/test/**" --glob "!src/domain/**" --glob "!src/i18n/**"`
Expected: only the three `aria-label` attributes in `PullRequestConversationView.tsx` and the `Pick<…, "merged_at" | "state" | "draft">` key lists.
Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
pnpm format
pnpm check
git add src/domain src/ipc/githubApi.ts src/services/githubService.ts src/components/pullrequests src/features/pullrequests
git commit -F - <<'EOF'
♻️ use CHECK_STATUS, PR_STATE and PR_STATUS in pull requests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: `FILE_STATUS`, `CHANGE_TYPE` and `REF_TYPE`

**Files:**
- Modify: `src/domain/enums/git.ts`, `src/domain/enums/enums.test.ts`
- Modify: `src/components/changes/stagingFileListHelpers.ts:20-51` (`case` labels only)
- Modify: `src/components/inspector/FileHistoryCommitRow.tsx:25-27`, `src/components/inspector/fileHistoryChangeTypeBadge.ts:1-4`
- Modify: `src/features/stash/components/StashFileList.tsx:44-51`
- Modify: `src/features/history/components/CommitGraphBranchPills.tsx:21-23,145-147`, `src/features/history/components/CommitGraphCommitRow.tsx:39`, `src/features/history/model/graphCheckout.ts:15-16`
- Create: `src/features/stash/components/StashFileList.test.tsx`, `src/components/inspector/FileHistoryCommitRow.test.tsx`
- Existing pins: `src/test/stagingFileListHelpers.test.ts`, `src/components/inspector/fileHistoryChangeTypeBadge.test.ts`, `src/features/history/components/CommitGraphBranchPills.test.tsx`, `src/test/CommitGraphBranchPills.test.tsx`, `src/features/history/components/CommitGraphCommitRow.test.tsx`, `src/features/history/model/graphCheckout.test.ts`

**Interfaces:**
- Consumes: `CHANGE_TYPE` (Task 1).
- Produces: `FILE_STATUS = { MODIFIED: "Modified", NEW: "New", DELETED: "Deleted", RENAMED: "Renamed", TYPECHANGE: "Typechange", CONFLICTED: "Conflicted" }`, `type FileStatus`; `REF_TYPE = { HEAD: "head", LOCAL: "local", REMOTE: "remote", TAG: "tag" }`, `type RefType`.

- [ ] **Step 1: Write the failing tests**

Add to `src/domain/enums/enums.test.ts` (import `type FileStatus as BindingFileStatus` from bindings):

```ts
// inside "enums stay in sync with generated bindings"
it("FILE_STATUS matches FileStatus", () => {
  expectTypeOf<FileStatus>().toEqualTypeOf<BindingFileStatus>();
});
```

```ts
it("REF_TYPE matches the ref_type strings Rust returns", () => {
  // String in Rust: src-tauri/src/read/graph.rs (GraphRef.ref_type).
  expect(REF_TYPE).toEqual({ HEAD: "head", LOCAL: "local", REMOTE: "remote", TAG: "tag" });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm typecheck`
Expected: FAIL, `FILE_STATUS` / `FileStatus` / `REF_TYPE` not exported.

- [ ] **Step 3: Add the constants to `git.ts`**

```ts
/** Working-tree file status. Source: bindings.ts FileStatus */
export const FILE_STATUS = {
  MODIFIED: "Modified",
  NEW: "New",
  DELETED: "Deleted",
  RENAMED: "Renamed",
  TYPECHANGE: "Typechange",
  CONFLICTED: "Conflicted",
} as const;
export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

/**
 * Kind of ref shown on a commit graph row.
 * Rust returns a plain String (src-tauri/src/read/graph.rs), so bindings type
 * the field as `string`.
 */
export const REF_TYPE = {
  HEAD: "head",
  LOCAL: "local",
  REMOTE: "remote",
  TAG: "tag",
} as const;
export type RefType = (typeof REF_TYPE)[keyof typeof REF_TYPE];
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm typecheck && pnpm test src/domain`
Expected: PASS.

- [ ] **Step 5: Write the pin test for `StashFileList` (no test exists)**

Create `src/features/stash/components/StashFileList.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StashFileList } from "./StashFileList";
import type { CommitDetails } from "../../../ipc/bindings.generated";

function details(status: string): CommitDetails {
  return {
    id: "abc123",
    full_message: "WIP",
    author_name: "Dev",
    author_email: "dev@example.com",
    author_timestamp_sec: 0,
    parent_ids: [],
    files: [{ path: "src/a.ts", status, additions: 1, deletions: 0 }],
    total_additions: 1,
    total_deletions: 0,
  };
}

describe("StashFileList", () => {
  it.each([
    ["added", "A", "text-diff-add-text"],
    ["deleted", "D", "text-diff-remove-text"],
    ["modified", "M", "text-secondary"],
  ])("renders a %s file as %s", (status, letter, className) => {
    render(<StashFileList commitId="abc123" error={null} commitDetails={details(status)} />);
    expect(screen.getByText(letter)).toHaveClass(className);
  });
});
```

- [ ] **Step 6: Write the pin test for `FileHistoryCommitRow` (no direct test exists)**

Create `src/components/inspector/FileHistoryCommitRow.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileHistoryCommitRow } from "./FileHistoryCommitRow";
import type { FileHistoryItem } from "../../ipc/bindings.generated";

function commit(change_type: string): FileHistoryItem {
  return {
    commit_id: "d4e5f6a1b2c37890123456789abcdef012345678",
    short_id: "d4e5f6a",
    summary: "refactor exports",
    author_name: "Dev",
    author_email: "dev@example.com",
    timestamp_sec: 0,
    change_type,
  };
}

describe("FileHistoryCommitRow", () => {
  it.each([
    ["added", "Thêm mới"],
    ["deleted", "Đã xoá"],
    ["modified", "Đã sửa"],
  ])("titles a %s change as %s", (changeType, title) => {
    render(<FileHistoryCommitRow commit={commit(changeType)} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByTitle(title)).toBeInTheDocument();
  });
});
```

If `AuthorAvatar` needs a provider or mock, copy the setup used by `src/components/inspector/FileHistoryView.test.tsx`.

- [ ] **Step 7: Run all pins against the current code**

Run: `pnpm test src/features/stash src/components/inspector src/test/stagingFileListHelpers.test.ts src/features/history src/test/CommitGraphBranchPills.test.tsx`
Expected: PASS.

- [ ] **Step 8: Swap literals**

- `stagingFileListHelpers.ts`: `case "Conflicted" | "Modified" | "New" | "Deleted" | "Renamed" | "Typechange"` → `case FILE_STATUS.CONFLICTED` etc. Keep `case "Untracked":` and the `FileStatus | "Untracked"` parameter type (out of scope).
- `FileHistoryCommitRow.tsx`: `commit.change_type === "added"` → `CHANGE_TYPE.ADDED`, `"deleted"` → `CHANGE_TYPE.DELETED`.
- `fileHistoryChangeTypeBadge.ts`: use computed keys:

  ```ts
  const CHANGE_TYPE_BADGE_CLASS: Record<string, string> = {
    [CHANGE_TYPE.ADDED]: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    [CHANGE_TYPE.DELETED]: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  };
  ```

- `StashFileList.tsx`: `file.status === "deleted"` → `CHANGE_TYPE.DELETED`, `"added"` → `CHANGE_TYPE.ADDED` (all four comparisons).
- `CommitGraphBranchPills.tsx`, `CommitGraphCommitRow.tsx`, `graphCheckout.ts`: `ref_type === "head" | "tag" | "remote"` → `REF_TYPE.HEAD | TAG | REMOTE`; `ref_type !== "remote"` → `REF_TYPE.REMOTE`.

- [ ] **Step 9: Verify and run tests**

Run: `rg -n "ref_type\s*[!=]==\s*\"|change_type\s*===\s*\"|status === \"(added|deleted)\"|case \"(Modified|New|Deleted|Renamed|Typechange|Conflicted)\"" src --glob "!*.test.*" --glob "!src/test/**"`
Expected: no output.
Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
pnpm format
pnpm check
git add src/domain src/components/changes/stagingFileListHelpers.ts src/components/inspector src/features/stash src/features/history
git commit -F - <<'EOF'
♻️ use FILE_STATUS, CHANGE_TYPE and REF_TYPE

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: `SCREEN_TYPE`, `TAB_TYPE` and `HOME_TAB_ID`

**Files:**
- Modify: `src/domain/enums/app.ts`, `src/domain/enums/enums.test.ts`, `src/domain/constants/app.ts`
- Modify (types): `src/types/tab.ts:3,7`, `src/store/useViewStore.ts:3,14,18-19`
- Modify (screen): `src/App.tsx:63`, `src/appShellConfig.ts:141`, `src/components/header/RepoHeader.tsx:54-55`, `src/components/header/RepoHeaderScreenTabs.tsx:135-160`, `src/components/header/useRepoHeaderShortcuts.ts:21-27`, `src/components/rebase/InteractiveRebaseModal.actions.ts:95`, `src/components/ScreenRouter.tsx:24,28,41`, `src/features/branch/components/BranchSidebar.tsx:93`, `src/features/history/components/CommitGraph.tsx:57`, `src/features/history/components/CommitGraphActionDialogs.tsx:16`, `src/features/history/components/CommitGraphDialogs.actions.ts:18,48,53`, `src/features/history/components/CommitGraphDialogs.tsx:66`, `src/features/history/components/CommitGraphUndoableDialogs.tsx:15`, `src/hooks/useGlobalShortcuts.shortcuts.ts:86,93`, `src/store/useTabStore.ts:14,25,75,86`
- Modify (tab): `src/App.tsx:102`, `src/appShellConfig.ts:66`, `src/components/header/WindowTab.tsx:22`, `src/components/settings/settingsModalState.helpers.tsx:58`, `src/hooks/useAppTabSync.ts:20,22`, `src/store/useTabStore.ts:12-13,23,36,119,140,188,195,225`
- Existing pins: `src/components/ScreenRouter.test.tsx`, `src/test/useViewStore.test.ts`, `src/test/useTabStore.test.ts`, `src/test/WindowTabBar.test.tsx`, `src/test/App.test.tsx`, `src/test/RepoHeader.test.tsx`, `src/test/useGlobalShortcuts.test.ts`, `src/features/history/components/CommitGraphDialogs.actions.test.ts`

**Interfaces:**
- Consumes: `SCREEN_TYPE`, `ScreenType` (Task 1).
- Produces: `TAB_TYPE = { HOME: "home", REPO: "repo" }`, `type TabType`; `HOME_TAB_ID = "home"` in `src/domain/constants/app.ts`.

- [ ] **Step 1: Write the failing test**

Add to `src/domain/enums/enums.test.ts`:

```ts
it("TAB_TYPE lists the window tab kinds", () => {
  expect(TAB_TYPE).toEqual({ HOME: "home", REPO: "repo" });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/domain`
Expected: FAIL, `TAB_TYPE` not exported.

- [ ] **Step 3: Add the constants**

`src/domain/enums/app.ts`:

```ts
/** Kind of window tab: the home screen or an open repository. */
export const TAB_TYPE = {
  HOME: "home",
  REPO: "repo",
} as const;
export type TabType = (typeof TAB_TYPE)[keyof typeof TAB_TYPE];
```

`src/domain/constants/app.ts` (append):

```ts
/** Id of the always-present home tab. Repo tabs use their canonical path as id. */
export const HOME_TAB_ID = "home";
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/domain`
Expected: PASS.

- [ ] **Step 5: Run the pins against the current code**

Run: `pnpm test src/components/ScreenRouter.test.tsx src/test/useViewStore.test.ts src/test/useTabStore.test.ts src/test/WindowTabBar.test.tsx src/test/App.test.tsx src/test/RepoHeader.test.tsx src/test/useGlobalShortcuts.test.ts src/features/history/components/CommitGraphDialogs.actions.test.ts`
Expected: PASS.

- [ ] **Step 6: Merge the duplicate types**

`src/types/tab.ts`:

```ts
import { type RepoSummary } from "../ipc/bindings.generated";
import type { ScreenType, TabType } from "../domain/enums";

export type { ScreenType };

export interface TabItem {
  id: string; // HOME_TAB_ID or canonical repo path
  type: TabType;
  // ...rest unchanged
```

`src/store/useViewStore.ts`:

```ts
import { SCREEN_TYPE, type ScreenType } from "../domain/enums";

export type ActiveScreen = ScreenType;
// ...
  activeScreen: SCREEN_TYPE.HISTORY,
  // ...
    set({ activeScreen: SCREEN_TYPE.CONFLICT, activeConflictFile: filePath }),
  closeConflictResolver: () => set({ activeScreen: SCREEN_TYPE.CHANGES, activeConflictFile: null }),
```

- [ ] **Step 7: Swap the screen literals**

In every screen file listed above, replace `"history"`, `"changes"`, `"conflict"`, `"pull-requests"` **only where they are a screen** (arguments to `setActiveScreen`, comparisons with `activeScreen` / `tab.activeScreen`, `activeScreen:` fields) with `SCREEN_TYPE.HISTORY` / `CHANGES` / `CONFLICT` / `PULL_REQUESTS`. The narrow parameter type `(screen: "changes") => void` in `CommitGraphActionDialogs.tsx:16`, `CommitGraphDialogs.actions.ts:18` and `CommitGraphUndoableDialogs.tsx:15` becomes `(screen: typeof SCREEN_TYPE.CHANGES) => void`.

Do NOT change `openInspector(…, "history")`, `FileInspectorHeader` (`InspectorTab`), the comment in `useBranchSidebarShell.ts:79`, or `commandRegistry.ts`.

- [ ] **Step 8: Swap the tab literals**

- `type === "home" | "repo"` (and `type: "home" | "repo"` object fields in `useTabStore.ts`) → `TAB_TYPE.HOME` / `TAB_TYPE.REPO`.
- `id: "home"`, `activeTabId: "home"`, `activeTabId !== "home"`, `activeTabId === "home"` → `HOME_TAB_ID`, imported from `"<relative>/domain/constants/app"`.

- [ ] **Step 9: Verify and run tests**

Run: `rg -n "setActiveScreen\(\"|activeScreen\s*[!=]==\s*\"|activeScreen: \"|type\s*[!=]==\s*\"(home|repo)\"|type: \"(home|repo)\"|activeTabId\s*[!=]==\s*\"home\"|activeTabId: \"home\"|id: \"home\"" src --glob "!*.test.*" --glob "!src/test/**"`
Expected: no output.
Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
pnpm format
pnpm check
git add src/domain src/types/tab.ts src/store src/App.tsx src/appShellConfig.ts src/components src/features src/hooks
git status --short   # confirm only intended files are staged and bindings.generated.ts is not
git commit -F - <<'EOF'
♻️ use SCREEN_TYPE, TAB_TYPE and HOME_TAB_ID

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: `SETTINGS_SCOPE`, `PULL_STRATEGY` and `CONFIG_SCOPE` in settings

**Files:**
- Modify: `src/domain/enums/app.ts`, `src/domain/enums/enums.test.ts`
- Modify (scope): `src/components/settings/SettingsModalTabContent.tsx:16`, `src/components/settings/useSettingsModalState.tsx:15,27-37`, `src/components/settings/tabs/gitProfileFormHelpers.ts:69,74,91,94`, `src/components/settings/tabs/GitProfileTab.tsx:13,25,33,52,90`, `src/components/settings/tabs/useGitProfileDirtyState.ts:14,33`, `src/components/settings/tabs/useGitProfileForm.actions.ts:8,54`, `src/components/settings/tabs/useGitProfileForm.load.ts:7,32,36`, `src/components/settings/tabs/useGitProfileForm.ts:17,96`, `src/components/settings/tabs/useGitProfileFormLoadEffect.ts:7`, `src/features/settings/components/GitBehaviorTab.tsx:9,16,24,82`, `src/features/settings/components/ui/SettingsScopeSelector.tsx:8-9,58,60`, `src/features/settings/hooks/useGitBehaviorSettings.ts:16,20,47`, `src/features/settings/hooks/useGitBehaviorSettings.actions.ts:6,67-68,87-88`, `src/ipc/config.ts:93,95`
- Modify (pull strategy): `src/components/settings/helpDiagrams/PullStrategyDiagram.tsx:7-45`, `src/features/settings/components/GitBehaviorPullFetchSection.tsx:94-99`, `src/features/settings/components/GitBehaviorTab.tsx:26,31,41`, `src/features/settings/hooks/useGitBehaviorSettings.actions.ts:37,42,46`, `src/features/settings/hooks/useGitBehaviorSettings.ts:29`
- Existing pins: `src/components/settings/tabs/gitProfileFormHelpers.test.ts`, `src/features/settings/hooks/useGitBehaviorSettings.test.tsx`, `src/features/settings/components/GitBehaviorTab.test.tsx`, `src/features/settings/components/ui/SettingsScopeSelector.test.tsx`, `src/components/settings/helpDiagrams/PullStrategyDiagram.test.tsx`, `src/test/SettingsTabs.test.tsx`, `src/test/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `CONFIG_SCOPE` (Task 1).
- Produces: `SETTINGS_SCOPE = { GLOBAL: "global", REPO: "repo" }`, `type SettingsScope`; `PULL_STRATEGY = { INHERIT: "inherit", MERGE: "merge", REBASE: "rebase" }`, `type PullStrategy`.

- [ ] **Step 1: Write the failing test**

Add to `src/domain/enums/enums.test.ts`:

```ts
it("SETTINGS_SCOPE says repo where git config says local", () => {
  expect(SETTINGS_SCOPE).toEqual({ GLOBAL: "global", REPO: "repo" });
  expect(CONFIG_SCOPE.LOCAL).toBe("local");
});

it("PULL_STRATEGY lists the repo pull strategies", () => {
  expect(PULL_STRATEGY).toEqual({ INHERIT: "inherit", MERGE: "merge", REBASE: "rebase" });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/domain`
Expected: FAIL, constants not exported.

- [ ] **Step 3: Add the constants to `app.ts`**

```ts
/**
 * Scope selected in the settings modal. The UI says "repo"; the matching git
 * config scope is CONFIG_SCOPE.LOCAL.
 */
export const SETTINGS_SCOPE = {
  GLOBAL: "global",
  REPO: "repo",
} as const;
export type SettingsScope = (typeof SETTINGS_SCOPE)[keyof typeof SETTINGS_SCOPE];

/** Pull strategy for a repo; "inherit" follows the global pull.rebase setting. */
export const PULL_STRATEGY = {
  INHERIT: "inherit",
  MERGE: "merge",
  REBASE: "rebase",
} as const;
export type PullStrategy = (typeof PULL_STRATEGY)[keyof typeof PULL_STRATEGY];
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/domain`
Expected: PASS.

- [ ] **Step 5: Run the pins against the current code**

Run: `pnpm test src/components/settings src/features/settings src/test/SettingsTabs.test.tsx src/test/SettingsModal.test.tsx`
Expected: PASS.

- [ ] **Step 6: Swap types and literals**

- Every inline `"global" | "repo"` annotation (including `useState<"global" | "repo">`) → `SettingsScope`.
- `=== "repo"` / `=== "global"` on a settings scope, and `currentRepoPath ? "repo" : "global"` → `SETTINGS_SCOPE.REPO` / `SETTINGS_SCOPE.GLOBAL`.
- `SettingsScopeSelector.tsx` option values `value: "global"` / `value: "repo"` → `SETTINGS_SCOPE.*`. Leave the `testId` strings (`"scope-btn-global"`) as they are.
- `GitBehaviorTab.tsx:82` template key → `` `${scope || (currentRepoPath ? SETTINGS_SCOPE.REPO : SETTINGS_SCOPE.GLOBAL)}-${currentRepoPath}` ``.
- `useGitBehaviorSettings.actions.ts:67,87` `? "local" : "global"` (git config scope) → `CONFIG_SCOPE.LOCAL : CONFIG_SCOPE.GLOBAL`.
- `src/ipc/config.ts:93,95` `local.userName ? "local" : "global"` → `CONFIG_SCOPE.LOCAL : CONFIG_SCOPE.GLOBAL`. Leave `src/ipc/mocks/gitConfig.ts` (fixture).
- Pull strategy: `"inherit" | "merge" | "rebase"` annotations → `PullStrategy`; `useState<"merge" | "rebase">` in `PullStrategyDiagram.tsx` → `useState<Exclude<PullStrategy, typeof PULL_STRATEGY.INHERIT>>(PULL_STRATEGY.REBASE)`; every `"inherit"` / `"merge"` / `"rebase"` value or comparison in the pull-strategy files listed above → `PULL_STRATEGY.*`. Leave `testId` strings (`"pull-strategy-merge"`) alone.

- [ ] **Step 7: Verify and run tests**

Run: `rg -n "\"global\" \| \"repo\"|Scope\s*[!=]==\s*\"(repo|global)\"|\? \"repo\" : \"global\"|\? \"local\" : \"global\"|\"inherit\" \| \"merge\"|\"merge\" \| \"rebase\"|mode === \"(rebase|merge|inherit)\"" src --glob "!*.test.*" --glob "!src/test/**" --glob "!src/ipc/mocks/**"`
Expected: no output.
Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
pnpm format
pnpm check
git add src/domain src/components/settings src/features/settings src/ipc/config.ts
git commit -F - <<'EOF'
♻️ use SETTINGS_SCOPE, PULL_STRATEGY and CONFIG_SCOPE in settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: Document the rule and record plan additions in the spec

**Files:**
- Modify: `docs/CODING_RULES.md` (the `| String unions | \`src/domain/enums.ts\` |` row, and the rules list in section 2 or the reuse section)
- Modify: `docs/superpowers/specs/2026-10-05-shared-enum-constants-design.md`

- [ ] **Step 1: Update `docs/CODING_RULES.md`**

Replace the row:

```md
| String unions | `src/domain/enums.ts` |
```

with:

```md
| String unions | `src/domain/enums/` (`git.ts` for Rust values, `github.ts` for GitHub API values, `app.ts` for frontend values) |
```

Add this bullet directly under the reuse table's bullet list:

```md
- **Compare backend and GitHub values through a constant.** Write
  `res.status === OPERATION_STATUS.CONFLICT`, not `res.status === "Conflict"`.
  Several of these fields are typed `string` in the bindings, so a typo in a
  literal compiles. A union used in only one or two files may stay a literal
  union type. UI variants (`AlertVariant`, toast type, button variants) are not
  status values and do not use these constants.
```

- [ ] **Step 2: Record the additions in the spec**

In the spec's `### Constants` section add `CHECK_RUN_CONCLUSION` and `PR_FILE_STATUS` rows to the `github.ts` table and a note that `HOME_TAB_ID` lives in `src/domain/constants/app.ts`. In `## Commit sequence`, replace item 6 with two items: `♻️ use SCREEN_TYPE, TAB_TYPE and HOME_TAB_ID` and `♻️ use SETTINGS_SCOPE, PULL_STRATEGY and CONFIG_SCOPE in settings`, and renumber.

- [ ] **Step 3: Verify**

Run: `pnpm format:check && pnpm check-comment-language`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/CODING_RULES.md docs/superpowers/specs/2026-10-05-shared-enum-constants-design.md
git commit -F - <<'EOF'
📝 document shared enum constants in coding rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```
