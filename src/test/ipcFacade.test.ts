import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

/**
 * The commands live in domain modules and `invokeCommand` spreads them back
 * together. Forgetting one of those spreads does not fail the build: every call
 * site still typechecks against the facade's inferred type, which simply no
 * longer has that method. It would only surface at runtime, as a missing
 * function.
 *
 * So pin the count, and pin the handful of names that would go missing if a
 * whole domain were dropped.
 */
describe("invokeCommand facade", () => {
  it("exposes every command from the Rust surface", () => {
    expect(Object.keys(invokeCommand)).toHaveLength(77);
  });

  it("exposes at least one command from each domain module", () => {
    // One representative per domain: if a spread is dropped, its entry is gone.
    const representatives = [
      "ping", // app
      "openRepository", // repo
      "getBranches", // history
      "stageFile", // staging
      "createBranch", // branch
      "getRemotes", // remote
      "getStashes", // stash
      "getTags", // tag
      "mergeBranch", // merge
      "getRebaseCommits", // rebase
      "cherryPickCommit", // commitActions
      "getConflictFileData", // conflict
      "compareCommits", // compare
      "getGitConfig", // config
      "getGitHubToken", // github
      "undoCommit", // undo
    ];

    for (const name of representatives) {
      expect(invokeCommand).toHaveProperty(name);
      expect(typeof invokeCommand[name as keyof typeof invokeCommand]).toBe("function");
    }
  });
});
