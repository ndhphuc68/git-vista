import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

const SampleTailwindCard: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  return (
    <div
      data-testid="tailwind-card"
      className="flex flex-col gap-2 rounded-lg bg-surface p-4 text-primary shadow-md border border-border-subtle hover:bg-surface-hover transition-colors"
    >
      <h3 className="text-sm font-semibold text-accent">{title}</h3>
      <p className="text-xs text-secondary">{subtitle}</p>
    </div>
  );
};

describe("Tailwind CSS Integration", () => {
  it("renders component with Tailwind utility classes and theme token classes", () => {
    render(
      <SampleTailwindCard
        title="Visual Git Client"
        subtitle="Powered by Tauri v2 and Tailwind CSS"
      />
    );

    const card = screen.getByTestId("tailwind-card");
    expect(card).toBeInTheDocument();
    expect(card.className).toContain("flex");
    expect(card.className).toContain("rounded-lg");
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("border-border-subtle");

    const titleEl = screen.getByText("Visual Git Client");
    expect(titleEl).toBeInTheDocument();
    expect(titleEl.className).toContain("text-accent");

    const subtitleEl = screen.getByText("Powered by Tauri v2 and Tailwind CSS");
    expect(subtitleEl).toBeInTheDocument();
    expect(subtitleEl.className).toContain("text-secondary");
  });

  it("renders buttons with primary accent styling and proper class attributes", () => {
    render(
      <button
        data-testid="tailwind-btn"
        className="px-4 py-2 bg-accent text-accent-contrast rounded-lg font-semibold text-xs border-0 shadow-md hover:bg-accent-hover"
      >
        Mở thư mục
      </button>
    );

    const btn = screen.getByTestId("tailwind-btn");
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("bg-accent");
    expect(btn.className).toContain("text-accent-contrast");
    expect(btn.className).toContain("rounded-lg");
    expect(btn.className).toContain("hover:bg-accent-hover");
  });
});
