import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WelcomeScreen } from "../components/welcome/WelcomeScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("WelcomeScreen", () => {
  it("renders open button and recent repos list", async () => {
    const onSelect = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={onSelect} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Visual Git Client")).toBeInTheDocument();
    expect(screen.getByText("Mở thư mục...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("project-v3"));
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalled();
    });
  });

  it("calls clearRecentRepos when clicking clear button", async () => {
    const { invokeCommand } = await import("../ipc/client");
    const clearSpy = vi.spyOn(invokeCommand, "clearRecentRepos").mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("clear-recents-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("clear-recents-btn"));
    expect(clearSpy).toHaveBeenCalled();
  });

  it("calls removeRecentRepo when clicking remove button on a repo item", async () => {
    const { invokeCommand } = await import("../ipc/client");
    const removeSpy = vi.spyOn(invokeCommand, "removeRecentRepo").mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("remove-recent-d:/project-v3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("remove-recent-d:/project-v3"));
    expect(removeSpy).toHaveBeenCalledWith("d:/project-v3");
  });
});
