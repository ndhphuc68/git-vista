# Website Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a modern, responsive, high-performance static product landing page for GitVista in `website/` with bilingual EN/VI support, smart OS download detection, feature showcase, keyboard shortcuts guide, and automated GitHub Pages CI/CD.

**Architecture:** A zero-dependency static web application hosted in `website/`. Includes `index.html` (semantic HTML5, SEO meta tags, Tailwind CDN), `style.css` (high-craft dark mode aesthetic and responsive styles), `i18n.js` (complete English and Vietnamese dictionary synchronized with `README.md`), `app.js` (DOM i18n binding, client OS detection, smooth UX interactions), and `.github/workflows/deploy-pages.yml` (automated GitHub Pages publishing).

**Tech Stack:** HTML5, CSS3, Tailwind CSS (CDN), Vanilla JavaScript (ES2022), Vitest (for test suite verification), GitHub Actions (`actions/deploy-pages@v4`).

**Spec:** [`docs/superpowers/specs/2026-09-18-website-landing-page-design.md`](../specs/2026-09-18-website-landing-page-design.md)

## Global Constraints

- Standalone static web files in `website/`: no extra Node.js runtime build required on GitHub Pages.
- Bilingual support: 100% feature and content parity between English and Vietnamese.
- Design: High-craft modern Dark Mode matching developer tool aesthetic (similar to GitHub, Linear, Vercel).
- Git commit messages must follow Gitmoji format: `<emoji> <short description>`.
- Do not modify or add Playwright E2E tests unless explicitly requested.

---

### Task 1: Scaffolding `website/` Assets and Bilingual Data Dictionary (`i18n.js`)

**Files:**
- Create: `website/i18n.js`
- Create: `website/assets/app-icon.png` (copy from project root `app-icon.png`)
- Test: `src/tests/website-i18n.test.ts`

**Interfaces:**
- Produces: `window.I18N_DATA = { en: Record<string, string>, vi: Record<string, string> }`

- [ ] **Step 1: Write the failing unit test for `i18n.js` dictionary**

Create `src/tests/website-i18n.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Website i18n dictionary', () => {
  it('should exist and have identical non-empty keys for en and vi', () => {
    const i18nPath = path.resolve(__dirname, '../../website/i18n.js');
    expect(fs.existsSync(i18nPath)).toBe(true);

    const fileContent = fs.readFileSync(i18nPath, 'utf-8');
    // Evaluate or extract I18N_DATA
    const sandbox: { I18N_DATA?: { en: Record<string, string>; vi: Record<string, string> } } = {};
    const fn = new Function('window', fileContent);
    fn(sandbox);

    expect(sandbox.I18N_DATA).toBeDefined();
    const { en, vi } = sandbox.I18N_DATA!;
    expect(en).toBeDefined();
    expect(vi).toBeDefined();

    const enKeys = Object.keys(en).sort();
    const viKeys = Object.keys(vi).sort();

    expect(enKeys.length).toBeGreaterThan(20);
    expect(enKeys).toEqual(viKeys);

    for (const key of enKeys) {
      expect(en[key].trim().length).toBeGreaterThan(0);
      expect(vi[key].trim().length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tests/website-i18n.test.ts`
Expected: FAIL (file `website/i18n.js` does not exist).

- [ ] **Step 3: Create `website/assets/` directory and copy `app-icon.png`**

Copy `app-icon.png` to `website/assets/app-icon.png`.

- [ ] **Step 4: Implement `website/i18n.js`**

