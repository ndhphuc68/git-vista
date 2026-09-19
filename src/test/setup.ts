import "@testing-library/jest-dom/vitest";

// jsdom reports offsetWidth/offsetHeight as 0 for every element because it has
// no real layout engine. @tanstack/react-virtual measures the container with
// those properties on mount, so without a stub the virtual list renders no items
// in tests even when the underlying data is present.
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
