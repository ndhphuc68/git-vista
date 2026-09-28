import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative } from "node:path";

const SRC = join(process.cwd(), "src");
const FEATURES = join(SRC, "features");

/** Recursively collect every .ts/.tsx file under dir. Returns [] if dir is absent. */
function collectSourceFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Files allowed to import ipc/ outside api/, each with its reason and exit
 * condition. Every entry is temporary — shrink this list, never grow it.
 */
const IPC_IMPORT_EXCEPTIONS: Record<string, string> = {
  "features/branch/components/DeleteBranchModal.tsx":
    "undo toast calls undoDeleteBranch; removed once the undo domain has a hook",
  "features/branch/components/BranchSidebar.tsx":
    "queries getRemotes/getRepoStatus/getStashes/getTags directly and runs checkoutTag, pushTag, mergeBranch, rebaseBranch and undoDropStash; removed once the two remaining tag commands, merge/rebase and the undo domain each have a hook",
  "features/stash/components/StashDiffView.tsx":
    "reads commit details to render the stash diff; removed once the commit domain has a hook",
};

/**
 * Every import specifier a source file can use to create a static or dynamic
 * dependency on another module: `import … from "…"`, `import "…"`
 * (side-effect), `export … from "…"` (including `export type`), and dynamic
 * `import("…")`. `import type` is intentionally included — a type-only deep
 * import still names a private module of another feature, and the
 * public-interface rule is about that seam, not about what survives to
 * runtime.
 */
function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?[\s\S]*?\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[\s\S]*?\bfrom\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]!);
    }
  }
  return specifiers;
}

/**
 * Resolves `specifier`, written inside `importingFileRel` (a file path
 * relative to src/, forward-slashed), against the importing file's directory.
 * Returns the resolved path relative to src/ (forward-slashed), or null when
 * the specifier is not relative and not a bare `features/...` path (e.g. a
 * package import, which is never a cross-feature concern).
 *
 * An explicit "/index" segment is intentionally NOT collapsed: it is a
 * distinct, deeper specifier than the bare feature directory even though
 * both resolve to the same file on disk, and the public-interface rule only
 * allows the bare directory form.
 */
function resolveSpecifier(importingFileRel: string, specifier: string): string | null {
  if (specifier.startsWith(".")) {
    const fromDir = posix.dirname(importingFileRel);
    return posix.normalize(posix.join(fromDir, specifier));
  }
  if (specifier === "features" || specifier.startsWith("features/")) {
    return specifier;
  }
  return null;
}

/**
 * Classifies one import specifier written inside `importingFileRel` (a path
 * relative to src/, forward-slashed, e.g. "features/branch/components/
 * BranchSidebar.tsx"). Returns a human-readable violation message, or null
 * when the import is allowed.
 *
 * Allowed:
 *   - anything that does not resolve into src/features/<other> at all
 *     (same-feature imports, shared/, store/, node_modules, ...)
 *   - a specifier that resolves to EXACTLY src/features/<other> — the
 *     feature's public index.ts
 *
 * Forbidden: any specifier that resolves INTO another feature's directory
 * without stopping at its root (deep imports into api/, components/, model/,
 * or an explicit "/index").
 */
function crossFeatureViolation(importingFileRel: string, specifier: string): string | null {
  const match = /^features\/([^/]+)\//.exec(importingFileRel);
  if (!match) return null;
  const ownFeature = match[1]!;

  const resolved = resolveSpecifier(importingFileRel, specifier);
  if (resolved === null) return null;

  const target = /^features\/([^/]+)(\/.*)?$/.exec(resolved);
  if (!target) return null;
  const otherFeature = target[1]!;
  const rest = target[2] ?? "";

  if (otherFeature === ownFeature) return null; // same-feature import, unaffected
  if (rest === "") return null; // resolves to exactly the feature root: its public index.ts

  return `${importingFileRel} imports "${specifier}" -> features/${otherFeature}${rest} (deep import; only the public index is allowed)`;
}

