import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RepoHeader } from "../components/header/RepoHeader";
import { useRepoStore } from "../store/useRepoStore";
import { useSettingsStore } from "../store/useSettingsStore";
import * as ipc from "../ipc/client";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function showHeader() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RepoHeader onBackToWelcome={() => {}} />
    </QueryClientProvider>
  );
}

describe("RepoHeader remote task lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSettingsStore.getState().setLocale("en");
    useRepoStore.getState().setRepo({
      path: "/repo",
      name: "repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc",
    });
    vi.spyOn(ipc, "listenToTaskProgress").mockResolvedValue(vi.fn());
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(["fetch", "pull", "push"] as const)(
    "keeps %s failures visible and allows retry and dismissal",
    async (operation) => {
      const command = vi
        .spyOn(ipc.invokeCommand, `${operation}Repo`)
        .mockRejectedValue(new Error("Authentication failed"));
      showHeader();
      await act(async () => {
        fireEvent.click(screen.getByTestId(`btn-${operation}`));
      });
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByRole("alert")).toHaveTextContent(/credentials|authentication/i);
      command.mockResolvedValue("ok");
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      });
      expect(command).toHaveBeenCalledTimes(2);
      await act(async () => {
        fireEvent.click(screen.getByTestId(`btn-${operation}`));
      });
      command.mockRejectedValue(new Error("Authentication failed"));
      await act(async () => {
        fireEvent.click(screen.getByTestId(`btn-${operation}`));
      });
      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
  );

  it("does not let a previous success timer clear a newer running task", async () => {
    vi.spyOn(ipc.invokeCommand, "fetchRepo").mockResolvedValue("ok");
    const pull = deferred<string>();
    vi.spyOn(ipc.invokeCommand, "pullRepo").mockReturnValue(pull.promise);
    showHeader();
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-fetch"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-pull"));
    });
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByTestId("btn-fetch")).toBeDisabled();
    await act(async () => {
      pull.resolve("ok");
    });
  });

  it("keeps operations busy after cancellation request until the task settles", async () => {
    const fetch = deferred<string>();
    vi.spyOn(ipc.invokeCommand, "fetchRepo").mockReturnValue(fetch.promise);
    vi.spyOn(ipc.invokeCommand, "cancelRemoteTask").mockResolvedValue();
    showHeader();
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-fetch"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel task" }));
    });
    expect(screen.getByTestId("btn-push")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel task" })).toHaveTextContent("Cancelling…");
    expect(screen.getByRole("button", { name: "Cancel task" })).toBeDisabled();
    await act(async () => {
      fetch.reject(new Error("Operation cancelled"));
    });
    expect(screen.getByTestId("btn-push")).toBeEnabled();
  });

  it("shows cancellation failure while keeping the operation busy", async () => {
    const fetch = deferred<string>();
    vi.spyOn(ipc.invokeCommand, "fetchRepo").mockReturnValue(fetch.promise);
    vi.spyOn(ipc.invokeCommand, "cancelRemoteTask").mockRejectedValue(
      new Error("Cancel unavailable")
    );
    showHeader();
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-fetch"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel task" }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Cancellation failed");
    expect(screen.getByTestId("btn-push")).toBeDisabled();
    await act(async () => {
      fetch.resolve("ok");
    });
  });

  it("ignores old task completion after switching repositories", async () => {
    const fetch = deferred<string>();
    vi.spyOn(ipc.invokeCommand, "fetchRepo").mockReturnValue(fetch.promise);
    showHeader();
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-fetch"));
    });
    act(() =>
      useRepoStore.getState().setRepo({
        path: "/other",
        name: "other",
        is_bare: false,
        head_branch: "main",
        head_commit_id: "abc",
      })
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    await act(async () => {
      fetch.reject(new Error("Old repo failure"));
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("btn-fetch")).toBeEnabled();
  });

  it("cleans up a listener that finishes registering after unmount", async () => {
    const listener = deferred<() => void>();
    const unlisten = vi.fn();
    vi.mocked(ipc.listenToTaskProgress).mockReturnValue(listener.promise);
    const { unmount } = showHeader();
    unmount();
    await act(async () => {
      listener.resolve(unlisten);
    });
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it("retains a cancellation error even when cancellation fails after task completion", async () => {
    const fetch = deferred<string>();
    const cancel = deferred<void>();
    vi.spyOn(ipc.invokeCommand, "fetchRepo").mockReturnValue(fetch.promise);
    vi.spyOn(ipc.invokeCommand, "cancelRemoteTask").mockReturnValue(cancel.promise);
    showHeader();
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-fetch"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel task" }));
    });
    await act(async () => {
      fetch.resolve("ok");
    });
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    await act(async () => {
      cancel.reject(new Error("Cancel unavailable"));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Cancellation failed");
    expect(screen.getByTestId("btn-fetch")).toBeEnabled();
  });
});
