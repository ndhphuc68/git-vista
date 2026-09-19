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
 * Task 9 adds CheckoutConflictModal here when it moves into the feature.
 */
const IPC_IMPORT_EXCEPTIONS: Record<string, string> = {};

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
        const source = readFileSync(file, "utf8");
        for (const other of names) {
          if (other === name) continue;
          // Matches both "../<other>" relative hops and "features/<other>" paths.
          const pattern = new RegExp(`from\\s+["'][^"']*(?:\\.\\./${other}|features/${other})(?:/|["'])`);
          if (pattern.test(source)) {
            violations.push(`${relative(SRC, file)} imports feature "${other}"`);
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
        if (/from\s+["'][^"']*\/ipc\//.test(source)) {
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
