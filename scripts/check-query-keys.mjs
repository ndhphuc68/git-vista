#!/usr/bin/env node

/**
 * Blocks query key literals from creeping back into the code.
 *
 * Background: the project once had a cache bug because the same data was
 * keyed with differently-spelled keys in different files — `["repo_status",
 * path]` in one place, but `["repoStatus", path]` in another. React Query
 * treats those two strings as separate caches, so invalidating one didn't
 * refresh the other and users saw stale data. Phase 1 consolidated all of
 * this into `src/domain/queryKeys.ts`.
 *
 * This script keeps that from happening again. A lint rule would be the
 * natural fit, but oxlint has no `no-restricted-syntax` (only narrower
 * variants like no-restricted-imports), so this is enforced with a script,
 * the same way `check-contrast.mjs` does.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** Places where a query key literal is allowed to exist. */
const ALLOWED = [join("src", "domain", "queryKeys.ts"), join("src", "domain", "queryKeys.test.ts")];

/** Tests are exempt: many tests intentionally build raw keys to check cache behavior. */
const isTestFile = (path) => path.includes(`${join("src", "test")}`) || /\.test\.tsx?$/.test(path);

/**
 * `queryKey` followed by an array that starts with a string literal, e.g.
 * `queryKey: ["repo_status"`.
 *
 * The `\s*` before the colon also matches `queryKey :`, and the `\s` after
 * `[` includes newlines, so it catches arrays written across multiple lines
 * (Prettier often wraps long keys). Because of this, the whole file content
 * must be scanned at once rather than line by line.
 */
const LITERAL_KEY = /queryKey\s*:\s*\[\s*["'`]/g;

function collectFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collectFiles(full));
    } else if (/\.tsx?$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

const violations = [];

for (const file of collectFiles(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOWED.includes(rel) || isTestFile(rel)) continue;

  const content = readFileSync(file, "utf8");
  LITERAL_KEY.lastIndex = 0;

  let match;
  while ((match = LITERAL_KEY.exec(content)) !== null) {
    // Count newlines before the match position to derive the line number.
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    const text = content.slice(match.index, match.index + 80).split(/\r?\n/)[0];
    violations.push({ file: rel, line, text: text.trim() });
  }
}

if (violations.length > 0) {
  console.error(`\nFound ${violations.length} query key literal(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}`);
  }
  console.error(
    `\nUse \`qk\` from src/domain/queryKeys.ts instead of writing a key directly.` +
      `\nHand-written keys have caused cache bugs before: the same data with a` +
      `\ndifferent spelling means invalidation doesn't match, and users see stale data.\n`
  );
  process.exit(1);
}

console.log("No query key literals found outside src/domain/queryKeys.ts.");
