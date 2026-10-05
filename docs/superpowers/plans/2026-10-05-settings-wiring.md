# Settings Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every setting in the settings modal change app behavior, and remove the force push confirmation that guards nothing.

**Architecture:** Each setting is read from `useSettingsStore` at the point of use: confirmations in the staging list and branch sidebar, the commit limit in `useCommitBox`, dates through a new `useFormatDate` hook, diff display through a new `useDiffDisplaySettings` hook and a shared `ReadOnlyDiffHunk`, auto-fetch through a new `useAutoFetch` hook in `RepoHeader`, and the default terminal through a new `open_in_terminal` Tauri command.

**Tech Stack:** React 19, TypeScript, Zustand, TanStack Query, Vitest + Testing Library, Tauri 2 with tauri-specta (Rust).

Spec: `docs/superpowers/specs/2026-10-05-settings-wiring-design.md`

## Global Constraints

- Code, comments, test names and commit messages in English. User-facing text goes in both `src/i18n/vi.ts` and `src/i18n/en.ts`; never hardcode it. Use `{placeholder}` + `.replace`, not string concatenation.
- Lint limits: 300 lines/file, 80 lines/function, complexity 15, depth 4, 5 params, 3 nested callbacks. `react/exhaustive-deps` is an error. No `eslint-disable`/`oxlint-disable`.
- Layers: `features → shared → domain`. Only `src/ipc/**` and `src/features/*/api/**` import `ipc/` at runtime. Use `qk` from `src/domain/queryKeys.ts`; never call `invalidateQueries()` without a key.
- Never edit `src/ipc/bindings.generated.ts` by hand; regenerate with `cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings`.
- Colors via design tokens, conditional classes via `clsx`, sizes from the Tailwind scale. Runtime sizes from settings (font size, tab size) go in an inline `style`.
- A refactor is a mechanical replacement: pin behavior with a test first.
- Do not add or modify Playwright E2E tests.
- Commit messages: Gitmoji, `<emoji> <description>`, no `feat:` prefixes or scopes, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Run single test files with `pnpm vitest run <path>`. Every task ends with `pnpm format`, `pnpm lint` and `pnpm typecheck` green; the last task runs `pnpm check`.
- Test setup (`src/test/setup.ts`) seeds `locale = "vi"`, so components render Vietnamese by default in tests.

## File Map

| File | Change |
|---|---|
| `src/store/useSettingsStore.ts` | Remove force push confirm; add `autoFetchInterval` |
| `src/features/settings/components/GitBehaviorConfirmationsSection.tsx` | Drop force push row |
| `src/components/changes/StagingFileList.tsx` | Honor `confirmDiscard` |
| `src/features/branch/hooks/deleteBranchToast.ts` | New: shared success toast with undo |
| `src/features/branch/hooks/useDeleteBranchRequest.ts` | New: direct delete when confirmation is off |
| `src/features/branch/hooks/useDeleteBranchForm.ts`, `components/DeleteBranchModal.tsx`, `components/BranchSidebarDialogs.tsx`, `model/sidebarDialog.ts`, `hooks/useBranchSidebarShell.ts` | Wire the above |
| `src/components/changes/useCommitBox.ts`, `CommitBox.tsx`, `CommitBoxHeader.tsx`, `CommitSummaryInput.tsx` | Commit limit from settings |
| `src/i18n/index.ts` | `formatAbsoluteDate`, `formatCommitDate`, `useFormatDate` |
| Date call sites (5 files) | Use `useFormatDate` |
| `src/components/diff/ReadOnlyDiffHunk.tsx`, `UnifiedDiffRow.tsx`, `SplitDiffRow.tsx`, `splitRows.ts`, `useDiffDisplaySettings.ts` | New shared diff rendering |
| `FileDiffViewer.tsx`, `CompareDiffViewer.tsx`, `InteractiveDiffViewer.tsx`, `DiffLineGutter.tsx`, `PullRequestPatchDiffViewer.tsx` | Apply diff settings |
| `src/features/remote/api/useAutoFetch.ts` | New scheduler |
| `src/features/settings/hooks/useGitBehaviorSettings*.ts` | Use store for interval |
| `src-tauri/src/commands/terminal.rs` | New `open_in_terminal` |
| `src/ipc/editor.ts`, `src/features/repo/api/terminalApi.ts`, `src/components/header/RepoHeaderGitActions*.ts(x)` | Terminal button |

---

### Task 1: Remove the force push confirmation

**Files:**
- Modify: `src/store/useSettingsStore.ts` (lines 40, 67, 112, 142, 233-237)
- Modify: `src/features/settings/components/GitBehaviorConfirmationsSection.tsx`
- Modify: `src/i18n/vi.ts:164`, `src/i18n/en.ts:167`
- Test: `src/test/SettingsTabs.test.tsx`, `src/test/useSettingsStore.test.ts`

**Interfaces:**
- Produces: `useSettingsStore` without `confirmForcePush` / `setConfirmForcePush`.

- [ ] **Step 1: Write the failing test**

In `src/test/SettingsTabs.test.tsx`, inside `describe("GitBehaviorTab")`, replace these lines of the "toggles safety confirmations and git flags" test:

```tsx
      fireEvent.click(screen.getByTestId("toggle-confirm-force-push"));
      expect(useSettingsStore.getState().confirmForcePush).toBe(false);
```

with:

```tsx
      expect(screen.queryByTestId("toggle-confirm-force-push")).not.toBeInTheDocument();
```

Also delete `settings.setConfirmForcePush(true);` from that file's `beforeEach` (line 36).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/SettingsTabs.test.tsx`
Expected: FAIL, the force push toggle is still rendered.

- [ ] **Step 3: Remove the setting**

In `src/features/settings/components/GitBehaviorConfirmationsSection.tsx`, delete the third entry of `rows`:

```tsx
    {
      id: "confirm-force-push",
      label: b.confirmForcePushLabel,
      checked: s.confirmForcePush,
      set: s.setConfirmForcePush,
    },
```

and change the doc comment to `/** Safety confirmation switches: discard and delete branch warnings. */`.

In `src/store/useSettingsStore.ts` delete:
- `confirmForcePush: boolean;` from `SettingsState`
- `setConfirmForcePush: (confirm: boolean) => void;` from `SettingsState`
- `const savedConfirmForcePush = getStorage("gitvista_confirm_force_push", "true") === "true";`
- `confirmForcePush: savedConfirmForcePush,`
- the `setConfirmForcePush: makePersistedSetter(...)` block

In `src/i18n/vi.ts` delete `confirmForcePushLabel: "Xác nhận trước khi đẩy cưỡng bức (Force push)",`.
In `src/i18n/en.ts` delete `confirmForcePushLabel: "Confirm before force pushing",`.

In `src/test/useSettingsStore.test.ts` delete `store.setConfirmForcePush(true);` (beforeEach), `expect(store.confirmForcePush).toBe(true);`, `store.setConfirmForcePush(false);` and `expect(updated.confirmForcePush).toBe(false);`.

- [ ] **Step 4: Run tests and checks**

Run: `pnpm vitest run src/test/SettingsTabs.test.tsx src/test/useSettingsStore.test.ts && pnpm typecheck && pnpm lint`
Expected: PASS. `grep -rn "ForcePush" src` returns nothing.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "🔥 remove force push confirmation setting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Honor the discard and delete-branch confirmations

**Files:**
- Modify: `src/components/changes/StagingFileList.tsx`
- Create: `src/features/branch/hooks/deleteBranchToast.ts`
- Create: `src/features/branch/hooks/useDeleteBranchRequest.ts`
- Modify: `src/features/branch/hooks/useDeleteBranchForm.ts`
- Modify: `src/features/branch/model/sidebarDialog.ts`
- Modify: `src/features/branch/components/DeleteBranchModal.tsx`
- Modify: `src/features/branch/components/BranchSidebarDialogs.tsx:69-77`
- Modify: `src/features/branch/hooks/useBranchSidebarShell.ts`
- Test: `src/test/StagingFileList.test.tsx`, `src/test/DeleteBranchModal.test.tsx`, create `src/features/branch/hooks/useDeleteBranchRequest.test.tsx`

**Interfaces:**
- Produces: `showDeleteBranchUndoToast(repoPath: string, branchName: string, backupRef: string, t: Translations): void`
- Produces: `useDeleteBranchRequest(repoPath: string, setDialog: (dialog: SidebarDialog) => void): (dialog: SidebarDialog) => void`
- Produces: `SidebarDialog` variant `{ kind: "deleteBranch"; name: string; unmerged?: boolean }`
- Produces: `DeleteBranchModalProps.initialUnmerged?: boolean`

- [ ] **Step 1: Write the failing discard test**

Append to `src/test/StagingFileList.test.tsx` inside the top-level `describe`. Add `import { useSettingsStore } from "../store/useSettingsStore";` at the top if missing, and use the `mockProps` / render helper that the existing "opens DiscardConfirmModal" test uses:

```tsx
  it("discards immediately without the modal when confirmation is off", () => {
    useSettingsStore.getState().setConfirmDiscard(false);
    render(<StagingFileList {...mockProps} />);

    fireEvent.click(screen.getByTestId("discard-file-src/unstaged1.ts"));

    expect(mockProps.onDiscardFile).toHaveBeenCalledWith("src/unstaged1.ts");
    expect(screen.queryByTestId("confirm-discard-button")).not.toBeInTheDocument();
    useSettingsStore.getState().setConfirmDiscard(true);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run src/test/StagingFileList.test.tsx`
Expected: FAIL, `onDiscardFile` was not called.

- [ ] **Step 3: Implement the discard switch**

In `src/components/changes/StagingFileList.tsx` add `import { useSettingsStore } from "../../store/useSettingsStore";`, then after `const [discardTarget, setDiscardTarget] = useState<string | null>(null);` add:

```tsx
  const confirmDiscard = useSettingsStore((s) => s.confirmDiscard);

  // With the confirmation turned off in settings, discard straight away.
  const requestDiscard = (filePath: string) => {
    if (confirmDiscard) setDiscardTarget(filePath);
    else onDiscardFile(filePath);
  };
```

