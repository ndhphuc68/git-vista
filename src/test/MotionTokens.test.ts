import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Motion Tokens and CSS Animation Utilities", () => {
  const tokensCss = fs.readFileSync(path.resolve(__dirname, "../styles/tokens.css"), "utf-8");
  const globalsCss = fs.readFileSync(path.resolve(__dirname, "../styles/globals.css"), "utf-8");

  it("defines easing curves and durations in tokens.css", () => {
    expect(tokensCss).toContain("--ease-spring:");
    expect(tokensCss).toContain("--duration-instant:");
    expect(tokensCss).toContain("--duration-fast:");
    expect(tokensCss).toContain("--duration-slow:");
  });

  it("defines keyframe animations and utility classes in globals.css", () => {
    expect(globalsCss).toContain("@keyframes fadeIn");
    expect(globalsCss).toContain("@keyframes scaleIn");
    expect(globalsCss).toContain("@keyframes slideUp");
    expect(globalsCss).toContain(".animate-fade-in");
    expect(globalsCss).toContain(".animate-scale-in");
    expect(globalsCss).toContain(".animate-slide-up");
    expect(globalsCss).toContain(".btn-press");
    expect(globalsCss).toContain(".card-lift");
    expect(globalsCss).toContain(".modal-backdrop");
  });
});
