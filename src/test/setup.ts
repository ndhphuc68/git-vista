import "@testing-library/jest-dom/vitest";

// jsdom báo offsetWidth/offsetHeight = 0 cho mọi phần tử vì không có layout
// engine thật. @tanstack/react-virtual dùng offsetWidth/offsetHeight để đo
// kích thước container khi mount, nên nếu không giả lập, virtual items luôn
// rỗng trong test dù danh sách có dữ liệu.
if (typeof HTMLElement !== "undefined" && !("__patchedForVirtualizer" in HTMLElement.prototype)) {
  Object.defineProperties(HTMLElement.prototype, {
    __patchedForVirtualizer: { value: true },
    offsetWidth: { value: 800, configurable: true },
    offsetHeight: { value: 600, configurable: true },
  });
}

// Mock matchMedia cho jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
