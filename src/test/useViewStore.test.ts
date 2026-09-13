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

  it("can open and close conflict resolver", () => {
    expect(useViewStore.getState().activeConflictFile).toBeNull();

    useViewStore.getState().openConflictResolver("src/app.ts");
    expect(useViewStore.getState().activeScreen).toBe("conflict");
    expect(useViewStore.getState().activeConflictFile).toBe("src/app.ts");

    useViewStore.getState().closeConflictResolver();
    expect(useViewStore.getState().activeScreen).toBe("changes");
    expect(useViewStore.getState().activeConflictFile).toBeNull();
  });
});
