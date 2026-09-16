# Settings Modal & Git Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a comprehensive Settings modal dialog in GitVista with Rust backend libgit2 read/write for Git configuration (user.name, user.email, default branch, pull rebase), full appearance controls, and shortcut/palette integrations.

**Architecture:** Extend backend with read/write Git config modules and expose via Tauri Specta commands. Enhance frontend with settings store actions, IPC client functions, dedicated tabbed SettingsModal component, global `Ctrl+,` shortcut, and header gear button.

**Tech Stack:** Rust (libgit2 / git2-rs), Tauri v2, Specta, React 18, Zustand, Tailwind CSS, Vitest.

**Spec:** docs/superpowers/specs/2026-09-16-settings-modal-and-git-config-design.md

## Global Constraints

- No external git CLI execution required for config reads/writes; use native libgit2 (`git2::Config`).
- Browser dev mode fallback must be supported in `src/ipc/client.ts`.
- All user-facing strings must support both Vietnamese and English via `src/i18n/`.
- UI animations must use the design system's motion tokens.
- Gitmoji commit format: `<emoji> <short description>`.

---

### Task 1: Rust Backend - Read & Write Git Config

**Files:**
- Create: `src-tauri/src/read/config.rs`
- Modify: `src-tauri/src/read/mod.rs`
- Create: `src-tauri/src/write/config.rs`
- Modify: `src-tauri/src/write/mod.rs`

**Interfaces:**
- Produces:
  ```rust
  #[derive(Serialize, Deserialize, specta::Type, Clone, Copy, Debug, PartialEq, Eq)]
  #[serde(rename_all = "camelCase")]
  pub enum ConfigScope {
      Global,
      Local,
  }

  #[derive(Serialize, Deserialize, specta::Type, Clone, Debug)]
  #[serde(rename_all = "camelCase")]
  pub struct GitConfigDto {
      pub user_name: Option<String>,
      pub user_name_source: Option<ConfigScope>,
      pub user_email: Option<String>,
      pub user_email_source: Option<ConfigScope>,
      pub default_branch: Option<String>,
      pub pull_rebase: Option<bool>,
  }

  pub fn read_git_config(repo_path: Option<&str>) -> Result<GitConfigDto, AppError>;
  pub fn write_git_config(repo_path: Option<&str>, scope: ConfigScope, key: &str, value: &str) -> Result<(), AppError>;
  ```

- [ ] **Step 1: Write failing Rust unit tests**

