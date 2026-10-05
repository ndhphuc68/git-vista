import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PullRequestCiChecks } from "./PullRequestCiChecks";
import { vi as viTranslations } from "../../i18n/vi";
import type { CheckRunItem } from "../../ipc/githubApi";

function renderRun(status: CheckRunItem["status"]) {
  return render(
    <PullRequestCiChecks
      checkRuns={[{ name: "build", status, details_url: null }]}
      t={viTranslations}
    />
  );
}

describe("PullRequestCiChecks", () => {
  it("renders nothing without check runs", () => {
    const { container } = render(<PullRequestCiChecks checkRuns={[]} t={viTranslations} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks a successful run green", () => {
    const { container } = renderRun("success");
    expect(container.querySelector(".text-emerald-500")).not.toBeNull();
  });

  it("marks a failed run red", () => {
    const { container } = renderRun("failure");
    expect(container.querySelector(".text-red-500")).not.toBeNull();
  });

  it.each(["in_progress", "queued"] as const)("marks a %s run amber", (status) => {
    const { container } = renderRun(status);
    expect(container.querySelector(".text-amber-500")).not.toBeNull();
  });

  it("shows no status icon for a neutral run", () => {
    const { container } = renderRun("neutral");
    expect(container.querySelector(".text-emerald-500, .text-red-500, .text-amber-500")).toBeNull();
  });
});
