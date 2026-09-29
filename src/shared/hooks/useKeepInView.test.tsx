import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import { useKeepInView } from "./useKeepInView";

function Popup() {
  const ref = useRef<HTMLDivElement>(null);
  useKeepInView(ref);
  return <div ref={ref} data-testid="popup" />;
}

function mockRect(left: number, right: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    left,
    right,
    top: 0,
    bottom: 0,
    width: right - left,
    height: 0,
    x: left,
    y: 0,
    toJSON: () => ({}),
  });
}

describe("useKeepInView", () => {
  beforeEach(() => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1000);
  });
  afterEach(() => vi.restoreAllMocks());

  it("shifts a popup that overflows the left edge back into view", () => {
    mockRect(-40, 248);
    render(<Popup />);
    const popup = screen.getByTestId("popup");
    expect(popup.style.translate).toBe("48px 0");
    expect(popup.style.maxWidth).toBe("");
  });

  it("shifts a popup that overflows the right edge back into view", () => {
    mockRect(800, 1100);
    render(<Popup />);
    expect(screen.getByTestId("popup").style.translate).toBe("-108px 0");
  });

  it("narrows a popup that is wider than the visible area", () => {
    mockRect(-100, 1100);
    render(<Popup />);
    const popup = screen.getByTestId("popup");
    expect(popup.style.maxWidth).toBe("984px");
    expect(popup.style.minWidth).toBe("0px");
  });

  it("leaves a popup that already fits untouched", () => {
    mockRect(100, 400);
    render(<Popup />);
    const popup = screen.getByTestId("popup");
    expect(popup.style.translate).toBe("");
    expect(popup.style.maxWidth).toBe("");
  });
});
