import { describe, it, expect, beforeEach } from "vitest";
import { useViewStore } from "../store/useViewStore";

describe("useViewStore", () => {
  beforeEach(() => {
    useViewStore.getState().setActiveScreen("history");
  });

  it("defaults to history and can be set to changes", () => {
    expect(useViewStore.getState().activeScreen).toBe("history");
    useViewStore.getState().setActiveScreen("changes");
    expect(useViewStore.getState().activeScreen).toBe("changes");
    useViewStore.getState().setActiveScreen("history");
    expect(useViewStore.getState().activeScreen).toBe("history");
  });
});
