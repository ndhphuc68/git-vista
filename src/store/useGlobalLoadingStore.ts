import { create } from "zustand";

/**
 * Counts the async operations currently running app-wide, so a single
 * indicator can tell the user that something is still in progress.
 *
 * It is a counter rather than a flag because operations overlap: the
 * indicator stays up until the last one settles.
 */
export interface GlobalLoadingState {
  pendingCount: number;
  begin: () => void;
  end: () => void;
}

export const useGlobalLoadingStore = create<GlobalLoadingState>((set) => ({
  pendingCount: 0,
  begin: () => set((s) => ({ pendingCount: s.pendingCount + 1 })),
  end: () => set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) })),
}));

/**
 * Runs `task` while the global loading indicator is counted as busy.
 *
 * Use it for async work that does not go through `invokeCommand` (which is
 * tracked automatically). The count is released whether the task resolves or
 * rejects, and the task's result or error passes through unchanged.
 */
export async function trackGlobalLoading<T>(task: () => Promise<T>): Promise<T> {
  const { begin, end } = useGlobalLoadingStore.getState();
  begin();
  try {
    return await task();
  } finally {
    end();
  }
}
