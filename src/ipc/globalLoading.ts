/**
 * Hooks the IPC surface into the global loading indicator.
 *
 * Only commands that change something are tracked. Reads (`get*`, `compare*`
 * and the like) run constantly in the background through react-query, and
 * showing the indicator for them would keep it flickering for no reason.
 */
import { useGlobalLoadingStore } from "../store/useGlobalLoadingStore";

/** Read-only command prefixes: never shown as global loading. */
const READ_PREFIXES = ["get", "list", "compare", "ping"];

/**
 * Commands excluded by name. Fetch, pull, push and clone report their own
 * progress through `RemoteProgressBanner` and the clone screen, so a second
 * indicator would be redundant. The folder picker waits on the user, not on
 * Git. The rest are browser-mode dev helpers.
 */
const EXCLUDED_COMMANDS = new Set<string>([
  "fetchRepo",
  "pullRepo",
  "pushRepo",
  "cloneRepo",
  "cancelRemoteTask",
  "selectRepoFolder",
  "simulateRepoChange",
  "setMockGlobalConfig",
  "setMockLocalConfig",
  "deleteMockLocalConfig",
]);

export function isTrackedCommand(name: string): boolean {
  if (EXCLUDED_COMMANDS.has(name)) return false;
  return !READ_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

/**
 * Returns a copy of `commands` whose tracked commands count toward the global
 * loading indicator while their promise is pending. Results and rejections
 * pass through untouched.
 */
export function withGlobalLoading<T extends Record<string, unknown>>(commands: T): T {
  const wrapped: Record<string, unknown> = {};
  for (const [name, command] of Object.entries(commands)) {
    if (typeof command !== "function" || !isTrackedCommand(name)) {
      wrapped[name] = command;
      continue;
    }
    wrapped[name] = (...args: unknown[]) => {
      const result: unknown = command(...args);
      if (!isPromiseLike(result)) return result;
      const { begin, end } = useGlobalLoadingStore.getState();
      begin();
      // Settle the counter on both paths; the caller still gets the original
      // promise, so its rejection is observed there and not swallowed here.
      result.then(end, end);
      return result;
    };
  }
  return wrapped as T;
}
