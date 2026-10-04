import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsScopeSelector, type SettingsScopeSelectorProps } from "./SettingsScopeSelector";

const base: SettingsScopeSelectorProps = {
  hasRepo: true,
  scope: "repo",
  onScopeChange: () => {},
  repos: [{ path: "d:/a", label: "alpha" }],
  selectedRepoPath: "d:/a",
  onRepoChange: () => {},
};

describe("SettingsScopeSelector", () => {
  it("shows a static global line without a repo", () => {
    render(<SettingsScopeSelector {...base} hasRepo={false} scope="global" repos={[]} />);
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

  it("shows the repo picker only in repo scope with more than one repo", () => {
    const repos = [...base.repos, { path: "d:/b", label: "beta" }];
    const onRepoChange = vi.fn();
    const { rerender } = render(<SettingsScopeSelector {...base} />);
    expect(screen.queryByTestId("scope-repo-select")).not.toBeInTheDocument();

    rerender(<SettingsScopeSelector {...base} repos={repos} onRepoChange={onRepoChange} />);
    fireEvent.click(screen.getByTestId("scope-repo-select"));
    fireEvent.click(screen.getByRole("option", { name: "beta" }));
    expect(onRepoChange).toHaveBeenCalledWith("d:/b");

    rerender(<SettingsScopeSelector {...base} scope="global" repos={repos} />);
    expect(screen.queryByTestId("scope-repo-select")).not.toBeInTheDocument();
  });
});