and pass `onSetDiscardTarget={requestDiscard}` to `ChangesSection` instead of `setDiscardTarget`.

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run src/test/StagingFileList.test.tsx`
Expected: PASS (all tests, including the existing modal tests).

- [ ] **Step 5: Extract the undo toast (mechanical)**

The existing `DeleteBranchModal.test.tsx` tests pin the toast behavior. Create `src/features/branch/hooks/deleteBranchToast.ts`:

```ts
import { undoDeleteBranch } from "../../undo";
import { useToastStore } from "../../../store/useToastStore";
import type { Translations } from "../../../i18n/vi";

/** Success toast for a deleted branch, with an undo action that restores it from its backup ref. */
export function showDeleteBranchUndoToast(
  repoPath: string,
  branchName: string,
  backupRef: string,
  t: Translations
): void {
  useToastStore.getState().showToast({
    message: t.modals.deleteBranch.successToast.replace("{name}", branchName),
    type: "success",
    durationMs: 10000,
    undoAction: async () => {
      await undoDeleteBranch(repoPath, branchName, backupRef);
    },
  });
}
```

In `src/features/branch/hooks/useDeleteBranchForm.ts`, replace the `useToastStore.getState().showToast({...})` call inside `handleDelete` with `showDeleteBranchUndoToast(repoPath, branchName, backupRef, t);`, import it from `./deleteBranchToast`, and drop the now-unused `undoDeleteBranch` import.

Run: `pnpm vitest run src/test/DeleteBranchModal.test.tsx`
Expected: PASS (unchanged behavior).

- [ ] **Step 6: Write the failing modal test for `initialUnmerged`**

Append to `src/test/DeleteBranchModal.test.tsx`:

```tsx
  it("opens straight in the unmerged state and force deletes", async () => {
    const onClose = vi.fn();
    (invokeCommand.deleteBranch as ReturnType<typeof vi.fn>).mockResolvedValue(
      "refs/gitui-backup/delete-branch-test-123"
    );

    renderWithClient(
      <DeleteBranchModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        branchName="feature/unmerged"
        initialUnmerged
      />
    );

    expect(screen.getByText(/Nhánh chưa được gộp/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Vẫn xoá nhánh này/i }));

    await waitFor(() => {
      expect(invokeCommand.deleteBranch).toHaveBeenCalledWith(
        "/test/repo",
        "feature/unmerged",
        true
      );
    });
  });
```

Run: `pnpm vitest run src/test/DeleteBranchModal.test.tsx`
Expected: FAIL (TypeScript error on `initialUnmerged`, or the alert is missing).

- [ ] **Step 7: Implement `initialUnmerged`**

In `src/features/branch/model/sidebarDialog.ts` change the variant to:

```ts
  | { kind: "deleteBranch"; name: string; unmerged?: boolean }
```

In `useDeleteBranchForm.ts` add `initialUnmerged?: boolean;` to `DeleteBranchFormOptions`, destructure it, and change the reset effect to:

```ts
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsUnmerged(Boolean(initialUnmerged));
    }
  }, [isOpen, branchName, initialUnmerged]);
```

In `DeleteBranchModal.tsx` add `initialUnmerged?: boolean;` to the props, destructure it, and pass it to `useDeleteBranchForm({ ..., initialUnmerged })`.

In `BranchSidebarDialogs.tsx` add `initialUnmerged={dialog.unmerged}` to `<DeleteBranchModal>`.

Run: `pnpm vitest run src/test/DeleteBranchModal.test.tsx`
Expected: PASS.

- [ ] **Step 8: Write the failing request-hook test**

Create `src/features/branch/hooks/useDeleteBranchRequest.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useDeleteBranchRequest } from "./useDeleteBranchRequest";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useToastStore } from "../../../store/useToastStore";
import { invokeCommand } from "../../../ipc/client";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: { deleteBranch: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function setup() {
  const setDialog = vi.fn();
  const { result } = renderHook(() => useDeleteBranchRequest("/repo", setDialog), { wrapper });
  return { setDialog, openDialog: result.current };
}

describe("useDeleteBranchRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.getState().clearToasts();
    useSettingsStore.getState().setConfirmDeleteBranch(true);
  });

  it("opens the confirmation dialog when confirmation is on", () => {
    const { setDialog, openDialog } = setup();
    act(() => openDialog({ kind: "deleteBranch", name: "feat" }));
    expect(setDialog).toHaveBeenCalledWith({ kind: "deleteBranch", name: "feat" });
    expect(invokeCommand.deleteBranch).not.toHaveBeenCalled();
  });

  it("passes other dialogs through unchanged", () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    const { setDialog, openDialog } = setup();
    act(() => openDialog({ kind: "renameBranch", name: "feat" }));
    expect(setDialog).toHaveBeenCalledWith({ kind: "renameBranch", name: "feat" });
  });

  it("deletes directly with an undo toast when confirmation is off", async () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    vi.mocked(invokeCommand.deleteBranch).mockResolvedValue("refs/gitui-backup/x");
    const { setDialog, openDialog } = setup();

    act(() => openDialog({ kind: "deleteBranch", name: "feat" }));

    await waitFor(() =>
      expect(invokeCommand.deleteBranch).toHaveBeenCalledWith("/repo", "feat", false)
    );
    await waitFor(() => expect(useToastStore.getState().toasts[0]?.type).toBe("success"));
    expect(setDialog).not.toHaveBeenCalled();
  });

  it("falls back to the unmerged dialog when git refuses a safe delete", async () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    vi.mocked(invokeCommand.deleteBranch).mockRejectedValue(
      new Error("UNMERGED_BRANCH: not merged")
    );
    const { setDialog, openDialog } = setup();

    act(() => openDialog({ kind: "deleteBranch", name: "feat" }));

    await waitFor(() =>
      expect(setDialog).toHaveBeenCalledWith({ kind: "deleteBranch", name: "feat", unmerged: true })
    );
  });

  it("does not short-circuit the unmerged dialog itself", () => {
    useSettingsStore.getState().setConfirmDeleteBranch(false);
    const { setDialog, openDialog } = setup();
    act(() => openDialog({ kind: "deleteBranch", name: "feat", unmerged: true }));
    expect(setDialog).toHaveBeenCalledWith({ kind: "deleteBranch", name: "feat", unmerged: true });
    expect(invokeCommand.deleteBranch).not.toHaveBeenCalled();
  });
});
```

Run: `pnpm vitest run src/features/branch/hooks/useDeleteBranchRequest.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 9: Implement `useDeleteBranchRequest`**

Create `src/features/branch/hooks/useDeleteBranchRequest.ts`:

```ts
import { useDeleteBranch } from "../api";
import { isDialog, type SidebarDialog } from "../model/sidebarDialog";
import { showDeleteBranchUndoToast } from "./deleteBranchToast";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { mapGitError } from "../../../utils/errorMapping";
import { toErrorMessage } from "../../../shared/utils/toError";

/**
 * Wraps the sidebar's `setDialog` so that, with the delete-branch confirmation
 * turned off in settings, a delete request runs straight away instead of
 * opening the dialog. An unmerged branch still opens the dialog in its
 * unmerged state, so a force delete is always confirmed.
 */
export function useDeleteBranchRequest(
  repoPath: string,
  setDialog: (dialog: SidebarDialog) => void
): (dialog: SidebarDialog) => void {
  const { t } = useTranslation();
  const deleteBranch = useDeleteBranch(repoPath);
  const confirmDeleteBranch = useSettingsStore((s) => s.confirmDeleteBranch);

  const deleteDirectly = async (name: string) => {
    try {
      const backupRef = await deleteBranch.mutateAsync({ name, force: false });
      showDeleteBranchUndoToast(repoPath, name, backupRef, t);
    } catch (err: unknown) {
      if (toErrorMessage(err).includes("UNMERGED_BRANCH")) {
        setDialog({ kind: "deleteBranch", name, unmerged: true });
      } else {
        useToastStore.getState().showError(mapGitError(err, t));
      }
    }
  };

  return (dialog: SidebarDialog) => {
    if (isDialog(dialog, "deleteBranch") && !dialog.unmerged && !confirmDeleteBranch) {
      void deleteDirectly(dialog.name);
      return;
    }
    setDialog(dialog);
  };
}
```

In `useBranchSidebarShell.ts` import it and, right after `const closeDialog = () => setDialog(NO_DIALOG);`, add:

```ts
  const openDialog = useDeleteBranchRequest(repoPath, setDialog);
```

then return `setDialog: openDialog,` instead of `setDialog,` (keep `performCheckout` using the raw `setDialog`).

- [ ] **Step 10: Run tests and checks**

