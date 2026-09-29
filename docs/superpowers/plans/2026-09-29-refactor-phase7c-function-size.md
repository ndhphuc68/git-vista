# Refactor Phase 7c — Bring Size and Complexity Rules to Zero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `max-lines-per-function` (90), `complexity` (27) and `max-lines` (10) — 127 warnings — to 0 **at the current thresholds** (80 lines per function, complexity 15, 300 lines per file, blank lines and comments skipped), then raise all three rules to `error`.

**Architecture:** The human chose (2026-09-29) to keep the thresholds and clean every violation, rejecting both threshold retuning and a per-file ratchet. Every split is **by responsibility, never by line count** (spec §8: "Tách theo trách nhiệm, không tách cho đủ số dòng"). Each task owns a group of files and must leave every listed file at zero violations of the three rules without adding new violations anywhere. Behaviour and rendered output stay identical.

**Tech Stack:** oxlint 1.83 (`.oxlintrc.json`), TypeScript, React 19, TanStack Query v5, zustand, Vitest + Testing Library.

## Global Constraints

- Code, comments, test descriptions, test fixture strings and commit messages in **English**. User-facing strings (i18n entries, rendered text, `aria-label`, `title`) stay **Vietnamese** and are moved verbatim. `pnpm check-comment-language` enforces this.
- Commit messages use Gitmoji: `<emoji> <short description>`, no `feat:` prefixes, no parenthesized scopes. Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Do not add or modify Playwright E2E tests (`e2e/**`).
- **No behaviour change and no visual change.** JSX, `className` strings, ARIA attributes, event order, `await` vs fire-and-forget, effect dependencies and query options move verbatim. If a split would force any of these to change, stop and report.
- **Do not touch the thresholds or the lint config** in Tasks 1–12: no new `overrides`, no `eslint-disable`/`oxlint-disable` comments, no `// prettier-ignore` tricks, no packing statements onto one line to beat the counter. Task 13 only flips severities.
- Do not change an existing test's assertions (convention 4). Test **import paths** and `vi.mock` paths may change when a file moves.
- **Coverage first.** Before splitting a file, find what exercises it: `grep -rln "<ComponentOrFunctionName>" src --include=*.test.ts --include=*.test.tsx`. Tests may sit beside the file or in `src/test/`, and features are often imported through their `index.ts`. If no test renders/calls it, write a characterization test first (render + the main interaction or return value), see it pass on the original code, break the code and see it fail, restore (conventions 3 and 5). Record the break evidence verbatim in the report.
- New files must themselves have zero violations of all lint rules. Every new file stays under 300 lines.
- Architecture rules still hold and are enforced by `src/test/architectureBoundaries.test.ts` and lint (`error`): only `ipc/**` and `features/*/api/**` import `ipc/` at runtime; features import other features only via their public `index.ts`; a feature's own files import siblings, never their own index; no import cycle through a feature index.
- Verification (repo root): `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm check-comment-language`, `pnpm check-query-keys`. Count the three rules with Git Bash:
  `pnpm lint 2>&1 | grep -oE "warning [a-z-]+\([a-z/-]+\)" | sort | uniq -c | sort -rn`
  and list one task's files with `pnpm lint 2>&1 | grep -E "<path1>|<path2>"`. Baseline: **127** (90 / 27 / 10).
- `pnpm test` had one unexplained flaky failure in 1 of 7 full runs after Phase 7b. If a full run fails on a test unrelated to your files, re-run it once; if it passes, record the failing test's name and output in your report and continue.

### Splitting playbook (used by every task)

Pick the move that matches the responsibility you find; combine as needed.

1. **State + effects + handlers → a colocated hook.** A component body that is mostly `useState`/`useEffect`/handlers becomes `useXxx()` returning exactly what the JSX reads. Inside a feature put it in `features/<name>/hooks/useXxx.ts`; outside features put it beside the component (`src/components/<area>/useXxx.ts`). The hook keeps the same hook call order.
2. **JSX sections → named subcomponents** in sibling files (`XxxHeader.tsx`, `XxxFooter.tsx`, `XxxRow.tsx`). Pass only the props the section reads; keep the parent's markup structure (no new wrapper elements).
3. **Complexity → lookup tables, early returns, extracted predicates.** Replace `if/else`/`switch` chains that map a value to a label/class/icon with a `Record<…>` table; move boolean conditions into named helpers; pure helpers go to `features/<name>/model/` or a sibling `xxxHelpers.ts`, each with unit tests.
4. **Mutation + invalidation in a component → a mutation hook in `features/<name>/api/`.** Allowed (features README: call sites do not invalidate), but only when it is a verbatim move: same invalidated keys, same order, same `await` semantics, same error path. Add a hook test pinning the invalidated keys.
5. **Oversized non-component modules** (`ipc/mocks.ts`, `services/githubService.ts`, stores) split by domain or by concern into sibling modules re-exported from the original path, so importers do not change unless a task says so.

