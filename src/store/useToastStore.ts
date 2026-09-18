import { create } from "zustand";
import { flushSync } from "react-dom";
import { type FriendlyError } from "../utils/errorMapping";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  title?: string;
  message: string;
  durationMs?: number;
  undoAction?: () => Promise<void>;
  undoLabel?: string;
  friendlyError?: FriendlyError;
  rawError?: string;
  createdAt: number;
}

export interface ToastState {
  toasts: ToastItem[];
  showToast: (options: Omit<ToastItem, "id" | "createdAt"> & { id?: string }) => string;
  showSuccess: (message: string, undoAction?: () => Promise<void>, undoLabel?: string) => string;
  showError: (
    errorOrOptions:
      | string
      | FriendlyError
      | {
          title?: string;
          message?: string;
          rawError?: string;
          friendlyError?: FriendlyError;
        }
  ) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let nextId = 0;

const safeFlushSync = (fn: () => void) => {
  try {
    flushSync(fn);
  } catch {
    fn();
  }
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (options) => {
    const id = options.id || `toast-${Date.now()}-${++nextId}`;
    const defaultDuration = options.undoAction ? 10000 : 5000;
    const durationMs = options.durationMs !== undefined ? options.durationMs : defaultDuration;
    const newToast: ToastItem = {
      ...options,
      id,
      durationMs,
      createdAt: Date.now(),
    };
    safeFlushSync(() => {
      set((state) => ({
        toasts: [...state.toasts, newToast],
      }));
    });
    return id;
  },
  showSuccess: (message, undoAction, undoLabel) => {
    return get().showToast({
      type: "success",
      message,
      undoAction,
      undoLabel,
    });
  },
  showError: (errorOrOptions) => {
    if (typeof errorOrOptions === "string") {
      return get().showToast({
        type: "error",
        message: errorOrOptions,
        rawError: errorOrOptions,
      });
    }

    const friendlyError =
      "friendlyError" in errorOrOptions && errorOrOptions.friendlyError
        ? errorOrOptions.friendlyError
        : "actionHint" in errorOrOptions
          ? (errorOrOptions as FriendlyError)
          : undefined;

    const title = "title" in errorOrOptions ? errorOrOptions.title : undefined;
    const message = "message" in errorOrOptions ? errorOrOptions.message : undefined;
    const rawError = "rawError" in errorOrOptions ? errorOrOptions.rawError : undefined;

    const effectiveTitle = title || friendlyError?.title;
    const effectiveMessage =
      message || friendlyError?.message || effectiveTitle || rawError || "Có lỗi xảy ra";
    const effectiveRawError = rawError || friendlyError?.rawError;

    return get().showToast({
      type: "error",
      title: effectiveTitle,
      message: effectiveMessage,
      rawError: effectiveRawError,
      friendlyError,
    });
  },
  removeToast: (id) => {
    safeFlushSync(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    });
  },
  clearToasts: () => {
    safeFlushSync(() => {
      set({ toasts: [] });
    });
  },
}));
