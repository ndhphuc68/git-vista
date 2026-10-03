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
  message?: string;
  begin: (message?: string) => void;
  end: () => void;
}

export const useGlobalLoadingStore = create<GlobalLoadingState>((set) => ({
  pendingCount: 0,
  message: undefined,
  begin: (message?: string) =>
    set((s) => ({
      pendingCount: s.pendingCount + 1,
      message: message ?? s.message,
    })),
  end: () =>
    set((s) => {
      const nextPending = Math.max(0, s.pendingCount - 1);
      return {
        pendingCount: nextPending,
        message: nextPending === 0 ? undefined : s.message,
      };
    }),
}));

/**
 * Runs `task` while the global loading indicator is counted as busy.
 *
 * Use it for async work that does not go through `invokeCommand` (which is
 * tracked automatically). The count is released whether the task resolves or
 * rejects, and the task's result or error passes through unchanged.
 */
export async function trackGlobalLoading<T>(task: () => Promise<T>, message?: string): Promise<T> {
  const { begin, end } = useGlobalLoadingStore.getState();
  begin(message);
  try {
    return await task();
  } finally {
    end();
  }
}