Run: `pnpm vitest run src/features/branch src/test/DeleteBranchModal.test.tsx src/test/BranchSidebar.test.tsx src/test/StagingFileList.test.tsx && pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add -A src
git commit -m "✨ honor discard and delete branch confirmation settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Commit subject limit from settings

**Files:**
- Modify: `src/components/changes/useCommitBox.ts:44,81`
- Modify: `src/components/changes/CommitBox.tsx:33,42,48`
- Modify: `src/components/changes/CommitBoxHeader.tsx`
- Modify: `src/components/changes/CommitSummaryInput.tsx`
- Modify: `src/i18n/vi.ts:492-493`, `src/i18n/en.ts:495-496`
- Test: `src/test/CommitBox.test.tsx`

**Interfaces:**
- Produces: `useCommitBox` returns `commitMessageLimit: number` and `isOverLimit: boolean` (replaces `isOver72`).
- Produces: `CommitBoxHeaderProps { summaryLength: number; limit: number; isOverLimit: boolean }`, `CommitSummaryInputProps` with `limit: number; isOverLimit: boolean` (replaces `isOver72`).

- [ ] **Step 1: Write the failing tests**

In `src/test/CommitBox.test.tsx` add `import { useSettingsStore } from "../store/useSettingsStore";`, add `useSettingsStore.getState().setCommitMessageLimit(72);` to `beforeEach`, and append:

```tsx
  it("uses the subject limit chosen in settings", () => {
    useSettingsStore.getState().setCommitMessageLimit(50);
    render(<CommitBox repoPath="/test/repo" stagedCount={1} onCommit={mockOnCommit} />);

    fireEvent.change(screen.getByTestId("commit-summary-input"), {
      target: { value: "a".repeat(51) },
    });

    expect(screen.getByText("51/50")).toBeInTheDocument();
    expect(screen.getByText(/Vượt quá 50 ký tự khuyến nghị/i)).toBeInTheDocument();
  });

  it("never warns when the limit is off", () => {
    useSettingsStore.getState().setCommitMessageLimit(0);
    render(<CommitBox repoPath="/test/repo" stagedCount={1} onCommit={mockOnCommit} />);

    fireEvent.change(screen.getByTestId("commit-summary-input"), {
      target: { value: "a".repeat(120) },
    });

    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.queryByText(/Vượt quá/i)).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run src/test/CommitBox.test.tsx`
Expected: FAIL on "51/50" and "120".

- [ ] **Step 3: Implement**

`src/i18n/vi.ts`:

```ts
    summaryPlaceholder: "Tiêu đề commit (ngắn gọn)...",
    charLimitWarn: "Vượt quá {limit} ký tự khuyến nghị",
```

`src/i18n/en.ts`:

```ts
    summaryPlaceholder: "Commit summary (keep it concise)...",
    charLimitWarn: "Exceeds the recommended {limit} characters",
```

`useCommitBox.ts`: add `import { useSettingsStore } from "../../store/useSettingsStore";`, replace `const isOver72 = summary.length > 72;` with:

```ts
  const commitMessageLimit = useSettingsStore((s) => s.commitMessageLimit);
  // A limit of 0 means "no limit" in settings.
  const isOverLimit = commitMessageLimit > 0 && summary.length > commitMessageLimit;
```

and in the returned object replace `isOver72,` with `commitMessageLimit,` and `isOverLimit,`.

`CommitBoxHeader.tsx`:

```tsx
export interface CommitBoxHeaderProps {
  summaryLength: number;
  limit: number;
  isOverLimit: boolean;
}

/** Title row plus the summary character counter (no denominator when the limit is off). */
export const CommitBoxHeader: React.FC<CommitBoxHeaderProps> = ({
  summaryLength,
  limit,
  isOverLimit,
}) => {
```

with the counter span's class using `isOverLimit` and its content:

```tsx
          {limit > 0 ? `${summaryLength}/${limit}` : summaryLength}
```

`CommitSummaryInput.tsx`: replace the `isOver72: boolean;` prop with `limit: number;` and `isOverLimit: boolean;`, use `invalid={isOverLimit}`, `{isOverLimit && (...)}`, and render `{t.commit.charLimitWarn.replace("{limit}", String(limit))}`. Update the doc comment to `/** The commit summary field, with its over-limit warning. */`.

`CommitBox.tsx`: destructure `commitMessageLimit, isOverLimit` instead of `isOver72`, and render:

```tsx
      <CommitBoxHeader
        summaryLength={summary.length}
        limit={commitMessageLimit}
        isOverLimit={isOverLimit}
      />

      <CommitSummaryInput
        summary={summary}
        onSummaryChange={setSummary}
        onKeyDown={handleKeyDown}
        limit={commitMessageLimit}
        isOverLimit={isOverLimit}
      />
```

- [ ] **Step 4: Run tests and checks**

Run: `pnpm vitest run src/test/CommitBox.test.tsx && pnpm typecheck && pnpm lint && grep -rn "isOver72\|summaryPlaceholder" src --include=*.test.tsx`
Expected: PASS; the grep shows no test asserting the old placeholder (fix any it finds).

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "✨ apply commit subject limit setting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Date format setting

**Files:**
- Modify: `src/i18n/index.ts`
- Create: `src/i18n/formatDate.test.ts`
- Modify: `src/components/compare/CompareCommitList.tsx` (delete the local `formatRelativeTime`, lines 11-23)
- Modify: `src/components/inspector/BlameLineGutter.tsx:4,40`
- Modify: `src/components/inspector/FileHistoryCommitRow.tsx:4,59`
- Modify: `src/features/history/components/CommitMetadata.tsx`, `CommitMetadataAuthor.tsx`
- Modify: `src/features/welcome/components/RecentRepositoryRow.tsx:5,34`

**Interfaces:**
- Produces: `formatAbsoluteDate(timestampSec: number, locale: Locale): string`
- Produces: `formatCommitDate(timestampSec: number, timeDict: Translations["diff"]["time"], locale: Locale, dateFormat: DateFormat): string`
- Produces: `useFormatDate(): (timestampSec: number) => string`
- Produces: `CommitMetadataAuthor` prop `displayTime` (renamed from `relativeTime`).

- [ ] **Step 1: Write the failing tests**

Create `src/i18n/formatDate.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { formatAbsoluteDate, formatCommitDate, getTranslation, useFormatDate } from "./index";
import { useSettingsStore } from "../store/useSettingsStore";

const TIMESTAMP = 1_700_000_000; // 2023-11-14 UTC

function expectedAbsolute(locale: "vi" | "en") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(TIMESTAMP * 1000)
  );
}

describe("formatCommitDate", () => {
  it("formats relative time in relative mode", () => {
    const time = getTranslation("en").diff.time;
    const nowSec = Math.floor(Date.now() / 1000);
    expect(formatCommitDate(nowSec - 120, time, "en", "relative")).toBe("2m ago");
  });

  it("formats an absolute date in the given locale", () => {
    const time = getTranslation("vi").diff.time;
    expect(formatCommitDate(TIMESTAMP, time, "vi", "absolute")).toBe(expectedAbsolute("vi"));
    expect(formatAbsoluteDate(TIMESTAMP, "en")).toBe(expectedAbsolute("en"));
  });
});

describe("useFormatDate", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("en");
  });

  it("follows the date format setting", () => {
    useSettingsStore.getState().setDateFormat("absolute");
    const { result } = renderHook(() => useFormatDate());
    expect(result.current(TIMESTAMP)).toBe(expectedAbsolute("en"));
    useSettingsStore.getState().setDateFormat("relative");
  });
});
```

Run: `pnpm vitest run src/i18n/formatDate.test.ts`
Expected: FAIL, `formatAbsoluteDate` is not exported.

- [ ] **Step 2: Implement the helpers**

In `src/i18n/index.ts` change the store import to:

```ts
import { useSettingsStore, type DateFormat, type Locale } from "../store/useSettingsStore";
```

and add after `formatRelativeTime`:

```ts
/** Locale-aware date and time, e.g. "Nov 14, 2023, 10:13 PM". */
export function formatAbsoluteDate(timestampSec: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(timestampSec * 1000)
  );
}

/** Formats a timestamp the way the user chose in Settings › Appearance › Date format. */
export function formatCommitDate(
  timestampSec: number,
  timeDict: Translations["diff"]["time"],
  locale: Locale,
  dateFormat: DateFormat
): string {
  return dateFormat === "absolute"
    ? formatAbsoluteDate(timestampSec, locale)
    : formatRelativeTime(timestampSec, timeDict);
}

/** Returns a formatter bound to the current locale and date format setting. */
export function useFormatDate(): (timestampSec: number) => string {
  const locale = useSettingsStore((s) => s.locale);
  const dateFormat = useSettingsStore((s) => s.dateFormat);
  const timeDict = (dictionaries[locale] || vi).diff.time;
  return (timestampSec: number) => formatCommitDate(timestampSec, timeDict, locale, dateFormat);
}
```

Run: `pnpm vitest run src/i18n/formatDate.test.ts`
Expected: PASS.

- [ ] **Step 3: Replace the call sites**

`CompareCommitList.tsx`: delete the local `formatRelativeTime` function (it hardcodes Vietnamese), import `useFormatDate` from `"../../i18n"` next to `useTranslation`, add `const formatDate = useFormatDate();` after `const { t } = useTranslation();`, and render `{formatDate(commit.timestamp)}`.

`BlameLineGutter.tsx`: import becomes `import { AuthorAvatar } from "../../features/history";` plus `import { useFormatDate } from "../../i18n";`; add `const formatDate = useFormatDate();` at the top of the component body; render `{formatDate(line.timestamp_sec)}`.

`FileHistoryCommitRow.tsx`: same as `BlameLineGutter`, rendering `{formatDate(commit.timestamp_sec)}`.

`CommitMetadata.tsx`: drop `formatRelativeTime` from the `../model/commitDetails` import, import `useFormatDate` from `"../../../i18n"`, replace the `relativeTime` `useMemo` with:

```tsx
  const formatDate = useFormatDate();
  const displayTime = details ? formatDate(details.author_timestamp_sec) : "";