A split that only moves lines without a nameable responsibility is a review finding.

---

## Task map

| Task | Area | Files (violations) | Count |
| --- | --- | --- | --- |
| 1 | services, ipc, stores, utils | `services/githubService.ts` (4), `ipc/config.ts` (1), `ipc/mocks.ts` (1), `store/useSettingsStore.ts` (1), `store/useTabStore.ts` (1), `store/useToastStore.ts` (1), `utils/commandRegistry.ts` (1) | 10 |
| 2 | standalone hooks and model | `hooks/useGlobalShortcuts.ts` (2), `features/remote/api/useRemoteTask.ts` (1), `features/settings/hooks/useGitBehaviorSettings.ts` (1), `features/welcome/hooks/useRecentRepositories.ts` (1), `features/branch/hooks/useSidebarActions.ts` (1), `features/history/model/commitDetails.ts` (1) | 7 |
| 3 | changes | `components/changes/ChangesScreen.tsx` (2), `CommitBox.tsx` (2), `InteractiveDiffViewer.tsx` (4), `StagingFileList.tsx` (4) | 12 |
| 4 | pull requests | `components/pullrequests/CreatePullRequestModal.tsx` (3), `PullRequestDetailDrawer.tsx` (3), `components/sidebar/PullRequestsSection.tsx` (3) | 9 |
| 5 | rebase, merge, conflict | `components/rebase/InteractiveRebaseModal.tsx` (2), `RebaseCommitRow.tsx` (1), `RebaseLivePreview.tsx` (2), `components/merge/MergeBranchModal.tsx` (1), `components/conflict/ConflictResolverScreen.tsx` (3), `components/banner/InProgressOperationBanner.tsx` (1) | 10 |
| 6 | settings (git) | `components/settings/tabs/GitProfileTab.tsx` (4), `SettingsModal.tsx` (2), `tabs/GitHubSettingsTab.tsx` (1), `features/settings/components/GitBehaviorOptions.tsx` (1), `GitBehaviorPullStrategy.tsx` (2) | 10 |
| 7 | settings (display) | `components/settings/HelpTooltip.tsx` (1), `helpDiagrams/PullStrategyDiagram.tsx` (1), `tabs/AppearanceTab.tsx` (1), `tabs/DiffViewerTab.tsx` (1), `tabs/ExternalToolsTab.tsx` (1) | 5 |
| 8 | app shell and header | `App.tsx` (3), `components/Shell.tsx` (1), `components/ControlsBar.tsx` (1), `components/header/RepoHeader.tsx` (2), `header/WindowTabBar.tsx` (3) | 10 |
| 9 | overlays and chrome | `components/palette/CommandPalette.tsx` (1), `shortcuts/ShortcutsHelpModal.tsx` (1), `splash/SplashScreen.tsx` (1), `toast/ToastItem.tsx` (2), `common/RemoteProgressBanner.tsx` (2) | 7 |
| 10 | compare, inspector, graph | `components/compare/CompareDiffViewer.tsx` (1), `CompareFileList.tsx` (1), `CompareHeader.tsx` (1), `CompareModal.tsx` (2), `components/inspector/BlameView.tsx` (2), `FileHistoryView.tsx` (1), `FileInspectorDrawer.tsx` (1), `components/graph/GraphSvgLane.tsx` (1) | 10 |
| 11 | `features/branch` | `BranchSidebar.tsx` (2), `BranchSidebarSections.tsx` (3), `BranchTreeNode.tsx` (1), `CheckoutConflictModal.tsx` (1), `CreateBranchModal.tsx` (1), `DeleteBranchModal.tsx` (1), `RemoteTreeNode.tsx` (1), `RenameBranchModal.tsx` (1), `StashSection.tsx` (1), `TagSection.tsx` (2) | 14 |
| 12a | `features/history` | `CherryPickModal.tsx`, `CommitDetailPanel.tsx`, `CommitFileDiff.tsx`, `CommitFileList.tsx`, `CommitGraph.tsx`, `CommitGraphContextMenu.tsx`, `CommitGraphDialogs.tsx`, `CommitGraphRows.tsx` (2), `CommitMetadata.tsx`, `FileDiffViewer.tsx`, `RevertModal.tsx` | 12 |
| 12b | remote, stash, tag, welcome | `features/remote/components/AddEditRemoteModal.tsx` (2), `ManageRemotesModal.tsx` (2), `features/stash/components/StashDiffView.tsx` (1), `features/tag/components/CreateTagModal.tsx` (1), `DeleteTagModal.tsx` (1), `features/welcome/components/CloneModal.tsx` (1), `RecentRepositoryList.tsx` (2), `WelcomeScreen.tsx` (1) | 11 |
| 13 | lock | `.oxlintrc.json`, docs | raise to `error` |

