import { describe, it, expect } from "vitest";
import { extractFriendlyError, resolveErrorToastFields } from "../store/useToastStore";
import type { FriendlyError } from "../utils/errorMapping";

describe("useToastStore error helpers", () => {
  describe("extractFriendlyError", () => {
    it("returns the friendlyError field when present and truthy", () => {
      const friendlyError: FriendlyError = {
        title: "Auth failed",
        message: "Please sign in again",
        actionHint: "Sign in",
      };
      expect(extractFriendlyError({ friendlyError })).toBe(friendlyError);
    });

    it("ignores a falsy friendlyError field and falls back to the actionHint branch", () => {
      const options = { friendlyError: undefined, actionHint: "Retry" };
      expect(extractFriendlyError(options)).toBe(options);
    });

    it("treats an object with actionHint as a FriendlyError itself", () => {
      const options = { title: "Oops", message: "Something failed", actionHint: "Try again" };
      expect(extractFriendlyError(options)).toBe(options);
    });

    it("returns undefined when neither friendlyError nor actionHint is present", () => {
      expect(extractFriendlyError({ title: "Oops", message: "Something failed" })).toBeUndefined();
    });
  });

  describe("resolveErrorToastFields", () => {
    it("uses title/message/rawError from a plain options object", () => {
      expect(
        resolveErrorToastFields({
          title: "Push failed",
          message: "Network unreachable",
          rawError: "ECONNRESET",
        })
      ).toEqual({
        title: "Push failed",
        message: "Network unreachable",
        rawError: "ECONNRESET",
        friendlyError: undefined,
      });
    });

    it("falls back to the friendlyError's title/message when options omit them", () => {
      const friendlyError: FriendlyError = {
        title: "Auth failed",
        message: "Please sign in again",
        rawError: "401 Unauthorized",
      };
      expect(resolveErrorToastFields({ friendlyError })).toEqual({
        title: "Auth failed",
        message: "Please sign in again",
        rawError: "401 Unauthorized",
        friendlyError,
      });
    });

    it("falls back message to the resolved title, then rawError, then the Vietnamese default", () => {
      expect(resolveErrorToastFields({ title: "Push failed" })).toEqual({
        title: "Push failed",
        message: "Push failed",
        rawError: undefined,
        friendlyError: undefined,
      });

      expect(resolveErrorToastFields({ rawError: "ECONNRESET" })).toEqual({
        title: undefined,
        message: "ECONNRESET",
        rawError: "ECONNRESET",
        friendlyError: undefined,
      });

      expect(resolveErrorToastFields({})).toEqual({
        title: undefined,
        message: "Có lỗi xảy ra",
        rawError: undefined,
        friendlyError: undefined,
      });
    });

    it("treats an actionHint-bearing object (FriendlyError) as the sole input", () => {
      const options = {
        title: "Merge conflict",
        message: "Resolve conflicts before continuing",
        actionHint: "Open the conflict view",
      };
      expect(resolveErrorToastFields(options)).toEqual({
        title: "Merge conflict",
        message: "Resolve conflicts before continuing",
        rawError: undefined,
        friendlyError: options,
      });
    });
  });
});