```

and pass `displayTime={displayTime}`. In `CommitMetadataAuthor.tsx` rename the `relativeTime` prop to `displayTime` (interface, destructuring, and the `<span>` at line 48).

`RecentRepositoryRow.tsx`: keep the welcome screen's own relative formatter for relative mode:

```tsx
import { formatAbsoluteDate, useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
...
  const { t, locale } = useTranslation();
  const dateFormat = useSettingsStore((s) => s.dateFormat);
  const relativeTime =
    dateFormat === "absolute" && item.last_opened_at_ms
      ? formatAbsoluteDate(item.last_opened_at_ms / 1000, locale)
      : formatRelativeTime(item.last_opened_at_ms, t.welcome);
```

(adjust the existing `useTranslation` import line instead of duplicating it).

- [ ] **Step 4: Run tests and checks**

Run: `pnpm vitest run src/i18n src/features/history src/features/welcome src/components && pnpm typecheck && pnpm lint`
Expected: PASS. If a compare or inspector test asserted the old hardcoded "phút trước" text, update it to the `t.diff.time` wording (e.g. "2 phút trước" → the `vi.ts` `minutesAgo` value).

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "✨ apply date format setting to commit dates

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Extract the shared read-only diff hunk

Mechanical refactor: `FileDiffHunk` in `FileDiffViewer.tsx` and `FileDiffHunk` in `CompareDiffViewer.tsx` are identical. Pin, then move.

**Files:**
- Create: `src/components/diff/UnifiedDiffRow.tsx`
- Create: `src/components/diff/ReadOnlyDiffHunk.tsx`
- Create: `src/components/diff/ReadOnlyDiffHunk.test.tsx`
- Modify: `src/features/history/components/FileDiffViewer.tsx` (delete lines 18-85, `FileDiffHunk`)
- Modify: `src/components/compare/CompareDiffViewer.tsx` (delete lines 22-88, `FileDiffHunk`)

**Interfaces:**
- Produces: `UnifiedDiffRow` props `{ line: DiffLine; tokens: WordDiffToken[] | undefined; showWordDiff: boolean }`
- Produces: `ReadOnlyDiffHunk` props `{ hunk: DiffHunk; showWordDiff: boolean }` (extended in Tasks 6 and 7)

- [ ] **Step 1: Pin the current rendering**

Append to `src/features/history/components/FileDiffViewer.test.tsx` (it already mocks `getCommitFileDiff` with a one-delete, one-add hunk; reuse its `renderView`):

```tsx
it("renders the hunk header, line numbers, signs and contents", async () => {
  renderView();

  expect(await screen.findByText("@@ -1,2 +1,2 @@")).toBeInTheDocument();
  expect(screen.getByText("+")).toBeInTheDocument();
  expect(screen.getByText("-")).toBeInTheDocument();
  expect(screen.getAllByText("1")).toHaveLength(2);
});
```

Run: `pnpm vitest run src/features/history/components/FileDiffViewer.test.tsx src/components/compare/CompareDiffViewer.test.tsx`
Expected: PASS (on the current code).

- [ ] **Step 2: Create `UnifiedDiffRow.tsx`**

```tsx
import React from "react";
import clsx from "clsx";
import { type DiffLine } from "../../ipc/bindings.generated";
import { type WordDiffToken } from "../../utils/wordDiff";
import { DiffLineContent } from "./DiffLineContent";

export interface UnifiedDiffRowProps {
  line: DiffLine;
  tokens: WordDiffToken[] | undefined;
  showWordDiff: boolean;
}

/** One read-only unified diff line: old/new line numbers, sign and content. */
export const UnifiedDiffRow: React.FC<UnifiedDiffRowProps> = ({ line, tokens, showWordDiff }) => {
  const isAdd = line.line_type === "add";
  const isDel = line.line_type === "delete";

  return (
    <div
      className={clsx(
        "flex leading-5 whitespace-pre font-mono hover:brightness-95 dark:hover:brightness-110 transition-colors",
        isAdd
          ? "bg-diff-add-bg text-diff-add-text"
          : isDel
            ? "bg-diff-remove-bg text-diff-remove-text"
            : "bg-transparent text-primary"
      )}
    >
      {/* Line numbers gutter */}
      <div className="flex shrink-0 select-none border-r border-border-subtle/50 text-tertiary bg-window/40">
        <span className="w-10 text-right pr-2 py-0.5 opacity-70">{line.old_lineno ?? ""}</span>
        <span className="w-10 text-right pr-2 py-0.5 opacity-70">{line.new_lineno ?? ""}</span>
      </div>

      {/* Sign (+ / - / space) */}
      <span
        className={clsx(
          "w-6 select-none text-center py-0.5 shrink-0 font-bold",
          isAdd ? "text-diff-add-text" : isDel ? "text-diff-remove-text" : "text-tertiary"
        )}
      >
        {isAdd ? "+" : isDel ? "-" : " "}
      </span>

      {/* Code line content */}
      <span className="flex-1 min-w-0 py-0.5 pr-3 overflow-x-visible">
        <DiffLineContent
          content={line.content}
          lineType={line.line_type}
          tokens={tokens}
          showWordDiff={showWordDiff}
        />
      </span>
    </div>
  );
};
```

- [ ] **Step 3: Create `ReadOnlyDiffHunk.tsx`**

```tsx
import React, { useMemo } from "react";
import { type DiffHunk } from "../../ipc/bindings.generated";
import { pairHunkLines } from "../../utils/wordDiff";
import { diffLineKey } from "../../shared/utils/listKeys";
import { UnifiedDiffRow } from "./UnifiedDiffRow";

export interface ReadOnlyDiffHunkProps {
  hunk: DiffHunk;
  showWordDiff: boolean;
}

/** A read-only diff hunk (history and compare viewers): header plus its lines. */
export const ReadOnlyDiffHunk: React.FC<ReadOnlyDiffHunkProps> = ({ hunk, showWordDiff }) => {
  const tokenMap = useMemo(() => pairHunkLines(hunk.lines), [hunk.lines]);

  return (
    <div className="border-b last:border-b-0 border-border-subtle">
      {/* Hunk Header */}
      <div className="bg-window px-3 py-1 text-[11px] font-semibold text-secondary border-b border-border-subtle flex items-center gap-2 select-none">
        <span className="text-accent font-mono">{hunk.header}</span>
      </div>

      {/* Hunk Lines */}
      <div className="divide-y divide-border-subtle/30">
        {hunk.lines.map((line, lIdx) => (
          <UnifiedDiffRow
            key={diffLineKey(line)}
            line={line}
            tokens={tokenMap.get(lIdx)}
            showWordDiff={showWordDiff}
          />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Swap both viewers to it**

In `FileDiffViewer.tsx` delete `FileDiffHunkProps` and `FileDiffHunk`, remove the now-unused imports (`clsx`, `pairHunkLines`, `DiffHunk`, `DiffLineContent`, `diffLineKey`), import `ReadOnlyDiffHunk` from `"../../../components/diff/ReadOnlyDiffHunk"`, and render:

```tsx
      {diff.hunks.map((hunk) => (
        <ReadOnlyDiffHunk key={hunkKey(hunk)} hunk={hunk} showWordDiff={showWordDiff} />
      ))}
```

Do the same in `CompareDiffViewer.tsx` (import from `"../diff/ReadOnlyDiffHunk"`; keep the `DiffHunk` import only if still used, otherwise remove it).

- [ ] **Step 5: Add a direct component test**

Create `src/components/diff/ReadOnlyDiffHunk.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReadOnlyDiffHunk } from "./ReadOnlyDiffHunk";
import type { DiffHunk } from "../../ipc/bindings.generated";

const sampleHunk: DiffHunk = {
  header: "@@ -1,3 +1,3 @@",
  old_start: 1,
  old_lines: 3,
  new_start: 1,
  new_lines: 3,
  lines: [
    { line_type: "context", content: "keep\n", old_lineno: 1, new_lineno: 1 },
    { line_type: "delete", content: "old\n", old_lineno: 2, new_lineno: null },
    { line_type: "add", content: "new\n", old_lineno: null, new_lineno: 2 },
  ],
};

describe("ReadOnlyDiffHunk", () => {
  it("renders the header and every line in unified order", () => {
    render(<ReadOnlyDiffHunk hunk={sampleHunk} showWordDiff={false} />);
    expect(screen.getByText("@@ -1,3 +1,3 @@")).toBeInTheDocument();
    const contents = screen.getAllByText(/^(keep|old|new)$/).map((el) => el.textContent);
    expect(contents).toEqual(["keep", "old", "new"]);
  });
});
```

(If `getAllByText` misses the trailing newline, match with `{ exact: false }` via `/keep|old|new/`.)

- [ ] **Step 6: Run tests and checks**

Run: `pnpm vitest run src/components/diff src/features/history/components/FileDiffViewer.test.tsx src/components/compare/CompareDiffViewer.test.tsx && pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "♻️ extract shared read-only diff hunk

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Font size, tab size and line numbers in every diff viewer

**Files:**
- Create: `src/components/diff/useDiffDisplaySettings.ts`, `src/components/diff/useDiffDisplaySettings.test.ts`
- Modify: `src/components/diff/UnifiedDiffRow.tsx`, `ReadOnlyDiffHunk.tsx`, `ReadOnlyDiffHunk.test.tsx`
- Modify: `src/features/history/components/FileDiffViewer.tsx`
- Modify: `src/components/compare/CompareDiffViewer.tsx`
- Modify: `src/components/changes/InteractiveDiffViewer.tsx`, `src/components/changes/DiffLineGutter.tsx`
- Modify: `src/features/pullrequests/components/PullRequestPatchDiffViewer.tsx`
- Test: `src/features/history/components/FileDiffViewer.test.tsx`

**Interfaces:**
- Produces: `useDiffDisplaySettings(): { style: React.CSSProperties; showLineNumbers: boolean; viewMode: DiffViewMode }`
- Produces: `UnifiedDiffRowProps.showLineNumbers: boolean`, `ReadOnlyDiffHunkProps.showLineNumbers: boolean`
- Line number gutters carry `data-testid="diff-line-numbers"`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/diff/useDiffDisplaySettings.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDiffDisplaySettings } from "./useDiffDisplaySettings";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("useDiffDisplaySettings", () => {
  it("maps the diff settings to a container style and flags", () => {
    useSettingsStore.setState({
      diffFontSize: 16,
      diffTabSize: 8,
      diffShowLineNumbers: false,
      diffViewMode: "split",
    });
    const { result } = renderHook(() => useDiffDisplaySettings());
    expect(result.current.style).toEqual({ fontSize: "16px", tabSize: 8 });
    expect(result.current.showLineNumbers).toBe(false);
    expect(result.current.viewMode).toBe("split");
  });
});
```

Append to `FileDiffViewer.test.tsx`:

```tsx
it("applies the diff font size and hides line numbers when turned off", async () => {
  useSettingsStore.setState({ diffFontSize: 16, diffShowLineNumbers: false });
  const { container } = renderView();

  await screen.findByText("@@ -1,2 +1,2 @@");
  expect(container.querySelector('[style*="font-size: 16px"]')).not.toBeNull();
  expect(screen.queryByTestId("diff-line-numbers")).not.toBeInTheDocument();
  useSettingsStore.setState({ diffFontSize: 13, diffShowLineNumbers: true });
});
```

Run: `pnpm vitest run src/components/diff src/features/history/components/FileDiffViewer.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Implement the hook**

Create `src/components/diff/useDiffDisplaySettings.ts`:

```ts
import type { CSSProperties } from "react";
import { useSettingsStore, type DiffViewMode } from "../../store/useSettingsStore";

export interface DiffDisplaySettings {
  /** Font size and tab width from Settings › Diff viewer, for the viewer's scroll container. */
  style: CSSProperties;
  showLineNumbers: boolean;
  viewMode: DiffViewMode;
}

/** Diff viewer display settings shared by every diff viewer. */
export function useDiffDisplaySettings(): DiffDisplaySettings {
  const fontSize = useSettingsStore((s) => s.diffFontSize);
  const tabSize = useSettingsStore((s) => s.diffTabSize);
  const showLineNumbers = useSettingsStore((s) => s.diffShowLineNumbers);
  const viewMode = useSettingsStore((s) => s.diffViewMode);
  return { style: { fontSize: `${fontSize}px`, tabSize }, showLineNumbers, viewMode };
}
```

- [ ] **Step 3: Line numbers in the read-only rows**

`UnifiedDiffRow.tsx`: add `showLineNumbers: boolean;` to the props, destructure it, and wrap the gutter:

```tsx
      {showLineNumbers && (
        <div
          data-testid="diff-line-numbers"
          className="flex shrink-0 select-none border-r border-border-subtle/50 text-tertiary bg-window/40"
        >
          <span className="w-10 text-right pr-2 py-0.5 opacity-70">{line.old_lineno ?? ""}</span>
          <span className="w-10 text-right pr-2 py-0.5 opacity-70">{line.new_lineno ?? ""}</span>
        </div>
      )}
```

`ReadOnlyDiffHunk.tsx`: add `showLineNumbers: boolean;` to the props, destructure it, and pass `showLineNumbers={showLineNumbers}` to `UnifiedDiffRow`. In `ReadOnlyDiffHunk.test.tsx` pass `showLineNumbers` to the existing render and add:

```tsx
  it("hides line numbers when turned off", () => {
    render(<ReadOnlyDiffHunk hunk={sampleHunk} showWordDiff={false} showLineNumbers={false} />);
    expect(screen.queryByTestId("diff-line-numbers")).not.toBeInTheDocument();
  });
```

- [ ] **Step 4: Apply in the history and compare viewers**

`FileDiffViewer.tsx`: import `useDiffDisplaySettings` from `"../../../components/diff/useDiffDisplaySettings"`, add `const { style, showLineNumbers } = useDiffDisplaySettings();` with the other hooks (before the `isLoading` early return), add `style={style}` to the outer `<div className="flex flex-col font-mono text-xs overflow-x-auto ...">` of the hunks branch, and pass `showLineNumbers={showLineNumbers}` to `ReadOnlyDiffHunk`.

`CompareDiffViewer.tsx`: same, importing from `"../diff/useDiffDisplaySettings"`, putting `style={style}` on `<div className="flex-1 overflow-y-auto">`.

- [ ] **Step 5: Apply in the staging viewer**

`InteractiveDiffViewer.tsx`: import `useDiffDisplaySettings` from `"../diff/useDiffDisplaySettings"`, add `const { style } = useDiffDisplaySettings();` next to the other hooks, and add `style={style}` to `<div className="flex flex-col font-mono text-xs overflow-x-auto">`.

`DiffLineGutter.tsx`: turn the arrow into a block body so it can read the setting:

```tsx
import { useSettingsStore } from "../../store/useSettingsStore";
...
/** Sticky line-number gutter (old/new numbers, when enabled, plus the +/-/space origin sign). */
export const DiffLineGutter: React.FC<DiffLineGutterProps> = ({
  oldLineno,
  newLineno,
  isAdd,
  isDel,
  isModifiedLine,
}) => {
  const showLineNumbers = useSettingsStore((s) => s.diffShowLineNumbers);

  return (
    <div
      className={clsx(
        "flex items-center sticky left-0 z-2 shrink-0",
        isAdd ? "bg-diff-add-bg" : isDel ? "bg-diff-remove-bg" : "bg-surface"
      )}
    >
      {showLineNumbers && (
        <span data-testid="diff-line-numbers" className="flex">
          <span className="w-11 text-tertiary select-none text-right pr-2 shrink-0">
            {oldLineno ?? ""}
          </span>
          <span className="w-11 text-tertiary select-none text-right pr-2 shrink-0">
            {newLineno ?? ""}
          </span>
        </span>
      )}

      {/* Origin Sign (+, -, ' ') */}
      <span
        className={clsx(
          "w-5 select-none text-center shrink-0",
          isModifiedLine ? "font-bold" : "font-normal"
        )}
      >
        {isAdd ? "+" : isDel ? "-" : " "}
      </span>
    </div>
  );
};
```

Add `src/components/changes/DiffLineGutter.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiffLineGutter } from "./DiffLineGutter";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("DiffLineGutter", () => {
  it("shows or hides line numbers per setting", () => {
    useSettingsStore.setState({ diffShowLineNumbers: true });
    const props = { oldLineno: 3, newLineno: 4, isAdd: false, isDel: false, isModifiedLine: false };
    const { rerender } = render(<DiffLineGutter {...props} />);
    expect(screen.getByText("3")).toBeInTheDocument();

    useSettingsStore.setState({ diffShowLineNumbers: false });
    rerender(<DiffLineGutter {...props} />);
    expect(screen.queryByText("3")).not.toBeInTheDocument();
    useSettingsStore.setState({ diffShowLineNumbers: true });
  });
});
```

- [ ] **Step 6: Apply in the PR patch viewer**

`PullRequestPatchDiffViewer.tsx`: import `useDiffDisplaySettings` from `"../../../components/diff/useDiffDisplaySettings"`; call `const { style, showLineNumbers } = useDiffDisplaySettings();` right after `useTranslation()` (before the early return); add `style={style}` to the outer `<div className="overflow-x-auto font-mono text-xs leading-5 ...">`; wrap the two line number spans:

```tsx
              {showLineNumbers && (
                <>
                  <span className="w-10 text-right select-none text-tertiary px-1 shrink-0">
                    {line.oldLine ?? ""}
                  </span>
                  <span className="w-10 text-right select-none text-tertiary px-1 shrink-0">
                    {line.newLine ?? ""}
                  </span>
                </>
              )}
```

If the `lines.map` callback now exceeds the complexity limit, extract the non-hunk row into a `PatchLineRow` component in the same file.

- [ ] **Step 7: Run tests and checks**

Run: `pnpm vitest run src/components src/features/history src/features/pullrequests && pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "✨ apply diff font, tab size and line number settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Split view for the history and compare viewers

**Files:**
- Create: `src/components/diff/splitRows.ts`, `src/components/diff/splitRows.test.ts`
- Create: `src/components/diff/SplitDiffRow.tsx`
- Modify: `src/components/diff/ReadOnlyDiffHunk.tsx`, `ReadOnlyDiffHunk.test.tsx`
- Modify: `FileDiffViewer.tsx`, `CompareDiffViewer.tsx`
- Modify: `src/i18n/vi.ts:122-123`, `src/i18n/en.ts:124-125`

**Interfaces:**
- Consumes: `useDiffDisplaySettings().viewMode` (Task 6).
- Produces: `SplitSide { line: DiffLine; index: number }`, `SplitRow { left: SplitSide | null; right: SplitSide | null }`, `pairSplitRows(lines: DiffLine[]): SplitRow[]`
- Produces: `ReadOnlyDiffHunkProps.viewMode: DiffViewMode`
- Split rows carry `data-testid="split-diff-row"`.

- [ ] **Step 1: Write the failing pairing tests**

Create `src/components/diff/splitRows.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pairSplitRows } from "./splitRows";
import type { DiffLine } from "../../ipc/bindings.generated";

const ctx = (n: number): DiffLine => ({ line_type: "context", content: `c${n}`, old_lineno: n, new_lineno: n });
const del = (n: number): DiffLine => ({ line_type: "delete", content: `d${n}`, old_lineno: n, new_lineno: null });
const add = (n: number): DiffLine => ({ line_type: "add", content: `a${n}`, old_lineno: null, new_lineno: n });

function shape(lines: DiffLine[]) {
  return pairSplitRows(lines).map((row) => [row.left?.line.content ?? null, row.right?.line.content ?? null]);
}

describe("pairSplitRows", () => {
  it("puts context lines on both sides", () => {
    expect(shape([ctx(1), ctx(2)])).toEqual([["c1", "c1"], ["c2", "c2"]]);
  });

  it("pads the right side when deletes outnumber adds", () => {
    expect(shape([del(1), del(2), add(1)])).toEqual([["d1", "a1"], ["d2", null]]);
  });

  it("pads the left side when adds outnumber deletes", () => {
    expect(shape([del(1), add(1), add(2)])).toEqual([["d1", "a1"], [null, "a2"]]);
  });

  it("keeps lone adds and alternating runs separate", () => {
    expect(shape([add(1), ctx(2), del(3), add(3), ctx(4)])).toEqual([
      [null, "a1"],
      ["c2", "c2"],
      ["d3", "a3"],
      ["c4", "c4"],
    ]);
  });

  it("keeps each line's index in the hunk", () => {
    const rows = pairSplitRows([ctx(1), del(2), add(2)]);
    expect(rows[1]?.left?.index).toBe(1);
    expect(rows[1]?.right?.index).toBe(2);
  });
});
```

Run: `pnpm vitest run src/components/diff/splitRows.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 2: Implement `splitRows.ts`**

```ts
import { type DiffLine } from "../../ipc/bindings.generated";

/** One side of a split row; `index` is the line's position in the hunk (for word-diff tokens). */
export interface SplitSide {
  line: DiffLine;
  index: number;
}

export interface SplitRow {
  left: SplitSide | null;
  right: SplitSide | null;
}

/** Collects consecutive lines of `lineType` starting at `start`. */
function takeRun(lines: DiffLine[], start: number, lineType: string): SplitSide[] {
  const run: SplitSide[] = [];
  for (let i = start; i < lines.length && lines[i]!.line_type === lineType; i++) {
    run.push({ line: lines[i]!, index: i });
  }
  return run;
}

/**
 * Lays a hunk out as side-by-side rows. Context lines appear on both sides; a
 * run of deletes followed by a run of adds is paired in order, and the shorter
 * side gets empty cells.
 */
export function pairSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.line_type !== "delete" && line.line_type !== "add") {
      rows.push({ left: { line, index: i }, right: { line, index: i } });
      i++;
      continue;
    }
    const deletes = takeRun(lines, i, "delete");
    const adds = takeRun(lines, i + deletes.length, "add");
    const count = Math.max(deletes.length, adds.length);
    for (let k = 0; k < count; k++) {
      rows.push({ left: deletes[k] ?? null, right: adds[k] ?? null });
    }
    i += deletes.length + adds.length;
  }
  return rows;
}
```

Run: `pnpm vitest run src/components/diff/splitRows.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the failing split render test**

Append to `ReadOnlyDiffHunk.test.tsx` (pass `viewMode="unified"` to the earlier renders):

```tsx
  it("renders paired rows in split mode", () => {
    render(
      <ReadOnlyDiffHunk hunk={sampleHunk} showWordDiff={false} showLineNumbers viewMode="split" />
    );
    const rows = screen.getAllByTestId("split-diff-row");
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveTextContent("old");
    expect(rows[1]).toHaveTextContent("new");
  });
```

Run: `pnpm vitest run src/components/diff/ReadOnlyDiffHunk.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implement `SplitDiffRow.tsx`**

```tsx
import React from "react";
import clsx from "clsx";
import { type WordDiffToken } from "../../utils/wordDiff";
import { DiffLineContent } from "./DiffLineContent";
import { type SplitRow, type SplitSide } from "./splitRows";

interface SplitDiffCellProps {
  side: SplitSide | null;
  isOld: boolean;
  tokenMap: Map<number, WordDiffToken[]>;
  showWordDiff: boolean;
  showLineNumbers: boolean;
}

/** One half of a split row; an empty half fills the gap left by an unpaired line. */
const SplitDiffCell: React.FC<SplitDiffCellProps> = ({
  side,
  isOld,
  tokenMap,
  showWordDiff,
  showLineNumbers,
}) => {
  if (!side) return <div className="flex-1 min-w-0 bg-window/40" />;
  const { line, index } = side;
  const isAdd = line.line_type === "add";
  const isDel = line.line_type === "delete";

  return (
    <div
      className={clsx(
        "flex flex-1 min-w-0 overflow-x-auto",
        isAdd
          ? "bg-diff-add-bg text-diff-add-text"
          : isDel
            ? "bg-diff-remove-bg text-diff-remove-text"
            : "text-primary"
      )}
    >
      {showLineNumbers && (
        <span
          data-testid="diff-line-numbers"
          className="w-10 shrink-0 select-none text-right pr-2 py-0.5 opacity-70 text-tertiary bg-window/40 border-r border-border-subtle/50"
        >
          {(isOld ? line.old_lineno : line.new_lineno) ?? ""}
        </span>
      )}
      <span className="w-6 shrink-0 select-none text-center py-0.5 font-bold">
        {isAdd ? "+" : isDel ? "-" : " "}
      </span>
      <span className="flex-1 py-0.5 pr-3 whitespace-pre">
        <DiffLineContent
          content={line.content}
          lineType={line.line_type}
          tokens={tokenMap.get(index)}
          showWordDiff={showWordDiff}
        />
      </span>
    </div>
  );
};

export interface SplitDiffRowProps {
  row: SplitRow;
  tokenMap: Map<number, WordDiffToken[]>;
  showWordDiff: boolean;
  showLineNumbers: boolean;
}

/** A side-by-side diff row: old file on the left, new file on the right. */
export const SplitDiffRow: React.FC<SplitDiffRowProps> = ({
  row,
  tokenMap,
  showWordDiff,
  showLineNumbers,
}) => (
  <div data-testid="split-diff-row" className="flex leading-5 font-mono">
    <SplitDiffCell
      side={row.left}
      isOld
      tokenMap={tokenMap}
      showWordDiff={showWordDiff}
      showLineNumbers={showLineNumbers}
    />
    <div className="w-px shrink-0 bg-border-subtle" />
    <SplitDiffCell
      side={row.right}
      isOld={false}
      tokenMap={tokenMap}
      showWordDiff={showWordDiff}
      showLineNumbers={showLineNumbers}
    />
  </div>
);
```

- [ ] **Step 5: Switch modes in `ReadOnlyDiffHunk`**

Replace `ReadOnlyDiffHunk.tsx` with:

```tsx
import React, { useMemo } from "react";
import { type DiffHunk } from "../../ipc/bindings.generated";
import { type DiffViewMode } from "../../store/useSettingsStore";
import { pairHunkLines } from "../../utils/wordDiff";
import { diffLineKey } from "../../shared/utils/listKeys";
import { UnifiedDiffRow } from "./UnifiedDiffRow";
import { SplitDiffRow } from "./SplitDiffRow";
import { pairSplitRows, type SplitRow } from "./splitRows";

export interface ReadOnlyDiffHunkProps {
  hunk: DiffHunk;
  showWordDiff: boolean;
  showLineNumbers: boolean;
  viewMode: DiffViewMode;
}

function splitRowKey(row: SplitRow): string {
  const left = row.left ? diffLineKey(row.left.line) : "-";
  const right = row.right ? diffLineKey(row.right.line) : "-";
  return `${left}|${right}`;
}

/** A read-only diff hunk (history and compare viewers): header plus unified or split lines. */
export const ReadOnlyDiffHunk: React.FC<ReadOnlyDiffHunkProps> = ({
  hunk,
  showWordDiff,
  showLineNumbers,
  viewMode,
}) => {
  const tokenMap = useMemo(() => pairHunkLines(hunk.lines), [hunk.lines]);
  const splitRows = useMemo(
    () => (viewMode === "split" ? pairSplitRows(hunk.lines) : []),
    [hunk.lines, viewMode]
  );

  return (
    <div className="border-b last:border-b-0 border-border-subtle">
      {/* Hunk Header */}
      <div className="bg-window px-3 py-1 text-[11px] font-semibold text-secondary border-b border-border-subtle flex items-center gap-2 select-none">
        <span className="text-accent font-mono">{hunk.header}</span>
      </div>

      {/* Hunk Lines */}
      <div className="divide-y divide-border-subtle/30">
        {viewMode === "split"
          ? splitRows.map((row) => (
              <SplitDiffRow
                key={splitRowKey(row)}
                row={row}
                tokenMap={tokenMap}
                showWordDiff={showWordDiff}
                showLineNumbers={showLineNumbers}
              />
            ))
          : hunk.lines.map((line, lIdx) => (
              <UnifiedDiffRow
                key={diffLineKey(line)}
                line={line}
                tokens={tokenMap.get(lIdx)}
                showWordDiff={showWordDiff}
                showLineNumbers={showLineNumbers}
              />
            ))}
      </div>
    </div>
  );
};
```

In `FileDiffViewer.tsx` and `CompareDiffViewer.tsx`, destructure `viewMode` from `useDiffDisplaySettings()` too and pass `viewMode={viewMode}` to `ReadOnlyDiffHunk`.

- [ ] **Step 6: Note the staging limitation in settings**

`src/i18n/vi.ts`:

```ts
      viewModeUnifiedDesc: "Hiển thị các dòng thêm và xóa trên cùng một luồng văn bản liền mạch. Trình xem staging luôn dùng kiểu gộp dòng.",
      viewModeSplitDesc: "Hiển thị tệp gốc bên trái và tệp đã sửa bên phải trực quan. Trình xem staging luôn dùng kiểu gộp dòng.",
```

`src/i18n/en.ts`:

```ts
      viewModeUnifiedDesc: "Display additions and deletions in an inline stream. The staging view always uses unified.",
      viewModeSplitDesc: "Display original file on left and modified file on right. The staging view always uses unified.",
```

- [ ] **Step 7: Run tests and checks**

Run: `pnpm vitest run src/components src/features/history src/test/SettingsTabs.test.tsx && pnpm typecheck && pnpm lint`
Expected: PASS (fix any settings test that asserted the old description text exactly).

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "✨ add split diff view to history and compare viewers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Auto-fetch

**Files:**
- Modify: `src/store/useSettingsStore.ts`
- Modify: `src/features/settings/hooks/useGitBehaviorSettings.ts`, `useGitBehaviorSettings.actions.ts`
- Delete: `src/features/settings/hooks/useGitBehaviorSettings.constants.ts`
- Create: `src/features/remote/api/useAutoFetch.ts`, `src/features/remote/api/useAutoFetch.test.tsx`
- Modify: `src/features/remote/api/index.ts`, `src/components/header/RepoHeader.tsx`
- Test: `src/features/settings/hooks/useGitBehaviorSettings.test.tsx` (unchanged; it pins persistence)

**Interfaces:**
- Produces: `useSettingsStore` fields `autoFetchInterval: number` (seconds, `0` = off, default `300`) and `setAutoFetchInterval: (seconds: number) => void`, persisted under `gitvista_autofetch_interval`.
- Produces: `useAutoFetch(repoPath: string | undefined, isRemoteBusy: boolean): void`

- [ ] **Step 1: Move the interval into the store**

In `useSettingsStore.ts` add to `SettingsState` (after `commitMessageLimit`):

```ts
  // Background fetch interval in seconds; 0 turns auto-fetch off.
  autoFetchInterval: number;
```

and to the actions: `setAutoFetchInterval: (seconds: number) => void;`. In `loadInitialSettingsState` add:

```ts
  const savedAutoFetchInterval = parseInt(getStorage("gitvista_autofetch_interval", "300"), 10);
```

and `autoFetchInterval: savedAutoFetchInterval,` to the returned object. In the store body add:

```ts
    setAutoFetchInterval: makePersistedSetter(
      set,
      "gitvista_autofetch_interval",
      "autoFetchInterval"
    ),
```

In `useGitBehaviorSettings.ts` remove the `useState` for `autoFetchInterval` and the constants import, add `import { useSettingsStore } from "../../../store/useSettingsStore";`, and read:

```ts
  const autoFetchInterval = useSettingsStore((s) => s.autoFetchInterval);
  const setAutoFetchInterval = useSettingsStore((s) => s.setAutoFetchInterval);
```

(keep passing `setAutoFetchInterval` in `actionsContext`). In `useGitBehaviorSettings.actions.ts` drop the constants import and make the handler:

```ts
export function createAutoFetchChangeHandler(context: GitBehaviorActionsContext) {
  return (seconds: number) => {
    context.setAutoFetchInterval(seconds);
    context.showSuccess(context.t.settings.profile.savedSuccess);
  };
}
```

Delete `useGitBehaviorSettings.constants.ts`.

Run: `pnpm vitest run src/features/settings src/test/useSettingsStore.test.ts`
Expected: PASS, including "persists the selected auto-fetch interval".

- [ ] **Step 2: Write the failing scheduler tests**

Create `src/features/remote/api/useAutoFetch.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAutoFetch } from "./useAutoFetch";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: { fetchRepo: vi.fn() },
}));

