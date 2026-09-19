#!/usr/bin/env node

/**
 * Keeps code comments in English.
 *
 * The codebase is a Vietnamese-language product, so Vietnamese belongs in
 * user-facing strings — i18n entries, aria-labels, titles. Comments are read
 * only by developers and the whole codebase writes them in English, so a
 * Vietnamese comment is an inconsistency rather than a localization.
 *
 * This is a script rather than a lint rule because oxlint has no
 * `no-restricted-syntax`, the same reason `check-query-keys.mjs` is a script.
 *
 * Detection is deliberately narrow: it only flags lines that are comments AND
 * contain a Vietnamese-specific diacritic. A comment mentioning a Vietnamese
 * UI string in passing would be a false positive, so add such a file to
 * SKIP_FILES with a reason rather than loosening the pattern.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "scripts"];

/**
 * Files exempt from the check, each with the reason.
 *
 * `src/i18n/*` hold the translation dictionaries themselves. `check-contrast.mjs`
 * predates this rule; translating it is unrelated cleanup, not a blocker.
 */
const SKIP_FILES = new Set([
  join("src", "i18n", "vi.ts"),
  join("src", "i18n", "en.ts"),
  join("src", "i18n", "index.ts"),
  join("scripts", "check-contrast.mjs"),
]);

/** Characters that exist in Vietnamese but not in English. */
const VIETNAMESE = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

/** A line that is (or continues) a comment. Good enough — it never reads code. */
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

function collectFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      found.push(...collectFiles(full));
    } else if (/\.(tsx?|mjs|js)$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of collectFiles(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (SKIP_FILES.has(rel)) continue;

    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, index) => {
        if (COMMENT_LINE.test(line) && VIETNAMESE.test(line)) {
          violations.push({ file: rel, line: index + 1, text: line.trim() });
        }
      });
  }
}

if (violations.length > 0) {
  console.error(`\nFound ${violations.length} non-English comment(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}`);
  }
  console.error(
    `\nWrite comments in English (see AGENTS.md → Language).` +
      `\nUser-facing text keeps the product's language — i18n entries,` +
      `\naria-labels and titles are unaffected by this check.\n`
  );
  process.exit(1);
}

console.log("All comments are in English.");
