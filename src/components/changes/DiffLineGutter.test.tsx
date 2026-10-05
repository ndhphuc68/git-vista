import { describe, it, expect, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { DiffLineGutter } from "./DiffLineGutter";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("DiffLineGutter", () => {
  afterEach(() => {
    act(() => {
      useSettingsStore.setState({ diffShowLineNumbers: true });
    });
  });

  it("shows or hides line numbers per setting", () => {
    act(() => {
      useSettingsStore.setState({ diffShowLineNumbers: true });
    });
    const props = { oldLineno: 3, newLineno: 4, isAdd: false, isDel: false, isModifiedLine: false };
    const { rerender } = render(<DiffLineGutter {...props} />);
    expect(screen.getByText("3")).toBeInTheDocument();

    act(() => {
      useSettingsStore.setState({ diffShowLineNumbers: false });
    });
    rerender(<DiffLineGutter {...props} />);
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });
});