/**
 * True when the source pulls a VALUE out of ipc/ at runtime — the thing the
 * layer rule forbids outside api/.
 *
 * Type-only imports are erased at compile time and create no runtime
 * dependency, so a model file may name an IPC type without calling one. Only
 * these two spellings count as type-only:
 *   `import type { X } from "…/ipc/…"`
 *   `import { type X, type Y } from "…/ipc/…"`   (EVERY binding marked)
 *
 * Everything else is a runtime dependency, including the three forms that an
 * earlier, narrower version of this check silently let through:
 *   `import "…/ipc/…"`                       (side effect — runs the module)
 *   `export { x } from "…/ipc/…"`            (re-export of a live binding)
 *   `import d, { type X } from "…/ipc/…"`    (default specifier outside {})
 */
function importsIpcAtRuntime(source: string): boolean {
  const IPC_PATH = String.raw`["'][^"']*\/ipc\/[^"']*["']`;

  // A side-effect import has no bindings at all but still executes the module.
  if (new RegExp(String.raw`^\s*import\s+${IPC_PATH}`, "m").test(source)) return true;

  // `export ... from "…/ipc/…"` re-exports a live binding unless it is
  // `export type`, which is erased like a type-only import.
  // [^;] keeps a match inside one statement: with [\s\S] the lazy quantifier
  // happily spans earlier imports, so `import React from "react"; … import
  // { type X } from "…/ipc/…"` came back as one statement with a default
  // specifier and was wrongly flagged as a runtime import.
  const reExports = source.match(new RegExp(String.raw`export\s[^;]*?from\s+${IPC_PATH}`, "g"));
  if (reExports?.some((statement) => !/^export\s+type\b/.test(statement))) return true;

  const imports = source.match(new RegExp(String.raw`import\s[^;]*?from\s+${IPC_PATH}`, "g"));
  if (!imports) return false;

  return imports.some((statement) => {
    if (/^import\s+type\b/.test(statement)) return false;

    // Everything between `import` and `from` — default and namespace
    // specifiers included, not just the brace group.
    const clause = statement
      .replace(/^import\s+/, "")
      .replace(/\s+from[\s\S]*$/, "")
      .trim();
    const braces = clause.match(/\{([\s\S]*)\}/);

    // No brace group means a bare default or namespace import: always a value.
    if (!braces) return true;

    // A default or namespace specifier sitting outside the braces is a value
    // even when every named binding is type-only.
    if (clause.slice(0, clause.indexOf("{")).replace(/,/g, "").trim() !== "") return true;

    const bindings = braces[1]!
      .split(",")
      .map((binding) => binding.trim())
      .filter(Boolean);
    if (bindings.length === 0) return true;

    return !bindings.every((binding) => /^type\s/.test(binding));
  });
}

/** Names of the feature directories that currently exist. */
function featureNames(): string[] {
  try {
    return readdirSync(FEATURES).filter((name) => statSync(join(FEATURES, name)).isDirectory());
  } catch {
    return [];
  }
}

