#!/usr/bin/env node

/**
 * Script kiểm tra độ tương phản màu sắc (WCAG 2.1 AA - tối thiểu 4.5:1)
 * cho bảng màu chính và màu diff theo đặc tả mục 7.2.
 * Chạy trong CI để đảm bảo không bị suy giảm khả năng tiếp cận.
 */

// Hàm chuyển đổi hex sang RGB
function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "").trim();
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Tính luminance chuẩn theo sRGB WCAG
function getLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Tính Contrast Ratio: (L1 + 0.05) / (L2 + 0.05)
function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Color palettes from tokens.css (VS Code Dark Modern, Light Modern & Colorblind modes)
const testSuites = [
  {
    theme: "VS Code Dark Modern (Default Dark)",
    checks: [
      { name: "Primary text on window bg", fg: "#cccccc", bg: "#181818", minRatio: 4.5 },
      { name: "Primary text on surface bg", fg: "#cccccc", bg: "#1f1f1f", minRatio: 4.5 },
      { name: "Secondary text on surface bg", fg: "#9d9d9d", bg: "#1f1f1f", minRatio: 4.5 },
      { name: "Accent on surface bg", fg: "#3794ff", bg: "#1f1f1f", minRatio: 4.5 },
      { name: "Diff add text on diff add bg", fg: "#49d184", bg: "#1e382b", minRatio: 4.5 },
      { name: "Diff remove text on diff remove bg", fg: "#ff7b72", bg: "#421d23", minRatio: 4.5 },
    ],
  },
  {
    theme: "VS Code Light Modern",
    checks: [
      { name: "Primary text on window bg", fg: "#1f1f1f", bg: "#f8f8f8", minRatio: 4.5 },
      { name: "Primary text on surface bg", fg: "#1f1f1f", bg: "#ffffff", minRatio: 4.5 },
      { name: "Secondary text on surface bg", fg: "#616161", bg: "#ffffff", minRatio: 4.5 },
      { name: "Accent on surface bg", fg: "#005fb8", bg: "#ffffff", minRatio: 4.5 },
      { name: "Diff add text on diff add bg", fg: "#1a7f37", bg: "#e6ffec", minRatio: 4.5 },
      { name: "Diff remove text on diff remove bg", fg: "#cf222e", bg: "#ffebe9", minRatio: 4.5 },
    ],
  },
  {
    theme: "Colorblind Mode (Dark)",
    checks: [
      { name: "Diff add (Sky blue)", fg: "#38bdf8", bg: "#0c283e", minRatio: 4.5 },
      { name: "Diff remove (Amber)", fg: "#fbbf24", bg: "#3e240c", minRatio: 4.5 },
    ],
  },
  {
    theme: "Colorblind Mode (Light)",
    checks: [
      { name: "Diff add (Blue)", fg: "#0969da", bg: "#ddf4ff", minRatio: 4.5 },
      { name: "Diff remove (Gold/Brown)", fg: "#9a6700", bg: "#fff8c5", minRatio: 4.5 },
    ],
  },
];

console.log("🔍 Kiểm tra độ tương phản màu sắc (WCAG AA - Min 4.5:1)...\n");
let failed = 0;

for (const suite of testSuites) {
  console.log(`--- ${suite.theme} ---`);
  for (const check of suite.checks) {
    const ratio = getContrastRatio(check.fg, check.bg);
    const passed = ratio >= check.minRatio;
    const icon = passed ? "✅" : "❌";
    console.log(
      `  ${icon} ${check.name}: ${ratio.toFixed(2)}:1 (Yêu cầu: >= ${check.minRatio}:1) [fg: ${check.fg}, bg: ${check.bg}]`
    );
    if (!passed) {
      failed++;
    }
  }
  console.log("");
}

if (failed > 0) {
  console.error(`❌ Kiểm tra thất bại! Có ${failed} cặp màu không đạt chuẩn WCAG AA 4.5:1.`);
  process.exit(1);
} else {
  console.log("✨ Toàn bộ bảng màu đạt chuẩn tương phản WCAG AA 4.5:1!");
  process.exit(0);
}
