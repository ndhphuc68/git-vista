import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Website app.js logic", () => {
  it("should correctly define detectPlatform, setLanguage, and integrate with DOM", () => {
    const appJsPath = path.resolve(__dirname, "../../website/app.js");
    expect(fs.existsSync(appJsPath)).toBe(true);

    const appCode = fs.readFileSync(appJsPath, "utf-8");
    expect(appCode).toContain("detectPlatform");
    expect(appCode).toContain("setLanguage");
    expect(appCode).toContain("localStorage");
    expect(appCode).toContain("data-i18n");
  });

  it("should successfully execute detectPlatform on mock user agents", () => {
    const appJsPath = path.resolve(__dirname, "../../website/app.js");
    const appCode = fs.readFileSync(appJsPath, "utf-8");

    const fakeWindow: any = {
      navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      document: {
        addEventListener: () => {},
        querySelectorAll: () => [],
        getElementById: () => null,
      },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
      },
      I18N_DATA: {
        en: { "hero.download_primary": "Download for Windows" },
        vi: { "hero.download_primary": "Tải về cho Windows" },
      },
    };

    const fn = new Function("window", "document", "navigator", "localStorage", appCode);
    fn(fakeWindow, fakeWindow.document, fakeWindow.navigator, fakeWindow.localStorage);

    expect(fakeWindow.GitVistaWeb).toBeDefined();
    expect(fakeWindow.GitVistaWeb.detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      "windows"
    );
    expect(
      fakeWindow.GitVistaWeb.detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
    ).toBe("mac");
    expect(fakeWindow.GitVistaWeb.detectPlatform("Mozilla/5.0 (X11; Linux x86_64)")).toBe("linux");
  });
});
