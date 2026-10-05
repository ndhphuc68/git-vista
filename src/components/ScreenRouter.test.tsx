import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScreenRouter } from "./ScreenRouter";

vi.mock("./Shell", () => ({
  Shell: () => <div data-testid="mock-shell">Shell Component</div>,
}));

vi.mock("./changes/ChangesScreen", () => ({
  ChangesScreen: () => <div data-testid="mock-changes-screen">Changes Screen</div>,
}));

vi.mock("./conflict/ConflictResolverScreen", () => ({
  ConflictResolverScreen: () => (
    <div data-testid="mock-conflict-screen">Conflict Resolver Screen</div>
  ),
}));

vi.mock("../features/pullrequests", () => ({
  PullRequestsScreen: ({ repoPath }: { repoPath: string }) => (
    <div data-testid="mock-pr-screen">Pull Requests Screen: {repoPath}</div>
  ),
}));

describe("ScreenRouter", () => {
  const dummyProps = {
    repoPath: "/path/to/repo",
    activeConflictFile: null,
    closeConflictResolver: vi.fn(),
    onResolveAndStage: vi.fn().mockResolvedValue(undefined),
  };

  it("renders Shell when activeScreen is history", () => {
    render(<ScreenRouter {...dummyProps} activeScreen="history" />);
    expect(screen.getByTestId("mock-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-changes-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-pr-screen")).not.toBeInTheDocument();
  });

  it("renders ChangesScreen when activeScreen is changes", () => {
    render(<ScreenRouter {...dummyProps} activeScreen="changes" />);
    expect(screen.getByTestId("mock-changes-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-pr-screen")).not.toBeInTheDocument();
  });

  it("renders PullRequestsScreen when activeScreen is pull-requests", () => {
    render(<ScreenRouter {...dummyProps} activeScreen="pull-requests" />);
    expect(screen.getByTestId("mock-pr-screen")).toBeInTheDocument();
    expect(screen.getByText("Pull Requests Screen: /path/to/repo")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-changes-screen")).not.toBeInTheDocument();
  });

  it("updates PullRequestsScreen when repoPath changes", () => {
    const { rerender } = render(<ScreenRouter {...dummyProps} activeScreen="pull-requests" />);
    expect(screen.getByText("Pull Requests Screen: /path/to/repo")).toBeInTheDocument();

    rerender(
      <ScreenRouter {...dummyProps} repoPath="/path/to/other-repo" activeScreen="pull-requests" />
    );
    expect(screen.getByText("Pull Requests Screen: /path/to/other-repo")).toBeInTheDocument();
  });
});
