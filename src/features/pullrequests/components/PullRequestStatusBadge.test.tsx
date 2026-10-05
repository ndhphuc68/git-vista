import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PullRequestStatusBadge } from "./PullRequestStatusBadge";
import { getPullRequestStatus } from "../model/pullRequestStatus";

afterEach(() => {
  cleanup();
});

describe("getPullRequestStatus", () => {
  it("returns 'merged' when merged_at is present", () => {
    const status = getPullRequestStatus({
      merged_at: "2026-10-01T12:00:00Z",
      state: "closed",
      draft: false,
    });
    expect(status).toBe("merged");
  });

  it("returns 'closed' when state is closed and merged_at is null", () => {
    const status = getPullRequestStatus({
      merged_at: null,
      state: "closed",
      draft: false,
    });
    expect(status).toBe("closed");
  });

  it("returns 'draft' when state is open and draft is true", () => {
    const status = getPullRequestStatus({
      merged_at: null,
      state: "open",
      draft: true,
    });
    expect(status).toBe("draft");
  });

  it("returns 'open' when state is open and draft is false", () => {
    const status = getPullRequestStatus({
      merged_at: null,
      state: "open",
      draft: false,
    });
    expect(status).toBe("open");
  });
});

describe("PullRequestStatusBadge", () => {
  it("renders merged badge with purple styling and GitMerge icon", () => {
    const { container } = render(
      <PullRequestStatusBadge
        pr={{
          merged_at: "2026-10-01T12:00:00Z",
          state: "closed",
          draft: false,
        }}
      />
    );

    expect(screen.getByText("Merged")).toBeInTheDocument();
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-purple-500/15");
  });

  it("renders closed badge with rose styling and AlertCircle icon", () => {
    const { container } = render(
      <PullRequestStatusBadge
        pr={{
          merged_at: null,
          state: "closed",
          draft: false,
        }}
      />
    );

    expect(screen.getByText("Closed")).toBeInTheDocument();
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-rose-500/15");
  });

  it("renders draft badge with surface-header styling and FileEdit icon", () => {
    const { container } = render(
      <PullRequestStatusBadge
        pr={{
          merged_at: null,
          state: "open",
          draft: true,
        }}
      />
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-surface-header");
  });

  it("renders open badge with emerald styling and GitPullRequest icon", () => {
    const { container } = render(
      <PullRequestStatusBadge
        pr={{
          merged_at: null,
          state: "open",
          draft: false,
        }}
      />
    );

    expect(screen.getByText("Open")).toBeInTheDocument();
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-emerald-500/15");
  });

  it("applies size variants correctly", () => {
    const { container: smContainer } = render(
      <PullRequestStatusBadge pr={{ merged_at: null, state: "open", draft: false }} size="sm" />
    );
    expect((smContainer.firstChild as HTMLElement).className).toContain("text-xs");

    const { container: mdContainer } = render(
      <PullRequestStatusBadge pr={{ merged_at: null, state: "open", draft: false }} size="md" />
    );
    expect((mdContainer.firstChild as HTMLElement).className).toContain("text-sm");
  });
});
