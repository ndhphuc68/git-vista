import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { stashAndCreateBranch } from "./useCreateBranchConflict.actions";

const t = getTranslation();
const STASH_MESSAGE = t.modals.createBranch.autoStashMessage.replace("{name}", "feat/x");

function setup() {
  const calls: string[] = [];
  const params = {
    calls,
    name: "feat/x",
    targetCommit: "refs/heads/main",
    saveStash: vi.fn(async () => void calls.push("save")),
    createBranch: vi.fn(async () => void calls.push("create")),
    popStash: vi.fn(async () => void calls.push("pop")),
    t,
    onSuccess: vi.fn(),
    onClose: vi.fn(),
    setError: vi.fn(),
  };
  return params;
}

describe("stashAndCreateBranch", () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it("stashes, creates with checkout, then pops the stash onto the new branch", async () => {
    const p = setup();

    await stashAndCreateBranch(p);

    expect(p.saveStash).toHaveBeenCalledWith({ message: STASH_MESSAGE, includeUntracked: true });
    expect(p.createBranch).toHaveBeenCalledWith({
      name: "feat/x",
      targetCommit: "refs/heads/main",
      checkout: true,
    });
    expect(p.popStash).toHaveBeenCalledWith({ index: 0 });
    expect(p.calls).toEqual(["save", "create", "pop"]);
    expect(p.onSuccess).toHaveBeenCalled();
    expect(p.onClose).toHaveBeenCalled();
    const [toast] = useToastStore.getState().toasts;
    expect(toast?.type).toBe("success");
    expect(toast?.message).toContain("feat/x");
  });

  it("stops without creating when the stash itself fails", async () => {
    const p = setup();
    p.saveStash.mockRejectedValue(new Error("disk full"));

    await stashAndCreateBranch(p);

    expect(p.createBranch).not.toHaveBeenCalled();
    expect(p.popStash).not.toHaveBeenCalled();
    expect(p.setError).toHaveBeenLastCalledWith("disk full");
    expect(p.onClose).not.toHaveBeenCalled();
  });

  it("puts the changes back when creating the branch fails", async () => {
    const p = setup();
    p.createBranch.mockRejectedValue(new Error("bad ref"));

    await stashAndCreateBranch(p);

    expect(p.popStash).toHaveBeenCalledWith({ index: 0 });
    expect(p.setError).toHaveBeenLastCalledWith(
      t.modals.createBranch.createFailedRestored.replace("{msg}", "bad ref")
    );
    expect(p.onClose).not.toHaveBeenCalled();
  });

  it("names the kept stash when the changes cannot be put back after a failed create", async () => {
    const p = setup();
    p.createBranch.mockRejectedValue(new Error("bad ref"));
    p.popStash.mockRejectedValue(new Error("pop failed"));

    await stashAndCreateBranch(p);

    expect(p.setError).toHaveBeenLastCalledWith(
      t.modals.createBranch.createFailedKeptInStash
        .replace("{msg}", "bad ref")
        .replace("{stash}", STASH_MESSAGE)
    );
    expect(p.onClose).not.toHaveBeenCalled();
  });

  it("still closes on the new branch but reports the kept stash when the pop conflicts", async () => {
    const p = setup();
    p.popStash.mockRejectedValue(new Error("STASH_CONFLICT: conflict"));

    await stashAndCreateBranch(p);

    expect(p.onSuccess).toHaveBeenCalled();
    expect(p.onClose).toHaveBeenCalled();
    const [toast] = useToastStore.getState().toasts;
    expect(toast?.type).toBe("error");
    expect(toast?.message).toContain(STASH_MESSAGE);
  });
});
