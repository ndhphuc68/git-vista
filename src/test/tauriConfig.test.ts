import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Tauri configuration", () => {
  it("configures the main window to open maximized by default with fallback dimensions", () => {
    const configPath = path.resolve(__dirname, "../../src-tauri/tauri.conf.json");
    const rawContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(rawContent);

    const mainWindow = config.app?.windows?.find((w: { label: string }) => w.label === "main");

    expect(mainWindow).toBeDefined();
    expect(mainWindow.maximized).toBe(true);
    expect(mainWindow.resizable).toBe(true);
    expect(mainWindow.width).toBe(1200);
    expect(mainWindow.height).toBe(800);
  });
});
