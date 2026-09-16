# Splash Screen & UX Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a polished macOS-native style Splash Screen (~1.8s intro + 300ms exit fade) and a zero-dependency app-wide UX animation system (screen transitions, sliding tabs indicator, spring modals, and micro-interactions) across GitVista.

**Architecture:** A lightweight React startup lifecycle manages `<SplashScreen />` with brand intro animations and graceful unmount. Pure CSS tokens and GPU-accelerated keyframe utilities power all motions, while a lightweight 30-line `<Transition />` component powers smooth enter and exit transitions for modals and panels without external packages.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

**Spec:** [`docs/superpowers/specs/2026-09-16-splash-and-ux-animations-design.md`](file:///d:/project-v3/docs/superpowers/specs/2026-09-16-splash-and-ux-animations-design.md)

## Global Constraints

- Use Gitmoji for commit messages: `<emoji> <short description>` without Conventional Commit prefixes or parenthesized scopes.
- Zero external runtime npm packages added (100% pure CSS + React 19 state).
- Preserve 100% passing tests on existing test suite (40 files, 173 tests).
- Respect `@media (prefers-reduced-motion: reduce)` everywhere.
- GPU-accelerated properties (`transform`, `opacity`) for 60-120fps smooth desktop performance.

---

### Task 1: Motion Tokens & CSS Animation Utilities

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/globals.css`
- Test: `src/test/MotionTokens.test.ts`

**Interfaces:**
- Consumes: CSS variables in `:root` (`--ease-macos`, `--duration-normal`, etc.)
- Produces:
  - CSS tokens: `--ease-spring`, `--duration-instant`, `--duration-fast`, `--duration-slow`
  - CSS classes: `.animate-fade-in`, `.animate-scale-in`, `.animate-slide-up`, `.animate-slide-down`, `.btn-press`, `.card-lift`, `.modal-backdrop`

- [ ] **Step 1: Write the failing test**

Create `src/test/MotionTokens.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Motion Tokens and CSS Animation Utilities", () => {
  const tokensCss = fs.readFileSync(path.resolve(__dirname, "../styles/tokens.css"), "utf-8");
  const globalsCss = fs.readFileSync(path.resolve(__dirname, "../styles/globals.css"), "utf-8");

  it("defines easing curves and durations in tokens.css", () => {
    expect(tokensCss).toContain("--ease-spring:");
    expect(tokensCss).toContain("--duration-instant:");
    expect(tokensCss).toContain("--duration-fast:");
    expect(tokensCss).toContain("--duration-slow:");
  });

  it("defines keyframe animations and utility classes in globals.css", () => {
    expect(globalsCss).toContain("@keyframes fadeIn");
    expect(globalsCss).toContain("@keyframes scaleIn");
    expect(globalsCss).toContain("@keyframes slideUp");
    expect(globalsCss).toContain(".animate-fade-in");
    expect(globalsCss).toContain(".animate-scale-in");
    expect(globalsCss).toContain(".animate-slide-up");
    expect(globalsCss).toContain(".btn-press");
    expect(globalsCss).toContain(".card-lift");
    expect(globalsCss).toContain(".modal-backdrop");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/MotionTokens.test.ts`  
Expected: FAIL with missing `--ease-spring` or missing `@keyframes`.

- [ ] **Step 3: Update tokens.css and globals.css**

In `src/styles/tokens.css`, add:
```css
  /* Motion & Easing */
  --ease-macos: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.12);
  --duration-instant: 100ms;
  --duration-fast: 180ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
```

In `src/styles/globals.css`, define:
```css
/* Motion Keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.08);
  }
}

/* Motion Utility Classes */
.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-macos) forwards;
}

.animate-scale-in {
  animation: scaleIn var(--duration-normal) var(--ease-spring) forwards;
}

.animate-slide-up {
  animation: slideUp var(--duration-normal) var(--ease-macos) forwards;
}

