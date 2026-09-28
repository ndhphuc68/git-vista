import { renderHook, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWelcomeShortcuts } from "./useWelcomeShortcuts";

describe("useWelcomeShortcuts", () => {
  it("calls the latest openFolder after a re-render", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const noop = () => {};
    const { rerender } = renderHook(
      ({ openFolder }) =>
        useWelcomeShortcuts({ openFolder, openClone: noop, focusSearch: noop, clearSearch: noop }),
      { initialProps: { openFolder: first } }
    );

    rerender({ openFolder: latest });
    fireEvent.keyDown(window, { key: "o", ctrlKey: true });

    expect(latest).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });
});
