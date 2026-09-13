# Release Notes — Visual Git Client v1.0

## v1.0.0 (2026-09-14)

First stable release of Visual Git Client. Covers all Milestone M0–M5 features.

---

## M5 — Polish, UX & Packaging (v0.5.0 ? v1.0.0)

### M5.1 — Undo, Toast & Error Mapping
- **Ref Backup System**: Every destructive operation (commit, branch delete, file discard, stash drop) creates a `refs/gitui-backup/<action>-<timestamp>` safety ref, auto-pruned after 30 days.
- **Undo Commands**: `undo_commit` (soft reset HEAD~1), `undo_delete_branch`, `undo_discard_file`, `undo_drop_stash` exposed as Tauri commands.
- **Friendly Error Mapping**: `mapGitError()` converts raw Git errors to Vietnamese-language messages with action hints.
- **Toast System**: Bottom-right toast notifications with 10-second countdown undo button ("Hoàn tác") and expandable technical details ("Chi ti?t k? thu?t").

### M5.2 — Command Palette & Keyboard Shortcuts
- **Command Palette** (`Ctrl+K`): Spotlight-style overlay with fuzzy search (Vietnamese diacritic-aware), category headers, and keyboard navigation.
- **Global Shortcuts**: `Ctrl+1/2` (screen navigation), `Ctrl+T` (mode toggle), `Ctrl+B` (sidebar), `?` (help), `Escape` (dismiss).
- **Shortcuts Help Modal** (`?`): 4-category reference card (Chung, Ði?u hu?ng, Git, Cài d?t).
- **Simple/Advanced Mode**: Clickable toggle in titlebar adapts labels — Vietnamese friendly labels (Luu thay d?i, L?y v?, Kéo v?, Ð?y lên) in Simple mode vs. full Git terminology in Advanced mode.

### M5.3 — Packaging, CI Release & v1.0 Finalization
- **Performance Benchmarks**: Automated benchmark test (`m5_benchmark_test`) validates commit graph render < 800 ms and status < 500 ms on a 500-commit fixture.
- **Production Bundle Config**: `tauri.conf.json` updated with `bundle.active: true`, all platforms (NSIS/DMG/deb/AppImage), icons, copyright, and metadata.
- **Multi-Platform CI Release**: `.github/workflows/release.yml` builds and uploads native installers on tag push using `tauri-apps/tauri-action`.

---

## M4 — Diff Viewer, File Explorer & Stash (v0.4.0 ? v0.5.0)

- Side-by-side diff viewer with syntax highlighting
- File tree explorer with staged/unstaged grouping
- Stash create, apply, pop, and drop
- Branch comparison view

---

## M3 — Commit History & Branch Graph (v0.3.0 ? v0.4.0)

- Commit history list with author, date, and message
- Visual branch/merge graph rendered from libgit2
- Commit detail panel with file change list
- Pagination (offset/limit) for large repositories

---

## M2 — Branch Management (v0.2.0 ? v0.3.0)

- Create, switch, and delete local branches
- Branch sidebar with current branch indicator
- Checkout with dirty-tree detection

---

## M1 — Staging & Commits (v0.1.0 ? v0.2.0)

- Stage/unstage individual files
- Commit with message
- View working tree status (new, modified, deleted)

---

## M0 — Foundations (v0.0.1 ? v0.1.0)

- Tauri v2 + React + TypeScript + Vite project scaffold
- Rust backend with libgit2 bindings
- Basic IPC layer with Specta type generation
- CI pipeline (Windows/macOS/Linux)
