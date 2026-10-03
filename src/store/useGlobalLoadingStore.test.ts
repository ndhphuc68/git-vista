import { describe, it, expect, beforeEach } from "vitest";
import { useGlobalLoadingStore, trackGlobalLoading } from "./useGlobalLoadingStore";

describe("useGlobalLoadingStore", () => {
  beforeEach(() => {
    useGlobalLoadingStore.setState({ pendingCount: 0, message: undefined });
  });

  it("increments pendingCount on begin and decrements on end", () => {
    const store = useGlobalLoadingStore.getState();
    store.begin();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(1);

    store.begin();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(2);

    store.end();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(1);

    store.end();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(0);

    // Cannot go below 0
    store.end();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(0);
  });

  it("stores a custom message on begin and clears it when idle", () => {
    const store = useGlobalLoadingStore.getState();
    store.begin("Đang commit...");
    expect(useGlobalLoadingStore.getState().message).toBe("Đang commit...");

    store.end();
    expect(useGlobalLoadingStore.getState().message).toBeUndefined();
  });

  it("preserves message during overlapping operations until all finish", () => {
    const store = useGlobalLoadingStore.getState();
    store.begin("First task");
    store.begin();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(2);
    expect(useGlobalLoadingStore.getState().message).toBe("First task");

    store.end();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(1);
    expect(useGlobalLoadingStore.getState().message).toBe("First task");

    store.end();
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(0);
    expect(useGlobalLoadingStore.getState().message).toBeUndefined();
  });

  it("passes custom message through trackGlobalLoading", async () => {
    let observedMessageDuringRun: string | undefined;
    await trackGlobalLoading(async () => {
      observedMessageDuringRun = useGlobalLoadingStore.getState().message;
    }, "Custom message");

    expect(observedMessageDuringRun).toBe("Custom message");
    expect(useGlobalLoadingStore.getState().pendingCount).toBe(0);
    expect(useGlobalLoadingStore.getState().message).toBeUndefined();
  });
});
