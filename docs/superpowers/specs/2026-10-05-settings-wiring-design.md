# Settings wiring

Date: 2026-10-05
Status: approved design, pending implementation plan

## Problem

After the settings redesign, several settings are persisted but nothing in the
app reads them, so changing them has no visible effect:

| Setting | Current state |
|---|---|
| Auto-fetch interval | Written to `localStorage` only; no scheduler runs fetch |
| Confirm before discard | `DiscardConfirmModal` always shows |
| Confirm before deleting a branch | Not read anywhere |
| Confirm before force push | The app has no force push action at all |
| Commit subject length warning | `useCommitBox` hardcodes `> 72` |
| Date format | Not read; every list shows relative time |
| Diff view mode, font size, tab size, line numbers | Only used by the settings preview |
| Default terminal | No "open terminal" action and no Rust command |

## Goals

- Every setting shown in the settings modal changes app behavior.
- Remove the force push confirmation, which guards nothing.

## Non-goals

- A force push feature.
- Split view in the staging diff viewer or the PR patch viewer.
- Terminal support outside Windows.
- Auto-fetch for repositories other than the active tab.
- Playwright E2E changes.

## 1. Confirmations, commit limit, date format

### Confirm before discard

`StagingFileList` reads `confirmDiscard`. On: unchanged (`DiscardConfirmModal`).
Off: the discard request calls `onDiscardFile` directly without the modal.

### Confirm before deleting a branch

Off: choosing Delete in the branch menu deletes immediately with
`force: false` and shows the existing success toast with undo. If git reports
`UNMERGED_BRANCH`, `DeleteBranchModal` opens in its unmerged state so a force
delete is always confirmed. The delete + toast logic is shared with
`useDeleteBranchForm`, not duplicated.

On: unchanged.

### Force push confirmation

Remove `confirmForcePush` / `setConfirmForcePush` from `useSettingsStore`, its
row in `GitBehaviorConfirmationsSection`, and its keys in `src/i18n/vi.ts` and
`src/i18n/en.ts`. The stale `gitvista_confirm_force_push` storage key is
ignored.

### Commit subject limit

`useCommitBox` replaces the hardcoded `72` with `commitMessageLimit`; `0`
never warns. `isOver72` is renamed `isOverLimit`. `CommitBoxHeader` shows the
counter as `{length}/{limit}`, or just `{length}` when the limit is `0`.

### Date format

Add `formatCommitDate(timestampSec, timeDict, locale, dateFormat)` to
`src/i18n/index.ts`:

- `relative`: delegates to `formatRelativeTime`.
- `absolute`: `Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })`.

Add a `useFormatDate()` hook that binds `t`, `locale`, and `dateFormat`.
Replace all callers of `formatRelativeTime` (commit lists, commit metadata,
blame gutter, file history, compare commit list, recent repositories) with it.

### Tests

- `StagingFileList`: discard skips the modal when the setting is off.
- Branch delete: direct delete when off; falls back to the modal on
  `UNMERGED_BRANCH`.
- `useCommitBox` / `CommitBoxHeader`: limits 0, 50, 72.
- `formatCommitDate`: both modes, both locales.

## 2. Diff display settings

### Shared read-only hunk

`FileDiffHunk` (history) and the hunk renderer in `CompareDiffViewer` are
near-identical. Before moving them, pin the current unified rendering with a
test; then extract to `src/components/diff/`:

- `useDiffDisplaySettings()`: reads `diffFontSize`, `diffTabSize`,
  `diffShowLineNumbers`, `diffViewMode`; returns those values plus a `style`
  object (`fontSize`, `tabSize`) for the viewer's scroll container. These are
  runtime values from settings, like `DiffPreviewSection` already uses.
- `pairSplitRows(lines)`: pure function. Context lines appear on both sides. A
  run of `delete` lines immediately followed by a run of `add` lines is paired
  in order; the shorter side gets empty cells. Unpaired runs fill one side.
- `ReadOnlyDiffHunk`: hunk header, then unified rows (the existing markup) or
  split rows. Each split half has an optional line number, the sign, and the
  content with word-diff tokens, and scrolls horizontally on its own.

### Where each setting applies

| Viewer | Font / tab size | Line numbers | Split |
|---|---|---|---|
| History (`FileDiffViewer`) | yes | yes | yes, via `ReadOnlyDiffHunk` |
| Compare (`CompareDiffViewer`) | yes | yes | yes, via `ReadOnlyDiffHunk` |
| Staging (`InteractiveDiffViewer`) | yes | yes (hides the number columns of `DiffLineGutter`) | no, always unified |
| PR patch viewer | yes | yes | no |

