import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiffLineGutter } from "./DiffLineGutter";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("DiffLineGutter", () => {
  it("shows or hides line numbers per setting", () => {
    useSettingsStore.setState({ diffShowLineNumbers: true });
    const props = { oldLineno: 3, newLineno: 4, isAdd: false, isDel: false, isModifiedLine: false };
    const { rerender } = render(<DiffLineGutter {...props} />);
    expect(screen.getByText("3")).toBeInTheDocument();

    useSettingsStore.setState({ diffShowLineNumbers: false });
    rerender(<DiffLineGutter {...props} />);
    expect(screen.queryByText("3")).not.toBeInTheDocument();
    useSettingsStore.setState({ diffShowLineNumbers: true });
  });
});
