import { render, renderHook, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "../store/useSettingsStore";
import { ControlsBar } from "../components/ControlsBar";
import { CommitBox } from "../components/changes/CommitBox";
import { AppearanceTab } from "../components/settings/tabs/AppearanceTab";
import { useTranslation } from "./index";
import { vi as viTranslations } from "./vi";
import { en } from "./en";
import { getAppCommands } from "../utils/commandRegistry";

vi.hoisted(() => {
  localStorage.setItem("mode", "simple");
});

describe("Advanced Git interface with a saved legacy simple mode", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("vi");
  });

  it("does not offer a mode switch in the controls or appearance settings", () => {
    render(
      <>
        <ControlsBar lastEvent={null} />
        <AppearanceTab />
      </>
    );
    expect(screen.queryAllByText(/Simple|Advanced|Đơn giản|Nâng cao/i)).toHaveLength(0);
  });

  it("uses advanced commit and amend labels", () => {
    render(<CommitBox repoPath="/test/repo" stagedCount={1} onCommit={vi.fn()} />);
    expect(screen.getByTestId("commit-button")).toHaveTextContent(
      viTranslations.commit.commitAdvanced.replace("{count}", "1")
    );
    expect(screen.getByLabelText(viTranslations.commit.amendAdvanced)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("amend-checkbox"));
    expect(screen.getByTestId("commit-button")).toHaveTextContent(
      viTranslations.commit.amendCommitAdvanced
    );
  });

  it.each(["vi", "en"] as const)("uses advanced Git action labels in %s", (locale) => {
    useSettingsStore.getState().setLocale(locale);
    const { result } = renderHook(() => useTranslation());
    expect(result.current.actions).toEqual(
      (locale === "vi" ? viTranslations : en).gitActions.advanced
    );
  });

  it("does not offer a mode command", () => {
    expect(getAppCommands({ navigate: vi.fn() }).map((command) => command.id)).not.toContain(
      "settings-mode"
    );
  });
});