The "View mode" row in the Diff viewer settings gets a description (i18n)
saying the staging viewer always uses unified.

### Tests

- `pairSplitRows`: context only, more deletes than adds, more adds than
  deletes, alternating runs.
- `ReadOnlyDiffHunk`: unified vs split, line numbers hidden.
- The four viewers apply the font/tab `style` and the line number setting.

## 3. Auto-fetch

### Store

Move `autoFetchInterval` / `setAutoFetchInterval` into `useSettingsStore`,
keeping the storage key `gitvista_autofetch_interval` so saved values survive.
`useGitBehaviorSettings` reads and writes through the store and drops its
local state; the settings tab behaves the same.

### Scheduler

`src/features/remote/api/useAutoFetch.ts`: `useAutoFetch(repoPath, isRemoteBusy)`,
called from `RepoHeader` next to `useRemoteTask` with
`isRemoteBusy = remote.isPending`.

- Interval `0` or no repo: no timer. Otherwise `setInterval(interval * 1000)`,
  reset when the repo or interval changes, cleared on unmount. The first fetch
  happens one interval after opening, not immediately.
- On each tick, skip when `document.hidden`, when `isRemoteBusy`, or when the
  previous auto-fetch is still running.
- Call `invokeCommand.fetchRepo(repoPath)` without a `taskId`, so no progress
  banner shows. Prune behaves as for a manual fetch.
- Success: `invalidateQueries({ queryKey: qk.repo.all(repoPath) })` for the
  repo that was fetched. Failure: `console.warn`, no toast.

Known limitation (accepted): a manual fetch/pull started while an auto-fetch
is running can run concurrently; git's ref locking keeps data safe, but the
manual operation may report a lock error.

### Tests

With fake timers: fetches on each interval; no fetch when the interval is 0,
the window is hidden, a manual task is running, or the previous auto-fetch is
in flight; invalidates on success; swallows errors; reschedules when the
interval changes. Update `useGitBehaviorSettings` tests for the store move.

## 4. Open in terminal

### Rust

New `src-tauri/src/commands/terminal.rs` with an `open_in_terminal(repo_path,
terminal)` command, registered like `open_in_editor`. Bindings are regenerated
by specta, never edited by hand.

`resolve_terminal_launch(terminal, path, is_windows) -> Result<Launch, AppError>`
is a pure function returning program, args, and working directory:

| Terminal | Launch |
|---|---|
| `wt` | `wt.exe -d <path>` |
| `powershell` | `powershell.exe -NoExit`, `current_dir = path` |
| `cmd` | `cmd.exe /K`, `current_dir = path` |
| `bash` | Git Bash: find `git.exe` on `PATH`, derive `<git root>/git-bash.exe --cd=<path>`; `AppError::NotFound` if missing. Not `bash.exe`, which on Windows is often WSL |

Spawn with `CREATE_NEW_CONSOLE`, never through a shell; the path is only an
argument. Reuse `to_editor_path` to strip the `\\?\` prefix. Outside Windows,
return `AppError::InvalidOperation`.

### Frontend

- `src/ipc/editor.ts`: `openInTerminal(repoPath, terminal)` with a browser mock.
- `src/features/repo/api/terminalApi.ts`: `openInTerminal`, exported from
  `features/repo/index.ts`.
- `RepoHeaderGitActions`: a `SquareTerminal` icon button next to "Open in
  editor", same size; `title` / `aria-label` from `t.header.openInTerminal`.
- Handler in `RepoHeaderGitActions.actions.ts` reads `defaultTerminal`; errors
  go through `mapGitError` and a toast, like the editor action.

### Tests

- Rust: `resolve_terminal_launch` for all four terminals and the non-Windows
  branch.
- Frontend: the button calls the API with the chosen terminal; errors show a
  toast.

## i18n

New keys in both `vi.ts` and `en.ts`: `header.openInTerminal`, the view mode
"staging always uses unified" description. Absolute dates come from `Intl`
and need no keys. Remove the force push confirmation keys.

## Rollout

One commit per step, `pnpm check` green after each:

1. Remove force push confirmation.
2. Confirm discard and confirm delete branch.
3. Commit subject limit.
4. Date format.
5. Pin unified hunk rendering; extract `ReadOnlyDiffHunk`.
6. Font size, tab size, line numbers in all viewers.
7. Split view for history and compare.
8. Move auto-fetch interval into the store; `useAutoFetch`.
9. `open_in_terminal` Rust command.
10. Terminal button in the repo header.

Constraints from `AGENTS.md` / `docs/CODING_RULES.md` apply throughout.
