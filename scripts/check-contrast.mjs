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

// Color palettes from tokens.css (Studio Graphite unified theme & Colorblind mode)
const testSuites = [
  {
    theme: "Studio Graphite (Unified Theme)",
    checks: [
      { name: "Chữ chính trên Nền cửa sổ", fg: "#E5E8EC", bg: "#21252B", minRatio: 4.5 },
      { name: "Chữ chính trên Bề mặt nổi", fg: "#E5E8EC", bg: "#282C34", minRatio: 4.5 },
      { name: "Chữ phụ trên Bề mặt nổi", fg: "#9DA5B4", bg: "#282C34", minRatio: 4.5 },
      { name: "Accent trên Bề mặt nổi", fg: "#409EFF", bg: "#282C34", minRatio: 4.5 },
      { name: "Chữ Diff Thêm trên Nền Diff Thêm", fg: "#49D184", bg: "#1C3328", minRatio: 4.5 },
      { name: "Chữ Diff Xoá trên Nền Diff Xoá", fg: "#F56C6C", bg: "#3B1D22", minRatio: 4.5 },
    ],
  },
  {
    theme: "Colorblind Mode",
    checks: [
      { name: "Diff Thêm (Xanh dương)", fg: "#38BDF8", bg: "#0C283E", minRatio: 4.5 },
      { name: "Diff Xoá (Cam)", fg: "#FBBF24", bg: "#3E240C", minRatio: 4.5 },
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
