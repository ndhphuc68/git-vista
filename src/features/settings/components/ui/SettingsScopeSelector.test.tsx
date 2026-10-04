import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsScopeSelector, type SettingsScopeSelectorProps } from "./SettingsScopeSelector";

const base: SettingsScopeSelectorProps = {
  hasRepo: true,
  scope: "repo",
  onScopeChange: () => {},
  repoLabel: "alpha",
};

describe("SettingsScopeSelector", () => {
  it("shows a static global line without a repo", () => {
    render(<SettingsScopeSelector {...base} hasRepo={false} scope="global" repoLabel="" />);
    expect(screen.queryByTestId("scope-switcher")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scope-btn-repo")).not.toBeInTheDocument();
  });

  it("switches scope through the segmented control", () => {
    const onScopeChange = vi.fn();
    render(<SettingsScopeSelector {...base} onScopeChange={onScopeChange} />);
    expect(screen.getByTestId("scope-btn-repo")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("scope-btn-repo")).toHaveTextContent("alpha");
    fireEvent.click(screen.getByTestId("scope-btn-global"));
    expect(onScopeChange).toHaveBeenCalledWith("global");
  });

  it("never offers a picker for other repositories", () => {
    render(<SettingsScopeSelector {...base} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scope-repo-select")).not.toBeInTheDocument();
  });

  it("explains which repositories the current scope affects", () => {
    const { rerender } = render(<SettingsScopeSelector {...base} />);
    expect(screen.getByTestId("scope-hint")).toHaveTextContent("alpha");

    rerender(<SettingsScopeSelector {...base} scope="global" />);
    expect(screen.getByTestId("scope-hint")).not.toHaveTextContent("alpha");
  });
});