let hidden = false;
let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderAutoFetch(repoPath: string | undefined, busy = false) {
  return renderHook(({ path, isBusy }) => useAutoFetch(path, isBusy), {
    wrapper,
    initialProps: { path: repoPath, isBusy: busy },
  });
}

describe("useAutoFetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(invokeCommand.fetchRepo).mockReset().mockResolvedValue("ok");
    queryClient = new QueryClient();
    hidden = false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    useSettingsStore.getState().setAutoFetchInterval(300);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches the repo once per interval and refreshes its queries", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    renderAutoFetch("/repo");

    await act(() => vi.advanceTimersByTimeAsync(299_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1_000));
    expect(invokeCommand.fetchRepo).toHaveBeenCalledWith("/repo", undefined, false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.repo.all("/repo") });
  });

  it("does nothing when the interval is 0 or no repo is open", async () => {
    useSettingsStore.getState().setAutoFetchInterval(0);
    renderAutoFetch("/repo");
    renderAutoFetch(undefined);
    await act(() => vi.advanceTimersByTimeAsync(3_600_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();
  });

  it("skips ticks while the window is hidden or a manual task runs", async () => {
    hidden = true;
    const { rerender } = renderAutoFetch("/repo");
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();

    hidden = false;
    rerender({ path: "/repo", isBusy: true });
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();
  });

  it("skips a tick while the previous auto-fetch is still running", async () => {
    vi.mocked(invokeCommand.fetchRepo).mockReturnValue(new Promise(() => {}));
    renderAutoFetch("/repo");
    await act(() => vi.advanceTimersByTimeAsync(600_000));
    expect(invokeCommand.fetchRepo).toHaveBeenCalledTimes(1);
  });

  it("swallows fetch errors", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(invokeCommand.fetchRepo).mockRejectedValue(new Error("offline"));
    renderAutoFetch("/repo");
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("reschedules when the interval changes", async () => {
    renderAutoFetch("/repo");
    act(() => useSettingsStore.getState().setAutoFetchInterval(900));
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(invokeCommand.fetchRepo).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(600_000));
    expect(invokeCommand.fetchRepo).toHaveBeenCalledTimes(1);
  });
});
```

Run: `pnpm vitest run src/features/remote/api/useAutoFetch.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `useAutoFetch`**

