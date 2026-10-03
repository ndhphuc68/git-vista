import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { AuthorAvatar } from "./AuthorAvatar";

const NOREPLY = "42+octocat@users.noreply.github.com";

function renderAvatar(email = NOREPLY) {
  return render(<AuthorAvatar name="Jane Doe" email={email} size={18} />);
}

describe("AuthorAvatar", () => {
  afterEach(() => {
    useSettingsStore.setState({ avatarStyle: "initials" });
  });

  it("shows initials in initials mode", () => {
    useSettingsStore.setState({ avatarStyle: "initials" });
    const { container } = renderAvatar();
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders nothing in none mode", () => {
    useSettingsStore.setState({ avatarStyle: "none" });
    const { container } = renderAvatar();
    expect(container).toBeEmptyDOMElement();
  });

  it("loads the email avatar in gravatar mode", async () => {
    useSettingsStore.setState({ avatarStyle: "gravatar" });
    const { container } = renderAvatar();
    await waitFor(() =>
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "https://avatars.githubusercontent.com/u/42?s=36"
      )
    );
  });

  it("falls back to initials when the image fails to load", async () => {
    useSettingsStore.setState({ avatarStyle: "gravatar" });
    const { container } = renderAvatar("missing@example.com");
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});
