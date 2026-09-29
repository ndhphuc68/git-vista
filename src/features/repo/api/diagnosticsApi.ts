/**
 * Thin wrappers over the dev-diagnostics IPC commands used by the dev-only
 * `ControlsBar`. This module lives in `features/repo/api`, the only place in
 * `features/repo` allowed to import `ipc/`; `ControlsBar` composes these
 * functions instead of calling `invokeCommand` directly.
 */
import { invokeCommand } from "../../../ipc/client";
import type { SystemInfo } from "../../../ipc/bindings.generated";

/** Round-trips `message` to the Rust backend and back, for IPC smoke-testing. */
export function ping(message: string): Promise<string> {
  return invokeCommand.ping(message);
}

/** OS, architecture, git and app version info reported by the Rust backend. */
export function getSystemInfo(): Promise<SystemInfo> {
  return invokeCommand.getSystemInfo();
}

/** Fires a mock repo-changed event for `path`, for dev event-wiring tests. */
export function simulateRepoChange(path: string): Promise<void> {
  return invokeCommand.simulateRepoChange(path);
}