Create `src/features/remote/api/useAutoFetch.ts`:

```ts
import { useEffect, useRef, type MutableRefObject } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";
import { useSettingsStore } from "../../../store/useSettingsStore";

/** One background fetch: silent (no progress task id), refreshes the repo's queries on success. */
function runAutoFetch(
  repoPath: string,
  queryClient: QueryClient,
  inFlight: MutableRefObject<boolean>
) {
  inFlight.current = true;
  invokeCommand
    .fetchRepo(repoPath, undefined, false)
    .then(() => queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) }))
    .catch((error: unknown) => console.warn("Auto-fetch failed", error))
    .finally(() => {
      inFlight.current = false;
    });
}

/**
 * Fetches the active repository in the background every
 * `autoFetchInterval` seconds from Settings › Git behavior (0 turns it off).
 * A tick is skipped while the window is hidden, while a manual
 * fetch/pull/push runs, or while the previous auto-fetch is unfinished.
 */
export function useAutoFetch(repoPath: string | undefined, isRemoteBusy: boolean): void {
  const queryClient = useQueryClient();
  const intervalSec = useSettingsStore((s) => s.autoFetchInterval);
  const busy = useRef(isRemoteBusy);
  const inFlight = useRef(false);

  useEffect(() => {
    busy.current = isRemoteBusy;
  }, [isRemoteBusy]);

  useEffect(() => {
    if (!repoPath || intervalSec <= 0) return;
    const timer = setInterval(() => {
      if (document.hidden || busy.current || inFlight.current) return;
      runAutoFetch(repoPath, queryClient, inFlight);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [repoPath, intervalSec, queryClient]);
}
```

