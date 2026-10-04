# Settings Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the settings modal as a grouped-rows UI with one scope selector (only on the Git config tabs), shared `Switch` / `SegmentedControl` controls, and a sticky save bar for Git Profile.

**Architecture:** Generic controls live in `src/shared/ui/`. Settings-specific layout primitives (`SettingsPage`, `SettingsSection`, `SettingsRow`, `SettingsSaveBar`, `SettingsScopeSelector`, `SettingsInheritRow`) live in `src/components/settings/ui/`. Every tab is re-composed from these primitives; data hooks stay as they are except `useGitProfileForm`, which gains `isDirty` / `handleDiscard` derived from the loaded config.

**Tech Stack:** React 19, TypeScript, Tailwind (design tokens), zustand, Vitest + Testing Library, lucide-react, clsx, pnpm.

Spec: `docs/superpowers/specs/2026-10-04-settings-redesign-design.md`

## Global Constraints

- Code, comments, test names, commit messages: English. User-facing text: i18n only, every key in both `src/i18n/vi.ts` and `src/i18n/en.ts` (`en` is typed as `Translations = typeof vi`, so a missing key fails `tsc`).
- Lint limits: 300 lines/file, 80 lines/function, complexity 15, depth 4, 5 params, 3 nested callbacks. No `eslint-disable` / `oxlint-disable`.
- `src/shared/ui/**` never imports `ipc/`, `store/`, or `i18n/`.
- Colors via tokens / existing Tailwind token classes (`bg-surface-header`, `border-border-subtle`, `text-primary`, `text-secondary`, `text-tertiary`, `bg-accent`, `bg-accent-subtle`, `bg-surface-hover`, `bg-surface`, `bg-border-strong`). No hex, no `bg-[#…]`. No arbitrary sizes like `w-[22px]` / `text-[11px]` in new code; use the Tailwind scale. Conditional classes via `clsx`.
- Reuse `Button`, `Input`, `Select`, `Alert` from `src/shared/ui`.
- Do not touch Playwright E2E tests. Do not edit `src/ipc/bindings.generated.ts`.
- Commit messages: Gitmoji, no scope, e.g. `✨ add switch component`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The working tree has unrelated uncommitted edits (`scripts/check-contrast.mjs`, `src/store/useSettingsStore.ts`, `src/styles/tokens.css`). Never stage them: always `git add` explicit paths.
- Per-task verification: `pnpm vitest run <paths>`, `pnpm typecheck`, `pnpm lint`. Full `pnpm check` in the final task.

## File map

Create:
- `src/shared/ui/Switch.tsx`, `Switch.test.tsx`
- `src/shared/ui/SegmentedControl.tsx`, `segmentedControl.helpers.ts`, `SegmentedControl.test.tsx`
- `src/components/settings/ui/SettingsPage.tsx`, `SettingsSection.tsx`, `SettingsRow.tsx`, `SettingsSaveBar.tsx`, `SettingsScopeSelector.tsx`, `SettingsInheritRow.tsx`, `index.ts`, plus `SettingsRow.test.tsx`, `SettingsSaveBar.test.tsx`, `SettingsScopeSelector.test.tsx`, `SettingsInheritRow.test.tsx`
- `src/components/settings/settingsModalState.helpers.tsx`, `settingsModalState.helpers.test.ts`
- `src/components/settings/SettingsNavButton.tsx`
- `src/domain/constants/app.ts`
- `src/components/settings/tabs/useGitProfileDirtyState.ts`
- `src/components/settings/tabs/GitProfileIdentitySection.tsx`, `GitProfileSigningSection.tsx`, `GitProfileCommitSection.tsx`
- `src/features/settings/components/GitBehaviorPullFetchSection.tsx`, `GitBehaviorRebaseSection.tsx`, `GitBehaviorPullFetchSection.test.tsx`
- `src/components/settings/tabs/AppearanceThemeSection.tsx`, `AppearanceDisplaySection.tsx`
- `src/components/settings/tabs/DiffLayoutSection.tsx`, `DiffOptionsSection.tsx`

Modify: `src/shared/ui/index.ts`, `src/i18n/vi.ts`, `src/i18n/en.ts`, `SettingsModal.tsx`, `SettingsModalSidebar.tsx`, `SettingsModalTabContent.tsx`, `useSettingsModalState.tsx`, `GitProfileTab.tsx`, `gitProfileFormHelpers.ts` (+ test), `useGitProfileForm.ts`, `GitBehaviorTab.tsx`, `GitBehaviorOptions.tsx` (+ test), `GitBehaviorConfirmationsSection.tsx`, `AppearanceTab.tsx`, `DiffViewerTab.tsx`, `DiffPreviewSection.tsx`, `ExternalToolsTab.tsx`, `ExternalToolsEditorSection.tsx`, `ExternalToolsTerminalSection.tsx`, `GitHubSettingsTab.tsx`, `GitHubTokenPanel.tsx`, `GitHubTokenStatusAlerts.tsx`, `GitHubAccountCard.tsx`, tests in `src/test/SettingsModal.test.tsx`, `src/test/SettingsTabs.test.tsx`, `src/components/settings/SettingsModal.test.tsx`, `src/components/settings/tabs/GitProfileTab.test.tsx`.

Delete (in the task that replaces them): `SettingsModalScopeSwitcher.tsx`, `GitProfileInheritToggle.tsx`, `GitProfileScopeBanner.tsx`, `GitProfileScopeBadge.tsx`, `GitProfileSaveButton.tsx`, `GitProfileIdentityFields.tsx`, `GitProfileGpgSection.tsx`, `GitProfileCommitConventionsSection.tsx`, `GitBehaviorScopeBanner.tsx`, `GitBehaviorToggleSwitch.tsx`, `GitBehaviorPullStrategy.tsx` (+ test), `GitBehaviorPullStrategyGlobalOptions.tsx`, `GitBehaviorPullStrategyRepoOptions.tsx`, `GitBehaviorPullStrategyOption.tsx`, `GitBehaviorFlagsSection.tsx`, `GitBehaviorAutoFetchSection.tsx`, `AppearanceLocaleSection.tsx`, `AppearanceDateFormatSection.tsx`, `AppearanceAvatarSection.tsx`, `AppearanceColorblindSection.tsx`, `DiffViewModeSection.tsx`, `DiffFontSizeSection.tsx`, `DiffTabSizeSection.tsx`, `DiffTogglesSection.tsx`.

---

### Task 1: i18n keys for the redesign

**Files:**
- Modify: `src/i18n/vi.ts`, `src/i18n/en.ts`

**Interfaces:**
- Produces (used by all later tasks): `t.settings.sidebar.{groupGit,groupApp,version}`, `t.settings.scope.{applyTo,useGlobal,appWide,lockedHint}`, `t.settings.saveBar.{unsaved,discard}`, `t.settings.sections.{identity,signing,commit,pullFetch,rebase,theme,display,layout,options,preview,editor,terminal,auth}`, `t.settings.profile.{commitLength50Short,commitLength72Short}`, `t.settings.diff.{viewModeUnifiedShort,viewModeSplitShort}`, `t.settings.behavior.{pullMergeShort,pullRebaseShort}`, `t.settings.github.{loading,showToken,hideToken,useGhCliHint}`.

- [ ] **Step 1: Add the new nested objects to `vi.ts`**

In `src/i18n/vi.ts`, inside `settings: {`, directly after the closing `},` of `tabs: { … },` insert:

```ts
    sidebar: {
      groupGit: "Cấu hình Git",
      groupApp: "Ứng dụng",
      version: "Phiên bản {version}",
    },
    scope: {
      applyTo: "Áp dụng cho",
      useGlobal: "Dùng cấu hình Global",
      appWide: "Áp dụng cho toàn ứng dụng",
      lockedHint: "Đang kế thừa từ Global. Tắt \"Dùng cấu hình Global\" để chỉnh sửa.",
    },
    saveBar: {
      unsaved: "Có thay đổi chưa lưu",
      discard: "Hoàn tác",
    },
    sections: {
      identity: "Danh tính",
      signing: "Ký commit",
      commit: "Quy ước commit",
      pullFetch: "Pull & Fetch",
      rebase: "Rebase",
      theme: "Chủ đề",
      display: "Hiển thị",
      layout: "Bố cục",
      options: "Tùy chọn",
      preview: "Xem trước",
      editor: "Trình soạn thảo",
      terminal: "Terminal",
      auth: "Xác thực",
    },
```

- [ ] **Step 2: Add the short labels to existing `vi.ts` objects**

- In `profile: {`, after the `commitLength72: …,` line:
  ```ts
      commitLength50Short: "50 ký tự",
      commitLength72Short: "72 ký tự",
  ```
- In `diff: {`, after the `viewModeSplitDesc: …,` line:
  ```ts
      viewModeUnifiedShort: "Gộp dòng",
      viewModeSplitShort: "Song song",
  ```
- In `behavior: {`, after the `pullRebaseDesc: …,` line:
  ```ts
      pullMergeShort: "Merge",
      pullRebaseShort: "Rebase",
  ```
- In `github: {`, after the `noToken: …,` line:
  ```ts
      loading: "Đang tải cấu hình GitHub...",
      showToken: "Hiện token",
      hideToken: "Ẩn token",
      useGhCliHint: "Tự động lấy token từ `gh auth token`",
  ```

- [ ] **Step 3: Mirror everything in `en.ts`**

Same positions in `src/i18n/en.ts`:

```ts
    sidebar: {
      groupGit: "Git config",
      groupApp: "Application",
      version: "Version {version}",
    },
    scope: {
      applyTo: "Apply to",
      useGlobal: "Use global configuration",
      appWide: "Applies app-wide",
      lockedHint: "Inherited from Global. Turn off \"Use global configuration\" to edit.",
    },
    saveBar: {
      unsaved: "Unsaved changes",
      discard: "Discard",
    },
    sections: {
      identity: "Identity",
      signing: "Commit signing",
      commit: "Commit conventions",
      pullFetch: "Pull & Fetch",
      rebase: "Rebase",
      theme: "Theme",
      display: "Display",
      layout: "Layout",
      options: "Options",
      preview: "Preview",
      editor: "Editor",
      terminal: "Terminal",
      auth: "Authentication",
    },
```

```ts
      commitLength50Short: "50 chars",
      commitLength72Short: "72 chars",
```

```ts
      viewModeUnifiedShort: "Unified",
      viewModeSplitShort: "Split",
```

```ts
      pullMergeShort: "Merge",
      pullRebaseShort: "Rebase",
```

```ts
      loading: "Loading GitHub settings...",
      showToken: "Show token",
      hideToken: "Hide token",
      useGhCliHint: "Read the token from `gh auth token`",
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck`
Expected: exit 0 (a key missing from `en.ts` would fail here).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/vi.ts src/i18n/en.ts
git commit -m "🌐 add settings redesign translations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `Switch` shared control

**Files:**
- Create: `src/shared/ui/Switch.tsx`, `src/shared/ui/Switch.test.tsx`
- Modify: `src/shared/ui/index.ts`

**Interfaces:**
- Produces: `Switch` with props `{ checked: boolean; onChange: (checked: boolean) => void; id?: string; disabled?: boolean; "aria-label"?: string; "aria-labelledby"?: string; "data-testid"?: string }`. Exported from `src/shared/ui` with `type SwitchProps`.

- [ ] **Step 1: Write the failing test**

`src/shared/ui/Switch.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("exposes switch role and checked state", () => {
    render(<Switch checked aria-label="Line numbers" onChange={() => {}} />);
    const sw = screen.getByRole("switch", { name: "Line numbers" });
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("reports the toggled value on click", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} aria-label="Prune" onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not report changes while disabled", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} disabled aria-label="Prune" onChange={onChange} />);
    const sw = screen.getByRole("switch");
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards id and data-testid", () => {
    render(<Switch checked={false} id="gpg" data-testid="toggle-gpg" onChange={() => {}} />);
    expect(screen.getByTestId("toggle-gpg")).toHaveAttribute("id", "gpg");
  });

  it("is a non-submitting button", () => {
    render(<Switch checked={false} aria-label="X" onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("type", "button");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run src/shared/ui/Switch.test.tsx`
Expected: FAIL, cannot resolve `./Switch`.

- [ ] **Step 3: Implement**

`src/shared/ui/Switch.tsx`:

```tsx
import React from "react";
import clsx from "clsx";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "data-testid"?: string;
}

/**
 * Shared on/off toggle (`role="switch"`). Knows nothing about what it
 * toggles; the caller names it via `aria-label` or `aria-labelledby`.
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  id,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "data-testid": testId,
}) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    data-testid={testId}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={clsx(
      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
      "transition-colors duration-200 ease-in-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      "disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-accent" : "bg-border-strong"
    )}
  >
    <span
      aria-hidden="true"
      className={clsx(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm",
        "transition-transform duration-200 ease-in-out",
        checked ? "translate-x-4" : "translate-x-0"
      )}
    />
  </button>
);
```

Append to `src/shared/ui/index.ts`:

```ts
export { Switch, type SwitchProps } from "./Switch";
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/shared/ui/Switch.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/Switch.tsx src/shared/ui/Switch.test.tsx src/shared/ui/index.ts
git commit -m "✨ add shared switch component

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `SegmentedControl` shared control

**Files:**
- Create: `src/shared/ui/SegmentedControl.tsx`, `src/shared/ui/segmentedControl.helpers.ts`, `src/shared/ui/SegmentedControl.test.tsx`
- Modify: `src/shared/ui/index.ts`

**Interfaces:**
- Produces:
  ```ts
  interface SegmentedOption<T extends string | number> { value: T; label: React.ReactNode; testId?: string; disabled?: boolean }
  interface SegmentedControlProps<T extends string | number> {
    value: T; onChange: (value: T) => void; options: readonly SegmentedOption<T>[];
    "aria-label"?: string; "aria-labelledby"?: string; disabled?: boolean; "data-testid"?: string;
  }
  function SegmentedControl<T extends string | number>(props: SegmentedControlProps<T>): JSX.Element
  ```
  Exported from `src/shared/ui` with `type SegmentedControlProps`, `type SegmentedOption`.

- [ ] **Step 1: Write the failing test**

`src/shared/ui/SegmentedControl.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";

const OPTIONS: SegmentedOption<number>[] = [
  { value: 0, label: "Off", testId: "opt-0" },
  { value: 50, label: "50", testId: "opt-50" },
  { value: 72, label: "72", testId: "opt-72", disabled: true },
  { value: 100, label: "100", testId: "opt-100" },
];

function Controlled({ onPicked }: { onPicked?: (v: number) => void }) {
  const [value, setValue] = useState(0);
  return (
    <SegmentedControl
      aria-label="Limit"
      value={value}
      options={OPTIONS}
      onChange={(next) => {
        setValue(next);
        onPicked?.(next);
      }}
    />
  );
}

