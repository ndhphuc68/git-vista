# Milestone M5.3: Packaging, CI Release & v1.0 Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện đóng gói đa nền tảng (Windows, macOS, Linux), thiết lập kiểm chuẩn hiệu năng tự động (Benchmark Guard) bảo vệ ngân sách <800ms, tự động hoá quy trình phát hành CI Release, và tài liệu hoá toàn diện bản phát hành chính thức Visual Git Client v1.0.

**Tech Stack:** Tauri 2, Rust, libgit2, GitHub Actions, Vitest, Vite 6.

**Spec:** `docs/superpowers/specs/2026-09-14-m5-3-packaging-ci-release-design.md`

---

### Task 1: Performance Benchmark Suite (`src-tauri/tests/m5_benchmark_test.rs`)

**Files:**
- Create: `src-tauri/tests/m5_benchmark_test.rs`

**Interfaces:**
- Produces: Automated performance test creating a 500+ commit repository fixture and verifying execution time budgets:
  - Commit graph loading & lane calculation: < 800ms.
  - Repo status calculation: < 500ms.

- [ ] **Step 1: Write integration benchmark test in `src-tauri/tests/m5_benchmark_test.rs`**
- [ ] **Step 2: Run test to verify it passes within budgets**
  - Run: `cargo test --test m5_benchmark_test --manifest-path src-tauri/Cargo.toml -- --nocapture`
- [ ] **Step 3: Commit**

---

### Task 2: Production Bundle Configuration (`src-tauri/tauri.conf.json`)

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Interfaces:**
- Produces: Production packaging bundle configuration for Windows (`nsis`, `msi`), macOS (`dmg`), Linux (`deb`, `appimage`), icons, app metadata, categories, copyright.

- [ ] **Step 1: Update `src-tauri/tauri.conf.json` bundle configuration**
- [ ] **Step 2: Validate configuration with `cargo check` and bundle dry check**
- [ ] **Step 3: Commit**

---

### Task 3: Multi-Platform CI Release Workflow (`.github/workflows/release.yml`)

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `.github/workflows/ci.yml` (add benchmark step)

**Interfaces:**
- Produces: Automated GitHub Actions workflow building and publishing release artifacts across `windows-latest`, `macos-latest`, and `ubuntu-latest` on tag push (`v*`) or manual dispatch.

- [ ] **Step 1: Create `.github/workflows/release.yml`**
- [ ] **Step 2: Update `.github/workflows/ci.yml` with performance benchmark step**
- [ ] **Step 3: Commit**

---

### Task 4: Complete v1.0 Documentation & Release Notes (`README.md`, `RELEASE_NOTES_v1.0.md`)

**Files:**
- Modify: `README.md`
- Create: `docs/RELEASE_NOTES_v1.0.md`

**Interfaces:**
- Produces: Comprehensive user and developer documentation covering all features built across M0 through M5, installation instructions, keyboard shortcuts reference, and v1.0 release notes.

- [ ] **Step 1: Create `docs/RELEASE_NOTES_v1.0.md`**
- [ ] **Step 2: Update `README.md` with full feature overview, shortcuts, and installation guides**
- [ ] **Step 3: Commit**

---

### Task 5: Full Project Verification & Sanity Check

- [ ] **Step 1: Run complete verification suite:**
  - `cargo test --manifest-path src-tauri/Cargo.toml`
  - `pnpm test --run`
  - `pnpm run build`
- [ ] **Step 2: Update walkthrough artifact**
