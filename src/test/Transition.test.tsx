import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Transition } from "../components/common/Transition";

describe("Transition Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children when show is true", () => {
    render(
      <Transition show={true} enterClass="custom-enter">
        <div data-testid="content">Hello World</div>
      </Transition>
    );

    const el = screen.getByTestId("content");
    expect(el).toBeInTheDocument();
    expect(el.parentElement).toHaveClass("custom-enter");
  });

  it("delays unmounting during exit animation when show becomes false", () => {
    const { rerender } = render(
      <Transition show={true} enterClass="custom-enter" exitClass="custom-exit" duration={200}>
        <div data-testid="content">Modal Content</div>
      </Transition>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();

    // Trigger exit
    rerender(
      <Transition show={false} enterClass="custom-enter" exitClass="custom-exit" duration={200}>
        <div data-testid="content">Modal Content</div>
      </Transition>
    );

    // Still in DOM during exit duration
    const content = screen.getByTestId("content");
    expect(content).toBeInTheDocument();
    expect(content.parentElement).toHaveClass("custom-exit");

    // Fast-forward past duration
    act(() => {
      vi.advanceTimersByTime(210);
    });

    // Content should now be unmounted
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("does not mount initially if show is false and unmountOnExit is true", () => {
    render(
      <Transition show={false} unmountOnExit={true}>
        <div data-testid="content">Hidden</div>
      </Transition>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });
});
