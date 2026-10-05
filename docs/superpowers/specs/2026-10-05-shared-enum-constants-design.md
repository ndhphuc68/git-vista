# Shared enum constants

Date: 2026-10-05
Status: approved design, pending implementation plan

## Problem

Production code compares status and kind values as bare string literals, for
example `res.status === "Conflict"` or `step.action === "Squash"`. The same
values are spelled out again in every file that uses them.

- `src/domain/enums.ts` already defines `CHECK_STATUS`, `CHANGE_TYPE`,
  `PR_STATE`, `CONFIG_SCOPE` and `SCREEN_TYPE`, but no production file imports
  any of them.
- Four types are declared twice: `CheckStatus` (`ipc/githubApi.ts` and
  `domain/enums.ts`), `PullRequestState` (same pair), `ScreenType` /
  `ActiveScreen` (`types/tab.ts`, `store/useViewStore.ts`) and `StatusKey` /
  `PullRequestStatus` (`components/pullrequests/pullRequestStatusKey.ts`,
  `features/pullrequests/model/pullRequestStatus.ts`).
- Some backend values reach TypeScript as `string`, not as a union: the
  operation result `status` (`src-tauri/src/exec/commit_actions.rs:14`,
  `src-tauri/src/exec/merge.rs`) and `ref_type`
  (`src-tauri/src/read/graph.rs:21`). A typo in a comparison against them
  compiles.
- `"repo"` means two different things: a tab type (`types/tab.ts`) and a
  settings scope (`"global" | "repo"`, written inline about ten times under
  `components/settings/`).

## Goals

- Every value that crosses the Rust or GitHub boundary, and every frontend
  value compared in several modules, is compared through one constant.
- Each concept has exactly one type declaration, derived from its constant.
- `pnpm check` fails when a generated binding union and its constant drift
  apart.

## Non-goals

- Changing the Rust side. `status` and `ref_type` stay `String` (see
  "Follow-up debt").
- Constants for UI variants (`AlertVariant`, toast type, `ButtonVariant`,
  sizes). Their `"success"` / `"error"` are a different concept from CI or
  operation status and must not share a constant.
- Constants for unions used in only one or two files (`Theme`, `Locale`,
  `SettingsTab`, `DiffViewMode`, `ChangesViewMode`, `InspectorTab`,
  `DiffLineType`, `WordDiffType`, `RemoteOperation`, `ConflictAction`,
  `CommandCategory`, `ExternalEditor`, `ExternalTerminal`, commit prefixes).
  Their literal union type already catches typos.
- A lint script that bans the literals. The rule goes into
  `docs/CODING_RULES.md` and is checked in review.
- Changing test assertions. Tests keep asserting literal strings so they pin
  the real wire values.

## Design

### Pattern

Keep the existing pattern from `domain/enums.ts`: a plain object with
`as const` and a type derived from it. No TypeScript `enum`.

```ts
export const REBASE_ACTION = {
  PICK: "Pick",
  // ...
} as const;
export type RebaseActionKind = (typeof REBASE_ACTION)[keyof typeof REBASE_ACTION];
```

### Layout

`src/domain/enums.ts` becomes a folder. Files in it import nothing, so
`domain/` still depends on nothing.

```
src/domain/enums/
├─ git.ts       values produced by the Rust backend
├─ github.ts    values produced by the GitHub API
├─ app.ts       frontend-only values
├─ index.ts     barrel; `import … from "domain/enums"` keeps working
└─ enums.test.ts
```

### Constants

`git.ts`

| Constant | Values | Source of truth |
|---|---|---|
| `REBASE_ACTION` | `Pick`, `Reword`, `Squash`, `Fixup`, `Drop` | `RebaseActionKind` in bindings |
| `FILE_STATUS` | `Modified`, `New`, `Deleted`, `Renamed`, `Typechange`, `Conflicted` | `FileStatus` in bindings |
| `OPERATION_STATUS` | `Committed`, `Staged`, `Conflict`, `Error` | Rust `String`, `exec/commit_actions.rs`, `exec/merge.rs` |
| `REF_TYPE` | `head`, `local`, `remote`, `tag` | Rust `String`, `read/graph.rs` |
| `CHANGE_TYPE` | unchanged | moved from `enums.ts` |
| `CONFIG_SCOPE` | unchanged | `ConfigScope` in bindings |

`github.ts`

| Constant | Values | Notes |
|---|---|---|
| `CHECK_STATUS` | unchanged | the app's mapped CI status |
| `CHECK_RUN_STATE` | `completed`, `in_progress`, `queued` | raw GitHub check-run `status`, read by `mapCheckRunStatus` |
| `PR_STATE` | unchanged | |
| `PR_STATUS` | `merged`, `closed`, `draft`, `open` | the badge status |

`app.ts`

