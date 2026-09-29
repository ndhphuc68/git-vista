import { describe, it, expect, beforeEach } from "vitest";
import { isTrackedCommand, withGlobalLoading } from "./globalLoading";
import { trackGlobalLoading, useGlobalLoadingStore } from "../store/useGlobalLoadingStore";

const pending = () => useGlobalLoadingStore.getState().pendingCount;

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("isTrackedCommand", () => {
  it("tracks commands that change the repository", () => {
    expect(isTrackedCommand("checkoutBranch")).toBe(true);
    expect(isTrackedCommand("createCommit")).toBe(true);
    expect(isTrackedCommand("mergeBranch")).toBe(true);
  });

  it("skips reads and commands that report their own progress", () => {
    expect(isTrackedCommand("getBranches")).toBe(false);
    expect(isTrackedCommand("compareCommits")).toBe(false);
    expect(isTrackedCommand("ping")).toBe(false);
    expect(isTrackedCommand("fetchRepo")).toBe(false);
    expect(isTrackedCommand("pushRepo")).toBe(false);
    expect(isTrackedCommand("selectRepoFolder")).toBe(false);
  });
});

describe("withGlobalLoading", () => {
  beforeEach(() => {
    useGlobalLoadingStore.setState({ pendingCount: 0 });
  });

  it("counts a tracked command while its promise is pending", async () => {
    const d = deferred<string>();
    const commands = withGlobalLoading({ checkoutBranch: () => d.promise });

    const result = commands.checkoutBranch();
    expect(pending()).toBe(1);

    d.resolve("done");
    await expect(result).resolves.toBe("done");
    expect(pending()).toBe(0);
  });

  it("releases the count and keeps the rejection when a command fails", async () => {
    const d = deferred();
    const commands = withGlobalLoading({ deleteBranch: () => d.promise });

    const result = commands.deleteBranch();
    expect(pending()).toBe(1);

    d.reject(new Error("boom"));
    await expect(result).rejects.toThrow("boom");
    expect(pending()).toBe(0);
  });

  it("stays busy until every overlapping command settles", async () => {
    const first = deferred();
    const second = deferred();
    const commands = withGlobalLoading({
      stageFile: () => first.promise,
      stageAll: () => second.promise,
    });

    const a = commands.stageFile();
    const b = commands.stageAll();
    expect(pending()).toBe(2);

    first.resolve();
    await a;
    expect(pending()).toBe(1);

    second.resolve();
    await b;
    expect(pending()).toBe(0);
  });

  it("leaves untracked commands alone", async () => {
    const d = deferred();
    const commands = withGlobalLoading({ getBranches: () => d.promise });

    const result = commands.getBranches();
    expect(pending()).toBe(0);
    d.resolve();
    await result;
  });

  it("passes arguments through to the wrapped command", async () => {
    const commands = withGlobalLoading({
      renameBranch: async (repo: string, from: string, to: string) => `${repo}:${from}->${to}`,
    });

    await expect(commands.renameBranch("/repo", "a", "b")).resolves.toBe("/repo:a->b");
  });
});

describe("trackGlobalLoading", () => {
  beforeEach(() => {
    useGlobalLoadingStore.setState({ pendingCount: 0 });
  });

  it("counts an arbitrary task and releases it on failure", async () => {
    const d = deferred();
    const result = trackGlobalLoading(() => d.promise);
    expect(pending()).toBe(1);

    d.reject(new Error("nope"));
    await expect(result).rejects.toThrow("nope");
    expect(pending()).toBe(0);
  });
});
