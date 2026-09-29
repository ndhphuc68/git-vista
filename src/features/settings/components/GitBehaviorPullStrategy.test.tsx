import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GitBehaviorPullStrategy } from "./GitBehaviorPullStrategy";

function clickOptionContaining(text: string) {
  const button = screen
    .getAllByRole("button")
    .find((el) => el.textContent?.includes(text) && el.tagName === "BUTTON");
  if (!button) throw new Error(`No button found containing "${text}"`);
  fireEvent.click(button);
}

describe("GitBehaviorPullStrategy", () => {
  it("renders the repo-scope options and reports the selected strategy", () => {
    const onRepoPullStrategyChange = vi.fn();
    const onGlobalPullStrategyChange = vi.fn();

    render(
      <GitBehaviorPullStrategy
        activeScope="repo"
        currentRepoPath="/repo/one"
        localPullRebase={null}
        globalPullRebase={true}
        loading={false}
        saving={false}
        onGlobalPullStrategyChange={onGlobalPullStrategyChange}
        onRepoPullStrategyChange={onRepoPullStrategyChange}
      />
    );

    // 3 option buttons: inherit, merge, rebase
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(3);

    clickOptionContaining("Kế thừa từ Global");
    expect(onRepoPullStrategyChange).toHaveBeenCalledWith("inherit");

    clickOptionContaining("Tạo Merge Commit");
    expect(onRepoPullStrategyChange).toHaveBeenCalledWith("merge");

    clickOptionContaining("Rebase lên trên nhánh mới");
    expect(onRepoPullStrategyChange).toHaveBeenCalledWith("rebase");
  });

  it("renders the global-scope options and reports the selected strategy", () => {
    const onRepoPullStrategyChange = vi.fn();
    const onGlobalPullStrategyChange = vi.fn();

    render(
      <GitBehaviorPullStrategy
        activeScope="global"
        currentRepoPath={null}
        localPullRebase={null}
        globalPullRebase={false}
        loading={false}
        saving={false}
        onGlobalPullStrategyChange={onGlobalPullStrategyChange}
        onRepoPullStrategyChange={onRepoPullStrategyChange}
      />
    );

    clickOptionContaining("Tạo Merge Commit");
    expect(onGlobalPullStrategyChange).toHaveBeenCalledWith(false);

    clickOptionContaining("Rebase lên trên nhánh mới");
    expect(onGlobalPullStrategyChange).toHaveBeenCalledWith(true);
  });
});