| Constant | Values |
|---|---|
| `SCREEN_TYPE` | unchanged |
| `TAB_TYPE` | `home`, `repo` |
| `SETTINGS_SCOPE` | `global`, `repo` |
| `PULL_STRATEGY` | `inherit`, `merge`, `rebase` |

`SETTINGS_SCOPE` and `CONFIG_SCOPE` stay separate: the settings UI says
`repo`, git config says `local`.

### Duplicate types

The `domain` type becomes the only declaration. The old locations re-export or
alias it, so existing imports keep compiling and each commit stays small.

- `ipc/githubApi.ts`: `CheckStatus` and `PullRequestState` re-export from
  `domain/enums`.
- `types/tab.ts` `ScreenType` and `store/useViewStore.ts` `ActiveScreen` alias
  `ScreenType` from `domain/enums`. `Tab.type` uses `TabType`.
- `StatusKey` and the feature's `PullRequestStatus` alias `PullRequestStatus`
  from `domain/enums`.
- The inline `"global" | "repo"` annotations under `components/settings/`
  become `SettingsScope`. The inline `"inherit" | "merge" | "rebase"` and
  `"merge" | "rebase"` annotations use `PullStrategy` (or
  `Exclude<PullStrategy, "inherit">` for the diagram).

## Keeping constants in sync with bindings

`enums.test.ts` is the only file under `domain/` that imports from `ipc/`, and
only with `import type`. It asserts type equality at compile time:

```ts
import type { RebaseActionKind as BindingRebaseActionKind } from "../../ipc/bindings.generated";

it("REBASE_ACTION matches RebaseActionKind in bindings", () => {
  expectTypeOf<RebaseActionKind>().toEqualTypeOf<BindingRebaseActionKind>();
});
```

`pnpm build` runs `tsc` over all of `src`, test files included, so a variant
added or removed in Rust fails `pnpm check` once bindings are regenerated.
This covers `REBASE_ACTION`, `FILE_STATUS` and `CONFIG_SCOPE`, the constants
with a generated union.

`CHECK_STATUS` and `PR_STATE` are declared by hand in `ipc/githubApi.ts`, not
generated. Once that file re-exports them, `domain/enums` is their only source
of truth, and the existing runtime tests that list their values stay.

`OPERATION_STATUS` and `REF_TYPE` have no binding union. Runtime tests assert
each string, with a comment naming the Rust file that produces it. They do not
detect a Rust-side rename; that gap is accepted and listed under follow-up
debt.

## Testing

Every literal replacement is mechanical. For each group:

1. Find tests that cover the files being changed (CodeGraph blast radius).
2. Where a branch has no test, for example the colors in
   `rebaseActionColor.ts` or the `Conflict` branch of a modal, add a unit or
   component test first and make it pass against the current code.
3. Replace the literals and rerun the tests.

No Playwright E2E changes.

## Commit sequence

Branch `refactor/shared-enum-constants`. Every commit passes `pnpm check` on
its own.

1. `♻️ split domain enums into git, github and app modules` — move only, plus
   the `expectTypeOf` sync checks for existing constants.
2. `♻️ use REBASE_ACTION in interactive rebase` — `components/rebase/`.
3. `♻️ use OPERATION_STATUS for merge, rebase, cherry-pick and revert results`.
4. `♻️ use CHECK_STATUS, PR_STATE and PR_STATUS in pull requests` — includes
   the `CheckStatus`, `PullRequestState` and `PullRequestStatus` merges and
   `mapCheckRunStatus`.
5. `♻️ use FILE_STATUS, CHANGE_TYPE and REF_TYPE` — changes, inspector, stash,
   history graph.
6. `♻️ use SCREEN_TYPE, TAB_TYPE, SETTINGS_SCOPE and PULL_STRATEGY` — includes
   the `ScreenType` / `ActiveScreen` merge and the settings scope annotations.
7. `📝 document shared enum constants in coding rules` — the "String unions"
   row points to `src/domain/enums/`, and a rule says that comparisons against
   backend or GitHub values use the constant.

## Risks

- Mixing up the two meanings of `"repo"`: separate constants with separate
  types, so `tsc` rejects a cross-use.
- Touching UI-variant `"success"` / `"error"` by accident: out of scope; only
  the files listed per commit are edited.
- Lint limits (300 lines per file, 80 per function): replacing a literal with
  `CONST.KEY` only lengthens lines, which `pnpm format` wraps. If a file hits a
  limit, stop and raise it instead of disabling the rule.

## Follow-up debt

- Make `status` and `ref_type` Rust `enum`s with `specta::Type` so bindings
  emit real unions, then replace the runtime tests with `expectTypeOf`.
- Merge `getStatusKey` (`components/pullrequests/pullRequestStatusKey.ts`) and
  `getPullRequestStatus` (`features/pullrequests/model/pullRequestStatus.ts`).
  Their logic is near-identical, but merging them is a logic change.
- Move the hardcoded CI-check `aria-label`s in
  `features/pullrequests/components/PullRequestConversationView.tsx` into i18n.
