#!/usr/bin/env node

/**
 * Chặn query key literal quay trở lại code.
 *
 * Bối cảnh: dự án từng có bug cache vì cùng một dữ liệu được đặt key khác
 * chữ ở các file khác nhau — `["repo_status", path]` ở nơi này, nhưng
 * `["repoStatus", path]` ở nơi kia. React Query coi hai chuỗi đó là hai
 * cache riêng biệt, nên invalidate bên này không làm mới bên kia và người
 * dùng thấy dữ liệu cũ. Giai đoạn 1 đã gom toàn bộ về `src/domain/queryKeys.ts`.
 *
 * Script này giữ cho nó không tái phát. Đáng lẽ dùng luật lint, nhưng oxlint
 * không có `no-restricted-syntax` (chỉ có các biến thể hẹp như
 * no-restricted-imports), nên kiểm tra bằng script giống `check-contrast.mjs`.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** Nơi query key literal được phép tồn tại. */
const ALLOWED = [join("src", "domain", "queryKeys.ts"), join("src", "domain", "queryKeys.test.ts")];

/** Test được miễn: nhiều test cố tình dựng key thô để kiểm tra hành vi cache. */
const isTestFile = (path) => path.includes(`${join("src", "test")}`) || /\.test\.tsx?$/.test(path);

/**
 * `queryKey` theo sau là mảng mở đầu bằng chuỗi, ví dụ `queryKey: ["repo_status"`.
 *
 * `\s*` trước dấu hai chấm bắt cả `queryKey :`, và `\s` sau `[` bao gồm cả xuống
 * dòng nên bắt được mảng viết nhiều dòng (Prettier hay ngắt dòng key dài).
 * Vì vậy phải quét trên toàn bộ nội dung file chứ không quét từng dòng.
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
    // Đếm số xuống dòng trước vị trí khớp để suy ra số dòng.
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    const text = content.slice(match.index, match.index + 80).split(/\r?\n/)[0];
    violations.push({ file: rel, line, text: text.trim() });
  }
}

if (violations.length > 0) {
  console.error(`\nTìm thấy ${violations.length} query key literal:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}`);
  }
  console.error(
    `\nDùng \`qk\` từ src/domain/queryKeys.ts thay vì viết key trực tiếp.` +
      `\nKey viết tay từng gây bug cache: cùng dữ liệu nhưng khác chữ thì` +
      `\ninvalidate không khớp, và người dùng thấy dữ liệu cũ.\n`
  );
  process.exit(1);
}

console.log("Không có query key literal nào ngoài src/domain/queryKeys.ts.");
