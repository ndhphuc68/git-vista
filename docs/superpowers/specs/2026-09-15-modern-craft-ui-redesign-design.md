# GitVista UX/UI Redesign Design Specification
**Topic**: Modern Craft (Linear & Raycast Aesthetic) Redesign  
**Date**: 2026-09-15  
**Target Milestone**: v1.1 - Modern Craft Experience  

---

## 1. Overview & Motivation

GitVista is a high-speed, keyboard-driven desktop Git GUI built with Tauri v2, Rust, and React 19. While the functional foundations (Commit Graph, Staging/Diff, Branch/Remote/Stash operations, Undo, Command Palette) are solid, the existing user interface has several UX limitations:
- **Visual Clutter & Vertical Stacking**: The top `ControlsBar` stacked above `RepoHeader` consumes valuable vertical height (80px+), pushing the main workspace down.
- **Underutilized Horizontal Space**: Top-tab screen switching (`History` / `Changes`) cramps header actions (Fetch, Pull, Push, Search, Branch info).
- **Design Aesthetic**: The current gray-toned theme lacks the depth, micro-interactions, and visual hierarchy of modern developer-focused applications (Linear, Raycast, Cursor, Zed).

This redesign adopts **Option 1: Modern Craft (Linear & Raycast Aesthetic)** to deliver a refined, keyboard-first, high-density desktop experience.

---

## 2. Design System & Tokens

### 2.1 Color Palette
- **Dark Theme (Primary default)**:
  - Window Background: `#0D1117` (Deep Obsidian)
  - Surface Background: `#161B22` (Dark Charcoal)
  - Surface Elevated / Hover: `#21262D`
  - Surface Active: `#30363D`
  - Subtle Border: `rgba(255, 255, 255, 0.08)` (Micro-borders)
  - Strong Border: `#30363D`
  - Primary Text: `#F0F6FC`
  - Secondary Text: `#8B949E`
  - Tertiary Text: `#6E7681`
  - Accent Primary: `#6366F1` (Electric Indigo)
  - Accent Hover: `#4F46E5`
  - Accent Subtle: `rgba(99, 102, 241, 0.15)`
  - Success / Added: `#10B981` (Emerald Green)
  - Diff Added Background: `rgba(16, 185, 129, 0.12)`
  - Destructive / Removed: `#F43F5E` (Rose Red)
  - Diff Removed Background: `rgba(244, 63, 94, 0.12)`
  - Warning / Behind: `#F59E0B` (Amber)

- **Light Theme**:
  - Window Background: `#F6F8FA`
  - Surface: `#FFFFFF`
  - Surface Hover: `#F3F4F6`
  - Subtle Border: `#E1E4E8`
  - Primary Text: `#1F2328`
  - Secondary Text: `#656D76`
  - Accent Primary: `#4F46E5`

- **Colorblind Mode**:
  - Maintained as Blue/Orange alternative for diffs and status badges.

### 2.2 Typography & Sizing
- UI Font: System stack (`-apple-system`, `BlinkMacSystemFont`, `"Segoe UI Variable"`, `"Segoe UI"`, `Inter`, `sans-serif`)
- Code & Hashes: `"JetBrains Mono"`, `"Cascadia Code"`, `monospace`
- Micro-radii: `rounded-md (6px)` to `rounded-lg (8px)` for interactive items; `rounded-full` for status badges.

---

## 3. Architecture & Component Structure

### 3.1 App Layout (`src/App.tsx`)
```
+-------------------------------------------------------------------------+
| [Activity Rail (48px)] | [RepoHeader (44px)]                           |
|                        | - Breadcrumb (Repo / Branch)                  |
|                        | - Sync Pill (Ahead / Behind / 1-Click Sync)    |
|                        | - Command Trigger (Ctrl+K)                    |
|                        | - Right Actions (Refresh, Layout toggles)      |
|                        +-----------------------------------------------+
| - History (Ctrl+1)     | [Main Screen Area]                            |
| - Changes (Ctrl+2)     | - If History: Shell (Sidebar + Graph + Detail)|
| - Stashes              | - If Changes: ChangesScreen (Files + Diff)    |
| - Branches (Ctrl+B)    | - If Conflict: ConflictResolverScreen         |
|                        |                                               |
| - [Bottom Settings]    |                                               |
+-------------------------------------------------------------------------+
```

### 3.2 Key Components
1. **`ActivityRail.tsx`** (New):
   - Vertical sidebar rail (48px fixed).
   - Tooltips with shortcut hints (`Ctrl+1`, `Ctrl+2`, `Ctrl+B`, `?`).
   - Badge counter on `Changes` showing total uncommitted files.
   - Settings trigger at bottom opening a compact Settings Dialog / Modal.

2. **`RepoHeader.tsx`** (Redesigned):
   - Unified single header (44px height).
   - Replaces the separate `ControlsBar` by embedding Sync, Remote tasks, and Quick Actions directly.
   - 1-Click Sync button: Smart Pull & Push in one streamlined action with spinner.
   - Branch Switcher dropdown pill with active branch and upstream info.

3. **`ChangesScreen.tsx` & Staging**:
   - Modern cards for file list categories (Staged, Unstaged, Untracked).
   - Quick action buttons (Stage All, Unstage All, Stash).
   - Streamlined Commit Box with shortcut badge `Ctrl+Enter` and clean textarea.

4. **`CommitGraph.tsx` & History**:
   - Smooth curved SVG lines for branch lanes.
   - Clean author avatar initials pill.
   - Relative timestamps with exact datetime tooltip.

5. **`SettingsModal.tsx`** (New):
   - Clean popover/modal housing the previous `ControlsBar` settings: Theme toggle (Light/Dark/System), Mode toggle (Simple/Advanced), Colorblind mode, and DevTools/IPC diagnostic tab.

---

## 4. Verification & Testing

1. **Unit & Component Tests**:
   - Run Vitest suite (`pnpm test`) to ensure all store bindings, shortcuts, and component interactions pass.
   - Update tests that assert on `RepoHeader` or `ControlsBar` selectors.
2. **Contrast & Accessibility**:
   - Run `pnpm check-contrast` to verify WCAG AA / AAA compliance.
3. **Manual Flow Verification**:
   - Switching between History and Changes via Activity Rail and shortcuts (`Ctrl+1`, `Ctrl+2`).
   - Staging/Unstaging files and committing code.
   - Syncing (Fetch, Pull, Push) with status badges.
   - Theme toggling (Dark/Light/Colorblind).
