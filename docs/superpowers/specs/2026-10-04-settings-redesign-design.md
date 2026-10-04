# Settings modal redesign

Date: 2026-10-04
Status: approved design, pending implementation plan

## Problem

The current settings modal (`src/components/settings/`) has these issues:

- Scope is chosen in two places: the Global/Repository switcher in the header
  and the Inherit/Override radio cards inside the Git Profile tab.
- The header switcher shows on every tab, but only Git Profile and Git
  Behavior honor repo scope. Appearance, Diff, Tools and GitHub are
  app-wide, so the switcher misleads there.
- Content is a narrow stacked form inside an 85vw modal. Typography hierarchy
  is weak (many 10–11px labels) and sections have no visual grouping.
- The Git Profile Save button sits at the bottom of a scrolling form.
- Toggles are hand-rolled per tab; option pickers are large bordered buttons.
- Hardcoded strings: `"Đang tải cấu hình GitHub..."` in `GitHubSettingsTab`,
  `GitVista` / `v0.1.0 • macOS Edition` in `SettingsModalSidebar`.

## Goals

- One place to choose scope, shown only where scope applies.
- A grouped-rows layout (label + description left, control right) shared by
  all six tabs.
- Shared primitives instead of per-tab hand-rolled controls.
- No behavior change in data hooks (`useGitProfileForm`,
  `useGitBehaviorSettings`, `useGitHubSettings`, settings store setters),
  except the additions to `useGitProfileForm` listed below.

## Non-goals

- New settings or new persistence.
- Playwright E2E changes.
- Changing the settings store shape or the `SettingsTab` union.

## 1. Modal shell

`SettingsModal.tsx`

- Header: settings icon, title, close button. The description line and
  `SettingsModalScopeSwitcher` are removed from the header.
- Body: sidebar + scrollable content column (`max-w-3xl`, centered).

`SettingsModalSidebar.tsx` (width `w-56`)

- Two labeled groups (small uppercase group label):
  - **Git config**: Profile, Behavior
  - **Application**: Appearance, Diff viewer, Tools, GitHub
- `useSettingsModalState` returns grouped nav items
  (`navGroups: { id, label, items: NavItem[] }[]`).
- Active item: `bg-surface-hover`, `text-primary`, 2px accent bar on the left.
  No solid accent fill.
- Nav buttons expose `aria-current="page"` when active.
- Footer app name / version come from i18n.

## 2. Shared primitives

Settings-specific layout lives in `src/components/settings/ui/`:

| Component | Responsibility |
|---|---|
| `SettingsPage` | Page title (`text-lg`), description, body slot |
| `SettingsSection` | Uppercase group label + rounded card; children rows separated by dividers |
| `SettingsRow` | Left: label, optional description, optional `HelpTooltip`. Right: control slot. Props for `htmlFor` and `disabled` (dims row) |
| `SettingsSaveBar` | Sticky bar at the bottom of the content column: "Unsaved changes" + Discard + Save. Rendered only while dirty |
| `SettingsScopeBar` | "Apply to: [Global \| repo ▾]" segmented control plus, in repo scope, a "Use global configuration" row |

Generic controls go to `src/shared/ui/` (no imports from `ipc/`, `store/`,
`i18n/`) and are exported from its index:

| Component | Notes |
|---|---|
| `Switch` | `role="switch"`, `aria-checked`, `disabled`, forwards `id` and `data-testid`. Replaces the hand-rolled toggles |
| `SegmentedControl<T>` | `role="radiogroup"` with `role="radio"` options, arrow-key navigation, per-option `data-testid` |

Colors use design tokens only; conditional classes use `clsx`; sizes use the
Tailwind scale.

## 3. Git config tabs

### Scope bar (shared by Profile and Behavior)

- "Apply to" segmented control: Global / current repo. Repo segment only when
  a repository is open; a repo `Select` appears only when more than one repo
  tab is open. Scope state stays in `useSettingsModalState`; the bar receives
  it via `SettingsModalTabContent`.
- In repo scope, a `SettingsRow` "Use global configuration" with a `Switch`.
  The description shows the global `name <email>`. This replaces
  `GitProfileInheritToggle`, `GitProfileScopeBanner` and
  `GitBehaviorScopeBanner`.
- When the repo has a local override, the row shows a small
  "Reset to global" link button (keeps `data-testid="reset-to-global-btn"`).
