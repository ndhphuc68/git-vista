import { describe, it, expect } from "vitest";
import {
  sanitizeRemoteName,
  isInvalidRemoteName,
  resolveInitialRemoteFields,
} from "./remoteNameHelpers";
import type { RemoteItem } from "../../../ipc/bindings.generated";

describe("sanitizeRemoteName", () => {
  it("strips whitespace and characters git forbids in a remote name", () => {
    expect(sanitizeRemoteName("up stream~^:?*[\\@{}")).toBe("upstream");
  });

  it("leaves an already-valid name untouched", () => {
    expect(sanitizeRemoteName("upstream-2")).toBe("upstream-2");
  });
});

describe("isInvalidRemoteName", () => {
  it("rejects a name starting with a dash", () => {
    expect(isInvalidRemoteName("-bad")).toBe(true);
  });

  it("rejects a name containing a forbidden character", () => {
    expect(isInvalidRemoteName("up:stream")).toBe(true);
  });

  it("accepts a plain valid name", () => {
    expect(isInvalidRemoteName("upstream")).toBe(false);
  });
});

describe("resolveInitialRemoteFields", () => {
  it("returns blank fields when adding a new remote", () => {
    expect(resolveInitialRemoteFields(null)).toEqual({
      name: "",
      fetchUrl: "",
      useSeparatePush: false,
      pushUrl: "",
    });
  });

  it("prefills from the existing remote when editing", () => {
    const remote: RemoteItem = {
      name: "origin",
      fetch_url: "https://example.com/a.git",
      push_url: "https://example.com/a.git",
      branch_count: 3,
      is_default: true,
    };
    expect(resolveInitialRemoteFields(remote)).toEqual({
      name: "origin",
      fetchUrl: "https://example.com/a.git",
      useSeparatePush: false,
      pushUrl: "https://example.com/a.git",
    });
  });

  it("detects a custom push url different from the fetch url", () => {
    const remote: RemoteItem = {
      name: "origin",
      fetch_url: "https://example.com/a.git",
      push_url: "git@example.com:a.git",
      branch_count: 3,
      is_default: true,
    };
    expect(resolveInitialRemoteFields(remote)).toEqual({
      name: "origin",
      fetchUrl: "https://example.com/a.git",
      useSeparatePush: true,
      pushUrl: "git@example.com:a.git",
    });
  });
});
