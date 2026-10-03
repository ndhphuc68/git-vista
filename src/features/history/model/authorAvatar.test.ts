import { describe, expect, it } from "vitest";
import { getGitHubNoreplyAvatarUrl, getGravatarUrl, resolveAuthorAvatarUrl } from "./authorAvatar";

describe("getGitHubNoreplyAvatarUrl", () => {
  it("uses the numeric user id when the noreply address has one", () => {
    expect(getGitHubNoreplyAvatarUrl("56473628+octocat@users.noreply.github.com", 36)).toBe(
      "https://avatars.githubusercontent.com/u/56473628?s=36"
    );
  });

  it("falls back to the login for legacy noreply addresses", () => {
    expect(getGitHubNoreplyAvatarUrl("octocat@users.noreply.github.com", 36)).toBe(
      "https://github.com/octocat.png?size=36"
    );
  });

  it("returns null for regular email addresses", () => {
    expect(getGitHubNoreplyAvatarUrl("dev@example.com", 36)).toBeNull();
  });
});

describe("getGravatarUrl", () => {
  it("hashes the normalized email with SHA-256 and asks for a 404 when missing", async () => {
    const url = await getGravatarUrl("  Dev@Example.com ", 40);
    const expected = await getGravatarUrl("dev@example.com", 40);
    expect(url).toBe(expected);
    expect(url).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\/[0-9a-f]{64}\?s=40&d=404$/);
  });
});

describe("resolveAuthorAvatarUrl", () => {
  it("returns null when there is no email", async () => {
    await expect(resolveAuthorAvatarUrl("", 36)).resolves.toBeNull();
    await expect(resolveAuthorAvatarUrl(null, 36)).resolves.toBeNull();
  });

  it("prefers the GitHub avatar for noreply addresses", async () => {
    await expect(resolveAuthorAvatarUrl("1+octocat@users.noreply.github.com", 36)).resolves.toBe(
      "https://avatars.githubusercontent.com/u/1?s=36"
    );
  });

  it("uses Gravatar for other addresses", async () => {
    await expect(resolveAuthorAvatarUrl("dev@example.com", 36)).resolves.toMatch(
      /^https:\/\/www\.gravatar\.com\/avatar\//
    );
  });
});
