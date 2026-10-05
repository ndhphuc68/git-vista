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

  it("leaves in-app links alone", () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText("local"));
    expect(openExternalUrl).not.toHaveBeenCalled();
  });
});
