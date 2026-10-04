import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { PullRequestFilesChangedView } from "./PullRequestFilesChangedView";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { vi as viTranslations } from "../../../i18n/vi";
import type { PullRequestFileItem } from "../../../ipc/githubApi";

beforeEach(() => {
  useSettingsStore.setState({ locale: "vi" });
});

afterEach(() => {
  cleanup();
});

const mockFiles: PullRequestFileItem[] = [
  {
    filename: "src/main.ts",
    status: "added",
    additions: 25,
    deletions: 0,
    changes: 25,
    patch: "@@ -0,0 +1,2 @@\n+console.log('main');\n+export const x = 1;",
  },
  {
    filename: "src/utils.ts",
    status: "modified",
    additions: 10,
    deletions: 5,
    changes: 15,
    patch: "@@ -1,3 +1,3 @@\n-const oldFn = 1;\n+const newFn = 2;",
  },
  {
    filename: "src/deprecated.ts",
    status: "removed",
    additions: 0,
    deletions: 12,
    changes: 12,
    patch: "@@ -1,12 +0,0 @@\n-delete me;",
  },
];

describe("PullRequestFilesChangedView", () => {
  it("displays summary calculation correctly (file count, +additions, -deletions)", () => {
    render(<PullRequestFilesChangedView files={mockFiles} />);

    // Total: 3 files, 35 additions, 17 deletions
    const expectedSummary = viTranslations.pullRequestsScreen.files.summary
      .replace("{count}", "3")
      .replace("{additions}", "35")
      .replace("{deletions}", "17");

    expect(screen.getByText(expectedSummary)).toBeInTheDocument();
  });

  it("lists all files with status badges and change counts", () => {
    render(<PullRequestFilesChangedView files={mockFiles} />);

    expect(screen.getByRole("button", { name: /src\/main\.ts/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /src\/utils\.ts/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /src\/deprecated\.ts/i })).toBeInTheDocument();

    expect(screen.getByText("+25")).toBeInTheDocument();
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.getByText("-12")).toBeInTheDocument();

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("selects first file by default and renders its patch diff", () => {
    render(<PullRequestFilesChangedView files={mockFiles} />);

    expect(screen.getByText("console.log('main');")).toBeInTheDocument();
  });

  it("changes selection and renders newly selected file patch diff when a file is clicked", () => {
    const handleSelectFile = vi.fn();

    render(<PullRequestFilesChangedView files={mockFiles} onSelectFile={handleSelectFile} />);

    const utilsButton = screen.getByRole("button", { name: /src\/utils\.ts/i });
    fireEvent.click(utilsButton);

    expect(handleSelectFile).toHaveBeenCalledWith("src/utils.ts");
    expect(screen.getByText("const newFn = 2;")).toBeInTheDocument();
  });

  it("honors controlled selectedFilename prop", () => {
    render(<PullRequestFilesChangedView files={mockFiles} selectedFilename="src/deprecated.ts" />);

    expect(screen.getByText("delete me;")).toBeInTheDocument();
  });

  it("handles empty files list gracefully", () => {
    render(<PullRequestFilesChangedView files={[]} />);

    const emptySummary = viTranslations.pullRequestsScreen.files.summary
      .replace("{count}", "0")
      .replace("{additions}", "0")
      .replace("{deletions}", "0");

    expect(screen.getByText(emptySummary)).toBeInTheDocument();
  });
});