describe("architecture boundaries", () => {
  it("features import other features only through their public index", () => {
    const names = featureNames();
    // Guard against the check silently passing because the scan found no feature directories.
    expect(names.length).toBeGreaterThan(0);
    const violations: string[] = [];

    for (const name of names) {
      const files = collectSourceFiles(join(FEATURES, name));
      for (const file of files) {
        // Normalised so specifier resolution works the same on Windows.
        const rel = relative(SRC, file).replace(/\\/g, "/");
        const source = readFileSync(file, "utf8");
        for (const specifier of extractImportSpecifiers(source)) {
          const violation = crossFeatureViolation(rel, specifier);
          if (violation) violations.push(violation);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("feature -> feature public imports form no cycle", () => {
    const names = featureNames();
    expect(names.length).toBeGreaterThan(0);

    // Build the graph of feature -> feature edges created by public imports
    // (i.e. imports that crossFeatureViolation allows: those resolving to
    // exactly src/features/<other>).
    const edges = new Map<string, Set<string>>();
    for (const name of names) edges.set(name, new Set());

    for (const name of names) {
      const files = collectSourceFiles(join(FEATURES, name));
      for (const file of files) {
        const rel = relative(SRC, file).replace(/\\/g, "/");
        const source = readFileSync(file, "utf8");
        for (const specifier of extractImportSpecifiers(source)) {
          const resolved = resolveSpecifier(rel, specifier);
          if (resolved === null) continue;
          const target = /^features\/([^/]+)$/.exec(resolved);
          if (!target) continue;
          const otherFeature = target[1]!;
          if (otherFeature !== name) edges.get(name)!.add(otherFeature);
        }
      }
    }

    // Depth-first search for a cycle, recording the path so a failure prints it.
    const WHITE = 0,
      GRAY = 1,
      BLACK = 2;
    const color = new Map<string, number>(names.map((n) => [n, WHITE]));
    const path: string[] = [];
    // Boxed in an object so TS does not (mis)narrow the field to `null` across
    // the closure below, which mutates it on the other side of a function call.
    const state: { cycle: string[] | null } = { cycle: null };

    function visit(node: string) {
      if (state.cycle) return;
      color.set(node, GRAY);
      path.push(node);
      for (const next of edges.get(node) ?? []) {
        if (state.cycle) return;
        if (color.get(next) === GRAY) {
          const start = path.indexOf(next);
          state.cycle = [...path.slice(start), next];
          return;
        }
        if (color.get(next) === WHITE) visit(next);
      }
      path.pop();
      color.set(node, BLACK);
    }

    for (const name of names) {
      if (color.get(name) === WHITE) visit(name);
      if (state.cycle) break;
    }

    const { cycle } = state;
    const message = cycle ? `cycle found: ${cycle.join(" -> ")}` : undefined;
    expect(cycle, message).toBeNull();
  });

  it("only features/*/api may import ipc/", () => {
    const names = featureNames();
    // Guard against the check silently passing because the scan found no feature directories.
    expect(names.length).toBeGreaterThan(0);
    const violations: string[] = [];

    for (const name of names) {
      const files = collectSourceFiles(join(FEATURES, name));
      for (const file of files) {
        const rel = relative(SRC, file).replace(/\\/g, "/");
        if (rel.includes(`features/${name}/api/`)) continue;
        if (rel in IPC_IMPORT_EXCEPTIONS) continue;
        const source = readFileSync(file, "utf8");
        if (importsIpcAtRuntime(source)) {
          violations.push(`${rel} imports ipc/ outside of api/`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("every ipc-import exception still exists", () => {
    // An exception left behind after its file moved or was cleaned up would
    // silently widen the rule. Each entry must name a real file.
    for (const rel of Object.keys(IPC_IMPORT_EXCEPTIONS)) {
      expect(() => statSync(join(SRC, rel)), `stale exception: ${rel}`).not.toThrow();
    }
  });

  it("shared/ui does not import ipc, store, or i18n", () => {
    const files = collectSourceFiles(join(SRC, "shared", "ui"));
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (/from\s+["'][^"']*\/(ipc|store|i18n)(\/|["'])/.test(source)) {
        violations.push(relative(SRC, file));
      }
    }

    expect(violations).toEqual([]);
    // Guard against the check silently passing because the glob found nothing.
    expect(files.length).toBeGreaterThan(0);
  });
});

describe("crossFeatureViolation", () => {
  const FILE = "features/branch/components/BranchSidebar.tsx";

  it.each([
    ["public import, one level up", "../stash"],
    ["public import, two levels up", "../../stash"],
    ["public import, three levels up", "../../../features/stash"],
    ["public import, bare features/ path", "features/stash"],
  ])("allows %s (%s)", (_label, specifier) => {
    expect(crossFeatureViolation(FILE, specifier)).toBeNull();
  });

  it.each([
    ["deep api import", "../../stash/api"],
    ["deep components import", "../../stash/components/StashDiffView"],
    ["deep model import", "../../stash/model/stashTree"],
    ["explicit /index", "../../stash/index"],
    ["bare features/ deep import", "features/stash/model/y"],
  ])("forbids %s (%s)", (_label, specifier) => {
    expect(crossFeatureViolation(FILE, specifier)).not.toBeNull();
  });

  it("allows a same-feature deep import", () => {
    expect(crossFeatureViolation(FILE, "../model/branchTree")).toBeNull();
  });

  it("allows a non-feature import", () => {
    expect(crossFeatureViolation(FILE, "../../../store/useRepoStore")).toBeNull();
    expect(crossFeatureViolation(FILE, "react")).toBeNull();
  });

  it("forbids a side-effect deep import", () => {
    const specifiers = extractImportSpecifiers(`import "../../stash/api";`);
    expect(specifiers).toEqual(["../../stash/api"]);
    expect(crossFeatureViolation(FILE, specifiers[0]!)).not.toBeNull();
  });

  it("forbids an export-from deep import", () => {
    const specifiers = extractImportSpecifiers(
      `export { useApplyStash } from "../../stash/api";`
    );
    expect(specifiers).toEqual(["../../stash/api"]);
    expect(crossFeatureViolation(FILE, specifiers[0]!)).not.toBeNull();
  });

  it("forbids a type-only deep import", () => {
    const specifiers = extractImportSpecifiers(`import type { StashItem } from "../../stash/api";`);
    expect(specifiers).toEqual(["../../stash/api"]);
    expect(crossFeatureViolation(FILE, specifiers[0]!)).not.toBeNull();
  });

  it("forbids a dynamic deep import", () => {
    const specifiers = extractImportSpecifiers(`const m = await import("../../stash/api");`);
    expect(specifiers).toEqual(["../../stash/api"]);
    expect(crossFeatureViolation(FILE, specifiers[0]!)).not.toBeNull();
  });

  it("allows a dynamic public import", () => {
    const specifiers = extractImportSpecifiers(`const m = await import("../../stash");`);
    expect(specifiers).toEqual(["../../stash"]);
    expect(crossFeatureViolation(FILE, specifiers[0]!)).toBeNull();
  });
});

describe("importsIpcAtRuntime", () => {
  const IPC = '"../../../ipc/client"';

  it.each([
    ["named value import", `import { invokeCommand } from ${IPC};`],
    ["default import", `import client from ${IPC};`],
    ["namespace import", `import * as ipc from ${IPC};`],
    ["mixed type and value bindings", `import { type Tag, commands } from ${IPC};`],
    ["default alongside type-only bindings", `import client, { type Tag } from ${IPC};`],
    ["side-effect import", `import ${IPC};`],
    ["re-export of a live binding", `export { invokeCommand } from ${IPC};`],
    ["multi-line value import", `import {\n  invokeCommand,\n  other,\n} from ${IPC};`],
  ])("flags %s", (_label, source) => {
    expect(importsIpcAtRuntime(source)).toBe(true);
  });

  it.each([
    ["import type syntax", `import type { Tag } from ${IPC};`],
    ["every binding marked type", `import { type Tag, type Branch } from ${IPC};`],
    ["export type re-export", `export type { Tag } from ${IPC};`],
    ["a path that merely starts with ipc", `import { helper } from "../ipcHelpers/util";`],
    [
      "a type-only ipc import preceded by other imports",
      `import React from "react";\nimport clsx from "clsx";\nimport { type Tag } from ${IPC};`,
    ],
    ["no ipc import at all", `import { useState } from "react";`],
  ])("ignores %s", (_label, source) => {
    expect(importsIpcAtRuntime(source)).toBe(false);
  });
});