describe("SegmentedControl", () => {
  it("renders a radiogroup with the selected radio checked", () => {
    render(<Controlled />);
    expect(screen.getByRole("radiogroup", { name: "Limit" })).toBeInTheDocument();
    expect(screen.getByTestId("opt-0")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("opt-50")).toHaveAttribute("aria-checked", "false");
  });

  it("selects an option on click", () => {
    const onPicked = vi.fn();
    render(<Controlled onPicked={onPicked} />);
    fireEvent.click(screen.getByTestId("opt-50"));
    expect(onPicked).toHaveBeenCalledWith(50);
    expect(screen.getByTestId("opt-50")).toHaveAttribute("aria-checked", "true");
  });

  it("only the selected radio is in the tab order", () => {
    render(<Controlled />);
    expect(screen.getByTestId("opt-0")).toHaveAttribute("tabindex", "0");
    expect(screen.getByTestId("opt-50")).toHaveAttribute("tabindex", "-1");
  });

  it("moves with arrow keys, skipping disabled options and wrapping", () => {
    const onPicked = vi.fn();
    render(<Controlled onPicked={onPicked} />);
    fireEvent.keyDown(screen.getByTestId("opt-0"), { key: "ArrowRight" });
    expect(onPicked).toHaveBeenLastCalledWith(50);
    fireEvent.keyDown(screen.getByTestId("opt-50"), { key: "ArrowRight" });
    expect(onPicked).toHaveBeenLastCalledWith(100);
    fireEvent.keyDown(screen.getByTestId("opt-100"), { key: "ArrowRight" });
    expect(onPicked).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(screen.getByTestId("opt-0"), { key: "ArrowLeft" });
    expect(onPicked).toHaveBeenLastCalledWith(100);
    expect(screen.getByTestId("opt-100")).toHaveFocus();
  });

  it("disables every option when disabled", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl aria-label="L" value={0} options={OPTIONS} onChange={onChange} disabled />
    );
    fireEvent.click(screen.getByTestId("opt-50"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("opt-50")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run src/shared/ui/SegmentedControl.test.tsx`
Expected: FAIL, cannot resolve `./SegmentedControl`.

- [ ] **Step 3: Implement the helper**

`src/shared/ui/segmentedControl.helpers.ts`:

```ts
/** Direction for an arrow key, or 0 when the key does not move the selection. */
export function arrowStep(key: string): -1 | 0 | 1 {
  if (key === "ArrowRight" || key === "ArrowDown") return 1;
  if (key === "ArrowLeft" || key === "ArrowUp") return -1;
  return 0;
}

/** Next enabled index from `from` in direction `step`, wrapping; -1 when none is enabled. */
export function nextEnabledIndex(
  disabled: readonly boolean[],
  from: number,
  step: -1 | 1
): number {
  const count = disabled.length;
  for (let offset = 1; offset <= count; offset += 1) {
    const index = (from + step * offset + count * offset) % count;
    if (!disabled[index]) return index;
  }
  return -1;
}
```

- [ ] **Step 4: Implement the component**

`src/shared/ui/SegmentedControl.tsx`:

```tsx
import React, { useRef } from "react";
import clsx from "clsx";
import { arrowStep, nextEnabledIndex } from "./segmentedControl.helpers";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  testId?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

/**
 * Shared single-choice segmented control (WAI-ARIA radiogroup). Arrow keys
 * move and select, skipping disabled options; only the selected option is
 * in the tab order.
 */
export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  disabled = false,
  "data-testid": testId,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const disabledFlags = options.map((opt) => disabled || Boolean(opt.disabled));
  const focusIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = arrowStep(event.key);
    if (step === 0) return;
    event.preventDefault();
    const next = nextEnabledIndex(disabledFlags, index, step);
    if (next === -1) return;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-testid={testId}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-header/60 p-0.5"
    >
      {options.map((opt, index) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={disabledFlags[index]}
            data-testid={opt.testId}
            onClick={() => onChange(opt.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected ? "bg-surface text-primary shadow-xs" : "text-secondary hover:text-primary"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

Append to `src/shared/ui/index.ts`:

```ts
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from "./SegmentedControl";
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run src/shared/ui/SegmentedControl.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/SegmentedControl.tsx src/shared/ui/segmentedControl.helpers.ts src/shared/ui/SegmentedControl.test.tsx src/shared/ui/index.ts
git commit -m "✨ add shared segmented control

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Settings layout primitives

**Files:**
- Create: `src/components/settings/ui/SettingsPage.tsx`, `SettingsSection.tsx`, `SettingsRow.tsx`, `SettingsSaveBar.tsx`, `SettingsInheritRow.tsx`, `index.ts`, `SettingsRow.test.tsx`, `SettingsSaveBar.test.tsx`, `SettingsInheritRow.test.tsx`

**Interfaces:**
- Consumes: `Switch` (Task 2), `Button` from `src/shared/ui`, i18n keys from Task 1.
- Produces (exported from `src/components/settings/ui/index.ts`):
  ```ts
  SettingsPage: React.FC<{ title: string; description?: string; toolbar?: React.ReactNode; children: React.ReactNode }>
  SettingsSection: React.FC<{ title: string; hint?: string; help?: React.ReactNode; children: React.ReactNode }>
  SettingsRow: React.FC<{ label: React.ReactNode; description?: React.ReactNode; htmlFor?: string; labelId?: string; help?: React.ReactNode; disabled?: boolean; children?: React.ReactNode; "data-testid"?: string }>
  SettingsSaveBar: React.FC<{ visible: boolean; saving: boolean; saveDisabled: boolean; saveLabel: string; onDiscard: () => void }>
  SettingsInheritRow: React.FC<{ inheriting: boolean; onInheritChange: (inherit: boolean) => void; description?: React.ReactNode; disabled?: boolean; canReset?: boolean; onReset?: () => void }>
  ```
  `SettingsSaveBar` renders a `type="submit"` button with `data-testid="save-profile-btn"` and a discard button with `data-testid="discard-profile-btn"`. `SettingsInheritRow` renders a switch with `data-testid="toggle-use-global"` and, when `canReset && onReset`, a button with `data-testid="reset-to-global-btn"`.

- [ ] **Step 1: Write the failing tests**

`src/components/settings/ui/SettingsRow.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsRow } from "./SettingsRow";

describe("SettingsRow", () => {
  it("associates the label with its control through htmlFor", () => {
    render(
      <SettingsRow label="Author name" htmlFor="name">
        <input id="name" />
      </SettingsRow>
    );
    expect(screen.getByLabelText("Author name")).toHaveAttribute("id", "name");
  });

  it("renders the label as plain text with an id when there is no htmlFor", () => {
    render(<SettingsRow label="Prune" labelId="prune-label" />);
    expect(screen.getByText("Prune")).toHaveAttribute("id", "prune-label");
  });

  it("renders description and help", () => {
    render(<SettingsRow label="A" description="Desc" help={<span>?</span>} />);
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("dims the row when disabled", () => {
    render(<SettingsRow label="A" disabled data-testid="row" />);
    expect(screen.getByTestId("row")).toHaveClass("opacity-60");
  });
});
```

`src/components/settings/ui/SettingsSaveBar.test.tsx`:

```tsx
import type { FormEvent } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsSaveBar } from "./SettingsSaveBar";

describe("SettingsSaveBar", () => {
  it("renders nothing when not visible", () => {
    render(
      <SettingsSaveBar visible={false} saving={false} saveDisabled={false} saveLabel="Save" onDiscard={() => {}} />
    );
    expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument();
  });

  it("submits the surrounding form and calls onDiscard", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    const onDiscard = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <SettingsSaveBar visible saving={false} saveDisabled={false} saveLabel="Save" onDiscard={onDiscard} />
      </form>
    );
    fireEvent.click(screen.getByTestId("save-profile-btn"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("discard-profile-btn"));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("disables save when saveDisabled", () => {
    render(
      <SettingsSaveBar visible saving={false} saveDisabled saveLabel="Save" onDiscard={() => {}} />
    );
    expect(screen.getByTestId("save-profile-btn")).toBeDisabled();
  });
});
```

`src/components/settings/ui/SettingsInheritRow.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsInheritRow } from "./SettingsInheritRow";

describe("SettingsInheritRow", () => {
  it("reports turning inheritance off", () => {
    const onInheritChange = vi.fn();
    render(<SettingsInheritRow inheriting onInheritChange={onInheritChange} />);
    const sw = screen.getByTestId("toggle-use-global");
    expect(sw).toHaveAttribute("aria-checked", "true");
    fireEvent.click(sw);
    expect(onInheritChange).toHaveBeenCalledWith(false);
  });

  it("shows the reset button only when it can reset", () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <SettingsInheritRow inheriting={false} onInheritChange={() => {}} onReset={onReset} />
    );
    expect(screen.queryByTestId("reset-to-global-btn")).not.toBeInTheDocument();

    rerender(
      <SettingsInheritRow inheriting={false} onInheritChange={() => {}} canReset onReset={onReset} />
    );
    fireEvent.click(screen.getByTestId("reset-to-global-btn"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run src/components/settings/ui`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `SettingsPage`**

`src/components/settings/ui/SettingsPage.tsx`:

```tsx
import React from "react";

export interface SettingsPageProps {
  title: string;
  description?: string;
  /** Rendered between the header and the sections, e.g. the scope selector. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

/** Title, description and body of one settings tab. */
export const SettingsPage: React.FC<SettingsPageProps> = ({
  title,
  description,
  toolbar,
  children,
}) => (
  <div className="space-y-6">
    <header className="space-y-1">
      <h3 className="m-0 text-lg font-semibold text-primary">{title}</h3>
      {description && <p className="m-0 text-xs text-secondary">{description}</p>}
    </header>
    {toolbar}
    {children}
  </div>
);
```

- [ ] **Step 4: Implement `SettingsSection`**

`src/components/settings/ui/SettingsSection.tsx`:

```tsx
import React from "react";

export interface SettingsSectionProps {
  title: string;
  /** Short note shown at the right of the section title. */
  hint?: string;
  /** Usually a `HelpTooltip`, shown next to the title. */
  help?: React.ReactNode;
  children: React.ReactNode;
}

/** Group label plus a rounded card whose rows are separated by dividers. */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  hint,
  help,
  children,
}) => (
  <section aria-label={title} className="space-y-2">
    <div className="flex items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-1.5">
        <h4 className="m-0 text-xs font-semibold uppercase tracking-wide text-tertiary">{title}</h4>
        {help}
      </div>
      {hint && <span className="text-xs text-tertiary">{hint}</span>}
    </div>
    <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-header/30">
      {children}
    </div>
  </section>
);
```

- [ ] **Step 5: Implement `SettingsRow`**

`src/components/settings/ui/SettingsRow.tsx`:

```tsx
import React from "react";
import clsx from "clsx";

export interface SettingsRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Id of the control; renders the label as a `<label>`. */
  htmlFor?: string;
  /** Id for the label, for controls named through `aria-labelledby`. */
  labelId?: string;
  help?: React.ReactNode;
  disabled?: boolean;
  /** The control, aligned to the right. */
  children?: React.ReactNode;
  "data-testid"?: string;
}

const LABEL_CLASS = "text-sm font-medium text-primary";

/** One setting: label and description on the left, its control on the right. */
export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  htmlFor,
  labelId,
  help,
  disabled,
  children,
  "data-testid": testId,
}) => (
  <div
    data-testid={testId}
    className={clsx("flex items-center justify-between gap-6 px-4 py-3", disabled && "opacity-60")}
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} id={labelId} className={LABEL_CLASS}>
            {label}
          </label>
        ) : (
          <span id={labelId} className={LABEL_CLASS}>
            {label}
          </span>
        )}
        {help}
      </div>
      {description && <p className="m-0 mt-0.5 text-xs text-secondary">{description}</p>}
    </div>
    {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
  </div>
);
```

- [ ] **Step 6: Implement `SettingsSaveBar`**

`src/components/settings/ui/SettingsSaveBar.tsx`:

```tsx
import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

export interface SettingsSaveBarProps {
  visible: boolean;
  saving: boolean;
  saveDisabled: boolean;
  saveLabel: string;
  onDiscard: () => void;
}

/** Floating bar pinned to the bottom of the content column while a form has unsaved changes. */
export const SettingsSaveBar: React.FC<SettingsSaveBarProps> = ({
  visible,
  saving,
  saveDisabled,
  saveLabel,
  onDiscard,
}) => {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-header px-4 py-3 shadow-lg">
      <span className="text-xs font-medium text-secondary">{t.settings.saveBar.unsaved}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          data-testid="discard-profile-btn"
          onClick={onDiscard}
          disabled={saving}
        >
          {t.settings.saveBar.discard}
        </Button>
        <Button
          variant="primary"
          type="submit"
          data-testid="save-profile-btn"
          loading={saving}
          disabled={saveDisabled}
        >
          <Check size={14} />
          <span>{saveLabel}</span>
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 7: Implement `SettingsInheritRow`**

`src/components/settings/ui/SettingsInheritRow.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { Button, Switch } from "../../../shared/ui";
import { SettingsRow } from "./SettingsRow";

export interface SettingsInheritRowProps {
  inheriting: boolean;
  onInheritChange: (inherit: boolean) => void;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Show the reset button (the repo has a saved local override). */
  canReset?: boolean;
  onReset?: () => void;
}

const LABEL_ID = "settings-use-global-label";

/** "Use global configuration" card shown at the top of a Git config tab in repo scope. */
export const SettingsInheritRow: React.FC<SettingsInheritRowProps> = ({
  inheriting,
  onInheritChange,
  description,
  disabled,
  canReset,
  onReset,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-accent/30 bg-accent-subtle/30">
      <SettingsRow label={t.settings.scope.useGlobal} labelId={LABEL_ID} description={description}>
        {canReset && onReset && (
          <Button
            variant="secondary"
            data-testid="reset-to-global-btn"
            onClick={onReset}
            disabled={disabled}
          >
            {t.settings.profile.resetToGlobalBtn}
          </Button>
        )}
        <Switch
          checked={inheriting}
          onChange={onInheritChange}
          disabled={disabled}
          aria-labelledby={LABEL_ID}
          data-testid="toggle-use-global"
        />
      </SettingsRow>
    </div>
  );
};
```

- [ ] **Step 8: Barrel**

`src/components/settings/ui/index.ts`:

```ts
export { SettingsPage, type SettingsPageProps } from "./SettingsPage";
export { SettingsSection, type SettingsSectionProps } from "./SettingsSection";
export { SettingsRow, type SettingsRowProps } from "./SettingsRow";
export { SettingsSaveBar, type SettingsSaveBarProps } from "./SettingsSaveBar";
export { SettingsInheritRow, type SettingsInheritRowProps } from "./SettingsInheritRow";
```

- [ ] **Step 9: Run tests, typecheck, lint**

Run: `pnpm vitest run src/components/settings/ui && pnpm typecheck && pnpm lint`
Expected: PASS (9 tests), no type or lint errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/settings/ui
git commit -m "✨ add settings layout primitives

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Modal shell, grouped sidebar and scope selector

**Files:**
- Create: `src/domain/constants/app.ts`, `src/components/settings/settingsModalState.helpers.tsx`, `src/components/settings/settingsModalState.helpers.test.ts`, `src/components/settings/SettingsNavButton.tsx`, `src/components/settings/ui/SettingsScopeSelector.tsx`, `src/components/settings/ui/SettingsScopeSelector.test.tsx`
- Modify: `src/components/settings/ui/index.ts`, `src/components/settings/useSettingsModalState.tsx`, `src/components/settings/SettingsModalSidebar.tsx`, `src/components/settings/SettingsModal.tsx`, `src/components/settings/SettingsModalTabContent.tsx`, `src/components/settings/tabs/GitProfileTab.tsx` (props only), `src/features/settings/components/GitBehaviorTab.tsx` (props only), `src/test/SettingsModal.test.tsx`, `src/components/settings/SettingsModal.test.tsx`
- Delete: `src/components/settings/SettingsModalScopeSwitcher.tsx`

**Interfaces:**
- Consumes: `SegmentedControl`, `Select` from `src/shared/ui`; `SettingsPage` (its `toolbar` slot).
- Produces:
  ```ts
  // settingsModalState.helpers.tsx
  interface NavItem { id: SettingsTab; label: string; icon: React.ReactNode }
  interface NavGroup { id: "git" | "app"; label: string; items: NavItem[] }
  interface RepoChoice { path: string; label: string }
  function buildNavGroups(t: Translations): NavGroup[]
  function repoDisplayName(path: string): string
  function buildRepoChoices(tabs: TabItem[], currentRepoPath: string | null): RepoChoice[]
  function isGitConfigTab(tab: SettingsTab): boolean
  // ui/SettingsScopeSelector.tsx
  interface SettingsScopeSelectorProps {
    hasRepo: boolean; scope: "global" | "repo"; onScopeChange: (scope: "global" | "repo") => void;
    repos: RepoChoice[]; selectedRepoPath: string; onRepoChange: (path: string) => void;
  }
  // GitProfileTab / GitBehaviorTab gain `toolbar?: React.ReactNode` and drop `onScopeChange`.
  ```
  `APP_VERSION` constant in `src/domain/constants/app.ts`.

- [ ] **Step 1: Write the failing helper and selector tests**

`src/components/settings/settingsModalState.helpers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildNavGroups, buildRepoChoices, isGitConfigTab, repoDisplayName } from "./settingsModalState.helpers";
import { en } from "../../i18n/en";
import type { TabItem } from "../../types/tab";

const repoTab = (path: string, name: string, alias?: string): TabItem =>
  ({
    id: path,
    type: "repo",
    alias,
    repo: { path, name, is_bare: false, head_branch: "main", head_commit_id: "1" },
  }) as TabItem;

describe("settingsModalState helpers", () => {
  it("groups git config tabs before application tabs", () => {
    const groups = buildNavGroups(en);
    expect(groups.map((g) => g.id)).toEqual(["git", "app"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["profile", "behavior"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["appearance", "diff", "tools", "github"]);
  });

  it("flags only profile and behavior as git config tabs", () => {
    expect(isGitConfigTab("profile")).toBe(true);
    expect(isGitConfigTab("behavior")).toBe(true);
    expect(isGitConfigTab("appearance")).toBe(false);
  });

  it("uses alias, then repo name, for repo choices", () => {
    const choices = buildRepoChoices([repoTab("d:/a", "alpha", "Work"), repoTab("d:/b", "beta")], "d:/a");
    expect(choices).toEqual([
      { path: "d:/a", label: "Work" },
      { path: "d:/b", label: "beta" },
    ]);
  });

  it("adds the current repo when no tab matches it", () => {
    expect(buildRepoChoices([], "d:/work/gamma")).toEqual([{ path: "d:/work/gamma", label: "gamma" }]);
  });

  it("derives a display name from the last path segment", () => {
    expect(repoDisplayName("C:\\code\\nomi\\")).toBe("nomi");
  });
});
```

`src/components/settings/ui/SettingsScopeSelector.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsScopeSelector, type SettingsScopeSelectorProps } from "./SettingsScopeSelector";

const base: SettingsScopeSelectorProps = {
  hasRepo: true,
  scope: "repo",
  onScopeChange: () => {},
  repos: [{ path: "d:/a", label: "alpha" }],
  selectedRepoPath: "d:/a",
  onRepoChange: () => {},
};

describe("SettingsScopeSelector", () => {
  it("shows a static global line without a repo", () => {
    render(<SettingsScopeSelector {...base} hasRepo={false} scope="global" repos={[]} />);
    expect(screen.queryByTestId("scope-switcher")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scope-btn-repo")).not.toBeInTheDocument();
  });

  it("switches scope through the segmented control", () => {
    const onScopeChange = vi.fn();
    render(<SettingsScopeSelector {...base} onScopeChange={onScopeChange} />);
    expect(screen.getByTestId("scope-btn-repo")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("scope-btn-repo")).toHaveTextContent("alpha");
    fireEvent.click(screen.getByTestId("scope-btn-global"));
    expect(onScopeChange).toHaveBeenCalledWith("global");
  });

  it("shows the repo picker only in repo scope with more than one repo", () => {
    const repos = [...base.repos, { path: "d:/b", label: "beta" }];
    const onRepoChange = vi.fn();
    const { rerender } = render(<SettingsScopeSelector {...base} />);
    expect(screen.queryByTestId("scope-repo-select")).not.toBeInTheDocument();

    rerender(<SettingsScopeSelector {...base} repos={repos} onRepoChange={onRepoChange} />);
    fireEvent.click(screen.getByTestId("scope-repo-select"));
    fireEvent.click(screen.getByRole("option", { name: "beta" }));
    expect(onRepoChange).toHaveBeenCalledWith("d:/b");

    rerender(<SettingsScopeSelector {...base} scope="global" repos={repos} />);
    expect(screen.queryByTestId("scope-repo-select")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run src/components/settings/settingsModalState.helpers.test.ts src/components/settings/ui/SettingsScopeSelector.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: App version constant**

`src/domain/constants/app.ts`:

```ts
/** Version shown in the settings sidebar footer. Keep in sync with package.json. */
export const APP_VERSION = "0.1.0";
```

- [ ] **Step 4: Helpers**

`src/components/settings/settingsModalState.helpers.tsx`:

```tsx
import React from "react";
import { User, Palette, Sliders, FileCode, Terminal, GitPullRequest } from "lucide-react";
import type { Translations } from "../../i18n/vi";
import type { SettingsTab } from "../../store/useSettingsStore";
import type { TabItem } from "../../types/tab";

export interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  id: "git" | "app";
  label: string;
  items: NavItem[];
}

export interface RepoChoice {
  path: string;
  label: string;
}

const GIT_CONFIG_TABS: readonly SettingsTab[] = ["profile", "behavior"];

/** True for tabs whose settings can be scoped to a repository. */
export function isGitConfigTab(tab: SettingsTab): boolean {
  return GIT_CONFIG_TABS.includes(tab);
}

/** Sidebar navigation: repo-scopable Git config first, then app-wide settings. */
export function buildNavGroups(t: Translations): NavGroup[] {
  const tabs = t.settings.tabs;
  return [
    {
      id: "git",
      label: t.settings.sidebar.groupGit,
      items: [
        { id: "profile", label: tabs.profile, icon: <User size={16} /> },
        { id: "behavior", label: tabs.behavior, icon: <Sliders size={16} /> },
      ],
    },
    {
      id: "app",
      label: t.settings.sidebar.groupApp,
      items: [
        { id: "appearance", label: tabs.appearance, icon: <Palette size={16} /> },
        { id: "diff", label: tabs.diff, icon: <FileCode size={16} /> },
        { id: "tools", label: tabs.tools, icon: <Terminal size={16} /> },
        { id: "github", label: tabs.github, icon: <GitPullRequest size={16} /> },
      ],
    },
  ];
}

/** Last path segment of a repository path. */
export function repoDisplayName(path: string): string {
  return path.split(/[/\\]/).filter(Boolean).pop() || path;
}

/** Open repo tabs as scope choices; always includes the current repo. */
export function buildRepoChoices(tabs: TabItem[], currentRepoPath: string | null): RepoChoice[] {
  const choices = tabs
    .filter((tab) => tab.type === "repo" && tab.repo)
    .map((tab) => ({
      path: tab.id,
      label: tab.alias || tab.repo?.name || repoDisplayName(tab.id),
    }));
  if (currentRepoPath && !choices.some((choice) => choice.path === currentRepoPath)) {
    choices.unshift({ path: currentRepoPath, label: repoDisplayName(currentRepoPath) });
  }
  return choices;
}
```

- [ ] **Step 5: `SettingsScopeSelector`**

`src/components/settings/ui/SettingsScopeSelector.tsx`:

```tsx
import React from "react";
import { Globe, FolderGit2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Select } from "../../../shared/ui";
import type { RepoChoice } from "../settingsModalState.helpers";

export interface SettingsScopeSelectorProps {
  hasRepo: boolean;
  scope: "global" | "repo";
  onScopeChange: (scope: "global" | "repo") => void;
  repos: RepoChoice[];
  selectedRepoPath: string;
  onRepoChange: (path: string) => void;
}

const LABEL_ID = "settings-scope-label";

/** "Apply to: Global | repo" picker shown at the top of the Git config tabs. */
export const SettingsScopeSelector: React.FC<SettingsScopeSelectorProps> = ({
  hasRepo,
  scope,
  onScopeChange,
  repos,
  selectedRepoPath,
  onRepoChange,
}) => {
  const { t } = useTranslation();
  const globalLabel = (
    <>
      <Globe size={14} />
      <span>{t.settings.profile.scopeGlobal}</span>
    </>
  );

  if (!hasRepo) {
    return (
      <div className="flex items-center gap-2 text-xs text-secondary">
        <span>{t.settings.scope.applyTo}</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-primary">{globalLabel}</span>
      </div>
    );
  }

  const repoLabel = repos.find((repo) => repo.path === selectedRepoPath)?.label ?? "";

  return (
    <div data-testid="scope-switcher" className="flex flex-wrap items-center gap-3">
      <span id={LABEL_ID} className="text-xs text-secondary">
        {t.settings.scope.applyTo}
      </span>
      <SegmentedControl
        aria-labelledby={LABEL_ID}
        value={scope}
        onChange={onScopeChange}
        options={[
          { value: "global", label: globalLabel, testId: "scope-btn-global" },
          {
            value: "repo",
            label: (
              <>
                <FolderGit2 size={14} />
                <span className="font-mono">{repoLabel}</span>
              </>
            ),
            testId: "scope-btn-repo",
          },
        ]}
      />
      {scope === "repo" && repos.length > 1 && (
        <Select
          data-testid="scope-repo-select"
          aria-label={t.settings.scopeSwitcher.selectRepo}
          value={selectedRepoPath}
          onChange={onRepoChange}
          options={repos.map((repo) => ({ value: repo.path, label: repo.label }))}
          mono
          className="w-48"
        />
      )}
    </div>
  );
};
```

Append to `src/components/settings/ui/index.ts`:

```ts
export { SettingsScopeSelector, type SettingsScopeSelectorProps } from "./SettingsScopeSelector";
```

- [ ] **Step 6: Run the new tests**

Run: `pnpm vitest run src/components/settings/settingsModalState.helpers.test.ts src/components/settings/ui/SettingsScopeSelector.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 7: Rewrite `useSettingsModalState`**

Replace `src/components/settings/useSettingsModalState.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n";
import { useTabStore } from "../../store/useTabStore";
import type { SettingsScopeSelectorProps } from "./ui";
import { buildNavGroups, buildRepoChoices, type NavGroup } from "./settingsModalState.helpers";

export interface UseSettingsModalStateOptions {
  currentRepoPath: string | null;
  isSettingsOpen: boolean;
}

export interface UseSettingsModalStateResult {
  navGroups: NavGroup[];
  scopeSelector: SettingsScopeSelectorProps;
  effectiveScope: "global" | "repo";
  effectiveRepoPath: string | null;
}

/** Owns the scope/repo-selection state and derived values for the settings modal. */
export function useSettingsModalState({
  currentRepoPath,
  isSettingsOpen,
}: UseSettingsModalStateOptions): UseSettingsModalStateResult {
  const { t } = useTranslation();
  const { tabs } = useTabStore();

  const [scope, setScope] = useState<"global" | "repo">(() =>
    currentRepoPath ? "repo" : "global"
  );
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(currentRepoPath || "");

  useEffect(() => {
    if (!isSettingsOpen) return;
    setSelectedRepoPath(currentRepoPath || "");
    setScope(currentRepoPath ? "repo" : "global");
  }, [currentRepoPath, isSettingsOpen]);

  const effectiveScope = currentRepoPath ? scope : "global";
  const repoPath = selectedRepoPath || currentRepoPath || "";
  const effectiveRepoPath = effectiveScope === "repo" ? repoPath : null;

  return {
    navGroups: buildNavGroups(t),
    scopeSelector: {
      hasRepo: Boolean(currentRepoPath),
      scope: effectiveScope,
      onScopeChange: setScope,
      repos: buildRepoChoices(tabs, currentRepoPath),
      selectedRepoPath: repoPath,
      onRepoChange: setSelectedRepoPath,
    },
    effectiveScope,
    effectiveRepoPath,
  };
}
```

- [ ] **Step 8: `SettingsNavButton` and sidebar**

`src/components/settings/SettingsNavButton.tsx`:

```tsx
import React from "react";
import clsx from "clsx";
import type { SettingsTab } from "../../store/useSettingsStore";
import type { NavItem } from "./settingsModalState.helpers";

export interface SettingsNavButtonProps {
  item: NavItem;
  active: boolean;
  onSelect: (tab: SettingsTab) => void;
}

/** One sidebar entry; the active entry gets a left accent bar. */
export const SettingsNavButton: React.FC<SettingsNavButtonProps> = ({ item, active, onSelect }) => (
  <button
    type="button"
    aria-current={active ? "page" : undefined}
    onClick={() => onSelect(item.id)}
    className={clsx(
      "relative flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
      active
        ? "bg-surface-hover font-medium text-primary"
        : "text-secondary hover:bg-surface-hover/60 hover:text-primary"
    )}
  >
    {active && (
      <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-accent" />
    )}
    {item.icon}
    <span>{item.label}</span>
  </button>
);
```

Replace `src/components/settings/SettingsModalSidebar.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../i18n";
import { APP_VERSION } from "../../domain/constants/app";
import { type SettingsTab } from "../../store/useSettingsStore";
import { type NavGroup } from "./settingsModalState.helpers";
import { SettingsNavButton } from "./SettingsNavButton";

export interface SettingsModalSidebarProps {
  navGroups: NavGroup[];
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

/** Left-hand navigation for the settings modal, grouped by scope. */
export const SettingsModalSidebar: React.FC<SettingsModalSidebarProps> = ({
  navGroups,
  activeTab,
  setActiveTab,
}) => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t.settings.title}
      className="flex w-56 shrink-0 flex-col justify-between border-r border-border-subtle bg-surface-header/20 p-3"
    >
      <div className="flex flex-col gap-5">
        {navGroups.map((group) => (
          <div key={group.id} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-tertiary">
              {group.label}
            </div>
            {group.items.map((item) => (
              <SettingsNavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onSelect={setActiveTab}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-1 text-xs text-tertiary">
        <span className="font-semibold text-secondary">{t.appTitle}</span>
        <span>{t.settings.sidebar.version.replace("{version}", APP_VERSION)}</span>
      </div>
    </nav>
  );
};
```

- [ ] **Step 9: Tab content passes the selector as a toolbar**

Replace `src/components/settings/SettingsModalTabContent.tsx` with:

```tsx
import React from "react";
import { type SettingsTab } from "../../store/useSettingsStore";
import { GitProfileTab } from "./tabs/GitProfileTab";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { GitBehaviorTab } from "../../features/settings";
import { DiffViewerTab } from "./tabs/DiffViewerTab";
import { ExternalToolsTab } from "./tabs/ExternalToolsTab";
import { GitHubSettingsTab } from "./tabs/GitHubSettingsTab";
import { SettingsScopeSelector, type SettingsScopeSelectorProps } from "./ui";

export interface SettingsModalTabContentProps {
  activeTab: SettingsTab;
  effectiveScope: "global" | "repo";
  effectiveRepoPath: string | null;
  scopeSelector: SettingsScopeSelectorProps;
}

/** Renders the active settings tab's content. */
export const SettingsModalTabContent: React.FC<SettingsModalTabContentProps> = ({
  activeTab,
  effectiveScope,
  effectiveRepoPath,
  scopeSelector,
}) => {
  const toolbar = <SettingsScopeSelector {...scopeSelector} />;

  return (
    <div
      key={`${activeTab}-${effectiveScope}-${effectiveRepoPath}`}
      className="mx-auto max-w-3xl animate-fade-in pb-8"
    >
      {activeTab === "profile" && (
        <GitProfileTab scope={effectiveScope} currentRepoPath={effectiveRepoPath} toolbar={toolbar} />
      )}
      {activeTab === "behavior" && (
        <GitBehaviorTab scope={effectiveScope} currentRepoPath={effectiveRepoPath} toolbar={toolbar} />
      )}
      {activeTab === "appearance" && <AppearanceTab />}
      {activeTab === "diff" && <DiffViewerTab />}
      {activeTab === "tools" && <ExternalToolsTab />}
      {activeTab === "github" && <GitHubSettingsTab />}
    </div>
  );
};
```

- [ ] **Step 10: Temporary toolbar wiring in the two Git tabs**

The tabs are rebuilt in Tasks 7–8; for now only change their props so the app compiles and the selector shows.

In `src/components/settings/tabs/GitProfileTab.tsx`:
- Replace the props interface with:
  ```tsx
  interface GitProfileTabProps {
    currentRepoPath: string | null;
    scope?: "global" | "repo";
    /** Scope selector rendered above the form. */
    toolbar?: React.ReactNode;
  }
  ```
- Change the destructuring to `({ currentRepoPath, scope: propScope, toolbar })`.
- Render `{toolbar}` as the first child of the outer `<div className="space-y-6">`.

In `src/features/settings/components/GitBehaviorTab.tsx`:
- Replace `onScopeChange?: (scope: "global" | "repo") => void;` with
  ```tsx
    /** Scope selector rendered above the options. */
    toolbar?: React.ReactNode;
  ```
- Change the destructuring to `({ currentRepoPath, scope: propScope, toolbar })`.
- Render `{toolbar}` as the first child of `<div className="space-y-6">`.
- In the JSDoc, replace "Scope ownership (global vs. repo) still lives in `SettingsModal`, which supplies `scope` and `currentRepoPath`." with "Scope state lives in `useSettingsModalState`; the scope selector arrives through `toolbar`."

- [ ] **Step 11: Rewrite `SettingsModal`**

Replace `src/components/settings/SettingsModal.tsx` with:

```tsx
import React from "react";
import { Settings, X } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Modal } from "../../shared/ui";
import { useSettingsModalState } from "./useSettingsModalState";
import { SettingsModalSidebar } from "./SettingsModalSidebar";
import { SettingsModalTabContent } from "./SettingsModalTabContent";

interface SettingsModalProps {
  currentRepoPath: string | null;
}

const TITLE_ID = "settings-modal-title";

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRepoPath }) => {
  const { t } = useTranslation();
  const { isSettingsOpen, activeTab, closeSettings, setActiveTab } = useSettingsStore();
  const { navGroups, scopeSelector, effectiveScope, effectiveRepoPath } = useSettingsModalState({
    currentRepoPath,
    isSettingsOpen,
  });

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} size="full" labelledBy={TITLE_ID}>
      {/* Fixed 85vh, not just a max: the tab content below scrolls within a
          flex column that needs a definite height, and Modal's panel only
          caps height. The width is wider than any MODAL_SIZE tier, so it is
          set here too. */}
      <div className="w-[85vw] max-w-[85vw] h-[85vh] flex flex-col min-h-0">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface-header/40 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Settings size={18} className="text-accent" />
            <h2 id={TITLE_ID} className="m-0 text-sm font-semibold text-primary">
              {t.settings.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            aria-label={t.common.close}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <SettingsModalSidebar
            navGroups={navGroups}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-8">
            <SettingsModalTabContent
              activeTab={activeTab}
              effectiveScope={effectiveScope}
              effectiveRepoPath={effectiveRepoPath}
              scopeSelector={scopeSelector}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
```

Delete the old switcher:

```bash
git rm src/components/settings/SettingsModalScopeSwitcher.tsx
```

- [ ] **Step 12: Update the modal tests**

In `src/test/SettingsModal.test.tsx`, replace the test "khi có repo mở, cho phép chuyển đổi giữa Global và Repository scope" body after `render(...)` with:

```tsx
    const globalBtn = await screen.findByTestId("scope-btn-global");
    const repoBtn = screen.getByTestId("scope-btn-repo");

    expect(repoBtn).not.toBeDisabled();
    // Default to repo scope when currentRepoPath is provided
    expect(repoBtn).toHaveAttribute("aria-checked", "true");

    // Switch to global scope
    fireEvent.click(globalBtn);
    expect(screen.getByTestId("scope-btn-global")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("scope-btn-repo")).toHaveAttribute("aria-checked", "false");
```

and replace the body of "cho phép chọn giữa các repository khác nhau khi có nhiều repo mở" after `render(...)` with:

```tsx
    const select = screen.getByTestId("scope-repo-select");
    expect(select).toBeInTheDocument();

    // Select project-beta
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "project-beta" }));
    expect(screen.getByTestId("scope-repo-select")).toHaveTextContent("project-beta");
```

In `src/components/settings/SettingsModal.test.tsx`, replace
`expect(screen.getByText(/Cài đặt|Settings/i)).toBeInTheDocument();` with
`expect(screen.getByRole("heading", { level: 2, name: /Cài đặt|Settings/i })).toBeInTheDocument();`.

- [ ] **Step 13: Run tests, typecheck, lint**

Run: `pnpm vitest run src/components/settings src/test/SettingsModal.test.tsx src/test/SettingsTabs.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS. The inherit/reset tests in `src/test/SettingsModal.test.tsx` still use `inherit-toggle-*` and pass because `GitProfileTab` internals are unchanged until Task 7.

- [ ] **Step 14: Commit**

```bash
git add src/domain/constants/app.ts src/components/settings src/features/settings/components/GitBehaviorTab.tsx src/test/SettingsModal.test.tsx
git commit -m "💄 redesign settings shell with grouped sidebar and scope selector

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Git Profile dirty state

**Files:**
- Create: `src/components/settings/tabs/useGitProfileDirtyState.ts`
- Modify: `src/components/settings/tabs/gitProfileFormHelpers.ts`, `src/components/settings/tabs/gitProfileFormHelpers.test.ts`, `src/components/settings/tabs/useGitProfileForm.ts`

**Interfaces:**
- Produces:
  ```ts
  // gitProfileFormHelpers.ts
  interface GitProfileSnapshot { isOverride: boolean; userName: string; userEmail: string; defaultBranch: string; gpgSign: boolean; gpgKey: string }
  function deriveProfileBaseline(activeScope: "global" | "repo", globalCfg: GitConfigDto | null, localCfg: GitConfigDto | null): GitProfileSnapshot | null
  function isProfileDirty(current: GitProfileSnapshot, baseline: GitProfileSnapshot | null, activeScope: "global" | "repo"): boolean
  // useGitProfileForm result gains:
  isDirty: boolean
  handleDiscard: () => void
  ```

- [ ] **Step 1: Write the failing helper tests**

Append to `src/components/settings/tabs/gitProfileFormHelpers.test.ts` (it already defines `GLOBAL_CONFIG`; add the two new imports to its existing import line from `./gitProfileFormHelpers`: `deriveProfileBaseline, isProfileDirty, type GitProfileSnapshot`):

```ts
const LOCAL_OVERRIDE: GitConfigDto = {
  ...GLOBAL_CONFIG,
  userName: "Local User",
  userNameSource: "local",
  userEmail: "local@example.com",
  userEmailSource: "local",
};

describe("deriveProfileBaseline", () => {
  it("returns null until the global config has loaded", () => {
    expect(deriveProfileBaseline("global", null, null)).toBeNull();
  });

  it("uses the global fields in global scope", () => {
    expect(deriveProfileBaseline("global", GLOBAL_CONFIG, LOCAL_OVERRIDE)).toEqual({
      isOverride: false,
      userName: "Global User",
      userEmail: "global@example.com",
      defaultBranch: "main",
      gpgSign: false,
      gpgKey: "",
    });
  });

  it("uses the repo fields in repo scope", () => {
    expect(deriveProfileBaseline("repo", GLOBAL_CONFIG, LOCAL_OVERRIDE)).toMatchObject({
      isOverride: true,
      userName: "Local User",
    });
  });
});

describe("isProfileDirty", () => {
  const baseline: GitProfileSnapshot = {
    isOverride: false,
    userName: "Jane",
    userEmail: "jane@example.com",
    defaultBranch: "main",
    gpgSign: false,
    gpgKey: "",
  };

  it("is clean without a baseline", () => {
    expect(isProfileDirty({ ...baseline, userName: "X" }, null, "global")).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(isProfileDirty({ ...baseline, userName: "  Jane  " }, baseline, "global")).toBe(false);
  });

  it("detects edited fields and override changes", () => {
    expect(isProfileDirty({ ...baseline, userEmail: "x@y.z" }, baseline, "global")).toBe(true);
    expect(isProfileDirty({ ...baseline, isOverride: true }, baseline, "repo")).toBe(true);
    expect(isProfileDirty({ ...baseline, gpgSign: true }, baseline, "global")).toBe(true);
  });

  it("ignores the default branch in repo scope", () => {
    expect(isProfileDirty({ ...baseline, defaultBranch: "dev" }, baseline, "repo")).toBe(false);
    expect(isProfileDirty({ ...baseline, defaultBranch: "dev" }, baseline, "global")).toBe(true);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run src/components/settings/tabs/gitProfileFormHelpers.test.ts`
Expected: FAIL, `deriveProfileBaseline` is not exported.

- [ ] **Step 3: Implement the helpers**

Append to `src/components/settings/tabs/gitProfileFormHelpers.ts`:

```ts
export interface GitProfileSnapshot {
  isOverride: boolean;
  userName: string;
  userEmail: string;
  defaultBranch: string;
  gpgSign: boolean;
  gpgKey: string;
}

const REPO_SCOPE_KEYS: readonly (keyof GitProfileSnapshot)[] = [
  "isOverride",
  "userName",
  "userEmail",
  "gpgSign",
  "gpgKey",
];
const GLOBAL_SCOPE_KEYS: readonly (keyof GitProfileSnapshot)[] = [
  ...REPO_SCOPE_KEYS,
  "defaultBranch",
];

/** The values the form would show right after loading the given config; null before the load. */
export function deriveProfileBaseline(
  activeScope: "global" | "repo",
  globalCfg: GitConfigDto | null,
  localCfg: GitConfigDto | null
): GitProfileSnapshot | null {
  if (!globalCfg) return null;
  if (activeScope === "repo" && localCfg) {
    return {
      ...deriveRepoScopeFields(localCfg, globalCfg),
      defaultBranch: globalCfg.defaultBranch || "main",
    };
  }
  return deriveGlobalScopeFields(globalCfg);
}

function normalize(value: string | boolean): string | boolean {
  return typeof value === "string" ? value.trim() : value;
}

/** True when the form differs from the loaded config (strings compared trimmed). */
export function isProfileDirty(
  current: GitProfileSnapshot,
  baseline: GitProfileSnapshot | null,
  activeScope: "global" | "repo"
): boolean {
  if (!baseline) return false;
  const keys = activeScope === "repo" ? REPO_SCOPE_KEYS : GLOBAL_SCOPE_KEYS;
  return keys.some((key) => normalize(current[key]) !== normalize(baseline[key]));
}
```

- [ ] **Step 4: Run helper tests**

Run: `pnpm vitest run src/components/settings/tabs/gitProfileFormHelpers.test.ts`
Expected: PASS.

- [ ] **Step 5: Dirty-state hook**

`src/components/settings/tabs/useGitProfileDirtyState.ts`:

```ts
import type { UseGitProfileFormFieldsResult } from "./useGitProfileFormFields";
import type { UseGitProfileFormStatusResult } from "./useGitProfileFormStatus";
import { deriveProfileBaseline, isProfileDirty } from "./gitProfileFormHelpers";

export interface UseGitProfileDirtyStateResult {
  isDirty: boolean;
  handleDiscard: () => void;
}

/** Compares the form with the loaded config and restores it on discard. */
export function useGitProfileDirtyState(
  fields: UseGitProfileFormFieldsResult,
  status: UseGitProfileFormStatusResult,
  activeScope: "global" | "repo"
): UseGitProfileDirtyStateResult {
  const baseline = deriveProfileBaseline(activeScope, status.globalConfig, status.localConfig);
  const current = {
    isOverride: status.isOverride,
    userName: fields.userName,
    userEmail: fields.userEmail,
    defaultBranch: fields.defaultBranch,
    gpgSign: fields.gpgSign,
    gpgKey: fields.gpgKey,
  };

  const handleDiscard = () => {
    if (!baseline) return;
    status.setIsOverride(baseline.isOverride);
    fields.setUserName(baseline.userName);
    fields.setUserEmail(baseline.userEmail);
    fields.setGpgSign(baseline.gpgSign);
    fields.setGpgKey(baseline.gpgKey);
    if (activeScope === "global") fields.setDefaultBranch(baseline.defaultBranch);
  };

  return { isDirty: isProfileDirty(current, baseline, activeScope), handleDiscard };
}
```

- [ ] **Step 6: Wire it into `useGitProfileForm`**

In `src/components/settings/tabs/useGitProfileForm.ts`:
- Add import: `import { useGitProfileDirtyState } from "./useGitProfileDirtyState";`
- Add to `UseGitProfileFormResult` after `hasLocalOverride: boolean;`:
  ```ts
    isDirty: boolean;
    handleDiscard: () => void;
  ```
- After `const status = useGitProfileFormStatus();` add:
  ```ts
    const dirty = useGitProfileDirtyState(fields, status, activeScope);
  ```
- In the returned object, after `hasLocalOverride,` add `...dirty,`.

- [ ] **Step 7: Hook test through the tab**

Append to `src/components/settings/tabs/GitProfileTab.test.tsx` inside the `describe`:

```tsx
  it("shows the save bar only after an edit and discards back to the loaded values", async () => {
    vi.spyOn(invokeCommand, "getGitConfig").mockResolvedValue(GLOBAL_CONFIG);

    render(<GitProfileTab currentRepoPath={null} />);

    const nameInput = await screen.findByDisplayValue("Global User");
    expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Someone Else" } });
    expect(screen.getByTestId("save-profile-btn")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("discard-profile-btn"));
    expect(nameInput).toHaveValue("Global User");
    expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument();
  });
```

This test fails until Task 7 renders `SettingsSaveBar`; run it as part of Task 7.

- [ ] **Step 8: Typecheck and run helper tests**

Run: `pnpm typecheck && pnpm vitest run src/components/settings/tabs/gitProfileFormHelpers.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/settings/tabs/gitProfileFormHelpers.ts src/components/settings/tabs/gitProfileFormHelpers.test.ts src/components/settings/tabs/useGitProfileDirtyState.ts src/components/settings/tabs/useGitProfileForm.ts src/components/settings/tabs/GitProfileTab.test.tsx
git commit -m "✨ track unsaved git profile changes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Git Profile tab on the new primitives

**Files:**
- Create: `src/components/settings/tabs/GitProfileIdentitySection.tsx`, `GitProfileSigningSection.tsx`, `GitProfileCommitSection.tsx`
- Modify: `src/components/settings/tabs/GitProfileTab.tsx`, `src/components/settings/tabs/GitProfileTab.test.tsx`, `src/test/SettingsModal.test.tsx`
- Delete: `GitProfileInheritToggle.tsx`, `GitProfileScopeBanner.tsx`, `GitProfileScopeBadge.tsx`, `GitProfileSaveButton.tsx`, `GitProfileIdentityFields.tsx`, `GitProfileGpgSection.tsx`, `GitProfileCommitConventionsSection.tsx` (all in `src/components/settings/tabs/`)

**Interfaces:**
- Consumes: `SettingsPage`, `SettingsSection`, `SettingsRow`, `SettingsSaveBar`, `SettingsInheritRow` (Task 4); `Switch`, `SegmentedControl`, `Input`; `useGitProfileForm` with `isDirty` / `handleDiscard` (Task 6).
- Produces: `GitProfileTab` props `{ currentRepoPath: string | null; scope?: "global" | "repo"; toolbar?: React.ReactNode }`.

- [ ] **Step 1: Identity section**

`src/components/settings/tabs/GitProfileIdentitySection.tsx`:

```tsx
import React from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Input, type InputProps } from "../../../shared/ui";
import { SettingsRow, SettingsSection } from "../ui";

export interface GitProfileIdentitySectionProps {
  showDefaultBranch: boolean;
  locked: boolean;
  userName: string;
  onUserNameChange: (value: string) => void;
  userEmail: string;
  onUserEmailChange: (value: string) => void;
  defaultBranch: string;
  onDefaultBranchChange: (value: string) => void;
}

const ProfileInput: React.FC<InputProps & { locked: boolean }> = ({ locked, ...rest }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      {locked && (
        <Lock size={13} role="img" aria-label={t.settings.scope.lockedHint} className="text-tertiary" />
      )}
      <Input size="md" mono disabled={locked} className="w-72" {...rest} />
    </div>
  );
};

/** user.name, user.email and (global scope only) init.defaultBranch. */
export const GitProfileIdentitySection: React.FC<GitProfileIdentitySectionProps> = ({
  showDefaultBranch,
  locked,
  userName,
  onUserNameChange,
  userEmail,
  onUserEmailChange,
  defaultBranch,
  onDefaultBranchChange,
}) => {
  const { t } = useTranslation();
  const p = t.settings.profile;

  return (
    <SettingsSection title={t.settings.sections.identity}>
      <SettingsRow label={p.userNameLabel} htmlFor="user-name" disabled={locked}>
        <ProfileInput
          id="user-name"
          locked={locked}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder={p.userNamePlaceholder}
        />
      </SettingsRow>
      <SettingsRow label={p.userEmailLabel} htmlFor="user-email" disabled={locked}>
        <ProfileInput
          id="user-email"
          type="email"
          locked={locked}
          value={userEmail}
          onChange={(e) => onUserEmailChange(e.target.value)}
          placeholder={p.userEmailPlaceholder}
        />
      </SettingsRow>
      {showDefaultBranch && (
        <SettingsRow label={p.defaultBranchLabel} htmlFor="default-branch">
          <ProfileInput
            id="default-branch"
            locked={false}
            value={defaultBranch}
            onChange={(e) => onDefaultBranchChange(e.target.value)}
            placeholder={p.defaultBranchPlaceholder}
          />
        </SettingsRow>
      )}
    </SettingsSection>
  );
};
```

- [ ] **Step 2: Signing section**

`src/components/settings/tabs/GitProfileSigningSection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { Input, Switch } from "../../../shared/ui";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../ui";

export interface GitProfileSigningSectionProps {
  locked: boolean;
  gpgSign: boolean;
  onGpgSignChange: (value: boolean) => void;
  gpgKey: string;
  onGpgKeyChange: (value: string) => void;
}

const GPG_LABEL_ID = "gpg-toggle-label";

/** commit.gpgsign switch and user.signingkey field. */
export const GitProfileSigningSection: React.FC<GitProfileSigningSectionProps> = ({
  locked,
  gpgSign,
  onGpgSignChange,
  gpgKey,
  onGpgKeyChange,
}) => {
  const { t } = useTranslation();
  const p = t.settings.profile;

  return (
    <SettingsSection
      title={t.settings.sections.signing}
      help={
        <HelpTooltip
          title={t.settings.help.profileGpgTitle}
          description={t.settings.help.profileGpgDesc}
          tag={t.settings.help.tagSafety}
        />
      }
    >
      <SettingsRow label={p.gpgEnable} labelId={GPG_LABEL_ID} description={p.gpgDesc} disabled={locked}>
        <Switch
          id="gpg-toggle"
          checked={gpgSign}
          onChange={onGpgSignChange}
          disabled={locked}
          aria-labelledby={GPG_LABEL_ID}
          data-testid="toggle-gpg-sign"
        />
      </SettingsRow>
      <SettingsRow label={p.gpgKeyLabel} htmlFor="gpg-key" disabled={locked || !gpgSign}>
        <Input
          id="gpg-key"
          size="md"
          mono
          className="w-72"
          disabled={locked}
          value={gpgKey}
          onChange={(e) => onGpgKeyChange(e.target.value)}
          placeholder={p.gpgKeyPlaceholder}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

- [ ] **Step 3: Commit conventions section**

`src/components/settings/tabs/GitProfileCommitSection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl } from "../../../shared/ui";
import { SettingsRow, SettingsSection } from "../ui";

export interface GitProfileCommitSectionProps {
  commitMessageLimit: number;
  onCommitMessageLimitChange: (limit: number) => void;
}

const LABEL_ID = "commit-limit-label";

/** Commit subject length warning (app-wide, saved immediately). */
export const GitProfileCommitSection: React.FC<GitProfileCommitSectionProps> = ({
  commitMessageLimit,
  onCommitMessageLimitChange,
}) => {
  const { t } = useTranslation();
  const p = t.settings.profile;

  return (
    <SettingsSection title={t.settings.sections.commit} hint={t.settings.scope.appWide}>
      <SettingsRow label={p.commitLengthLabel} labelId={LABEL_ID}>
        <SegmentedControl
          aria-labelledby={LABEL_ID}
          value={commitMessageLimit}
          onChange={onCommitMessageLimitChange}
          options={[
            { value: 0, label: p.commitLengthNoLimit, testId: "commit-limit-0" },
            { value: 50, label: p.commitLength50Short, testId: "commit-limit-50" },
            { value: 72, label: p.commitLength72Short, testId: "commit-limit-72" },
          ]}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

- [ ] **Step 4: Rewrite `GitProfileTab`**

Replace `src/components/settings/tabs/GitProfileTab.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import type { GitConfigDto } from "../../../ipc/client";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { SettingsInheritRow, SettingsPage, SettingsSaveBar } from "../ui";
import { useGitProfileForm } from "./useGitProfileForm";
import { GitProfileIdentitySection } from "./GitProfileIdentitySection";
import { GitProfileSigningSection } from "./GitProfileSigningSection";
import { GitProfileCommitSection } from "./GitProfileCommitSection";

interface GitProfileTabProps {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
  /** Scope selector rendered under the page header. */
  toolbar?: React.ReactNode;
}

function formatIdentity(config: GitConfigDto | null): string {
  if (!config?.userName) return "";
  return config.userEmail ? `${config.userName} <${config.userEmail}>` : config.userName;
}

export const GitProfileTab: React.FC<GitProfileTabProps> = ({
  currentRepoPath,
  scope: propScope,
  toolbar,
}) => {
  const { t } = useTranslation();
  const { commitMessageLimit, setCommitMessageLimit } = useSettingsStore();
  const activeScope = propScope || (currentRepoPath ? "repo" : "global");
  const form = useGitProfileForm({ currentRepoPath, activeScope });
  const isRepoScope = activeScope === "repo" && Boolean(currentRepoPath);
  const locked = isRepoScope && !form.isOverride;

  return (
    <form onSubmit={form.handleSave}>
      <SettingsPage title={t.settings.profile.title} description={t.settings.profile.subtitle} toolbar={toolbar}>
        {isRepoScope && (
          <SettingsInheritRow
            inheriting={!form.isOverride}
            onInheritChange={(inherit) =>
              inherit ? form.handleSelectInherit() : form.handleSelectOverride()
            }
            description={formatIdentity(form.globalConfig)}
            disabled={form.saving || form.loading}
            canReset={form.hasLocalOverride}
            onReset={form.handleResetToGlobal}
          />
        )}
        <GitProfileIdentitySection
          showDefaultBranch={activeScope === "global"}
          locked={locked}
          userName={form.userName}
          onUserNameChange={form.setUserName}
          userEmail={form.userEmail}
          onUserEmailChange={form.setUserEmail}
          defaultBranch={form.defaultBranch}
          onDefaultBranchChange={form.setDefaultBranch}
        />
        <GitProfileSigningSection
          locked={locked}
          gpgSign={form.gpgSign}
          onGpgSignChange={form.setGpgSign}
          gpgKey={form.gpgKey}
          onGpgKeyChange={form.setGpgKey}
        />
        <GitProfileCommitSection
          commitMessageLimit={commitMessageLimit}
          onCommitMessageLimitChange={setCommitMessageLimit}
        />
      </SettingsPage>
      <SettingsSaveBar
        visible={form.isDirty}
        saving={form.saving}
        saveDisabled={form.saving || form.loading}
        saveLabel={t.settings.profile.saveBtn}
        onDiscard={form.handleDiscard}
      />
    </form>
  );
};
```

Delete the replaced components:

```bash
git rm src/components/settings/tabs/GitProfileInheritToggle.tsx src/components/settings/tabs/GitProfileScopeBanner.tsx src/components/settings/tabs/GitProfileScopeBadge.tsx src/components/settings/tabs/GitProfileSaveButton.tsx src/components/settings/tabs/GitProfileIdentityFields.tsx src/components/settings/tabs/GitProfileGpgSection.tsx src/components/settings/tabs/GitProfileCommitConventionsSection.tsx
```

- [ ] **Step 5: Update tests for the new structure**

In `src/components/settings/tabs/GitProfileTab.test.tsx`, replace the test "saves trimmed user.name and user.email at global scope" body after `render(...)` with:

```tsx
    const nameInput = await screen.findByDisplayValue("Global User");
    fireEvent.change(nameInput, { target: { value: "  Jane Doe  " } });

    const emailInput = screen.getByLabelText(/user\.email/i);
    fireEvent.change(emailInput, { target: { value: "  jane@example.com  " } });

    fireEvent.click(screen.getByTestId("save-profile-btn"));

    await waitFor(() =>
      expect(setSpy).toHaveBeenCalledWith(null, "global", "user.name", "Jane Doe")
    );
    expect(setSpy).toHaveBeenCalledWith(null, "global", "user.email", "jane@example.com");
```

In `src/test/SettingsModal.test.tsx`:
- Both "currentRepoPath là null" tests: replace `screen.queryByTestId("inherit-toggle-inherit")` with `screen.queryByTestId("toggle-use-global")`.
- Test "hỗ trợ toggle Kế thừa từ Global / Ghi đè cho repo này trong GitProfileTab": replace from `await waitFor(` through `fireEvent.click(screen.getByTestId("inherit-toggle-override"));` with:
  ```tsx
    await waitFor(() => {
      expect(screen.getByTestId("toggle-use-global")).toHaveAttribute("aria-checked", "true");
    });

    // Turn inheritance off to override for this repo
    fireEvent.click(screen.getByTestId("toggle-use-global"));
  ```
- Test "nút Khôi phục về Global xoá ghi đè cục bộ và khôi phục kế thừa": replace
  ```tsx
    await waitFor(() => {
      expect(screen.getByTestId("inherit-toggle-override")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("inherit-toggle-override"));
  ```
  with
  ```tsx
    await waitFor(() => {
      expect(screen.getByTestId("toggle-use-global")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("toggle-use-global"));
  ```
  and replace the final assertion `expect(screen.getByTestId("inherit-toggle-inherit")).toBeChecked();` with
  `expect(screen.getByTestId("toggle-use-global")).toHaveAttribute("aria-checked", "true");`.

- [ ] **Step 6: Run tests, typecheck, lint**

Run: `pnpm vitest run src/components/settings src/test/SettingsModal.test.tsx src/test/SettingsTabs.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS, including the dirty/discard test from Task 6 and the `SettingsTabs` GitProfileTab test (toggling GPG makes the form dirty, so `save-profile-btn` is present).

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/tabs src/test/SettingsModal.test.tsx
git commit -m "💄 redesign git profile settings with grouped rows and save bar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Git Behavior tab on the new primitives

**Files:**
- Create: `src/features/settings/components/GitBehaviorPullFetchSection.tsx`, `GitBehaviorRebaseSection.tsx`, `GitBehaviorPullFetchSection.test.tsx`
- Modify: `src/features/settings/components/GitBehaviorTab.tsx`, `GitBehaviorOptions.tsx`, `GitBehaviorOptions.test.tsx`, `GitBehaviorConfirmationsSection.tsx`
- Delete: `GitBehaviorScopeBanner.tsx`, `GitBehaviorToggleSwitch.tsx`, `GitBehaviorPullStrategy.tsx`, `GitBehaviorPullStrategy.test.tsx`, `GitBehaviorPullStrategyGlobalOptions.tsx`, `GitBehaviorPullStrategyRepoOptions.tsx`, `GitBehaviorPullStrategyOption.tsx`, `GitBehaviorFlagsSection.tsx`, `GitBehaviorAutoFetchSection.tsx` (all in `src/features/settings/components/`)

**Interfaces:**
- Consumes: `useGitBehaviorSettings` (unchanged), `SettingsPage`, `SettingsSection`, `SettingsRow`, `SettingsInheritRow`, `Switch`, `SegmentedControl`, `Select`.
- Produces:
  ```ts
  interface GitBehaviorPullFetchSectionProps {
    pullRebase: boolean; pullLocked: boolean; busy: boolean;
    onPullStrategyChange: (isRebase: boolean) => void;
    fetchPrune: boolean; onToggleFetchPrune: () => void;
    autoFetchInterval: number; onAutoFetchChange: (seconds: number) => void;
  }
  interface GitBehaviorOptionsProps extends GitBehaviorPullFetchSectionProps {
    rebaseAutostash: boolean; onToggleRebaseAutostash: () => void;
  }
  ```
  Test ids: `pull-strategy-merge`, `pull-strategy-rebase`, `toggle-fetch-prune`, `auto-fetch-select`, `toggle-rebase-autostash`, `toggle-confirm-discard`, `toggle-confirm-delete-branch`, `toggle-confirm-force-push`.

- [ ] **Step 1: Write the failing section test**

`src/features/settings/components/GitBehaviorPullFetchSection.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GitBehaviorPullFetchSection, type GitBehaviorPullFetchSectionProps } from "./GitBehaviorPullFetchSection";
import { useSettingsStore } from "../../../store/useSettingsStore";

const props = (over: Partial<GitBehaviorPullFetchSectionProps> = {}): GitBehaviorPullFetchSectionProps => ({
  pullRebase: false,
  pullLocked: false,
  busy: false,
  onPullStrategyChange: vi.fn(),
  fetchPrune: false,
  onToggleFetchPrune: vi.fn(),
  autoFetchInterval: 0,
  onAutoFetchChange: vi.fn(),
  ...over,
});

describe("GitBehaviorPullFetchSection", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("vi");
  });

  it("reports the chosen pull strategy", () => {
    const p = props();
    render(<GitBehaviorPullFetchSection {...p} />);
    expect(screen.getByTestId("pull-strategy-merge")).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByTestId("pull-strategy-rebase"));
    expect(p.onPullStrategyChange).toHaveBeenCalledWith(true);
  });

  it("locks the pull strategy while the repo inherits it", () => {
    const p = props({ pullLocked: true });
    render(<GitBehaviorPullFetchSection {...p} />);
    expect(screen.getByTestId("pull-strategy-rebase")).toBeDisabled();
  });

  it("toggles fetch.prune", () => {
    const p = props();
    render(<GitBehaviorPullFetchSection {...p} />);
    fireEvent.click(screen.getByTestId("toggle-fetch-prune"));
    expect(p.onToggleFetchPrune).toHaveBeenCalledTimes(1);
  });

  it("reports the auto-fetch interval in seconds", () => {
    const p = props();
    render(<GitBehaviorPullFetchSection {...p} />);
    fireEvent.click(screen.getByTestId("auto-fetch-select"));
    fireEvent.click(screen.getByRole("option", { name: "Mỗi 15 phút" }));
    expect(p.onAutoFetchChange).toHaveBeenCalledWith(900);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run src/features/settings/components/GitBehaviorPullFetchSection.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Pull & fetch section**

`src/features/settings/components/GitBehaviorPullFetchSection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Select, Switch } from "../../../shared/ui";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { PullStrategyDiagram, FetchPruneDiagram } from "../../../components/settings/helpDiagrams";
import { SettingsRow, SettingsSection } from "../../../components/settings/ui";

export interface GitBehaviorPullFetchSectionProps {
  pullRebase: boolean;
  /** Repo scope while inheriting the global pull strategy. */
  pullLocked: boolean;
  busy: boolean;
  onPullStrategyChange: (isRebase: boolean) => void;
  fetchPrune: boolean;
  onToggleFetchPrune: () => void;
  autoFetchInterval: number;
  onAutoFetchChange: (seconds: number) => void;
}

const PULL_LABEL_ID = "pull-strategy-label";
const PRUNE_LABEL_ID = "fetch-prune-label";

/** Pull strategy, fetch.prune and background auto-fetch. */
export const GitBehaviorPullFetchSection: React.FC<GitBehaviorPullFetchSectionProps> = ({
  pullRebase,
  pullLocked,
  busy,
  onPullStrategyChange,
  fetchPrune,
  onToggleFetchPrune,
  autoFetchInterval,
  onAutoFetchChange,
}) => {
  const { t } = useTranslation();
  const b = t.settings.behavior;
  const h = t.settings.help;

  return (
    <SettingsSection title={t.settings.sections.pullFetch}>
      <SettingsRow
        label={b.pullRebaseTitle}
        labelId={PULL_LABEL_ID}
        description={pullRebase ? b.pullRebaseDesc : b.pullMergeDesc}
        help={<HelpTooltip title={h.pullStrategyTitle} description={h.pullStrategyDesc} tag={h.tagWorkflow} diagram={<PullStrategyDiagram />} />}
      >
        <SegmentedControl
          aria-labelledby={PULL_LABEL_ID}
          value={pullRebase ? "rebase" : "merge"}
          onChange={(mode) => onPullStrategyChange(mode === "rebase")}
          disabled={busy || pullLocked}
          options={[
            { value: "merge", label: b.pullMergeShort, testId: "pull-strategy-merge" },
            { value: "rebase", label: b.pullRebaseShort, testId: "pull-strategy-rebase" },
          ]}
        />
      </SettingsRow>
      <SettingsRow
        label={b.fetchPruneTitle}
        labelId={PRUNE_LABEL_ID}
        description={b.fetchPruneDesc}
        help={<HelpTooltip title={h.fetchPruneTitle} description={h.fetchPruneDesc} tag={h.tagRecommended} diagram={<FetchPruneDiagram />} />}
      >
        <Switch
          checked={fetchPrune}
          onChange={onToggleFetchPrune}
          aria-labelledby={PRUNE_LABEL_ID}
          data-testid="toggle-fetch-prune"
        />
      </SettingsRow>
      <SettingsRow
        label={b.autoFetchTitle}
        description={b.autoFetchDesc}
        help={<HelpTooltip title={h.autoFetchTitle} description={h.autoFetchDesc} tag={h.tagRecommended} />}
      >
        <Select
          data-testid="auto-fetch-select"
          aria-label={b.autoFetchTitle}
          value={String(autoFetchInterval)}
          onChange={(value) => onAutoFetchChange(Number(value))}
          options={[
            { value: "0", label: b.autoFetchOff },
            { value: "300", label: b.autoFetch5m },
            { value: "900", label: b.autoFetch15m },
          ]}
          className="w-44"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

Prettier will wrap the long `help={…}` lines; run `pnpm prettier --write` on the file (Step 9).

- [ ] **Step 4: Rebase section**

`src/features/settings/components/GitBehaviorRebaseSection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { Switch } from "../../../shared/ui";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { AutostashDiagram } from "../../../components/settings/helpDiagrams";
import { SettingsRow, SettingsSection } from "../../../components/settings/ui";

export interface GitBehaviorRebaseSectionProps {
  rebaseAutostash: boolean;
  onToggleRebaseAutostash: () => void;
}

const LABEL_ID = "rebase-autostash-label";

/** rebase.autoStash switch. */
export const GitBehaviorRebaseSection: React.FC<GitBehaviorRebaseSectionProps> = ({
  rebaseAutostash,
  onToggleRebaseAutostash,
}) => {
  const { t } = useTranslation();
  const h = t.settings.help;

  return (
    <SettingsSection title={t.settings.sections.rebase}>
      <SettingsRow
        label={t.settings.behavior.rebaseAutostashTitle}
        labelId={LABEL_ID}
        description={t.settings.behavior.rebaseAutostashDesc}
        help={
          <HelpTooltip
            title={h.rebaseAutostashTitle}
            description={h.rebaseAutostashDesc}
            tag={h.tagRecommended}
            diagram={<AutostashDiagram />}
          />
        }
      >
        <Switch
          checked={rebaseAutostash}
          onChange={onToggleRebaseAutostash}
          aria-labelledby={LABEL_ID}
          data-testid="toggle-rebase-autostash"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

- [ ] **Step 5: Confirmations section**

Replace `src/features/settings/components/GitBehaviorConfirmationsSection.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { Switch } from "../../../shared/ui";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { ConfirmationsDiagram } from "../../../components/settings/helpDiagrams";
import { SettingsRow, SettingsSection } from "../../../components/settings/ui";

/** Safety confirmation switches: discard, delete branch, and force-push warnings. */
export const GitBehaviorConfirmationsSection: React.FC = () => {
  const { t } = useTranslation();
  const b = t.settings.behavior;
  const s = useSettingsStore();
  const rows = [
    { id: "confirm-discard", label: b.confirmDiscardLabel, checked: s.confirmDiscard, set: s.setConfirmDiscard },
    { id: "confirm-delete-branch", label: b.confirmDeleteBranchLabel, checked: s.confirmDeleteBranch, set: s.setConfirmDeleteBranch },
    { id: "confirm-force-push", label: b.confirmForcePushLabel, checked: s.confirmForcePush, set: s.setConfirmForcePush },
  ];

  return (
    <SettingsSection
      title={b.confirmationsTitle}
      help={
        <HelpTooltip
          title={t.settings.help.confirmationsTitle}
          description={t.settings.help.confirmationsDesc}
          tag={t.settings.help.tagSafety}
          diagram={<ConfirmationsDiagram />}
        />
      }
    >
      {rows.map((row) => (
        <SettingsRow key={row.id} label={row.label} labelId={`${row.id}-label`}>
          <Switch
            checked={row.checked}
            onChange={row.set}
            aria-labelledby={`${row.id}-label`}
            data-testid={`toggle-${row.id}`}
          />
        </SettingsRow>
      ))}
    </SettingsSection>
  );
};
```

- [ ] **Step 6: Options composition**

Replace `src/features/settings/components/GitBehaviorOptions.tsx` with:

```tsx
import React from "react";
import {
  GitBehaviorPullFetchSection,
  type GitBehaviorPullFetchSectionProps,
} from "./GitBehaviorPullFetchSection";
import { GitBehaviorRebaseSection } from "./GitBehaviorRebaseSection";
import { GitBehaviorConfirmationsSection } from "./GitBehaviorConfirmationsSection";

export interface GitBehaviorOptionsProps extends GitBehaviorPullFetchSectionProps {
  rebaseAutostash: boolean;
  onToggleRebaseAutostash: () => void;
}

/** Pull & fetch, rebase, and safety confirmation sections of the git behavior tab. */
export const GitBehaviorOptions: React.FC<GitBehaviorOptionsProps> = ({
  rebaseAutostash,
  onToggleRebaseAutostash,
  ...pullFetch
}) => (
  <>
    <GitBehaviorPullFetchSection {...pullFetch} />
    <GitBehaviorRebaseSection
      rebaseAutostash={rebaseAutostash}
      onToggleRebaseAutostash={onToggleRebaseAutostash}
    />
    <GitBehaviorConfirmationsSection />
  </>
);
```

- [ ] **Step 7: Rewrite `GitBehaviorTab`**

Replace `src/features/settings/components/GitBehaviorTab.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsInheritRow, SettingsPage } from "../../../components/settings/ui";
import { useGitBehaviorSettings } from "../hooks/useGitBehaviorSettings";
import { GitBehaviorOptions } from "./GitBehaviorOptions";

export interface GitBehaviorTabProps {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
  /** Scope selector rendered under the page header. */
  toolbar?: React.ReactNode;
}

/**
 * Git behavior settings tab: pull strategy, fetch/rebase flags, safety
 * confirmations, and auto-fetch interval. Scope state lives in
 * `useSettingsModalState`; the scope selector arrives through `toolbar`.
 */
export const GitBehaviorTab: React.FC<GitBehaviorTabProps> = ({
  currentRepoPath,
  scope: propScope,
  toolbar,
}) => {
  const { t } = useTranslation();
  const s = useGitBehaviorSettings({ currentRepoPath, scope: propScope });
  const b = t.settings.behavior;
  const isRepoScope = s.activeScope === "repo" && Boolean(currentRepoPath);
  const inheriting = s.localPullRebase === null || s.localPullRebase === undefined;
  const globalMode = s.globalPullRebase ? "rebase" : "merge";
  const pullRebase = isRepoScope && !inheriting ? Boolean(s.localPullRebase) : s.globalPullRebase;
  const busy = s.loading || s.saving;

  const handlePullStrategyChange = (isRebase: boolean) => {
    if (isRepoScope) s.handleRepoPullStrategyChange(isRebase ? "rebase" : "merge");
    else s.handleGlobalPullStrategyChange(isRebase);
  };

  return (
    <SettingsPage title={b.title} description={b.subtitle} toolbar={toolbar}>
      {isRepoScope && (
        <SettingsInheritRow
          inheriting={inheriting}
          onInheritChange={(inherit) => s.handleRepoPullStrategyChange(inherit ? "inherit" : globalMode)}
          description={b.inheritGlobalPullDesc.replace(
            "{strategy}",
            s.globalPullRebase ? b.pullRebaseShort : b.pullMergeShort
          )}
          disabled={busy}
        />
      )}
      <GitBehaviorOptions
        pullRebase={pullRebase}
        pullLocked={isRepoScope && inheriting}
        busy={busy}
        onPullStrategyChange={handlePullStrategyChange}
        fetchPrune={s.fetchPrune}
        onToggleFetchPrune={s.handleToggleFetchPrune}
        autoFetchInterval={s.autoFetchInterval}
        onAutoFetchChange={s.handleAutoFetchChange}
        rebaseAutostash={s.rebaseAutostash}
        onToggleRebaseAutostash={s.handleToggleRebaseAutostash}
      />
    </SettingsPage>
  );
};
```

`Switch.onChange` passes a boolean while `handleToggleFetchPrune` / `handleToggleRebaseAutostash` take no arguments; TypeScript accepts a zero-parameter function there, so no wrapper is needed.

- [ ] **Step 8: Replace the options test and delete old components**

Replace `src/features/settings/components/GitBehaviorOptions.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GitBehaviorOptions, type GitBehaviorOptionsProps } from "./GitBehaviorOptions";
import { useSettingsStore } from "../../../store/useSettingsStore";

const props = (): GitBehaviorOptionsProps => ({
  pullRebase: false,
  pullLocked: false,
  busy: false,
  onPullStrategyChange: vi.fn(),
  fetchPrune: false,
  onToggleFetchPrune: vi.fn(),
  autoFetchInterval: 0,
  onAutoFetchChange: vi.fn(),
  rebaseAutostash: false,
  onToggleRebaseAutostash: vi.fn(),
});

describe("GitBehaviorOptions", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("vi");
    useSettingsStore.getState().setConfirmDiscard(true);
  });

  it("toggles safety confirmations from the settings store", () => {
    render(<GitBehaviorOptions {...props()} />);
    fireEvent.click(screen.getByTestId("toggle-confirm-discard"));
    expect(useSettingsStore.getState().confirmDiscard).toBe(false);
  });

  it("toggles rebase.autoStash", () => {
    const p = props();
    render(<GitBehaviorOptions {...p} />);
    fireEvent.click(screen.getByTestId("toggle-rebase-autostash"));
    expect(p.onToggleRebaseAutostash).toHaveBeenCalledTimes(1);
  });
});
```

```bash
git rm src/features/settings/components/GitBehaviorScopeBanner.tsx src/features/settings/components/GitBehaviorToggleSwitch.tsx src/features/settings/components/GitBehaviorPullStrategy.tsx src/features/settings/components/GitBehaviorPullStrategy.test.tsx src/features/settings/components/GitBehaviorPullStrategyGlobalOptions.tsx src/features/settings/components/GitBehaviorPullStrategyRepoOptions.tsx src/features/settings/components/GitBehaviorPullStrategyOption.tsx src/features/settings/components/GitBehaviorFlagsSection.tsx src/features/settings/components/GitBehaviorAutoFetchSection.tsx
```

- [ ] **Step 9: Format, run tests, typecheck, lint**

Run: `pnpm prettier --write src/features/settings/components && pnpm vitest run src/features/settings src/test/SettingsTabs.test.tsx src/test/SettingsModal.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS. `SettingsTabs` GitBehaviorTab test keeps its `toggle-*` ids; `SettingsModal` still finds "Hành vi khi Kéo về" (pull row label) and "Hộp thoại cảnh báo & Xác nhận an toàn" (section title).

- [ ] **Step 10: Commit**

```bash
git add src/features/settings
git commit -m "💄 redesign git behavior settings with grouped rows

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Appearance and Diff viewer tabs

**Files:**
- Create: `src/components/settings/tabs/AppearanceThemeSection.tsx`, `AppearanceDisplaySection.tsx`, `DiffLayoutSection.tsx`, `DiffOptionsSection.tsx`
- Modify: `AppearanceTab.tsx`, `DiffViewerTab.tsx`, `DiffPreviewSection.tsx`, `src/test/SettingsTabs.test.tsx`
- Delete: `AppearanceLocaleSection.tsx`, `AppearanceDateFormatSection.tsx`, `AppearanceAvatarSection.tsx`, `AppearanceColorblindSection.tsx`, `DiffViewModeSection.tsx`, `DiffFontSizeSection.tsx`, `DiffTabSizeSection.tsx`, `DiffTogglesSection.tsx`

**Interfaces:**
- Consumes: settings store setters (unchanged), primitives from Tasks 2–4.
- Produces test ids: `theme-light|dark|system`, `toggle-colorblind`, `locale-vi|en`, `date-format-select`, `avatar-style-select`, `diff-mode-unified|split`, `diff-fontsize-12|13|14|16`, `diff-tabsize-2|4|8`, `toggle-diff-ignore-whitespace`, `toggle-diff-show-line-numbers`.

- [ ] **Step 1: Update the tab tests first**

In `src/test/SettingsTabs.test.tsx`, add this helper above `describe("Settings Tabs Components", …)`:

```tsx
function pickOption(triggerTestId: string, optionName: RegExp | string) {
  fireEvent.click(screen.getByTestId(triggerTestId));
  fireEvent.click(screen.getByRole("option", { name: optionName }));
}
```

Replace the `AppearanceTab` test body with:

```tsx
      render(<AppearanceTab />);

      pickOption("date-format-select", /Thời gian tuyệt đối/i);
      expect(useSettingsStore.getState().dateFormat).toBe("absolute");

      pickOption("avatar-style-select", /Gravatar/i);
      expect(useSettingsStore.getState().avatarStyle).toBe("gravatar");

      fireEvent.click(screen.getByTestId("theme-dark"));
      expect(useSettingsStore.getState().theme).toBe("dark");

      fireEvent.click(screen.getByTestId("toggle-colorblind"));
      expect(useSettingsStore.getState().colorblind).toBe(true);
```

Also add `settings.setColorblind(false);` to the `beforeEach` after `settings.setTheme("light");`.

The option names match `vi.ts`: `dateAbsolute: "Thời gian tuyệt đối (vd: 17/09/2026 14:30)"`, `avatarGravatar: "Gravatar (Tải theo email tác giả)"`.

The `DiffViewerTab` test keeps its test ids and needs no change.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run src/test/SettingsTabs.test.tsx -t AppearanceTab`
Expected: FAIL, `date-format-select` not found.

- [ ] **Step 3: Appearance sections**

`src/components/settings/tabs/AppearanceThemeSection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Switch } from "../../../shared/ui";
import { useSettingsStore, type Theme } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../ui";

const THEME_LABEL_ID = "appearance-theme-label";
const COLORBLIND_LABEL_ID = "appearance-colorblind-label";

/** Color theme and colorblind mode. */
export const AppearanceThemeSection: React.FC = () => {
  const { t } = useTranslation();
  const a = t.settings.appearance;
  const { theme, setTheme, colorblind, setColorblind } = useSettingsStore();
  const themeOptions: { value: Theme; label: string; testId: string }[] = [
    { value: "light", label: a.themeLight, testId: "theme-light" },
    { value: "dark", label: a.themeDark, testId: "theme-dark" },
    { value: "system", label: a.themeSystem, testId: "theme-system" },
  ];

  return (
    <SettingsSection title={t.settings.sections.theme}>
      <SettingsRow
        label={a.themeTitle}
        labelId={THEME_LABEL_ID}
        help={
          <HelpTooltip
            title={t.settings.help.appearanceThemeTitle}
            description={t.settings.help.appearanceThemeDesc}
            tag={t.settings.help.tagVisual}
          />
        }
      >
        <SegmentedControl aria-labelledby={THEME_LABEL_ID} value={theme} onChange={setTheme} options={themeOptions} />
      </SettingsRow>
      <SettingsRow label={a.colorblindTitle} labelId={COLORBLIND_LABEL_ID} description={a.colorblindDesc}>
        <Switch
          checked={colorblind}
          onChange={setColorblind}
          aria-labelledby={COLORBLIND_LABEL_ID}
          data-testid="toggle-colorblind"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

`src/components/settings/tabs/AppearanceDisplaySection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Select } from "../../../shared/ui";
import {
  useSettingsStore,
  type AvatarStyle,
  type DateFormat,
  type Locale,
} from "../../../store/useSettingsStore";
import { SettingsRow, SettingsSection } from "../ui";

const LOCALE_LABEL_ID = "appearance-locale-label";

/** Display language, date format and author avatar style. */
export const AppearanceDisplaySection: React.FC = () => {
  const { t } = useTranslation();
  const a = t.settings.appearance;
  const { locale, setLocale, dateFormat, setDateFormat, avatarStyle, setAvatarStyle } =
    useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.display}>
      <SettingsRow label={a.localeTitle} labelId={LOCALE_LABEL_ID}>
        <SegmentedControl<Locale>
          aria-labelledby={LOCALE_LABEL_ID}
          value={locale}
          onChange={setLocale}
          options={[
            { value: "vi", label: a.localeVi, testId: "locale-vi" },
            { value: "en", label: a.localeEn, testId: "locale-en" },
          ]}
        />
      </SettingsRow>
      <SettingsRow label={a.dateFormatTitle}>
        <Select
          data-testid="date-format-select"
          aria-label={a.dateFormatTitle}
          value={dateFormat}
          onChange={(value) => setDateFormat(value as DateFormat)}
          options={[
            { value: "relative", label: a.dateRelative },
            { value: "absolute", label: a.dateAbsolute },
          ]}
          className="w-72"
        />
      </SettingsRow>
      <SettingsRow label={a.avatarTitle}>
        <Select
          data-testid="avatar-style-select"
          aria-label={a.avatarTitle}
          value={avatarStyle}
          onChange={(value) => setAvatarStyle(value as AvatarStyle)}
          options={[
            { value: "initials", label: a.avatarInitials },
            { value: "gravatar", label: a.avatarGravatar },
            { value: "none", label: a.avatarNone },
          ]}
          className="w-72"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

The casts are safe because `Select` only ever reports values from its `options` list.

Replace `src/components/settings/tabs/AppearanceTab.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsPage } from "../ui";
import { AppearanceThemeSection } from "./AppearanceThemeSection";
import { AppearanceDisplaySection } from "./AppearanceDisplaySection";

export const AppearanceTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingsPage title={t.settings.appearance.title} description={t.settings.appearance.subtitle}>
      <AppearanceThemeSection />
      <AppearanceDisplaySection />
    </SettingsPage>
  );
};
```

- [ ] **Step 4: Diff sections**

`src/components/settings/tabs/DiffLayoutSection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl } from "../../../shared/ui";
import {
  useSettingsStore,
  type DiffFontSize,
  type DiffTabSize,
  type DiffViewMode,
} from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { DiffModeDiagram } from "../helpDiagrams";
import { SettingsRow, SettingsSection } from "../ui";

const FONT_SIZES: DiffFontSize[] = [12, 13, 14, 16];
const TAB_SIZES: DiffTabSize[] = [2, 4, 8];

/** Diff view mode, code font size and tab width. */
export const DiffLayoutSection: React.FC = () => {
  const { t } = useTranslation();
  const d = t.settings.diff;
  const h = t.settings.help;
  const s = useSettingsStore();
  const fontLabels: Record<DiffFontSize, string> = { 12: d.fontSize12, 13: d.fontSize13, 14: d.fontSize14, 16: d.fontSize16 };
  const tabLabels: Record<DiffTabSize, string> = { 2: d.tabSize2, 4: d.tabSize4, 8: d.tabSize8 };

  return (
    <SettingsSection title={t.settings.sections.layout}>
      <SettingsRow
        label={d.viewModeTitle}
        labelId="diff-mode-label"
        description={s.diffViewMode === "split" ? d.viewModeSplitDesc : d.viewModeUnifiedDesc}
        help={<HelpTooltip title={h.diffModeTitle} description={h.diffModeDesc} tag={h.tagVisual} diagram={<DiffModeDiagram />} />}
      >
        <SegmentedControl<DiffViewMode>
          aria-labelledby="diff-mode-label"
          value={s.diffViewMode}
          onChange={s.setDiffViewMode}
          options={[
            { value: "unified", label: d.viewModeUnifiedShort, testId: "diff-mode-unified" },
            { value: "split", label: d.viewModeSplitShort, testId: "diff-mode-split" },
          ]}
        />
      </SettingsRow>
      <SettingsRow
        label={d.fontSizeTitle}
        labelId="diff-fontsize-label"
        help={<HelpTooltip title={h.diffFontSizeTitle} description={h.diffFontSizeDesc} />}
      >
        <SegmentedControl<DiffFontSize>
          aria-labelledby="diff-fontsize-label"
          value={s.diffFontSize}
          onChange={s.setDiffFontSize}
          options={FONT_SIZES.map((size) => ({ value: size, label: fontLabels[size], testId: `diff-fontsize-${size}` }))}
        />
      </SettingsRow>
      <SettingsRow label={d.tabSizeTitle} labelId="diff-tabsize-label">
        <SegmentedControl<DiffTabSize>
          aria-labelledby="diff-tabsize-label"
          value={s.diffTabSize}
          onChange={s.setDiffTabSize}
          options={TAB_SIZES.map((size) => ({ value: size, label: tabLabels[size], testId: `diff-tabsize-${size}` }))}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

`src/components/settings/tabs/DiffOptionsSection.tsx`:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { Switch } from "../../../shared/ui";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { WhitespaceDiagram } from "../helpDiagrams";
import { SettingsRow, SettingsSection } from "../ui";

/** Ignore-whitespace and line-number switches. */
export const DiffOptionsSection: React.FC = () => {
  const { t } = useTranslation();
  const d = t.settings.diff;
  const h = t.settings.help;
  const s = useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.options}>
      <SettingsRow
        label={d.whitespaceTitle}
        labelId="diff-whitespace-label"
        description={d.whitespaceIgnoreDesc}
        help={
          <HelpTooltip
            title={h.diffWhitespaceTitle}
            description={h.diffWhitespaceDesc}
            tag={h.tagRecommended}
            diagram={<WhitespaceDiagram />}
          />
        }
      >
        <Switch
          checked={s.diffIgnoreWhitespace}
          onChange={s.setDiffIgnoreWhitespace}
          aria-labelledby="diff-whitespace-label"
          data-testid="toggle-diff-ignore-whitespace"
        />
      </SettingsRow>
      <SettingsRow label={d.lineNumbersTitle} labelId="diff-line-numbers-label" description={d.lineNumbersDesc}>
        <Switch
          checked={s.diffShowLineNumbers}
          onChange={s.setDiffShowLineNumbers}
          aria-labelledby="diff-line-numbers-label"
          data-testid="toggle-diff-show-line-numbers"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

In `src/components/settings/tabs/DiffPreviewSection.tsx`:
- Add imports: `import { useTranslation } from "../../../i18n";` and `import { SettingsSection } from "../ui";`.
- Add `const { t } = useTranslation();` as the first line of the component.
- Replace the outer `<div className="pt-2">` and its `<label …>Preview</label>` with `<SettingsSection title={t.settings.sections.preview}>`, close it with `</SettingsSection>`, and change the preview box classes from `rounded-lg border border-border-subtle bg-surface-header/40 p-3 …` to `rounded-xl p-4 …` (keep `font-mono overflow-x-auto leading-relaxed select-none` and the inline style).

Replace `src/components/settings/tabs/DiffViewerTab.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsPage } from "../ui";
import { DiffLayoutSection } from "./DiffLayoutSection";
import { DiffOptionsSection } from "./DiffOptionsSection";
import { DiffPreviewSection } from "./DiffPreviewSection";

export const DiffViewerTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingsPage title={t.settings.diff.title} description={t.settings.diff.subtitle}>
      <DiffLayoutSection />
      <DiffOptionsSection />
      <DiffPreviewSection />
    </SettingsPage>
  );
};
```

```bash
git rm src/components/settings/tabs/AppearanceLocaleSection.tsx src/components/settings/tabs/AppearanceDateFormatSection.tsx src/components/settings/tabs/AppearanceAvatarSection.tsx src/components/settings/tabs/AppearanceColorblindSection.tsx src/components/settings/tabs/DiffViewModeSection.tsx src/components/settings/tabs/DiffFontSizeSection.tsx src/components/settings/tabs/DiffTabSizeSection.tsx src/components/settings/tabs/DiffTogglesSection.tsx
```

- [ ] **Step 5: Format, run tests, typecheck, lint**

Run: `pnpm prettier --write src/components/settings/tabs && pnpm vitest run src/test/SettingsTabs.test.tsx src/test/SettingsModal.test.tsx src/components/settings && pnpm typecheck && pnpm lint`
Expected: all PASS. `SettingsModal.test.tsx` still finds "Định dạng thời gian", "Ảnh đại diện tác giả", "Bố cục hiển thị Diff mặc định" and "Cỡ chữ hiển thị mã nguồn" as row labels (`getByText` ignores the `Select` `aria-label` attribute).

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/tabs src/test/SettingsTabs.test.tsx src/test/SettingsModal.test.tsx
git commit -m "💄 redesign appearance and diff viewer settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: External tools and GitHub tabs

**Files:**
- Modify: `src/components/settings/tabs/ExternalToolsTab.tsx`, `ExternalToolsEditorSection.tsx`, `ExternalToolsTerminalSection.tsx`, `GitHubSettingsTab.tsx`, `GitHubTokenPanel.tsx`, `GitHubTokenStatusAlerts.tsx`, `GitHubAccountCard.tsx`, `src/test/SettingsTabs.test.tsx`

**Interfaces:**
- Produces test ids: `editor-select`, `custom-editor-input`, `terminal-select`. GitHub test selectors (texts, placeholder) unchanged.

- [ ] **Step 1: Update the tools test first**

In `src/test/SettingsTabs.test.tsx`, replace the `ExternalToolsTab` test body with (uses `pickOption` from Task 9):

```tsx
      render(<ExternalToolsTab />);

      expect(screen.getByText(/Tích hợp Công cụ Ngoài/i)).toBeInTheDocument();

      pickOption("editor-select", /Cursor/);
      expect(useSettingsStore.getState().defaultEditor).toBe("cursor");

      pickOption("editor-select", /Lệnh tùy chỉnh/);
      expect(useSettingsStore.getState().defaultEditor).toBe("custom");

      const customInput = screen.getByTestId("custom-editor-input");
      fireEvent.change(customInput, { target: { value: "nvim" } });
      expect(useSettingsStore.getState().customEditorCommand).toBe("nvim");

      pickOption("terminal-select", /PowerShell/);
      expect(useSettingsStore.getState().defaultTerminal).toBe("powershell");
```

The suite runs with `setLocale("vi")`; the option names match `vi.ts` (`editorCursor: "Cursor (cursor)"`, `editorCustom: "Lệnh tùy chỉnh (Custom CLI Command)"`, `terminalPowerShell: "PowerShell (powershell)"`).

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run src/test/SettingsTabs.test.tsx -t ExternalToolsTab`
Expected: FAIL, `editor-select` not found.

- [ ] **Step 3: Editor section**

Replace `src/components/settings/tabs/ExternalToolsEditorSection.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { Input, Select } from "../../../shared/ui";
import { useSettingsStore, type DefaultEditor } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../ui";

/** Default editor picker plus the custom command field. */
export const ExternalToolsEditorSection: React.FC = () => {
  const { t } = useTranslation();
  const tools = t.settings.tools;
  const { defaultEditor, customEditorCommand, setDefaultEditor, setCustomEditorCommand } =
    useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.editor}>
      <SettingsRow
        label={tools.editorTitle}
        description={tools.editorDesc}
        help={
          <HelpTooltip
            title={t.settings.help.toolsEditorTitle}
            description={t.settings.help.toolsEditorDesc}
            tag={t.settings.help.tagIntegration}
          />
        }
      >
        <Select
          data-testid="editor-select"
          aria-label={tools.editorTitle}
          value={defaultEditor}
          onChange={(value) => setDefaultEditor(value as DefaultEditor)}
          options={[
            { value: "code", label: tools.editorVsCode },
            { value: "cursor", label: tools.editorCursor },
            { value: "subl", label: tools.editorSublime },
            { value: "notepad++", label: tools.editorNotepadPlusPlus },
            { value: "custom", label: tools.editorCustom },
          ]}
          className="w-72"
        />
      </SettingsRow>
      {defaultEditor === "custom" && (
        <SettingsRow label={tools.editorCustom} htmlFor="custom-editor-command">
          <Input
            id="custom-editor-command"
            size="md"
            mono
            className="w-72"
            data-testid="custom-editor-input"
            value={customEditorCommand}
            onChange={(e) => setCustomEditorCommand(e.target.value)}
            placeholder={tools.editorCustomPlaceholder}
          />
        </SettingsRow>
      )}
    </SettingsSection>
  );
};
```

- [ ] **Step 4: Terminal section**

Replace `src/components/settings/tabs/ExternalToolsTerminalSection.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { Select } from "../../../shared/ui";
import { useSettingsStore, type DefaultTerminal } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../ui";

/** Default terminal picker. */
export const ExternalToolsTerminalSection: React.FC = () => {
  const { t } = useTranslation();
  const tools = t.settings.tools;
  const { defaultTerminal, setDefaultTerminal } = useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.terminal}>
      <SettingsRow
        label={tools.terminalTitle}
        description={tools.terminalDesc}
        help={
          <HelpTooltip
            title={t.settings.help.toolsTerminalTitle}
            description={t.settings.help.toolsTerminalDesc}
            tag={t.settings.help.tagIntegration}
          />
        }
      >
        <Select
          data-testid="terminal-select"
          aria-label={tools.terminalTitle}
          value={defaultTerminal}
          onChange={(value) => setDefaultTerminal(value as DefaultTerminal)}
          options={[
            { value: "wt", label: tools.terminalWindowsTerminal },
            { value: "powershell", label: tools.terminalPowerShell },
            { value: "cmd", label: tools.terminalCmd },
            { value: "bash", label: tools.terminalGitBash },
          ]}
          className="w-72"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
```

Replace `src/components/settings/tabs/ExternalToolsTab.tsx` with:

```tsx
import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsPage } from "../ui";
import { ExternalToolsEditorSection } from "./ExternalToolsEditorSection";
import { ExternalToolsTerminalSection } from "./ExternalToolsTerminalSection";

export const ExternalToolsTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingsPage title={t.settings.tools.title} description={t.settings.tools.subtitle}>
      <ExternalToolsEditorSection />
      <ExternalToolsTerminalSection />
    </SettingsPage>
  );
};
```

- [ ] **Step 5: GitHub components**

Replace `src/components/settings/tabs/GitHubTokenStatusAlerts.tsx` with:

```tsx
import React from "react";
import { Alert } from "../../../shared/ui";

export interface GitHubTokenStatusAlertsProps {
  errorMessage: string | null;
  successMessage: string | null;
}

/** Error/success alerts shown below the GitHub token action buttons. */
export const GitHubTokenStatusAlerts: React.FC<GitHubTokenStatusAlertsProps> = ({
  errorMessage,
  successMessage,
}) => (
  <>
    {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
    {successMessage && <Alert variant="success">{successMessage}</Alert>}
  </>
);
```

In `src/components/settings/tabs/GitHubTokenPanel.tsx`:
- Change the outer wrapper `className="space-y-3 bg-surface-header/30 p-4 rounded-xl border border-border-subtle"` to `className="space-y-3 p-4"` (the card now comes from `SettingsSection`).
- Change the token label classes `text-xs font-semibold text-primary flex items-center gap-1.5` to `text-sm font-medium text-primary flex items-center gap-1.5`.
- Change the create-token link class `text-[11px]` to `text-xs`, and the help paragraph class `text-[11px] text-secondary` to `text-xs text-secondary`.
- On the show/hide button replace `title={showToken ? "Ẩn" : "Hiện"}` with:
  ```tsx
          title={showToken ? t.settings.github.hideToken : t.settings.github.showToken}
          aria-label={showToken ? t.settings.github.hideToken : t.settings.github.showToken}
  ```
- On the gh CLI button replace ``title="Tự động lấy token từ `gh auth token`"`` with `title={t.settings.github.useGhCliHint}`.

In `src/components/settings/tabs/GitHubAccountCard.tsx`:
- Container class → `p-4 rounded-xl border border-border-subtle bg-surface-header/30 flex items-center justify-between`.
- Avatar `img` class → `w-10 h-10 rounded-full border border-border-subtle`.
- Fallback avatar class → `w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center font-bold text-accent`.
- `CheckCircle2` class → `text-diff-add-text`.

Replace `src/components/settings/tabs/GitHubSettingsTab.tsx` with:

```tsx
import React from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { SettingsPage, SettingsSection } from "../ui";
import { useGitHubSettings } from "./useGitHubSettings";
import { GitHubAccountCard } from "./GitHubAccountCard";
import { GitHubTokenPanel } from "./GitHubTokenPanel";

export const GitHubSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const gh = useGitHubSettings();

  if (gh.isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-secondary">
        <RefreshCw size={16} className="mr-2 animate-spin" />
        <span>{t.settings.github.loading}</span>
      </div>
    );
  }

  return (
    <SettingsPage title={t.settings.github.title} description={t.settings.github.description}>
      {gh.connectedUser && (
        <GitHubAccountCard connectedUser={gh.connectedUser} onDisconnect={gh.handleDisconnect} />
      )}
      <SettingsSection title={t.settings.sections.auth}>
        <GitHubTokenPanel
          token={gh.token}
          onTokenChange={gh.setToken}
          showToken={gh.showToken}
          onToggleShowToken={() => gh.setShowToken(!gh.showToken)}
          isTesting={gh.isTesting}
          onTestAndSave={gh.handleTestAndSave}
          onUseGhCli={gh.handleUseGhCli}
          errorMessage={gh.errorMessage}
          successMessage={gh.successMessage}
        />
      </SettingsSection>
    </SettingsPage>
  );
};
```

- [ ] **Step 6: Run tests, typecheck, lint**

Run: `pnpm vitest run src/test/SettingsTabs.test.tsx src/test/GitHubSettingsTab.test.tsx src/test/SettingsModal.test.tsx src/components/settings && pnpm typecheck && pnpm lint`
Expected: all PASS. `SettingsModal.test.tsx` still finds the editor and terminal titles as row labels.

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/tabs src/test/SettingsTabs.test.tsx src/test/SettingsModal.test.tsx
git commit -m "💄 redesign external tools and github settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Remove unused translations and run the full check

**Files:**
- Modify: `src/i18n/vi.ts`, `src/i18n/en.ts`

- [ ] **Step 1: Find keys that lost their consumers**

Run:

```bash
for k in description scopeSwitcher.global scopeSwitcher.repo scopeSwitcher.noRepo profile.scopeLabel profile.scopeLocal profile.scopeGlobalDesc profile.scopeLocalDesc profile.inheritedFromGlobal profile.inheritGlobalOption profile.overrideRepoOption profile.repoSettingsBanner profile.repoSettingsDesc profile.noRepoWarning profile.gpgTitle profile.commitConventionsTitle profile.commitLength50 profile.commitLength72 diff.viewModeUnified diff.viewModeSplit diff.whitespaceIgnore behavior.inheritGlobalPull behavior.resetToGlobalBtn behavior.pullMerge behavior.pullRebase help.profileScopeTitle help.profileScopeDesc; do
  n=$(grep -rn "settings\.$k\b\|\.$(echo $k | sed 's/.*\.//')\b" src --include=*.ts --include=*.tsx | grep -v "src/i18n/" | wc -l)
  echo "$n $k"
done
```

Expected: a count per key. A count of `0` means no consumer. A non-zero count can be a false positive from a same-named key elsewhere (for example `.description` or `.pullMerge` matching `pullMergeShort` is excluded by `\b`, but `.description` matches many objects), so check each non-zero candidate by hand with `grep -rn "<key>" src --include=*.tsx | grep -v src/i18n/` before keeping it.

- [ ] **Step 2: Delete unused keys from both dictionaries**

For every key confirmed unused, delete its line from both `src/i18n/vi.ts` and `src/i18n/en.ts`. Delete `scopeSwitcher.global`, `.repo` and `.noRepo` but keep `scopeSwitcher.selectRepo` (used by `SettingsScopeSelector`). Keep `profile.scopeGlobal` (used by `SettingsScopeSelector`) and `profile.resetToGlobalBtn` (used by `SettingsInheritRow`).

- [ ] **Step 3: Full verification**

Run: `pnpm check`
Expected: exit 0. That covers format, lint, query keys, comment language, lint suppressions, bindings, build, all Vitest tests, clippy and cargo tests.

If `format:check` fails, run `pnpm prettier --write <reported files>` (never `pnpm format`, which would also reformat the user's unrelated edits), re-run `pnpm check`, and include only the reformatted files from this plan in the commit.

- [ ] **Step 4: Manual smoke check**

Run `pnpm tauri dev` (or `pnpm dev` for the web build), open Settings with a repo open, and confirm:
- the sidebar shows the "Cấu hình Git" and "Ứng dụng" groups;
- the scope selector appears only on Profile and Behavior;
- editing a profile field shows the floating save bar, and Hoàn tác hides it;
- turning off "Dùng cấu hình Global" unlocks the identity fields;
- the Appearance theme switch changes the theme live.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/vi.ts src/i18n/en.ts
git commit -m "🔥 remove unused settings translations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
