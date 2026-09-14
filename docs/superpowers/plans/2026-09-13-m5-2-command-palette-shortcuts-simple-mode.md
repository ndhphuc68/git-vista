# Milestone M5.2: Command Palette, Hệ Thống Phím Tắt & Chế Độ Simple/Advanced Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện trải nghiệm bàn phím nhanh (Keyboard-first workflow) với Command Palette (`Ctrl+K`), bảng tra cứu phím tắt (`?`/`Ctrl+/`), và cơ chế chuyển đổi chế độ làm việc tinh gọn (Simple) vs chuyên sâu (Advanced).

**Tech Stack:** React 19, TypeScript 5.8, Zustand 5, TanStack Query 5, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-13-m5-2-command-palette-shortcuts-simple-mode-design.md`

---

### Task 1: Command Palette Store & Command Registry (`useCommandPaletteStore.ts`, `commandRegistry.ts`)

**Files:**
- Create: `src/store/useCommandPaletteStore.ts`
- Create: `src/utils/commandRegistry.ts`
- Test: `src/test/commandRegistry.test.ts`

**Interfaces:**
- Produces: `useCommandPaletteStore` (`isOpen`, `open`, `close`, `toggle`), `CommandItem`, `getAppCommands(context)`, `filterCommands(commands, query)`.

- [ ] **Step 1: Write the failing test in `src/test/commandRegistry.test.ts`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `useCommandPaletteStore.ts` and `commandRegistry.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 2: Command Palette UI Component (`CommandPalette.tsx`)

**Files:**
- Create: `src/components/palette/CommandPalette.tsx`
- Test: `src/test/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `useCommandPaletteStore`, `getAppCommands`, `filterCommands`
- Produces: `<CommandPalette />` overlay with input search, keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`), categorized list, and action dispatch.

- [ ] **Step 1: Write the failing test in `src/test/CommandPalette.test.tsx`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `CommandPalette.tsx`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 3: Global Shortcuts System & Shortcuts Help Modal (`useGlobalShortcuts.ts`, `ShortcutsHelpModal.tsx`)

**Files:**
- Create: `src/components/shortcuts/ShortcutsHelpModal.tsx`
- Modify: `src/hooks/useGlobalShortcuts.ts`
- Test: `src/test/ShortcutsHelpModal.test.tsx`

**Interfaces:**
- Produces: `<ShortcutsHelpModal />` showing organized shortcut tables, extended `useGlobalShortcuts` handling `Ctrl+K`, `?` / `Ctrl+/`, `Ctrl+1`, `Ctrl+2`, `Ctrl+B`, `Ctrl+T`.

- [ ] **Step 1: Write the failing test in `src/test/ShortcutsHelpModal.test.tsx`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `ShortcutsHelpModal.tsx` and update `useGlobalShortcuts.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 4: Simple vs. Advanced Mode UI Integrations

**Files:**
- Modify: `src/components/header/RepoHeader.tsx`
- Modify: `src/components/changes/CommitBox.tsx`
- Modify: `src/components/Titlebar.tsx`
- Test: `src/test/AppMode.test.tsx`

**Interfaces:**
- Consumes: `useSettingsStore.mode` ("simple" vs "advanced")
- Produces: Dynamic terminology & UI complexity adaptation:
  - Simple: Friendly Vietnamese terms ("Lấy về", "Kéo về", "Đẩy lên", "Lưu tạm"), hides raw hash details.
  - Advanced: Git standards (`Fetch`, `Pull`, `Push`, `Stash`, short SHA badges, technical stats).

- [ ] **Step 1: Write the failing test in `src/test/AppMode.test.tsx`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement mode adaptations across `RepoHeader`, `CommitBox`, and `Titlebar`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 5: Mount in `App.tsx` & Full Verification Suite

**Files:**
- Modify: `src/App.tsx`
- Test: `src/test/App.test.tsx`

- [ ] **Step 1: Mount `<CommandPalette />` and `<ShortcutsHelpModal />` in `src/App.tsx`**
- [ ] **Step 2: Run full verification suite:**
  - `cargo test --manifest-path src-tauri/Cargo.toml`
  - `pnpm test --run`
  - `pnpm run build`
- [ ] **Step 3: Commit and update walkthrough**
