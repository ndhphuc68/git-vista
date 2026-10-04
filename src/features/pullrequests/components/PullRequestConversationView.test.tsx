import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PullRequestConversationView } from "./PullRequestConversationView";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { vi as viTranslations } from "../../../i18n/vi";
import type { PullRequestDetail } from "../../../ipc/githubApi";

beforeEach(() => {
  useSettingsStore.setState({ locale: "vi" });
});

afterEach(() => {
  cleanup();
});

const mockDetail: PullRequestDetail = {
  pr: {
    number: 42,
    title: "Feature: Add advanced filtering",
    state: "open",
    draft: false,
    merged_at: null,
    user: {
      login: "developer_one",
      avatar_url: "https://avatar.test/dev1",
      html_url: "https://github.com/developer_one",
    },
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
    head: { ref: "feature/filtering", sha: "aaa111" },
    base: { ref: "main", sha: "bbb222" },
    comments: 4,
    labels: [
      { id: 1, name: "enhancement", color: "a2eeef", description: "New feature" },
      { id: 2, name: "ui", color: "e99695", description: "UI work" },
    ],
    html_url: "https://github.com/owner/repo/pull/42",
  },
  body: "This PR introduces a new filtering algorithm for improved performance.",
  mergeable: true,
  assignees: [
    { login: "assignee_alice", avatar_url: "https://avatar.test/alice", html_url: "" },
    { login: "assignee_no_avatar", avatar_url: "", html_url: "" },
  ],
  requested_reviewers: [
    { login: "reviewer_bob", avatar_url: "https://avatar.test/bob", html_url: "" },
  ],
  check_runs: [
    { name: "unit-tests", status: "success", details_url: "https://ci.test/unit" },
    { name: "typecheck", status: "failure", details_url: "https://ci.test/typecheck" },
    { name: "e2e-tests", status: "in_progress", details_url: null },
    { name: "security-scan", status: "neutral", details_url: null },
  ],
  files: [],
  commits_count: 5,
};

describe("PullRequestConversationView", () => {
  it("renders PR description text when present", () => {
    render(<PullRequestConversationView detail={mockDetail} />);

    expect(screen.getByText(viTranslations.pullRequests.description)).toBeInTheDocument();
    expect(
      screen.getByText("This PR introduces a new filtering algorithm for improved performance.")
    ).toBeInTheDocument();
  });

  it("renders translated empty placeholder when description is absent or empty", () => {
    const emptyBodyDetail: PullRequestDetail = {
      ...mockDetail,
      body: "   ",
    };

    render(<PullRequestConversationView detail={emptyBodyDetail} />);

    expect(screen.getByText(viTranslations.pullRequests.description)).toBeInTheDocument();
    expect(screen.getByText(viTranslations.pullRequests.noDescription)).toBeInTheDocument();
  });

  it("renders check runs with status icons and details links", () => {
    render(<PullRequestConversationView detail={mockDetail} />);

    expect(screen.getByText(viTranslations.pullRequestsScreen.checks.title)).toBeInTheDocument();
    expect(screen.getByText("unit-tests")).toBeInTheDocument();
    expect(screen.getByText("typecheck")).toBeInTheDocument();
    expect(screen.getByText("e2e-tests")).toBeInTheDocument();
    expect(screen.getByText("security-scan")).toBeInTheDocument();

    const unitLink = screen.getByRole("link", {
      name: new RegExp(mockDetail.check_runs[0]!.name, "i"),
    });
    expect(unitLink).toHaveAttribute("href", "https://ci.test/unit");
    expect(unitLink).toHaveAttribute("target", "_blank");

    const typecheckLink = screen.getByRole("link", {
      name: new RegExp(mockDetail.check_runs[1]!.name, "i"),
    });
    expect(typecheckLink).toHaveAttribute("href", "https://ci.test/typecheck");
  });

  it("renders empty placeholder when check runs list is empty", () => {
    const noChecksDetail: PullRequestDetail = {
      ...mockDetail,
      check_runs: [],
    };

    render(<PullRequestConversationView detail={noChecksDetail} />);

    expect(screen.getByText(viTranslations.pullRequestsScreen.checks.noChecks)).toBeInTheDocument();
  });

  it("renders reviewers, assignees, and labels", () => {
    render(<PullRequestConversationView detail={mockDetail} />);

    // Reviewers
    expect(screen.getByText(viTranslations.pullRequestsScreen.meta.reviewers)).toBeInTheDocument();
    expect(screen.getByText("@reviewer_bob")).toBeInTheDocument();

    // Assignees
    expect(screen.getByText(viTranslations.pullRequestsScreen.meta.assignees)).toBeInTheDocument();
    expect(screen.getByText("@assignee_alice")).toBeInTheDocument();
    expect(screen.getByText("@assignee_no_avatar")).toBeInTheDocument();

    // Labels
    expect(screen.getByText(viTranslations.pullRequestsScreen.meta.labels)).toBeInTheDocument();
    expect(screen.getByText("enhancement")).toBeInTheDocument();
    expect(screen.getByText("ui")).toBeInTheDocument();
  });

  it("renders fallback placeholders when reviewers, assignees, and labels are empty", () => {
    const emptyMetaDetail: PullRequestDetail = {
      ...mockDetail,
      pr: {
        ...mockDetail.pr,
        labels: [],
      },
      requested_reviewers: [],
      assignees: [],
    };

    render(<PullRequestConversationView detail={emptyMetaDetail} />);

    expect(
      screen.getByText(viTranslations.pullRequestsScreen.meta.noReviewers)
    ).toBeInTheDocument();
    expect(
      screen.getByText(viTranslations.pullRequestsScreen.meta.noAssignees)
    ).toBeInTheDocument();
    expect(screen.getByText(viTranslations.pullRequestsScreen.meta.noLabels)).toBeInTheDocument();
  });
});
