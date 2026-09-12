import { describe, it, expect } from "vitest";
import { useVirtualizer } from "@tanstack/react-virtual";

describe("Task 1 Dependencies", () => {
  it("should have @tanstack/react-virtual available", () => {
    expect(typeof useVirtualizer).toBe("function");
  });
});