In `src-tauri/src/write/config.rs`:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_write_and_read_local_config() {
        let temp = TempDir::new().unwrap();
        let repo = git2::Repository::init(temp.path()).unwrap();
        let repo_path = temp.path().to_str().unwrap();

        write_git_config(Some(repo_path), ConfigScope::Local, "user.name", "Test User").unwrap();
        write_git_config(Some(repo_path), ConfigScope::Local, "user.email", "test@example.com").unwrap();

        let cfg = crate::read::config::read_git_config(Some(repo_path)).unwrap();
        assert_eq!(cfg.user_name.as_deref(), Some("Test User"));
        assert_eq!(cfg.user_name_source, Some(ConfigScope::Local));
        assert_eq!(cfg.user_email.as_deref(), Some("test@example.com"));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_write_and_read_local_config`
Expected: FAIL (module or function not found)

- [ ] **Step 3: Implement read_git_config and write_git_config**

Implement `src-tauri/src/read/config.rs`:
- Use `git2::Config::open_default()` for global/system.
- If `repo_path` is provided, open repo and inspect `repo.config()`. Check if entry is from local config or global config.
- Populate `GitConfigDto`.

Implement `src-tauri/src/write/config.rs`:
- For `ConfigScope::Global`, use `git2::Config::open_default()?.open_level(git2::ConfigLevel::Global)`.
- For `ConfigScope::Local`, require `repo_path`, open repo config, and set entry. If key is `pull.rebase` with "true"/"false", set boolean or string accordingly.

Export modules in `src-tauri/src/read/mod.rs` and `src-tauri/src/write/mod.rs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_write_and_read_local_config`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/read/ src-tauri/src/write/
git commit -m "✨ add git config read and write backend modules"
```

---

### Task 2: Tauri Commands & IPC Registration

**Files:**
- Create: `src-tauri/src/commands/config.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/ipc/bindings.ts`
- Modify: `src/ipc/client.ts`

**Interfaces:**
- Produces:
  - Tauri commands `get_git_config` and `set_git_config`.
  - Frontend bindings `invokeCommand.getGitConfig(repoPath?: string | null)` and `invokeCommand.setGitConfig(...)`.

- [ ] **Step 1: Create Tauri command wrappers**

In `src-tauri/src/commands/config.rs`:
```rust
use crate::error::AppError;
pub use crate::read::config::{ConfigScope, GitConfigDto};

#[tauri::command]
#[specta::specta]
pub fn get_git_config(repo_path: Option<String>) -> Result<GitConfigDto, AppError> {
    crate::read::config::read_git_config(repo_path.as_deref())
}

#[tauri::command]
#[specta::specta]
pub fn set_git_config(
    repo_path: Option<String>,
    scope: ConfigScope,
    key: String,
    value: String,
) -> Result<(), AppError> {
    crate::write::config::write_git_config(repo_path.as_deref(), scope, &key, &value)
}
```

- [ ] **Step 2: Register in `commands/mod.rs` and `lib.rs`**

Add `pub mod config; pub use config::*;` in `src-tauri/src/commands/mod.rs`.
Add `get_git_config` and `set_git_config` to `create_specta_builder()` in `src-tauri/src/lib.rs`.

- [ ] **Step 3: Update `src/ipc/bindings.ts` and `src/ipc/client.ts`**

In `src/ipc/bindings.ts`, define `ConfigScope` and `GitConfigDto`.
In `src/ipc/client.ts`, add `getGitConfig` and `setGitConfig` to `invokeCommand` with browser mock fallback.

- [ ] **Step 4: Verify Cargo test and Specta compile**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/commands/ src-tauri/src/lib.rs src/ipc/
git commit -m "✨ expose get_git_config and set_git_config IPC commands"
```

---

### Task 3: State Management & i18n Localization

**Files:**
- Modify: `src/store/useSettingsStore.ts`
- Modify: `src/i18n/vi.ts`
- Modify: `src/i18n/en.ts`
- Create: `src/test/useSettingsStore.test.ts`

**Interfaces:**
- Extends `useSettingsStore`:
  ```typescript
  isSettingsOpen: boolean;
  activeTab: "profile" | "appearance" | "behavior";
  openSettings: (tab?: "profile" | "appearance" | "behavior") => void;
  closeSettings: () => void;
  ```

- [ ] **Step 1: Write failing store test**

In `src/test/useSettingsStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../store/useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.getState().closeSettings();
  });

  it("opens settings with default or specified tab", () => {
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
    useSettingsStore.getState().openSettings("appearance");
    expect(useSettingsStore.getState().isSettingsOpen).toBe(true);
    expect(useSettingsStore.getState().activeTab).toBe("appearance");

    useSettingsStore.getState().closeSettings();
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run src/test/useSettingsStore.test.ts`
Expected: FAIL (methods not defined)

- [ ] **Step 3: Implement store additions and i18n dictionaries**

In `src/store/useSettingsStore.ts`:
Add `isSettingsOpen: false`, `activeTab: "profile"`, and action handlers.
In `src/i18n/vi.ts` and `src/i18n/en.ts`:
Add `settings` dictionary with translations for tabs, inputs, scope badges, buttons, and hints.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run src/test/useSettingsStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/useSettingsStore.ts src/i18n/ src/test/useSettingsStore.test.ts
git commit -m "✨ add settings modal state and i18n dictionaries"
```

---

### Task 4: Settings Modal Tabs Components

**Files:**
- Create: `src/components/settings/tabs/GitProfileTab.tsx`
- Create: `src/components/settings/tabs/AppearanceTab.tsx`
- Create: `src/components/settings/tabs/GitBehaviorTab.tsx`
- Create: `src/components/settings/SettingsModal.tsx`
- Create: `src/components/settings/SettingsModal.test.tsx`

**Interfaces:**
- `SettingsModal`: Root dialog with spring transition, backdrop, tab list, and escape handling.
- `GitProfileTab`: Form for Git author name & email, scope switch (Global vs Local), default branch.
- `AppearanceTab`: Radio cards for theme (Light/Dark/System), locale (vi/en), mode (Simple/Advanced), colorblind toggle.
- `GitBehaviorTab`: Options for pull.rebase and auto-fetch interval.

- [ ] **Step 1: Write component unit test**

In `src/components/settings/SettingsModal.test.tsx`:
```tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SettingsModal } from "./SettingsModal";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("SettingsModal", () => {
  it("renders when open and closes on close button", () => {
    useSettingsStore.getState().openSettings("profile");
    render(<SettingsModal currentRepoPath={null} />);
    
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const closeBtn = screen.getByLabelText(/close|đóng/i);
    fireEvent.click(closeBtn);
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run src/components/settings/SettingsModal.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement tab components and SettingsModal**

Implement:
1. `GitProfileTab.tsx`:
   - Fetch config on mount with `invokeCommand.getGitConfig(currentRepoPath)`.
   - Allow user to toggle scope between Global and Local (Local disabled if `currentRepoPath == null`).
   - Save handler calling `invokeCommand.setGitConfig` and triggering a success toast via `useToastStore`.
2. `AppearanceTab.tsx`:
   - Visual radio cards for Theme (Sun, Moon, Laptop icons).
   - Radio buttons for Language (VI, EN).
   - Mode switcher (Simple vs Advanced).
   - Colorblind switch.
3. `GitBehaviorTab.tsx`:
   - Pull rebase toggle (Merge vs Rebase).
   - Auto-fetch selection.
4. `SettingsModal.tsx`:
   - Modal wrapper with Backdrop, Header, Left sidebar tabs, Right panel content.
   - Escape key listener and backdrop click to close.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run src/components/settings/SettingsModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/
git commit -m "🎨 implement settings modal with profile, appearance, and behavior tabs"
```

---

### Task 5: App Integration (Header Button, Shortcuts & Command Palette)

**Files:**
- Modify: `src/components/header/RepoHeader.tsx`
- Modify: `src/components/welcome/WelcomeScreen.tsx`
- Modify: `src/hooks/useGlobalShortcuts.ts`
- Modify: `src/utils/commandRegistry.ts`
- Modify: `src/components/shortcuts/ShortcutsHelpModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Global shortcut: `Ctrl+,` (Cmd+, on macOS) triggers `openSettings()`.
- Command Palette: Item "Mở Cài đặt / Open Settings" with shortcut `Ctrl+,`.
- Header: Settings button (Gear icon) opens Settings.
- App.tsx: Renders `<SettingsModal currentRepoPath={currentRepo?.path ?? null} />`.

- [ ] **Step 1: Write shortcut and command registry tests**

In `src/test/useGlobalShortcuts.test.ts`:
Add test verifying that `Ctrl+,` calls `onOpenSettings`.
In `src/test/commandRegistry.test.ts` (or equivalent):
Verify command `app.openSettings` exists and is registered.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test --run src/test/useGlobalShortcuts.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement integrations**

1. In `src/hooks/useGlobalShortcuts.ts`:
   - Add `onOpenSettings?: () => void` to `UseGlobalShortcutsOptions`.
   - In `handleKeyDown`: if `isModifier && (e.key === "," || e.key === "<")`, preventDefault and call `onOpenSettings()`.
2. In `src/components/header/RepoHeader.tsx`:
   - Add a Settings gear button with tooltip `Cài đặt (Ctrl+,)`.
3. In `src/components/welcome/WelcomeScreen.tsx`:
   - Add a Settings button in the top-right corner.
4. In `src/utils/commandRegistry.ts`:
   - Register `settings.open` command with shortcut `Ctrl+,`.
5. In `src/components/shortcuts/ShortcutsHelpModal.tsx`:
   - Add `Ctrl+,` to the "Chung / General" category.
6. In `src/App.tsx`:
   - Mount `<SettingsModal currentRepoPath={currentRepo ? currentRepo.path : null} />`.
   - Pass `onOpenSettings: () => openSettings()` to `useGlobalShortcuts`.

- [ ] **Step 4: Run full test suite and build verification**

Run: `pnpm test --run`
Run: `pnpm build`
Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All tests PASS, build succeeds without type errors.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "✨ integrate settings modal into header, shortcuts, and command palette"
```
