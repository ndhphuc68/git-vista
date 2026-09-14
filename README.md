# GitVista

A fast, keyboard-driven Git GUI built with Tauri v2, Rust, and React.

## Features

- ?? **Commit Graph** � Visual branch/merge history with fast libgit2 rendering
- ? **Staging & Commits** � Stage files, write commits, view diffs
- ?? **Undo System** � Undo recent commits, branch deletes, file discards, and stash drops with backup refs
- ?? **Toast Notifications** � Friendly Vietnamese error messages with 10-second undo window
- ?? **Simple & Advanced Mode** � Toggle between beginner-friendly (Vietnamese labels) and full Git terminology
- ?? **Keyboard Shortcuts** � Full keyboard-driven workflow with command palette
- ?? **Branch Management** � Create, switch, delete branches with stash support
- ?? **Production Bundles** � Native installers for Windows (NSIS), macOS (DMG), and Linux (deb/AppImage)

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) stable
- On Linux: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`

### Development

```bash
# Install dependencies
pnpm install

# Start dev server (frontend + Tauri)
pnpm tauri dev
```

### Build

```bash
# Build frontend only
pnpm build

# Build native installer
pnpm tauri build
```

### Tests

```bash
# Frontend tests
pnpm test --run

# Rust tests (includes benchmarks)
cargo test --manifest-path src-tauri/Cargo.toml
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `?` | Show keyboard shortcuts help |
| `Ctrl+1` | Go to Changes screen |
| `Ctrl+2` | Go to Commits screen |
| `Ctrl+T` | Toggle Simple/Advanced mode |
| `Ctrl+B` | Toggle branch sidebar |
| `Ctrl+/` | Focus search / filter |
| `Escape` | Close dialogs / deselect |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | [Tauri v2](https://tauri.app/) |
| Backend | Rust + [libgit2](https://libgit2.org/) via [git2](https://crates.io/crates/git2) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Testing (FE) | Vitest + React Testing Library |
| Testing (BE) | Rust built-in test framework |
| IPC | Tauri Commands + [Specta](https://github.com/oscartbeaumont/specta) type generation |

## Architecture

```
src-tauri/src/
  read/         # libgit2 reads (graph, status, diff, branches, stash)
  write/        # Git write operations (commit, branch, stash, backup, undo)
  commands/     # Tauri IPC command handlers
  lib.rs        # Tauri app entry point

src/
  components/   # React UI components
  store/        # Zustand stores (app, toast, command palette)
  hooks/        # Custom React hooks (shortcuts, IPC)
  utils/        # Error mapping, command registry
  ipc/          # Tauri invoke wrappers
```

## Release

Tagging `v*` on the `main` branch triggers a GitHub Actions release workflow that:
1. Builds native installers on Windows, macOS, and Linux
2. Creates a draft GitHub Release with all artifacts attached

See [RELEASE_NOTES_v1.0.md](docs/RELEASE_NOTES_v1.0.md) for version history.

## License

MIT
