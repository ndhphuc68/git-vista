import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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
    "still queries remotes, stashes, tags and runs merge/rebase; removed as features/remote, features/stash and the remaining tag commands land in slice 2",
  "features/stash/components/StashDiffView.tsx":
    "reads commit details to render the stash diff; removed once the commit domain has a hook",
};

/**
 * Cross-feature imports allowed while a feature is mid-migration, as
 * "<importing file>" -> ["<imported feature>", ...]. Same rule as above:
 * temporary, named one by one, and shrinking. Every feature named for a file
 * must still be a real import — the staleness check below fails once one of
 * them is gone.
 */
const CROSS_FEATURE_EXCEPTIONS: Record<string, string[]> = {
  // "remote" added when ManageRemotesModal/PruneConfirmModal moved into
  // features/remote/components; removable once BranchSidebar's remote
  // dialogs are reached through features/remote's own barrel (task 7).
  "features/branch/components/BranchSidebar.tsx": ["tag", "stash", "remote"],
  // This modal belongs to the checkout-branch flow but must stash first;
  // removable once "stash then checkout" has a home of its own.
  "features/branch/components/CheckoutConflictModal.tsx": ["stash"],
};

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
  it("no feature imports another feature", () => {
    const names = featureNames();
    // Guard against the check silently passing because the scan found no feature directories.
    expect(names.length).toBeGreaterThan(0);
    const violations: string[] = [];

    for (const name of names) {
      const files = collectSourceFiles(join(FEATURES, name));
      for (const file of files) {
        // Normalised so an exception key matches on Windows too.
        const rel = relative(SRC, file).replace(/\\/g, "/");
        const source = readFileSync(file, "utf8");
        for (const other of names) {
          if (other === name) continue;
          if (CROSS_FEATURE_EXCEPTIONS[rel]?.includes(other)) continue;
          // Matches both "../<other>" relative hops and "features/<other>" paths.
          const pattern = new RegExp(
            `from\\s+["'][^"']*(?:\\.\\./${other}|features/${other})(?:/|["'])`
          );
          if (pattern.test(source)) {
            violations.push(`${rel} imports feature "${other}"`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
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

  it("every cross-feature exception still names a real import", () => {
    // Stricter than the ipc list: the file must exist AND still import every
    // feature it was excused for. Once one of those imports is gone, that
    // entry has to go too, otherwise it silently re-permits a violation later.
    for (const [rel, others] of Object.entries(CROSS_FEATURE_EXCEPTIONS)) {
      const full = join(SRC, rel);
      expect(() => statSync(full), `stale exception: ${rel}`).not.toThrow();
      const source = readFileSync(full, "utf8");
      for (const other of others) {
        const pattern = new RegExp(
          `from\\s+["'][^"']*(?:\\.\\./${other}|features/${other})(?:/|["'])`
        );
        expect(pattern.test(source), `${rel} no longer imports "${other}" — drop the entry`).toBe(
          true
        );
      }
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
