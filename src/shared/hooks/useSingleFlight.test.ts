import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSingleFlight } from "./useSingleFlight";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useSingleFlight", () => {
  it("ignores a task started while another is running", async () => {
    const { result } = renderHook(() => useSingleFlight());
    const gate = deferred();
    const first = vi.fn(() => gate.promise);
    const second = vi.fn(async () => {});

    let firstRun!: Promise<void>;
    await act(async () => {
      firstRun = result.current(first);
      await result.current(second);
    });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    await act(async () => {
      gate.resolve();
      await firstRun;
    });
  });

  it("accepts a new task once the previous one settles, even after a failure", async () => {
    const { result } = renderHook(() => useSingleFlight());
    const failing = vi.fn(async () => {
      throw new Error("boom");
    });
    const next = vi.fn(async () => {});

    await act(async () => {
      await expect(result.current(failing)).rejects.toThrow("boom");
      await result.current(next);
    });

    expect(next).toHaveBeenCalledTimes(1);
  });
});