.animate-slide-down {
  animation: slideDown var(--duration-normal) var(--ease-macos) forwards;
}

.animate-pulse-glow {
  animation: pulseGlow 2.4s ease-in-out infinite;
}

.btn-press {
  transition: transform var(--duration-instant) ease-out, filter var(--duration-instant) ease-out;
}

.btn-press:active {
  transform: scale(0.97);
}

.card-lift {
  transition: transform var(--duration-fast) var(--ease-macos), box-shadow var(--duration-fast) var(--ease-macos), border-color var(--duration-fast) var(--ease-macos);
}

.card-lift:hover {
  transform: translateY(-2px);
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: opacity var(--duration-normal) var(--ease-macos);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/MotionTokens.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/globals.css src/test/MotionTokens.test.ts
git commit -m "🎨 add motion tokens and animation utility classes"
```

---

### Task 2: Reusable Transition Component

**Files:**
- Create: `src/components/common/Transition.tsx`
- Test: `src/test/Transition.test.tsx`

**Interfaces:**
- Consumes: `React.ReactNode`
- Produces:
  ```typescript
  export interface TransitionProps {
    show: boolean;
    children: React.ReactNode;
    enterClass?: string;
    exitClass?: string;
    duration?: number;
    unmountOnExit?: boolean;
    className?: string;
  }
  export const Transition: React.FC<TransitionProps>;
  ```

- [ ] **Step 1: Write the failing test**

Create `src/test/Transition.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Transition } from "../components/common/Transition";

