import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompareFileList } from "./CompareFileList";
import type { CompareFileItem } from "../../ipc/bindings.generated";

const files: CompareFileItem[] = [
  { path: "src/added.ts", old_path: null, status: "Added", additions: 3, deletions: 0, is_binary: false },
  {
    path: "src/renamed.ts",
    old_path: "src/old.ts",
    status: "Renamed",
    additions: 1,
    deletions: 1,
    is_binary: false,
  },
];

describe("CompareFileList", () => {
  it("renders every file with its status badge and stat numbers, and selects on click", () => {
    const onSelectFile = vi.fn();
    render(
      <CompareFileList
        files={files}
        selectedFile={null}
        onSelectFile={onSelectFile}
        searchQuery=""
        onSearchChange={vi.fn()}
      />
    );

    expect(screen.getByText("src/added.ts")).toBeInTheDocument();
    expect(screen.getByText("src/renamed.ts")).toBeInTheDocument();
    expect(screen.getByText("← src/old.ts")).toBeInTheDocument();
    expect(screen.getByTitle("Added")).toBeInTheDocument();
    expect(screen.getByTitle("Renamed")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();

    fireEvent.click(screen.getByText("src/added.ts"));
    expect(onSelectFile).toHaveBeenCalledWith(files[0]);
  });

  it("filters files by the search query", () => {
    render(
      <CompareFileList
        files={files}
        selectedFile={null}
        onSelectFile={vi.fn()}
        searchQuery="renamed"
        onSearchChange={vi.fn()}
      />
    );

    expect(screen.queryByText("src/added.ts")).not.toBeInTheDocument();
    expect(screen.getByText("src/renamed.ts")).toBeInTheDocument();
  });

  it("shows a loading state while isLoading is true", () => {
    render(
      <CompareFileList
        files={[]}
        selectedFile={null}
        onSelectFile={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        isLoading
      />
    );

    expect(screen.queryByText("src/added.ts")).not.toBeInTheDocument();
  });
});