Implement complete dictionary with keys for:
- `nav.features`, `nav.downloads`, `nav.shortcuts`, `nav.docs`, `nav.github`
- `hero.title`, `hero.tagline`, `hero.description`, `hero.download_primary`, `hero.all_platforms`, `hero.view_github`
- `features.title`, `features.subtitle`
- 6 features: `features.graph.title`, `features.graph.desc`, `features.rebase.title`, `features.rebase.desc`, `features.undo.title`, `features.undo.desc`, `features.multitab.title`, `features.multitab.desc`, `features.diff.title`, `features.diff.desc`, `features.conflict.title`, `features.conflict.desc`
- `downloads.title`, `downloads.subtitle`, `downloads.windows.title`, `downloads.windows.desc`, `downloads.mac.title`, `downloads.mac.desc`, `downloads.linux.title`, `downloads.linux.desc`, `downloads.release_note`
- `shortcuts.title`, `shortcuts.subtitle`, shortcut keys and descriptions
- `footer.license`, `footer.community`

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/tests/website-i18n.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add website/i18n.js website/assets/app-icon.png src/tests/website-i18n.test.ts
git commit -m "✨ add website i18n dictionary and assets"
```

---

### Task 2: Implement Semantic HTML Structure and CSS Styling (`index.html` & `style.css`)

**Files:**
- Create: `website/index.html`
- Create: `website/style.css`
- Test: `src/tests/website-html.test.ts`

**Interfaces:**
- Consumes: `website/i18n.js`, `website/assets/app-icon.png`
- Produces: Complete responsive Dark Mode DOM structure with `data-i18n` bindings.

- [ ] **Step 1: Write test for HTML structure and meta tags**

Create `src/tests/website-html.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Website index.html', () => {
  it('should have proper SEO, Tailwind CDN, and data-i18n tags', () => {
    const htmlPath = path.resolve(__dirname, '../../website/index.html');
    const cssPath = path.resolve(__dirname, '../../website/style.css');

    expect(fs.existsSync(htmlPath)).toBe(true);
    expect(fs.existsSync(cssPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('GitVista');
    expect(html).toContain('cdn.tailwindcss.com');
    expect(html).toContain('data-i18n="hero.title"');
    expect(html).toContain('data-i18n="nav.features"');
    expect(html).toContain('href="https://github.com/ndhphuc68/git-vista-"');
    expect(html).toContain('id="download-primary-btn"');
    expect(html).toContain('id="lang-toggle-btn"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tests/website-html.test.ts`
Expected: FAIL (files do not exist).

- [ ] **Step 3: Implement `website/style.css`**

Define custom dark theme styles, backdrop blur, glowing gradients, scrollbar styling, and commit graph mock animation styling.

- [ ] **Step 4: Implement `website/index.html`**

Construct semantic HTML5 layout:
- Header: Sticky nav, logo, links, language switcher toggle, GitHub CTA button.
- Hero: Headline, tagline, dynamic OS download button, secondary download button, visual mock window of GitVista app (interactive commit graph mockup).
- Feature Showcase: 6 feature cards with modern icons and bilingual tags.
- Download Matrix: Windows, macOS, Linux download cards with direct release links and SHA / architecture notes.
- Shortcuts Cheat Sheet: Grid of keyboard shortcuts with styled `<kbd>` keys.
- Footer: Copyright, MIT license, Issue tracker link.
- Script tags linking `website/i18n.js` and `website/app.js`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/tests/website-html.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add website/index.html website/style.css src/tests/website-html.test.ts
git commit -m "🎨 implement website semantic html and custom styling"
```

---

### Task 3: Implement Client-Side Interaction Logic (`app.js`)

**Files:**
- Create: `website/app.js`
- Test: `src/tests/website-app.test.ts`

**Interfaces:**
- Consumes: `window.I18N_DATA` from `website/i18n.js`
- Produces: `window.GitVistaWeb = { setLanguage, detectPlatform, applyI18n }`

- [ ] **Step 1: Write test for `app.js` functionality**

Create `src/tests/website-app.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Website app.js logic', () => {
  it('should correctly detect OS and translate elements with data-i18n', () => {
    const appJsPath = path.resolve(__dirname, '../../website/app.js');
    expect(fs.existsSync(appJsPath)).toBe(true);

    const appCode = fs.readFileSync(appJsPath, 'utf-8');
    expect(appCode).toContain('detectPlatform');
    expect(appCode).toContain('setLanguage');
    expect(appCode).toContain('localStorage');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tests/website-app.test.ts`
Expected: FAIL (`website/app.js` does not exist).

- [ ] **Step 3: Implement `website/app.js`**

Implement:
1. `detectPlatform()`: Inspects `navigator.userAgent` and returns `'windows' | 'mac' | 'linux'`.
2. Updates primary CTA button with appropriate OS label, icon, and direct download URL:
   - Windows: `GitVista_0.1.0_x64-setup.exe`
   - macOS: `GitVista_0.1.0_universal.dmg`
   - Linux: `gitvista_0.1.0_amd64.deb`
3. `setLanguage(lang)`:
   - Sets active language (`'en'` or `'vi'`).
   - Updates `localStorage.setItem('gitvista_lang', lang)`.
   - Iterates through all `[data-i18n]` and updates `textContent` or `innerHTML`.
   - Iterates through `[data-i18n-placeholder]` and updates placeholders.
   - Updates toggle button active state.
4. Auto-initialize on `DOMContentLoaded`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tests/website-app.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add website/app.js src/tests/website-app.test.ts
git commit -m "✨ add website client-side interaction and os detection"
```

---

### Task 4: Configure GitHub Actions Pages Deployment Workflow (`deploy-pages.yml`)

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Test: Validate YAML syntax and action versions.

**Interfaces:**
- Deploys: `website/` directory to GitHub Pages upon push to `main` branch.

- [ ] **Step 1: Write workflow file `.github/workflows/deploy-pages.yml`**

```yaml
name: Deploy Landing Page to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - "website/**"
      - ".github/workflows/deploy-pages.yml"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./website"

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify YAML formatting and run automated test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "🚀 add github pages automated deployment workflow"
```

---

### Task 5: End-to-End Verification & Documentation Update

**Files:**
- Modify: `README.md` (add website link badge and URL)
- Test: Run full test suite `pnpm test` and lint checks.

- [ ] **Step 1: Update `README.md` with official website link**

Add website link to `README.md` in both English and Vietnamese sections:
- `https://ndhphuc68.github.io/git-vista-/`

- [ ] **Step 2: Run all unit tests and formatting checks**

Run: `pnpm test`
Run: `pnpm format:check`
Expected: All checks pass.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "📝 update readme with landing page website link"
```
