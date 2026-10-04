import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsRow } from "./SettingsRow";

describe("SettingsRow", () => {
  it("associates the label with its control through htmlFor", () => {
    render(
      <SettingsRow label="Author name" htmlFor="name">
        <input id="name" />
      </SettingsRow>
    );
    expect(screen.getByLabelText("Author name")).toHaveAttribute("id", "name");
  });

  it("renders the label as plain text with an id when there is no htmlFor", () => {
    render(<SettingsRow label="Prune" labelId="prune-label" />);
    expect(screen.getByText("Prune")).toHaveAttribute("id", "prune-label");
  });

  it("renders description and help", () => {
    render(<SettingsRow label="A" description="Desc" help={<span>?</span>} />);
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("dims the row when disabled", () => {
    render(<SettingsRow label="A" disabled data-testid="row" />);
    expect(screen.getByTestId("row")).toHaveClass("opacity-60");
  });
});
