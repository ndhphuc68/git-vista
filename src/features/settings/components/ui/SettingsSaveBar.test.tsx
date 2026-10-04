import type { FormEvent } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsSaveBar } from "./SettingsSaveBar";

describe("SettingsSaveBar", () => {
  it("renders nothing when not visible", () => {
    render(
      <SettingsSaveBar
        visible={false}
        saving={false}
        saveDisabled={false}
        saveLabel="Save"
        onDiscard={() => {}}
      />
    );
    expect(screen.queryByTestId("save-profile-btn")).not.toBeInTheDocument();
  });

  it("submits the surrounding form and calls onDiscard", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    const onDiscard = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <SettingsSaveBar
          visible
          saving={false}
          saveDisabled={false}
          saveLabel="Save"
          onDiscard={onDiscard}
        />
      </form>
    );
    fireEvent.click(screen.getByTestId("save-profile-btn"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("discard-profile-btn"));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("disables save when saveDisabled", () => {
    render(
      <SettingsSaveBar visible saving={false} saveDisabled saveLabel="Save" onDiscard={() => {}} />
    );
    expect(screen.getByTestId("save-profile-btn")).toBeDisabled();
  });
});
