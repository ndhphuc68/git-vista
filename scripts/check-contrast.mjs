#!/usr/bin/env node

/**
 * Script kiểm tra độ tương phản màu sắc (WCAG 2.1 AA - tối thiểu 4.5:1)
 * cho bảng màu chính và màu diff theo đặc tả mục 7.2.
 * Chạy trong CI để đảm bảo không bị suy giảm khả năng tiếp cận.
 */

// Hàm chuyển đổi hex sang RGB
function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '').trim();
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

// Bảng màu từ spec & tokens.css
const testSuites = [
  {
    theme: 'Light Theme',
    checks: [
      { name: 'Chữ chính trên Nền cửa sổ', fg: '#1A1918', bg: '#F5F3F1', minRatio: 4.5 },
      { name: 'Chữ chính trên Bề mặt nổi', fg: '#1A1918', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'Chữ phụ trên Bề mặt nổi', fg: '#6B6764', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'Accent trên Bề mặt nổi', fg: '#2F6FEB', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'Chữ Diff Thêm trên Nền Diff Thêm', fg: '#0E4429', bg: '#DAFBE1', minRatio: 4.5 },
      { name: 'Chữ Diff Xoá trên Nền Diff Xoá', fg: '#82071E', bg: '#FFEBE9', minRatio: 4.5 },
    ],
  },
  {
    theme: 'Dark Theme',
    checks: [
      { name: 'Chữ chính trên Nền cửa sổ', fg: '#EDEBE9', bg: '#1C1B1A', minRatio: 4.5 },
      { name: 'Chữ chính trên Bề mặt nổi', fg: '#EDEBE9', bg: '#252423', minRatio: 4.5 },
      { name: 'Chữ phụ trên Bề mặt nổi', fg: '#98938E', bg: '#252423', minRatio: 4.5 },
      { name: 'Accent trên Bề mặt nổi', fg: '#4D8DFF', bg: '#252423', minRatio: 4.5 },
      { name: 'Chữ Diff Thêm trên Nền Diff Thêm', fg: '#3FB950', bg: '#12261E', minRatio: 4.5 },
      { name: 'Chữ Diff Xoá trên Nền Diff Xoá', fg: '#F85149', bg: '#2D1416', minRatio: 4.5 },
    ],
  },
  {
    theme: 'Colorblind Mode (Light & Dark)',
    checks: [
      { name: 'Light: Diff Thêm (Xanh dương)', fg: '#0369A1', bg: '#E0F2FE', minRatio: 4.5 },
      { name: 'Light: Diff Xoá (Cam)', fg: '#B45309', bg: '#FEF3C7', minRatio: 4.5 },
      { name: 'Dark: Diff Thêm (Xanh dương)', fg: '#38BDF8', bg: '#0C283E', minRatio: 4.5 },
      { name: 'Dark: Diff Xoá (Cam)', fg: '#FBBF24', bg: '#3E240C', minRatio: 4.5 },
    ],
  },
];

console.log('🔍 Kiểm tra độ tương phản màu sắc (WCAG AA - Min 4.5:1)...\n');
let failed = 0;

for (const suite of testSuites) {
  console.log(`--- ${suite.theme} ---`);
  for (const check of suite.checks) {
    const ratio = getContrastRatio(check.fg, check.bg);
    const passed = ratio >= check.minRatio;
    const icon = passed ? '✅' : '❌';
    console.log(
      `  ${icon} ${check.name}: ${ratio.toFixed(2)}:1 (Yêu cầu: >= ${check.minRatio}:1) [fg: ${check.fg}, bg: ${check.bg}]`
    );
    if (!passed) {
      failed++;
    }
  }
  console.log('');
}

if (failed > 0) {
  console.error(`❌ Kiểm tra thất bại! Có ${failed} cặp màu không đạt chuẩn WCAG AA 4.5:1.`);
  process.exit(1);
} else {
  console.log('✨ Toàn bộ bảng màu đạt chuẩn tương phản WCAG AA 4.5:1!');
  process.exit(0);
}

