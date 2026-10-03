import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select, type SelectProps } from "./Select";
import { Modal } from "./Modal";

const OPTIONS = [
  { value: "main", label: "main", badge: <span>HEAD</span> },
  { value: "dev", label: "dev" },
  { value: "old", label: "old", disabled: true },
  { value: "feature", label: "feature" },
];

function Controlled(props: Partial<SelectProps> & { onPicked?: (v: string) => void }) {
  const [value, setValue] = useState(props.value ?? "main");
  return (
    <Select
      aria-label="Branch"
      options={OPTIONS}
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onPicked?.(next);
      }}
    />
  );
}

const trigger = () => screen.getByRole("combobox", { name: "Branch" });

describe("Select", () => {
  it("shows the selected option and its badge in the trigger", () => {
    render(<Controlled />);
    expect(trigger()).toHaveTextContent("mainHEAD");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the placeholder when the value matches no option", () => {
    render(<Controlled value="nope" placeholder="Pick one" />);
    expect(trigger()).toHaveTextContent("Pick one");
  });

  it("opens on click, marks the selected option and picks another by click", () => {
    const onPicked = vi.fn();
    render(<Controlled onPicked={onPicked} />);

    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("option", { name: /main/ })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("option", { name: "dev" }));
    expect(onPicked).toHaveBeenCalledWith("dev");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("dev");
    expect(trigger()).toHaveFocus();
  });

  it("ignores clicks on disabled options", () => {
    const onPicked = vi.fn();
    render(<Controlled onPicked={onPicked} />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("option", { name: "old" }));
    expect(onPicked).not.toHaveBeenCalled();
  });

  it("navigates with the keyboard, skipping disabled options", () => {
    const onPicked = vi.fn();
    render(<Controlled onPicked={onPicked} />);

    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(trigger(), { key: "ArrowDown" }); // dev
    fireEvent.keyDown(trigger(), { key: "ArrowDown" }); // feature (old is disabled)
    const feature = screen.getByRole("option", { name: "feature" });
    expect(trigger()).toHaveAttribute("aria-activedescendant", feature.id);

    fireEvent.keyDown(trigger(), { key: "Home" });
    fireEvent.keyDown(trigger(), { key: "End" });
    fireEvent.keyDown(trigger(), { key: "Enter" });
    expect(onPicked).toHaveBeenCalledWith("feature");
  });

  it("filters the list and shows the empty text when searchable", () => {
    render(<Controlled searchable searchPlaceholder="Filter" emptyText="Nothing found" />);
    fireEvent.click(trigger());

    const search = screen.getByRole("searchbox", { name: "Filter" });
    expect(search).toHaveFocus();

    fireEvent.change(search, { target: { value: "fea" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["feature"]);

    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("Nothing found")).toBeInTheDocument();
  });

  it("picks the first match with Enter from the search box", () => {
    const onPicked = vi.fn();
    render(<Controlled searchable searchPlaceholder="Filter" onPicked={onPicked} />);
    fireEvent.click(trigger());
    const search = screen.getByRole("searchbox", { name: "Filter" });
    fireEvent.change(search, { target: { value: "dev" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onPicked).toHaveBeenCalledWith("dev");
  });

  it("renders labelled groups", () => {
    render(
      <Select
        aria-label="Branch"
        value=""
        onChange={vi.fn()}
        options={[
          { label: "Local", options: [{ value: "a", label: "a" }] },
          { label: "Remote", options: [{ value: "b", label: "b" }] },
        ]}
      />
    );
    fireEvent.click(trigger());
    expect(screen.getByRole("group", { name: "Local" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Remote" })).toBeInTheDocument();
  });

  it("closes on an outside mouse press", () => {
    render(<Controlled />);
    fireEvent.click(trigger());
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not open when disabled", () => {
    render(<Controlled disabled />);
    expect(trigger()).toBeDisabled();
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes only itself on Escape inside a modal", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} labelledBy="t">
        <Modal.Body>
          <Controlled />
        </Modal.Body>
      </Modal>
    );
    fireEvent.click(trigger());
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("names the combobox from a label element via id", () => {
    render(
      <>
        <label htmlFor="pick">Base</label>
        <Select id="pick" value="main" onChange={vi.fn()} options={OPTIONS} />
      </>
    );
    expect(screen.getByLabelText("Base")).toHaveAttribute("role", "combobox");
  });
});
