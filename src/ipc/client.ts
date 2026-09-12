import { SystemInfo, RepoHeadInfo, RepoChangedPayload, TaskProgressPayload } from "./bindings";

// Helper kiểm tra môi trường chạy có phải trong Tauri runtime không
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
};

export const invokeCommand = {
  ping: async (msg: string): Promise<string> => {
    if (!isTauri()) {
      return `[Browser mock] Pong: ${msg} (at ${new Date().toLocaleTimeString()})`;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("ping", { msg });
  },

  getSystemInfo: async (): Promise<SystemInfo> => {
    if (!isTauri()) {
      return {
        os: "browser-dev",
        arch: "x86_64",
        git_version: "git version mock-2.50",
        app_version: "0.1.0",
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<SystemInfo>("get_system_info");
  },

  getRepoHeadInfo: async (repoPath: string): Promise<RepoHeadInfo> => {
    if (!isTauri()) {
      return {
        branch_name: "main",
        head_commit_id: "abc1234567890",
        is_detached: false,
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoHeadInfo>("get_repo_head_info", { repoPath });
  },

  simulateRepoChange: async (repoPath: string): Promise<void> => {
    if (!isTauri()) {
      window.dispatchEvent(
        new CustomEvent("mock-repo-changed", {
          detail: {
            repo_path: repoPath,
            reason: "Simulated trigger in browser",
            timestamp_ms: Date.now(),
          },
        })
      );
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("simulate_repo_change", { repoPath });
  },
};

export async function listenToRepoChanged(
  handler: (payload: RepoChangedPayload) => void
): Promise<() => void> {
  if (!isTauri()) {
    const mockListener = (e: Event) => {
      const customEvent = e as CustomEvent<RepoChangedPayload>;
      handler(customEvent.detail);
    };
    window.addEventListener("mock-repo-changed", mockListener);
    return () => window.removeEventListener("mock-repo-changed", mockListener);
  }

  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<RepoChangedPayload>("repo-changed", (event) => {
    handler(event.payload);
  });
  return unlisten;
}

export type { SystemInfo, RepoHeadInfo, RepoChangedPayload, TaskProgressPayload };

