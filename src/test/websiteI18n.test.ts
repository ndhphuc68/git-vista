import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Website i18n dictionary", () => {
  it("should exist and have identical non-empty keys for en and vi", () => {
    const i18nPath = path.resolve(__dirname, "../../website/i18n.js");
    expect(fs.existsSync(i18nPath)).toBe(true);

    const fileContent = fs.readFileSync(i18nPath, "utf-8");
    const sandbox: { I18N_DATA?: { en: Record<string, string>; vi: Record<string, string> } } = {};
    const fn = new Function("window", fileContent);
    fn(sandbox);

    expect(sandbox.I18N_DATA).toBeDefined();
    const { en, vi } = sandbox.I18N_DATA!;
    expect(en).toBeDefined();
    expect(vi).toBeDefined();

    const enKeys = Object.keys(en).sort();
    const viKeys = Object.keys(vi).sort();

    expect(enKeys.length).toBeGreaterThan(20);
    expect(enKeys).toEqual(viKeys);

    for (const key of enKeys) {
      expect(en[key].trim().length).toBeGreaterThan(0);
      expect(vi[key].trim().length).toBeGreaterThan(0);
    }
  });
});
