import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInspectorStore } from "../store/useInspectorStore";
import { FileDiffViewer } from "../components/diff/FileDiffViewer";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("File Inspector Entry Points", () => {
  beforeEach(() => {
    useInspectorStore.setState({
      isOpen: false,
      filePath: null,
      commitId: null,
      activeTab: "blame",
    });
  });

  it("triggers Git Blame from FileDiffViewer toolbar", async () => {
    renderWithClient(
      <FileDiffViewer repoPath="/mock/repo" commitId="c1a2b3c" filePath="src/test.ts" />
    );

    // Wait for toolbar to appear
    await waitFor(() => {
      expect(screen.getByTitle(/Git Blame/i)).toBeDefined();
    });

    const blameBtn = screen.getByTitle(/Git Blame/i);
    fireEvent.click(blameBtn);

    const store = useInspectorStore.getState();
    expect(store.isOpen).toBe(true);
    expect(store.filePath).toBe("src/test.ts");
    expect(store.activeTab).toBe("blame");
    expect(store.commitId).toBe("c1a2b3c");
  });

  it("triggers File History from FileDiffViewer toolbar", async () => {
    renderWithClient(
      <FileDiffViewer repoPath="/mock/repo" commitId="c1a2b3c" filePath="src/test.ts" />
    );

    await waitFor(() => {
      expect(screen.getByTitle(/Lịch sử|History/i)).toBeDefined();
    });

    const historyBtn = screen.getByTitle(/Lịch sử|History/i);
    fireEvent.click(historyBtn);

    const store = useInspectorStore.getState();
    expect(store.isOpen).toBe(true);
    expect(store.filePath).toBe("src/test.ts");
    expect(store.activeTab).toBe("history");
  });
});
