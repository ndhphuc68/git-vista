import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RepoHeaderScreenTabs } from "./RepoHeaderScreenTabs";
import { vi as viTranslations } from "../../i18n/vi";

const t = viTranslations;

describe("RepoHeaderScreenTabs", () => {
  it("renders 2 tabs when isGitHub is false or undefined", () => {
    const setActiveScreen = vi.fn();
    const { rerender } = render(
      <RepoHeaderScreenTabs
        t={t}
        activeScreen="history"
        setActiveScreen={setActiveScreen}
        shortcutLabel1="Cmd+1"
        shortcutLabel2="Cmd+2"
        shortcutLabel3="Cmd+3"
        totalChanges={0}
      />
    );

    expect(screen.getByTestId("tab-history")).toBeInTheDocument();
    expect(screen.getByTestId("tab-changes")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-pull-requests")).not.toBeInTheDocument();

    rerender(
      <RepoHeaderScreenTabs
        t={t}
        activeScreen="history"
        setActiveScreen={setActiveScreen}
        shortcutLabel1="Cmd+1"
        shortcutLabel2="Cmd+2"
        shortcutLabel3="Cmd+3"
        totalChanges={0}
        isGitHub={false}
      />
    );

    expect(screen.queryByTestId("tab-pull-requests")).not.toBeInTheDocument();
  });

  it("renders 3 tabs (History, Changes, Pull Requests) when isGitHub is true", () => {
    const setActiveScreen = vi.fn();
    render(
      <RepoHeaderScreenTabs
        t={t}
        activeScreen="history"
        setActiveScreen={setActiveScreen}
        shortcutLabel1="Cmd+1"
        shortcutLabel2="Cmd+2"
        shortcutLabel3="Cmd+3"
        totalChanges={0}
        isGitHub={true}
      />
    );

    expect(screen.getByTestId("tab-history")).toBeInTheDocument();
    expect(screen.getByTestId("tab-changes")).toBeInTheDocument();
    const prTab = screen.getByTestId("tab-pull-requests");
    expect(prTab).toBeInTheDocument();
    expect(prTab).toHaveAttribute("role", "tab");
    expect(prTab).toHaveAttribute("aria-selected", "false");
    expect(prTab).toHaveTextContent(t.screens.pullRequests);
    expect(prTab).toHaveAttribute("title", `${t.screens.pullRequests} (Cmd+3)`);
  });

  it("shows open PR count badge on the Pull Requests tab", () => {
    const setActiveScreen = vi.fn();
    render(
      <RepoHeaderScreenTabs
        t={t}
        activeScreen="history"
        setActiveScreen={setActiveScreen}
        shortcutLabel1="Cmd+1"
        shortcutLabel2="Cmd+2"
        shortcutLabel3="Cmd+3"
        totalChanges={0}
        isGitHub={true}
        openPrCount={5}
      />
    );

    const badge = screen.getByTestId("pull-requests-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("5");
    expect(badge.className).toContain("min-w-4");
  });

  it("clicking Pull Requests tab calls setActiveScreen with pull-requests", () => {
    const setActiveScreen = vi.fn();
    render(
      <RepoHeaderScreenTabs
        t={t}
        activeScreen="history"
        setActiveScreen={setActiveScreen}
        shortcutLabel1="Cmd+1"
        shortcutLabel2="Cmd+2"
        shortcutLabel3="Cmd+3"
        totalChanges={0}
        isGitHub={true}
      />
    );

    fireEvent.click(screen.getByTestId("tab-pull-requests"));
    expect(setActiveScreen).toHaveBeenCalledWith("pull-requests");
  });
});