describe("Transition Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children when show is true", () => {
    render(
      <Transition show={true} enterClass="custom-enter">
        <div data-testid="content">Hello World</div>
      </Transition>
    );

    const el = screen.getByTestId("content");
    expect(el).toBeInTheDocument();
    expect(el.parentElement).toHaveClass("custom-enter");
  });

  it("delays unmounting during exit animation when show becomes false", () => {
    const { rerender } = render(
      <Transition show={true} enterClass="custom-enter" exitClass="custom-exit" duration={200}>
        <div data-testid="content">Modal Content</div>
      </Transition>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();

    // Trigger exit
    rerender(
      <Transition show={false} enterClass="custom-enter" exitClass="custom-exit" duration={200}>
        <div data-testid="content">Modal Content</div>
      </Transition>
    );

    // Still in DOM during exit duration
    const content = screen.getByTestId("content");
    expect(content).toBeInTheDocument();
    expect(content.parentElement).toHaveClass("custom-exit");

    // Fast-forward past duration
    act(() => {
      vi.advanceTimersByTime(210);
    });

    // Content should now be unmounted
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("does not mount initially if show is false and unmountOnExit is true", () => {
    render(
      <Transition show={false} unmountOnExit={true}>
        <div data-testid="content">Hidden</div>
      </Transition>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/Transition.test.tsx`  
Expected: FAIL with "Cannot find module '../components/common/Transition'".

- [ ] **Step 3: Implement Transition component**

Create `src/components/common/Transition.tsx`:
```tsx
import React, { useState, useEffect } from "react";
import clsx from "clsx";

export interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  enterClass?: string;
  exitClass?: string;
  duration?: number;
  unmountOnExit?: boolean;
  className?: string;
}

export const Transition: React.FC<TransitionProps> = ({
  show,
  children,
  enterClass = "animate-scale-in",
  exitClass = "opacity-0 scale-95 transition-all duration-200 ease-macos pointer-events-none",
  duration = 200,
  unmountOnExit = true,
  className,
}) => {
  const [mounted, setMounted] = useState(show);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setIsAnimatingOut(false);
    } else if (mounted) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsAnimatingOut(false);
        if (unmountOnExit) {
          setMounted(false);
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, unmountOnExit, mounted]);

  if (!mounted && unmountOnExit) {
    return null;
  }

  return (
    <div
      className={clsx(
        className,
        show && !isAnimatingOut ? enterClass : exitClass
      )}
    >
      {children}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/Transition.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/common/Transition.tsx src/test/Transition.test.tsx
git commit -m "✨ create reusable transition animation component"
```

---

### Task 3: Splash Screen Component & Lifecycle

**Files:**
- Create: `src/components/splash/SplashScreen.tsx`
- Test: `src/test/SplashScreen.test.tsx`

**Interfaces:**
- Consumes: `/app-icon.png`, `useTranslation`
- Produces:
  ```typescript
  export interface SplashScreenProps {
    onFinish: () => void;
    duration?: number; // default 1800ms
    skipSplash?: boolean;
  }
  export const SplashScreen: React.FC<SplashScreenProps>;
  ```

- [ ] **Step 1: Write the failing test**

Create `src/test/SplashScreen.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SplashScreen } from "../components/splash/SplashScreen";

describe("SplashScreen Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders branding logo, title, and tagline", () => {
    render(<SplashScreen onFinish={vi.fn()} />);

    expect(screen.getByRole("img", { name: /gitvista logo/i })).toBeInTheDocument();
    expect(screen.getByText("GitVista")).toBeInTheDocument();
    expect(screen.getByText(/Visual Git Client/i)).toBeInTheDocument();
  });

  it("transitions to exit state after duration and calls onFinish", () => {
    const onFinishMock = vi.fn();
    render(<SplashScreen onFinish={onFinishMock} duration={1800} />);

    const splash = screen.getByTestId("splash-screen");
    expect(splash).not.toHaveClass("opacity-0");

    // Advance to 1800ms -> triggers exit fade
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(splash).toHaveClass("opacity-0");
    expect(onFinishMock).not.toHaveBeenCalled();

    // Advance 300ms exit fade duration -> total 2100ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onFinishMock).toHaveBeenCalledTimes(1);
  });

  it("calls onFinish immediately if skipSplash is true", () => {
    const onFinishMock = vi.fn();
    render(<SplashScreen onFinish={onFinishMock} skipSplash={true} />);

    expect(onFinishMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/SplashScreen.test.tsx`  
Expected: FAIL with "Cannot find module '../components/splash/SplashScreen'".

- [ ] **Step 3: Implement SplashScreen component**

Create `src/components/splash/SplashScreen.tsx`:
```tsx
import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useTranslation } from "../../i18n";

export interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
  skipSplash?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 1800,
  skipSplash = false,
}) => {
  const { t } = useTranslation();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (skipSplash) {
      onFinish();
      return;
    }

    // Check if user has prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const introTime = prefersReducedMotion ? 200 : duration;
    const exitTime = prefersReducedMotion ? 50 : 300;

    const timer1 = setTimeout(() => {
      setIsExiting(true);
    }, introTime);

    const timer2 = setTimeout(() => {
      onFinish();
    }, introTime + exitTime);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [duration, skipSplash, onFinish]);

  if (skipSplash) return null;

  return (
    <div
      data-testid="splash-screen"
      role="dialog"
      aria-label="GitVista Loading"
      className={clsx(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-window select-none",
        "transition-all duration-300 ease-macos",
        isExiting
          ? "opacity-0 scale-[1.03] pointer-events-none"
          : "opacity-100 scale-100"
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute w-80 h-80 rounded-full bg-accent/15 blur-3xl -z-10 animate-pulse-glow" />

      {/* Center Branding Card */}
      <div className="flex flex-col items-center gap-5 text-center px-6">
        {/* App Logo */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-3xl bg-surface border border-border-subtle shadow-md flex items-center justify-center overflow-hidden animate-scale-in">
            <img
              src="/app-icon.png"
              alt="GitVista Logo"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                // Fallback to stylized SVG icon if image not found
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="flex flex-col items-center gap-1 animate-slide-up">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              GitVista
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
              v0.1
            </span>
          </div>
          <p className="text-sm text-secondary max-w-[280px] leading-relaxed">
            {t.welcome?.tagline || "Visual Git Client"}
          </p>
        </div>

        {/* Ambient progress line */}
        <div className="w-48 h-1 bg-border-subtle rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-accent rounded-full animate-pulse"
            style={{
              width: "100%",
              transition: `width ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/SplashScreen.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/splash/SplashScreen.tsx src/test/SplashScreen.test.tsx
git commit -m "✨ add splash screen with brand intro animation"
```

---

### Task 4: Integrate Splash Screen into App Shell & Update Tests

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/test/App.test.tsx`

**Interfaces:**
- Consumes: `<SplashScreen onFinish={...} skipSplash={...} />`
- Produces: Integrated App startup flow with smooth fade from Splash to WelcomeScreen or active repo.

- [ ] **Step 1: Check App.test.tsx expectations**

Inspect `src/test/App.test.tsx` to verify what it expects when rendering `<App />`. Ensure that in tests, `skipSplash` can be controlled or defaulted to true via an optional prop `skipSplash` on `<App skipSplash={true} />`.

- [ ] **Step 2: Update App.tsx**

In `src/App.tsx`:
Add `isSplashActive` state:
```tsx
import { SplashScreen } from "./components/splash/SplashScreen";

export interface AppProps {
  skipSplash?: boolean;
}

export const App: React.FC<AppProps> = ({ skipSplash = false }) => {
  const [splashFinished, setSplashFinished] = useState(skipSplash);
  // ... existing code ...

  return (
    <QueryClientProvider client={queryClient}>
      {!splashFinished && (
        <SplashScreen
          onFinish={() => setSplashFinished(true)}
          skipSplash={skipSplash}
        />
      )}
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        {currentRepo ? (
          <RepoContent
            currentRepo={currentRepo}
            clearRepo={clearRepo}
            isGlobalCreateBranchOpen={isGlobalCreateBranchOpen}
            setIsGlobalCreateBranchOpen={setIsGlobalCreateBranchOpen}
          />
        ) : (
          <WelcomeScreen onSelectRepo={setRepo} />
        )}
        <ToastContainer />
        <CommandPalette context={commandContext} />
        <ShortcutsHelpModal
          isOpen={isShortcutsHelpOpen}
          onClose={() => setIsShortcutsHelpOpen(false)}
        />
      </div>
    </QueryClientProvider>
  );
};
```

- [ ] **Step 3: Update App.test.tsx to pass skipSplash or handle timer**

In `src/test/App.test.tsx`:
Update `<App />` render calls to `<App skipSplash={true} />` (or default prop when `process.env.NODE_ENV === "test"` if preferred, but passing prop keeps behavior explicit).

- [ ] **Step 4: Run App.test.tsx to verify it passes**

Run: `npx vitest run src/test/App.test.tsx`  
Expected: PASS (all 7 tests in `App.test.tsx`).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/test/App.test.tsx
git commit -m "✨ integrate splash screen lifecycle into app shell"
```

---

### Task 5: Modals & Command Palette Animation Upgrades

**Files:**
- Modify: `src/components/palette/CommandPalette.tsx`
- Modify: `src/components/shortcuts/ShortcutsHelpModal.tsx`
- Modify: `src/components/sidebar/CreateBranchModal.tsx`
- Modify: `src/components/sidebar/DeleteBranchModal.tsx`
- Modify: `src/components/sidebar/RenameBranchModal.tsx`
- Modify: `src/components/welcome/CloneModal.tsx`
- Modify: `src/components/changes/DiscardConfirmModal.tsx`
- Modify: `src/components/stash/CreateStashModal.tsx`

**Interfaces:**
- Wrap modal containers with `<Transition show={isOpen}>`
- Use `.modal-backdrop` and `.animate-scale-in` / spring curves

- [ ] **Step 1: Update CommandPalette.tsx**

Wrap `CommandPalette` backdrop and dialog in `<Transition show={isOpen}>`, apply `modal-backdrop` and spring scale-in.

- [ ] **Step 2: Run CommandPalette.test.tsx to verify tests pass**

Run: `npx vitest run src/test/CommandPalette.test.tsx`  
Expected: PASS (all 7 tests).

- [ ] **Step 3: Update Branch Modals & Shortcuts Modal**

Update `CreateBranchModal.tsx`, `DeleteBranchModal.tsx`, `RenameBranchModal.tsx`, and `ShortcutsHelpModal.tsx` with smooth scale-in and backdrop transitions.

- [ ] **Step 4: Run Modal tests**

Run: `npx vitest run src/test/CreateBranchModal.test.tsx src/test/DeleteBranchModal.test.tsx src/test/RenameBranchModal.test.tsx src/test/ShortcutsHelpModal.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/palette/CommandPalette.tsx src/components/shortcuts/ShortcutsHelpModal.tsx src/components/sidebar/*.tsx
git commit -m "✨ add spring entrance and exit transitions to all modals"
```

---

### Task 6: Screen & Component UX Upgrades (WelcomeScreen, RepoHeader, Shell, ChangesScreen)

**Files:**
- Modify: `src/components/welcome/WelcomeScreen.tsx`
- Modify: `src/components/header/RepoHeader.tsx`
- Modify: `src/components/Shell.tsx`
- Modify: `src/components/changes/ChangesScreen.tsx`
- Modify: `src/components/changes/CommitBox.tsx`

**Interfaces:**
- Consumes: `.btn-press`, `.card-lift`, `.animate-slide-up`, `--ease-macos`
- Produces: Polished interactive feel, sliding pill on `RepoHeader` tabs, smooth sidebar toggle.

- [ ] **Step 1: Enhance WelcomeScreen.tsx**

- Action cards ("Open Folder", "Clone Repo"): Add `.card-lift` and `.btn-press`.
- Recent repos rows: Smooth hover highlight, `.card-lift` on cards, fade-in action buttons.
- Drag & Drop state: Smooth accent ring pulse when dragging over.
- Keyboard shortcut badges: subtle hover shine.

- [ ] **Step 2: Enhance RepoHeader.tsx**

- Screen switcher tabs (History / Changes): Add smooth sliding pill indicator transition (`transition-all duration-200 ease-macos`).
- Remote sync buttons (Fetch, Pull, Push): Icon spin when in progress, `.btn-press` on click, `.animate-scale-in` on commit count badges.

- [ ] **Step 3: Enhance Shell.tsx & ChangesScreen.tsx**

- `Shell.tsx`: Add `transition-[width] duration-200 ease-macos` to sidebar container so collapsing/expanding is animated.
- `CommitDetailPanel.tsx`: Add `transition-transform duration-200 ease-macos` for smooth slide-in from right.
- `CommitBox.tsx`: Add `.btn-press` to Commit button, smooth focus ring transition on textarea.

- [ ] **Step 4: Run existing component tests to verify no regressions**

Run: `npx vitest run src/test/RepoHeader.test.tsx src/test/Shell.test.tsx src/test/CommitBox.test.tsx src/test/StagingFileList.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/welcome/WelcomeScreen.tsx src/components/header/RepoHeader.tsx src/components/Shell.tsx src/components/diff/CommitDetailPanel.tsx src/components/changes/ChangesScreen.tsx src/components/changes/CommitBox.tsx
git commit -m "🎨 upgrade screen transitions and micro-interactions across views"
```

---

### Task 7: Full Suite Verification & Motion Safety Check

**Files:**
- All tests across `src/test/`

- [ ] **Step 1: Run complete unit & integration test suite**

Run: `npm run test`  
Expected: 100% test files pass (40+ test files, 175+ tests).

- [ ] **Step 2: Run TypeScript build verification**

Run: `npm run build`  
Expected: Clean build (`tsc && vite build`) with exit code 0.

- [ ] **Step 3: Run color contrast verification**

Run: `npm run check-contrast`  
Expected: Clean contrast check without violations.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "✅ verify all motion tests and full test suite"
```
