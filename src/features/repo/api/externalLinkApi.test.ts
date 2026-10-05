import { describe, it, expect, vi, beforeEach } from "vitest";
import { isExternalUrl, openExternalUrl } from "./externalLinkApi";
import { openerCommands } from "../../../ipc/opener";

vi.mock("../../../ipc/opener", () => ({
  openerCommands: { openExternalUrl: vi.fn().mockResolvedValue(undefined) },
}));

describe("externalLinkApi", () => {
  beforeEach(() => {
    vi.mocked(openerCommands.openExternalUrl).mockClear();
  });

  it.each(["https://github.com/org/repo", "http://example.com", "mailto:dev@example.com"])(
    "treats %s as external",
    (href) => {
      expect(isExternalUrl(href)).toBe(true);
    }
  );

  it.each(["/settings", "#section", "javascript:alert(1)", "file:///etc/passwd", ""])(
    "does not treat %s as external",
    (href) => {
      expect(isExternalUrl(href)).toBe(false);
    }
  );

  it("opens web URLs through the opener", async () => {
    await openExternalUrl("https://github.com/org/repo/pull/1");
    expect(openerCommands.openExternalUrl).toHaveBeenCalledWith(
      "https://github.com/org/repo/pull/1"
    );
  });

  it("ignores non-web URLs", async () => {
    await openExternalUrl("javascript:alert(1)");
    expect(openerCommands.openExternalUrl).not.toHaveBeenCalled();
  });
});
