import { describe, it, expect } from "vitest";
import { findRemoteOrPlaceholder } from "../features/branch/model/remoteLookup";
import { type RemoteItem } from "../ipc/bindings.generated";

const origin: RemoteItem = {
  name: "origin",
  fetch_url: "git@github.com:example/repo.git",
  push_url: "git@github.com:example/repo.git",
  branch_count: 3,
  is_default: true,
};

describe("findRemoteOrPlaceholder", () => {
  it("returns the matching remote when it is loaded", () => {
    expect(findRemoteOrPlaceholder([origin], "origin", 5)).toBe(origin);
  });

  it("synthesizes a placeholder when the remote isn't loaded yet", () => {
    expect(findRemoteOrPlaceholder([], "upstream", 2)).toEqual({
      name: "upstream",
      fetch_url: null,
      push_url: null,
      branch_count: 2,
      is_default: false,
    });
  });
});
