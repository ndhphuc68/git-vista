import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useFocusTrap } from "./useFocusTrap";

/**
 * Minimal harness: a container that traps focus while `enabled` is true.
 * Kept deliberately dumb so the tests exercise the hook, not a component.
 */
function Trapped({
  enabled,
  children,
}: {
  enabled: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, enabled);
  return (
    <div ref={ref} data-testid="trap">
      {children ?? (
        <>
          <button type="button">first</button>
          <button type="button">middle</button>
          <button type="button">last</button>
        </>
      )}
    </div>
  );
}

describe("useFocusTrap", () => {
  let opener: HTMLButtonElement;

  beforeEach(() => {
    opener = document.createElement("button");
    opener.textContent = "opener";
    document.body.appendChild(opener);
    opener.focus();
  });

  afterEach(() => {
    opener.remove();
  });

  describe("initial focus", () => {
    it("moves focus into the container when enabled", () => {
      render(<Trapped enabled />);

      expect(document.activeElement).toBe(screen.getByText("first"));
    });

    it("focuses the container itself when it has no focusable children", () => {
      render(
        <Trapped enabled>
          <p>nothing focusable here</p>
        </Trapped>
      );

      expect(document.activeElement).toBe(screen.getByTestId("trap"));
    });

    it("leaves focus alone while disabled", () => {
      render(<Trapped enabled={false} />);

      expect(document.activeElement).toBe(opener);
    });

    it("honours an element marked with data-autofocus over the first focusable", () => {
      render(
        <Trapped enabled>
          <button type="button">first</button>
          <input data-autofocus aria-label="preferred" />
        </Trapped>
      );

      expect(document.activeElement).toBe(screen.getByLabelText("preferred"));
    });

    it("skips disabled and hidden elements when picking initial focus", () => {
      render(
        <Trapped enabled>
          <button type="button" disabled>
            disabled
          </button>
          <button type="button" hidden>
            hidden
          </button>
          <button type="button">reachable</button>
        </Trapped>
      );

      expect(document.activeElement).toBe(screen.getByText("reachable"));
    });
  });

  describe("trapping Tab", () => {
    it("wraps from the last element forward to the first", () => {
      render(<Trapped enabled />);
      const last = screen.getByText("last");
      const first = screen.getByText("first");
      act(() => last.focus());

      fireEvent.keyDown(last, { key: "Tab" });

      expect(document.activeElement).toBe(first);
    });

    it("wraps from the first element backward to the last (Shift+Tab)", () => {
      render(<Trapped enabled />);
      const first = screen.getByText("first");
      const last = screen.getByText("last");
      act(() => first.focus());

      fireEvent.keyDown(first, { key: "Tab", shiftKey: true });

      expect(document.activeElement).toBe(last);
    });

    it("does not hijack Tab between interior elements", () => {
      render(<Trapped enabled />);
      const first = screen.getByText("first");
      act(() => first.focus());

      const event = fireEvent.keyDown(first, { key: "Tab" });

      // The browser's own tab order handles this move, so the hook must NOT
      // preventDefault — fireEvent returns false when preventDefault was called.
      expect(event).toBe(true);
      expect(document.activeElement).toBe(first);
    });

    it("pulls focus back in if it escapes to the last element via a stray Tab", () => {
      render(<Trapped enabled />);
      const last = screen.getByText("last");
      act(() => last.focus());

      const event = fireEvent.keyDown(last, { key: "Tab" });

      expect(event).toBe(false);
      expect(document.activeElement).toBe(screen.getByText("first"));
    });

    it("ignores keys other than Tab", () => {
      render(<Trapped enabled />);
      const last = screen.getByText("last");
      act(() => last.focus());

      fireEvent.keyDown(last, { key: "Enter" });

      expect(document.activeElement).toBe(last);
    });

    it("does not trap Tab while disabled", () => {
      render(<Trapped enabled={false} />);
      const last = screen.getByText("last");
      act(() => last.focus());

      const event = fireEvent.keyDown(last, { key: "Tab" });

      expect(event).toBe(true);
      expect(document.activeElement).toBe(last);
    });
  });

  describe("restoring focus", () => {
    it("returns focus to the opener when unmounted", () => {
      const { unmount } = render(<Trapped enabled />);
      expect(document.activeElement).not.toBe(opener);

      unmount();

      expect(document.activeElement).toBe(opener);
    });

    it("returns focus to the opener when disabled without unmounting", () => {
      const { rerender } = render(<Trapped enabled />);
      expect(document.activeElement).not.toBe(opener);

      rerender(<Trapped enabled={false} />);

      expect(document.activeElement).toBe(opener);
    });

    it("does not throw when the opener is gone by the time it closes", () => {
      const { unmount } = render(<Trapped enabled />);
      opener.remove();

      expect(() => unmount()).not.toThrow();
    });

    it("does not steal focus back if something else was focused meanwhile", () => {
      const { rerender } = render(<Trapped enabled />);
      const outside = document.createElement("input");
      document.body.appendChild(outside);

      rerender(<Trapped enabled={false} />);
      // Simulate the app moving focus somewhere deliberate after close.
      outside.focus();

      expect(document.activeElement).toBe(outside);
      outside.remove();
    });
  });

  describe("nested traps", () => {
    it("only the innermost enabled trap handles Tab wrapping", () => {
      render(
        <Trapped enabled>
          <button type="button">outer-first</button>
          <Trapped enabled>
            <button type="button">inner-first</button>
            <button type="button">inner-last</button>
          </Trapped>
        </Trapped>
      );

      const innerLast = screen.getByText("inner-last");
      act(() => innerLast.focus());

      fireEvent.keyDown(innerLast, { key: "Tab" });

      // Wraps within the INNER trap, not out to outer-first.
      expect(document.activeElement).toBe(screen.getByText("inner-first"));
    });

    // Stacked modals are rendered as SIBLINGS, not DOM-nested (each modal is
    // its own fixed-position overlay). Depth cannot break the tie here, so
    // the most recently opened trap must win.
    it("the most recently opened trap wins when traps are siblings", () => {
      function Siblings({ secondOpen }: { secondOpen: boolean }) {
        return (
          <>
            <Trapped enabled>
              <button type="button">a-first</button>
              <button type="button">a-last</button>
            </Trapped>
            {secondOpen && (
              <Trapped enabled>
                <button type="button">b-first</button>
                <button type="button">b-last</button>
              </Trapped>
            )}
          </>
        );
      }

      const { rerender } = render(<Siblings secondOpen={false} />);
      rerender(<Siblings secondOpen />);

      const bLast = screen.getByText("b-last");
      act(() => bLast.focus());

      fireEvent.keyDown(bLast, { key: "Tab" });

      // Wraps within the SECOND trap, not into the first one.
      expect(document.activeElement).toBe(screen.getByText("b-first"));
    });

    it("restores focus to the outer trap when the inner one closes", () => {
      function Nested({ innerOpen }: { innerOpen: boolean }) {
        return (
          <Trapped enabled>
            <button type="button">outer-first</button>
            {innerOpen && (
              <Trapped enabled>
                <button type="button">inner-first</button>
              </Trapped>
            )}
          </Trapped>
        );
      }

      const { rerender } = render(<Nested innerOpen={false} />);
      const outerFirst = screen.getByText("outer-first");
      act(() => outerFirst.focus());

      rerender(<Nested innerOpen />);
      expect(document.activeElement).toBe(screen.getByText("inner-first"));

      rerender(<Nested innerOpen={false} />);

      expect(document.activeElement).toBe(outerFirst);
    });
  });

  it("does not warn or throw when the ref is never attached", () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});

    function NoRef() {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref, true);
      return <div>no ref attached</div>;
    }

    expect(() => render(<NoRef />)).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