Add `export { useAutoFetch } from "./useAutoFetch";` to `src/features/remote/api/index.ts`.

In `RepoHeader.tsx` change the import to `import { useAutoFetch, useRemoteTask } from "../../features/remote/api";` and add after the `const remote = useRemoteTask(...)` line:

```tsx
  useAutoFetch(currentRepo?.path, remote.isPending);
```

- [ ] **Step 4: Run tests and checks**

Run: `pnpm vitest run src/features/remote src/features/settings src/components/header && pnpm typecheck && pnpm lint && pnpm check-query-keys`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "✨ run background auto-fetch for the active repository

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: `open_in_terminal` Rust command

**Files:**
- Create: `src-tauri/src/commands/terminal.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs:93`
- Regenerate: `src/ipc/bindings.generated.ts`

**Interfaces:**
- Produces: Tauri command `open_in_terminal(repo_path: String, terminal: String) -> Result<(), AppError>`, generated as `commands.openInTerminal(repoPath: string, terminal: string)`.
- `terminal` is one of `"wt" | "powershell" | "cmd" | "bash"` (the `ExternalTerminal` type).

- [ ] **Step 1: Write the module with failing tests first**

Create `src-tauri/src/commands/terminal.rs` with the tests and stub signatures:

```rust
use super::editor::to_editor_path;
use crate::error::AppError;
use std::ffi::OsStr;
use std::path::{Path, PathBuf};
use std::process::Command;

/// How to spawn the terminal chosen in settings.
#[derive(Debug, PartialEq, Eq)]
pub struct TerminalLaunch {
    pub program: PathBuf,
    pub args: Vec<String>,
    pub current_dir: Option<String>,
    /// Console programs need a window of their own; GUI launchers (wt, git-bash) do not.
    pub new_console: bool,
}

/// Maps the terminal chosen in settings to the program, arguments and working
/// directory to spawn. Windows only; the path is passed as an argument, never
/// through a shell.
pub fn resolve_terminal_launch(
    terminal: &str,
    path: &str,
    is_windows: bool,
    git_bash: Option<&Path>,
) -> Result<TerminalLaunch, AppError> {
    todo!()
}

/// Finds Git for Windows' `git-bash.exe` from the first `git.exe` on `PATH`,
/// which lives in `<root>\cmd`, `<root>\bin` or `<root>\mingw64\bin`.
pub fn find_git_bash(path_var: &OsStr, is_file: impl Fn(&Path) -> bool) -> Option<PathBuf> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;
    use std::ffi::OsString;

    fn path_var(dirs: &[&str]) -> OsString {
        std::env::join_paths(dirs.iter().map(PathBuf::from)).unwrap()
    }

    #[test]
    fn launches_windows_terminal_in_the_repo() {
        let launch = resolve_terminal_launch("wt", r"D:\repo", true, None).unwrap();
        assert_eq!(launch.program, PathBuf::from("wt.exe"));
        assert_eq!(launch.args, vec!["-d".to_string(), r"D:\repo".to_string()]);
        assert!(!launch.new_console);
    }

    #[test]
    fn launches_console_shells_with_the_repo_as_working_dir() {
        let ps = resolve_terminal_launch("powershell", r"D:\repo", true, None).unwrap();
        assert_eq!(ps.program, PathBuf::from("powershell.exe"));
        assert_eq!(ps.args, vec!["-NoExit".to_string()]);
        assert_eq!(ps.current_dir.as_deref(), Some(r"D:\repo"));
        assert!(ps.new_console);

        let cmd = resolve_terminal_launch("cmd", r"D:\repo", true, None).unwrap();
        assert_eq!(cmd.program, PathBuf::from("cmd.exe"));
        assert_eq!(cmd.args, vec!["/K".to_string()]);
        assert_eq!(cmd.current_dir.as_deref(), Some(r"D:\repo"));
    }

    #[test]
    fn launches_git_bash_when_found() {
        let bash = Path::new("C:/Git/git-bash.exe");
        let launch = resolve_terminal_launch("bash", r"D:\repo", true, Some(bash)).unwrap();
        assert_eq!(launch.program, bash.to_path_buf());
        assert_eq!(launch.args, vec![r"--cd=D:\repo".to_string()]);
    }

    #[test]
    fn reports_missing_git_bash() {
        assert!(matches!(
            resolve_terminal_launch("bash", r"D:\repo", true, None),
            Err(AppError::NotFound(_))
        ));
    }

    #[test]
    fn rejects_unknown_terminals_and_other_platforms() {
        assert!(matches!(
            resolve_terminal_launch("xterm", r"D:\repo", true, None),
            Err(AppError::InvalidOperation(_))
        ));
        assert!(matches!(
            resolve_terminal_launch("cmd", "/repo", false, None),
            Err(AppError::InvalidOperation(_))
        ));
    }

    #[test]
    fn finds_git_bash_from_cmd_or_mingw_dirs() {
        let files: HashSet<PathBuf> = [
            "C:/Git/cmd/git.exe",
            "C:/Git/git-bash.exe",
            "E:/PortableGit/mingw64/bin/git.exe",
            "E:/PortableGit/git-bash.exe",
        ]
        .iter()
        .map(PathBuf::from)
        .collect();
        let is_file = |p: &Path| files.contains(p);

        assert_eq!(
            find_git_bash(&path_var(&["C:/Windows", "C:/Git/cmd"]), is_file),
            Some(PathBuf::from("C:/Git/git-bash.exe"))
        );
        assert_eq!(
            find_git_bash(&path_var(&["E:/PortableGit/mingw64/bin"]), is_file),
            Some(PathBuf::from("E:/PortableGit/git-bash.exe"))
        );
        assert_eq!(find_git_bash(&path_var(&["C:/Windows"]), is_file), None);
    }
}
```

Add `pub mod terminal;` and `pub use terminal::*;` to `src-tauri/src/commands/mod.rs` (alphabetical, after `tag`).

