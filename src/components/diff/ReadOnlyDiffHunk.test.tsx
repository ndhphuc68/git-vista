import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReadOnlyDiffHunk } from "./ReadOnlyDiffHunk";
import type { DiffHunk } from "../../ipc/bindings.generated";

const sampleHunk: DiffHunk = {
  header: "@@ -1,3 +1,3 @@",
  old_start: 1,
  old_lines: 3,
  new_start: 1,
  new_lines: 3,
  lines: [
    { line_type: "context", content: "keep\n", old_lineno: 1, new_lineno: 1 },
    { line_type: "delete", content: "old\n", old_lineno: 2, new_lineno: null },
    { line_type: "add", content: "new\n", old_lineno: null, new_lineno: 2 },
  ],
};

describe("ReadOnlyDiffHunk", () => {
  it("renders the header and every line in unified order", () => {
    render(<ReadOnlyDiffHunk hunk={sampleHunk} showWordDiff={false} />);
    expect(screen.getByText("@@ -1,3 +1,3 @@")).toBeInTheDocument();
    const contents = screen.getAllByText(/^(keep|old|new)$/).map((el) => el.textContent?.trim());
    expect(contents).toEqual(["keep", "old", "new"]);
  });
});
