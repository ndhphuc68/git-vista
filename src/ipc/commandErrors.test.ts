import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Every generated command resolves to the `{ status: "error" }` envelope a
// failing Rust command produces. A wrapper that awaits the command without
// `unwrap` resolves anyway, which the UI then reports as a success.
const called: string[] = [];
vi.mock("./bindings.generated", () => ({
  commands: new Proxy(
    {},
    {
      get: (_target, name) => async () => {
        called.push(String(name));
        return { status: "error", error: { type: "Git", message: "boom" } };
      },
    }
  ),
}));

import { appCommands } from "./app";
import { branchCommands } from "./branch";
import { commitActionCommands } from "./commitActions";
import { compareCommands } from "./compare";
import { configCommands } from "./config";
import { conflictCommands } from "./conflict";
import { githubCommands } from "./github";
import { historyCommands } from "./history";
import { mergeCommands } from "./merge";
import { rebaseCommands } from "./rebase";
import { remoteCommands } from "./remote";
import { repoCommands } from "./repo";
import { stagingCommands } from "./staging";
import { stashCommands } from "./stash";
import { tagCommands } from "./tag";
import { undoCommands } from "./undo";

const domains = {
  appCommands,
  branchCommands,
  commitActionCommands,
  compareCommands,
  configCommands,
  conflictCommands,
  githubCommands,
  historyCommands,
  mergeCommands,
  rebaseCommands,
  remoteCommands,
  repoCommands,
  stagingCommands,
  stashCommands,
  tagCommands,
  undoCommands,
};

// `ping` is a health check whose Rust command cannot fail, so its binding has
// no error envelope to unwrap.
const NO_ERROR_ENVELOPE = new Set(["appCommands.ping"]);

const wrappers = Object.entries(domains).flatMap(([domain, wrapperMap]) =>
  Object.entries(wrapperMap as Record<string, unknown>)
    .filter(([, fn]) => typeof fn === "function")
    .map(([name, fn]) => ({ id: `${domain}.${name}`, fn: fn as (...args: unknown[]) => unknown }))
    .filter(({ id }) => !NO_ERROR_ENVELOPE.has(id))
);

describe("IPC wrappers surface command errors", () => {
  beforeEach(() => {
    called.length = 0;
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
  });

  afterEach(() => {
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it.each(wrappers.map((wrapper) => [wrapper.id, wrapper.fn] as const))(
    "%s rejects when its command fails",
    async (_id, fn) => {
      const outcome = await Promise.resolve()
        .then(() => fn("repo", "arg", "arg", "arg", "arg"))
        .then(
          () => "resolved",
          () => "rejected"
        );

      expect(called.length).toBeGreaterThan(0);
      expect(outcome).toBe("rejected");
    }
  );
});