Sum: 127. Paths without a prefix are relative to the row's first directory. Counts may drift by one or two as earlier tasks touch shared files; each task's acceptance is "zero violations in its files, and the global total drops by at least its count without any new violation elsewhere".

---

## Tasks 1–12b (same structure)

Each of Tasks 1–12b follows these steps for the files in its Task-map row. The task brief is the row plus this block.

**Files:** exactly the row's files, plus the new sibling files, hooks, helpers and tests the splits create.

**Interfaces:**
- Consumes: public exports of other features, unchanged.
- Produces: no change to any file's **public** exports (component names, props interfaces, hook return shapes, feature `index.ts` exports). New modules are internal. If a public export must change, stop and report.

- [ ] **Step 1: Baseline.** Run `pnpm lint 2>&1 | grep -E "<the row's files>"` and record every violation (rule, function, size/complexity) in the report.
- [ ] **Step 2: Coverage.** For each file, find its tests (see Global Constraints). For each file with none, write a characterization test that renders it (or calls it) with realistic props and asserts the main output plus one interaction. Run it on the original code (PASS), break the code (FAIL, record output), restore.
- [ ] **Step 3: Split one file at a time** using the splitting playbook. After each file: `pnpm vitest run <its tests>` PASS with no assertion changes, and `pnpm lint 2>&1 | grep "<file>"` shows no remaining violation for it or its new siblings. Commit per file or per tightly related pair (`♻️ split <Component> into <responsibilities>`).
- [ ] **Step 4: Task verification.** `pnpm lint` exit 0 and the per-rule counts drop by at least the row's count, with no new warning in any file; `pnpm build` exit 0; `pnpm test` PASS; `pnpm check-comment-language` and `pnpm check-query-keys` PASS. Record the before/after counts.

---

### Task 13: Raise the three rules to `error`, update docs

**Files:**
- Modify: `.oxlintrc.json` (`max-lines`, `max-lines-per-function`, `complexity`: `"warn"` → `"error"`; thresholds unchanged)
- Modify: `src/test/architectureBoundaries.test.ts` (the parked 7b nit: the comment describing `ipc/history.ts` ↔ `ipc/client.ts` as a "pre-existing cycle" must say it is a false positive from string literals in mock data)
- Modify: `docs/superpowers/REFACTOR_STATUS.md` (Vietnamese; parked 7b nit: add SHAs `d46d844`, `64cfed4`, `8e2457e` to the 7b fix-wave row; new "Giai đoạn 7c" subsection; §4 row 7c ✅; header progress 8/8; "Số liệu hiện tại"; §1 test counts)

- [ ] **Step 1: Confirm zero.** `pnpm lint 2>&1 | grep -cE "max-lines|complexity"` → `0`.
- [ ] **Step 2: Raise severities** and run the ratchet probe: add a temporary 81-line function to `src/shared/utils/git.ts` → `pnpm lint` exits **1** with `error eslint(max-lines-per-function)`; remove → exit **0**. Record both outputs.
- [ ] **Step 3: Full verification** — every command in Global Constraints; `pnpm lint` must report **0 warnings and 0 errors**.
- [ ] **Step 4: Docs** — as listed under Files; include the per-task before/after table, the characterization tests added, any flaky-test names captured, and remaining debt (features importing upward from `src/components/`, e.g. `CloneModal` → `components/welcome/repoUrl`, `FileDiffViewer` → `components/diff/DiffLineContent`).
- [ ] **Step 5: Commit** — `🔧 raise size and complexity lint rules to error`, then `📝 document phase 7c completion`.
