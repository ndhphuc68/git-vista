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
});
