import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GitHubSettingsTab } from "../components/settings/tabs/GitHubSettingsTab";
import * as githubService from "../services/githubService";
import { invokeCommand } from "../ipc/client";
import { vi as viTranslations } from "../i18n/vi";

const t = viTranslations;

vi.mock("../services/githubService", () => ({
  testGitHubToken: vi.fn(),
}));

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    getGitHubToken: vi.fn(),
    saveGitHubToken: vi.fn(),
    removeGitHubToken: vi.fn(),
  },
}));

describe("GitHubSettingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders disconnected state when no token is present", async () => {
    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue(null);

    render(<GitHubSettingsTab />);

    expect(await screen.findByText(t.settings.github.title)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t.settings.github.tokenPlaceholder)).toBeInTheDocument();
    expect(screen.getByText(t.settings.github.testConnection)).toBeInTheDocument();
  });

  it("allows entering token, testing connection, and saving", async () => {
    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue(null);
    vi.mocked(githubService.testGitHubToken).mockResolvedValue({
      login: "testuser",
      avatar_url: "https://avatar.test/1",
      html_url: "https://github.com/testuser",
    });

    render(<GitHubSettingsTab />);

    const input = await screen.findByPlaceholderText(t.settings.github.tokenPlaceholder);
    fireEvent.change(input, { target: { value: "ghp_valid_token_123" } });

    const testBtn = screen.getByText(t.settings.github.testConnection);
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(githubService.testGitHubToken).toHaveBeenCalledWith("ghp_valid_token_123");
      expect(invokeCommand.saveGitHubToken).toHaveBeenCalledWith("ghp_valid_token_123");
    });

    expect(await screen.findByText(t.settings.github.connectedAs)).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("handles disconnecting token", async () => {
    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue("ghp_existing_token");
    vi.mocked(githubService.testGitHubToken).mockResolvedValue({
      login: "testuser",
      avatar_url: "https://avatar.test/1",
      html_url: "https://github.com/testuser",
    });

    render(<GitHubSettingsTab />);

    const disconnectBtn = await screen.findByText(t.settings.github.disconnect);
    fireEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(invokeCommand.removeGitHubToken).toHaveBeenCalled();
    });

    expect(
      await screen.findByPlaceholderText(t.settings.github.tokenPlaceholder)
    ).toBeInTheDocument();
  });
});