- Existing test ids kept on the new elements: `scope-switcher`,
  `scope-btn-global`, `scope-btn-repo`, `scope-repo-select`. The
  "Use global configuration" switch gets `data-testid="toggle-use-global"`
  (checked = inherit); unit tests using `inherit-toggle-inherit` /
  `inherit-toggle-override` are updated to it.

### Git Profile

Sections:

1. **Identity**: Author name, Author email, Default branch. Inputs on the
   right (`w-72`, mono). While inheriting, inputs are disabled, show the global
   value, and display a lock icon. Replaces `GitProfileScopeBadge`.
2. **Signing**: "Sign all commits" (`Switch`, `data-testid="toggle-gpg-sign"`)
   and "Signing key" input. The key row is dimmed while signing is off.
3. **Commit conventions**: "Subject line length warning" as a
   `SegmentedControl` [No limit | 50 | 72] (`commit-limit-*` ids kept), with a
   small "Applies app-wide" hint. Still auto-saves through the store.

`SettingsSaveBar` replaces `GitProfileSaveButton`. `useGitProfileForm` gains:

- `isDirty`: current field values differ from the last loaded values.
- `handleDiscard`: restore the last loaded values.

The save bar is hidden when not dirty, and Save is disabled while saving or
while inheriting in repo scope (same rule as today).

### Git Behavior

Uses the same scope bar. Options regrouped, logic in
`useGitBehaviorSettings` unchanged (still saves per change):

1. **Pull & fetch**: pull strategy (`SegmentedControl`), fetch prune
   (`Switch`), auto-fetch interval (`Select`).
2. **Rebase**: autostash (`Switch`).
3. **Safety confirmations**: discard, delete branch, force push (`Switch`).

## 4. Application tabs

Presentation only; store setters and hooks unchanged.

- **Appearance**: *Theme* section: theme (`SegmentedControl`
  Light/Dark/System), colorblind mode (`Switch`). *Display* section:
  language, date format, avatar style.
- **Diff viewer**: *Layout* section: view mode, font size, tab size
  (`SegmentedControl`). *Options* section: ignore whitespace, line numbers
  (`Switch`). `DiffPreviewSection` stays last, in its own card.
- **External tools**: *Editor* section (`Select`; custom command input row
  only when "custom" is selected). *Terminal* section (`Select`).
- **GitHub**: connected-account card (avatar, login, Disconnect) and an
  *Authentication* section (token input with show/hide, Test & save,
  Use gh CLI, error/success via `Alert`). Loading text moves to i18n.

## 5. i18n, tests, rollout

i18n:

- New keys in both `src/i18n/vi.ts` and `src/i18n/en.ts`: sidebar group
  labels, app name/version footer, save bar texts, "Apply to", "Use global
  configuration", "Applies app-wide", GitHub loading text, any new section
  labels.
- Remove keys that no longer have a consumer.

Tests (Vitest, next to their module):

- `Switch.test.tsx`, `SegmentedControl.test.tsx`: roles, aria state, click,
  keyboard, disabled.
- `SettingsRow.test.tsx`: label association, disabled dimming.
- `SettingsScopeBar.test.tsx`: repo segment visibility, repo select only with
  more than one repo, inherit switch callbacks, reset link visibility.
- `useGitProfileForm` dirty/discard tests.
- Update `src/components/settings/tabs/GitProfileTab.test.tsx` and
  `src/test/SettingsTabs.test.tsx` for the new structure.

Rollout: one commit per step, `pnpm check` green after each:

1. `Switch`, `SegmentedControl` in `shared/ui` + tests.
2. `SettingsPage`, `SettingsSection`, `SettingsRow`, `SettingsSaveBar` + tests.
3. Modal shell and grouped sidebar; remove header scope switcher.
4. `SettingsScopeBar`, wired into the Git config tabs.
5. Git Profile on the new primitives; `isDirty` / `handleDiscard`.
6. Git Behavior on the new primitives.
7. Appearance, Diff viewer, Tools, GitHub on the new primitives.
8. Remove dead components (`GitProfileInheritToggle`, `GitProfileScopeBanner`,
   `GitProfileScopeBadge`, `GitProfileSaveButton`, `GitBehaviorScopeBanner`,
   `SettingsModalScopeSwitcher`) and unused i18n keys.

Constraints from `AGENTS.md` / `docs/CODING_RULES.md` apply throughout:
300 lines/file, 80 lines/function, no lint disables, no hardcoded text or
sizes, tokens for colors.
