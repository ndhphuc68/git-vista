#!/usr/bin/env node

/**
 * Blocks new lint suppression comments.
 *
 * Every size, complexity and boundary rule in `.oxlintrc.json` is at `error`.
 * A single suppression comment switches one of them off for a line or a file
 * without anyone noticing in review, so the repo keeps an explicit per-file
 * baseline (see `lintSuppressions.mjs`) and this script fails on any
 * difference from it. oxlint's `--report-unused-disable-directives-severity=error` (wired
 * into `pnpm lint`) covers the other half: a suppression that no longer
 * suppresses anything.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  SUPPRESSION_BASELINE,
  countSuppressions,
  findSuppressionViolations,
} from "./lintSuppressions.mjs";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "e2e", "scripts", "website"];
const SKIP_DIRS = new Set(["node_modules", "dist"]);
const EXTENSIONS = /\.(?:ts|tsx|js|mjs|cjs)$/;

/** These files spell out the directive text on purpose. */
const SELF = new Set([
  "scripts/check-lint-suppressions.mjs",
  "scripts/lintSuppressions.mjs",
  "scripts/lintSuppressions.test.mjs",
]);

function collectFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collectFiles(full));
    } else if (EXTENSIONS.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

const counts = {};
for (const dir of SCAN_DIRS) {
  for (const file of collectFiles(join(ROOT, dir))) {
    const rel = relative(ROOT, file).split(sep).join("/");
    if (SELF.has(rel)) continue;
    const count = countSuppressions(readFileSync(file, "utf8"));
    if (count > 0) counts[rel] = count;
  }
}

const violations = findSuppressionViolations(counts, SUPPRESSION_BASELINE);

if (violations.length > 0) {
  console.error(`\nLint suppression comments differ from the baseline:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}: found ${v.found}, allowed ${v.allowed}`);
  }
  console.error(
    `\nFix the code instead of suppressing the rule. If you removed a` +
      `\nsuppression, lower its entry in scripts/lintSuppressions.mjs.\n`
  );
  process.exit(1);
}

console.log("Lint suppression comments match the baseline.");
