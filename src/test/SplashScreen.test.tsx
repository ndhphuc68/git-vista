import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SplashScreen } from "../components/splash/SplashScreen";

describe("SplashScreen Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders branding logo, title, and tagline", () => {
    render(<SplashScreen onFinish={vi.fn()} />);

    expect(screen.getByRole("img", { name: /gitvista logo/i })).toBeInTheDocument();
    expect(screen.getByText("GitVista")).toBeInTheDocument();
    expect(screen.getByText(/Trực quan hoá|Visual Git Client/i)).toBeInTheDocument();
  });

  it("transitions to exit state after duration and calls onFinish", () => {
    const onFinishMock = vi.fn();
    render(<SplashScreen onFinish={onFinishMock} duration={1800} />);

    const splash = screen.getByTestId("splash-screen");
    expect(splash).not.toHaveClass("opacity-0");

    // Advance to 1800ms -> triggers exit fade
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(splash).toHaveClass("opacity-0");
    expect(onFinishMock).not.toHaveBeenCalled();

    // Advance 300ms exit fade duration -> total 2100ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onFinishMock).toHaveBeenCalledTimes(1);
  });

  it("calls onFinish immediately if skipSplash is true", () => {
    const onFinishMock = vi.fn();
    render(<SplashScreen onFinish={onFinishMock} skipSplash={true} />);

    expect(onFinishMock).toHaveBeenCalledTimes(1);
  });
});
