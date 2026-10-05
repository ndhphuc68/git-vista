import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { useExternalLinks } from "./useExternalLinks";
import { openExternalUrl } from "../features/repo";

vi.mock("../features/repo", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  openExternalUrl: vi.fn().mockResolvedValue(undefined),
}));

function Harness() {
  useExternalLinks();
  return (
    <>
      <a href="https://github.com/org/repo" target="_blank" rel="noreferrer">
        <span>external</span>
      </a>
      <a href="#local">local</a>
      <div onClick={(e) => e.stopPropagation()}>
        <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
          inside modal
        </a>
      </div>
    </>
  );
}

describe("useExternalLinks", () => {
  beforeEach(() => {
    vi.mocked(openExternalUrl).mockClear();
  });

  it("opens external links in the system browser instead of the webview", () => {
    const { getByText } = render(<Harness />);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    getByText("external").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(openExternalUrl).toHaveBeenCalledWith("https://github.com/org/repo");
  });

  it("opens external links whose ancestor stops click propagation", () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText("inside modal"));
    expect(openExternalUrl).toHaveBeenCalledWith("https://github.com/settings/tokens");
  });

  it("leaves in-app links alone", () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText("local"));
    expect(openExternalUrl).not.toHaveBeenCalled();
  });
});
