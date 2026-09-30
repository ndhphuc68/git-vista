import { describe, expect, it } from "vitest";
import { readJson } from "./readJson";

describe("readJson", () => {
  it("resolves with the parsed body", async () => {
    const res = { json: async () => ({ login: "octocat" }) } as Response;
    await expect(readJson<{ login: string }>(res)).resolves.toEqual({ login: "octocat" });
  });

  it("rejects when the body is not JSON", async () => {
    const res = {
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response;
    await expect(readJson(res)).rejects.toThrow("Unexpected token");
  });
});