Run: `cargo test --manifest-path src-tauri/Cargo.toml --lib terminal`
Expected: FAIL (panics at `todo!()`).

- [ ] **Step 2: Implement**

Replace the two `todo!()` bodies:

```rust
pub fn resolve_terminal_launch(
    terminal: &str,
    path: &str,
    is_windows: bool,
    git_bash: Option<&Path>,
) -> Result<TerminalLaunch, AppError> {
    if !is_windows {
        return Err(AppError::InvalidOperation(
            "Opening a terminal is only supported on Windows".to_string(),
        ));
    }
    let launch = match terminal {
        "wt" => TerminalLaunch {
            program: PathBuf::from("wt.exe"),
            args: vec!["-d".to_string(), path.to_string()],
            current_dir: None,
            new_console: false,
        },
        "powershell" => TerminalLaunch {
            program: PathBuf::from("powershell.exe"),
            args: vec!["-NoExit".to_string()],
            current_dir: Some(path.to_string()),
            new_console: true,
        },
        "cmd" => TerminalLaunch {
            program: PathBuf::from("cmd.exe"),
            args: vec!["/K".to_string()],
            current_dir: Some(path.to_string()),
            new_console: true,
        },
        "bash" => {
            // Not `bash.exe`: on Windows that is often WSL, not Git Bash.
            let program = git_bash.ok_or_else(|| AppError::NotFound("git-bash.exe".to_string()))?;
            TerminalLaunch {
                program: program.to_path_buf(),
                args: vec![format!("--cd={path}")],
                current_dir: None,
                new_console: false,
            }
        }
        _ => {
            return Err(AppError::InvalidOperation(format!(
                "Unknown terminal: {terminal}"
            )))
        }
    };
    Ok(launch)
}

pub fn find_git_bash(path_var: &OsStr, is_file: impl Fn(&Path) -> bool) -> Option<PathBuf> {
    std::env::split_paths(path_var)
        .filter(|dir| is_file(&dir.join("git.exe")))
        .find_map(|dir| {
            dir.ancestors()
                .skip(1)
                .take(2)
                .map(|root| root.join("git-bash.exe"))
                .find(|candidate| is_file(candidate))
        })
}
```

Then add the spawn helper and command below them:

```rust
fn spawn_terminal(launch: &TerminalLaunch) -> Result<(), AppError> {
    let mut cmd = Command::new(&launch.program);
    cmd.args(&launch.args);
    if let Some(dir) = &launch.current_dir {
        cmd.current_dir(dir);
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NEW_CONSOLE: u32 = 0x0000_0010;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(if launch.new_console {
            CREATE_NEW_CONSOLE
        } else {
            CREATE_NO_WINDOW
        });
    }

    match cmd.spawn() {
        Ok(_) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            Err(AppError::NotFound(launch.program.display().to_string()))
        }
        Err(err) => Err(AppError::Io(err.to_string())),
    }
}

/// Opens the repository folder in the user's terminal of choice.
#[tauri::command]
#[specta::specta]
pub fn open_in_terminal(repo_path: String, terminal: String) -> Result<(), AppError> {
    let git_bash = std::env::var_os("PATH").and_then(|path| find_git_bash(&path, Path::is_file));
    let launch = resolve_terminal_launch(
        &terminal,
        &to_editor_path(&repo_path),
        cfg!(windows),
        git_bash.as_deref(),
    )?;
    spawn_terminal(&launch)
}
```

In `src-tauri/src/lib.rs` change `open_in_editor` in `collect_commands!` to:

```rust
            open_in_editor,
            open_in_terminal
```

- [ ] **Step 3: Run Rust tests, lint and regenerate bindings**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml --lib terminal
cargo fmt --manifest-path src-tauri/Cargo.toml
pnpm rust:lint
cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings
grep -n "openInTerminal" src/ipc/bindings.generated.ts
pnpm format
```

Expected: tests PASS, clippy clean, the grep shows `async openInTerminal(repoPath: string, terminal: string)`.

- [ ] **Step 4: Commit**

```bash
git add -A src-tauri src/ipc/bindings.generated.ts
git commit -m "✨ add open in terminal command

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Terminal button in the repo header

**Files:**
- Modify: `src/ipc/editor.ts`
- Create: `src/features/repo/api/terminalApi.ts`
- Modify: `src/features/repo/index.ts`
- Modify: `src/components/header/RepoHeaderGitActions.actions.ts`, `RepoHeaderGitActions.tsx`
- Modify: `src/i18n/vi.ts` (`header`), `src/i18n/en.ts` (`header`)
- Test: `src/components/header/RepoHeaderGitActions.test.tsx`

**Interfaces:**
- Consumes: `commands.openInTerminal(repoPath, terminal)` (Task 9).
- Produces: `invokeCommand.openInTerminal(repoPath: string, terminal: string): Promise<void>`, `openInTerminal(repoPath: string, terminal: string): Promise<void>` from `features/repo`, `openRepoInTerminal(repoPath: string, t: Translations): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/header/RepoHeaderGitActions.test.tsx`:

```tsx
describe("RepoHeaderGitActions - open in terminal", () => {
  beforeEach(() => {
    useSettingsStore.getState().setDefaultTerminal("powershell");
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the repo in the terminal chosen in settings", async () => {
    const spy = vi.spyOn(invokeCommand, "openInTerminal").mockResolvedValue(undefined);
    renderActions();

    fireEvent.click(screen.getByTestId("btn-open-in-terminal"));

    await waitFor(() => expect(spy).toHaveBeenCalledWith("D:/repos/demo", "powershell"));
  });

  it("shows a toast when the terminal is not installed", async () => {
    vi.spyOn(invokeCommand, "openInTerminal").mockRejectedValue({
      type: "NotFound",
      message: "git-bash.exe",
    });
    renderActions();

    fireEvent.click(screen.getByTestId("btn-open-in-terminal"));

    await waitFor(() => {
      const [toast] = useToastStore.getState().toasts;
      expect(toast?.type).toBe("error");
      expect(JSON.stringify(toast)).toContain(
        viTranslations.header.editorNotFound.replace("{program}", "git-bash.exe")
      );
    });
  });

  it("disables the button when no repo is open", () => {
    renderActions({});
    expect(screen.getByTestId("btn-open-in-terminal")).toBeDisabled();
  });
});
```

Run: `pnpm vitest run src/components/header/RepoHeaderGitActions.test.tsx`
Expected: FAIL (`openInTerminal` does not exist on `invokeCommand`).

- [ ] **Step 2: IPC and feature API**

`src/ipc/editor.ts`: change the header comment to "external editor and terminal" and add to `editorCommands`:

```ts
  openInTerminal: async (repoPath: string, terminal: string): Promise<void> => {
    // There is no terminal to launch in browser dev mode.
    if (!isTauri()) return;
    unwrap(await commands.openInTerminal(repoPath, terminal));
  },
```

Create `src/features/repo/api/terminalApi.ts`:

```ts
/**
 * Thin wrapper over the open-in-terminal IPC command, so header components
 * launch the terminal without importing `ipc/` directly.
 */
import { invokeCommand } from "../../../ipc/client";

/** Opens `repoPath` in `terminal` (one of the terminals offered in Settings › Tools). */
export function openInTerminal(repoPath: string, terminal: string): Promise<void> {
  return invokeCommand.openInTerminal(repoPath, terminal);
}
```

Add `export { openInTerminal } from "./api/terminalApi";` to `src/features/repo/index.ts` next to the `openInEditor` export.

- [ ] **Step 3: Action and button**

i18n `header` section — `vi.ts`: `openInTerminal: "Mở repo trong terminal",`; `en.ts`: `openInTerminal: "Open repository in terminal",` (both right after `openInEditor`).

Replace `RepoHeaderGitActions.actions.ts` with:

```ts
import { openInEditor, openInTerminal } from "../../features/repo";
import { type Translations } from "../../i18n/vi";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import { toErrorMessage } from "../../shared/utils/toError";

function isNotFoundError(err: unknown): err is { type: "NotFound"; message: string } {
  return typeof err === "object" && err !== null && (err as { type?: unknown }).type === "NotFound";
}

/** A missing program gets the "check your PATH" hint; anything else its own message. */
function showLaunchError(err: unknown, t: Translations): void {
  const message = isNotFoundError(err)
    ? t.header.editorNotFound.replace("{program}", err.message)
    : toErrorMessage(err);
  useToastStore.getState().showError(message);
}

/** Opens the repo in the editor chosen in Settings › Tools, reporting failures as a toast. */
export async function openRepoInEditor(repoPath: string, t: Translations): Promise<void> {
  const { defaultEditor, customEditorCommand } = useSettingsStore.getState();
  try {
    await openInEditor(repoPath, defaultEditor, customEditorCommand);
  } catch (err) {
    showLaunchError(err, t);
  }
}

/** Opens the repo in the terminal chosen in Settings › Tools, reporting failures as a toast. */
export async function openRepoInTerminal(repoPath: string, t: Translations): Promise<void> {
  const { defaultTerminal } = useSettingsStore.getState();
  try {
    await openInTerminal(repoPath, defaultTerminal);
  } catch (err) {
    showLaunchError(err, t);
  }
}
```

In `RepoHeaderGitActions.tsx` import `SquareTerminal` from `lucide-react` and `openRepoInTerminal` from the actions file, update the doc comment to mention the terminal, and add after the editor button:

```tsx
        {/* Open the repo in the terminal chosen in settings */}
        <button
          type="button"
          data-testid="btn-open-in-terminal"
          onClick={() => repoPath && void openRepoInTerminal(repoPath, t)}
          disabled={!repoPath}
          className="flex items-center justify-center w-8 h-8 bg-surface border border-border-subtle rounded-md text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs disabled:opacity-50"
          title={t.header.openInTerminal}
          aria-label={t.header.openInTerminal}
        >
          <SquareTerminal size={16} />
        </button>
```

- [ ] **Step 4: Run tests and the full check**

Run: `pnpm vitest run src/components/header && pnpm check`
Expected: PASS end to end (format, lint, query keys, comment language, lint suppressions, bindings, build, all Vitest tests, clippy, Rust tests).

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "✨ add open in terminal button to repo header

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
