import { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCommitFileNavigation } from "./useCommitFileNavigation";

const files = [
  { path: "src/Alpha.ts", status: "M", additions: 2, deletions: 1 },
  { path: "README.md", status: "A", additions: 3, deletions: 0 },
  { path: "src/omega.ts", status: "R100", additions: 0, deletions: 0 },
];

function useNavigation(
  availableFiles: typeof files | undefined,
  initialPath: string | null = null
) {
  const [selectedPath, setSelectedPath] = useState(initialPath);
  return {
    ...useCommitFileNavigation(availableFiles, selectedPath, setSelectedPath),
    selectedPath,
    setSelectedPath,
  };
}

describe("useCommitFileNavigation", () => {
  it("selects the first file only after details arrive", () => {
    const { result, rerender } = renderHook(({ availableFiles }) => useNavigation(availableFiles), {
      initialProps: { availableFiles: undefined as typeof files | undefined },
    });
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.hasNext).toBe(false);
    rerender({ availableFiles: files });
    expect(result.current.selectedPath).toBe("src/Alpha.ts");
    expect(result.current.selectedFile).toEqual(files[0]);
  });

  it("preserves existing selection and does not replace an unavailable path", () => {
    const { result, rerender } = renderHook(
      ({ availableFiles }) => useNavigation(availableFiles, "README.md"),
      { initialProps: { availableFiles: files } }
    );
    expect(result.current.selectedFile?.path).toBe("README.md");
    rerender({ availableFiles: [files[0]!] });
    expect(result.current.selectedPath).toBe("README.md");
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.hasNext).toBe(false);
  });

  it("navigates the full file order and stops at both boundaries", () => {
    const { result } = renderHook(() => useNavigation(files));
    expect(result.current.hasPrev).toBe(false);
    act(() => result.current.handlePrevFile());
    expect(result.current.selectedPath).toBe("src/Alpha.ts");
    act(() => result.current.handleNextFile());
    expect(result.current.selectedPath).toBe("README.md");
    expect(result.current.currentFileIndex).toBe(1);
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.hasNext).toBe(true);
    act(() => result.current.handleNextFile());
    expect(result.current.selectedPath).toBe("src/omega.ts");
    expect(result.current.hasNext).toBe(false);
    act(() => result.current.handleNextFile());
    expect(result.current.selectedPath).toBe("src/omega.ts");
    act(() => result.current.handlePrevFile());
    expect(result.current.selectedPath).toBe("README.md");
  });

  it("filters case-insensitively without changing selected file or navigation order", () => {
    const { result } = renderHook(() => useNavigation(files));
    act(() => result.current.setFileFilter("OMEGA"));
    expect(result.current.filteredFiles.map((file) => file.path)).toEqual(["src/omega.ts"]);
    expect(result.current.selectedFile?.path).toBe("src/Alpha.ts");
    act(() => result.current.handleNextFile());
    expect(result.current.selectedPath).toBe("README.md");
    act(() => result.current.setFileFilter(" omega "));
    expect(result.current.filteredFiles).toEqual([]);
    act(() => result.current.setFileFilter("   "));
    expect(result.current.filteredFiles).toEqual(files);
    act(() => result.current.setFileFilter(""));
    expect(result.current.filteredFiles).toEqual(files);
  });

  it("keeps empty and single-file navigation disabled", () => {
    const { result, rerender } = renderHook(({ availableFiles }) => useNavigation(availableFiles), {
      initialProps: { availableFiles: [] as typeof files },
    });
    act(() => {
      result.current.handleNextFile();
      result.current.handlePrevFile();
    });
    expect(result.current.selectedPath).toBeNull();
    expect(result.current.filteredFiles).toEqual([]);
    rerender({ availableFiles: [files[0]!] });
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.hasNext).toBe(false);
  });
});
