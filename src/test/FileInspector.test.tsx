import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInspectorStore } from "../store/useInspectorStore";
import { FileInspectorDrawer } from "../components/inspector/FileInspectorDrawer";
import { BlameView } from "../components/inspector/BlameView";
import { FileHistoryView } from "../components/inspector/FileHistoryView";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("File Inspector - Store and Components", () => {
  beforeEach(() => {
    useInspectorStore.setState({
      isOpen: false,
      filePath: null,
      commitId: null,
      activeTab: "blame",
    });
  });

  it("manages open, close, and tab switching in useInspectorStore", () => {
    const store = useInspectorStore.getState();
    expect(store.isOpen).toBe(false);

    store.openInspector("src/test.ts", "history", "c123");
    const updated = useInspectorStore.getState();
    expect(updated.isOpen).toBe(true);
    expect(updated.filePath).toBe("src/test.ts");
    expect(updated.activeTab).toBe("history");
    expect(updated.commitId).toBe("c123");

    updated.setActiveTab("blame");
    expect(useInspectorStore.getState().activeTab).toBe("blame");

    updated.closeInspector();
    expect(useInspectorStore.getState().isOpen).toBe(false);
    expect(useInspectorStore.getState().filePath).toBeNull();
  });

  it("renders BlameView with author details and code lines", async () => {
    renderWithClient(
      <BlameView repoPath="/mock/repo" filePath="src/index.ts" commitId={null} />
    );

    await waitFor(() => {
      expect(screen.getByText("GitVista Team")).toBeDefined();
    });

    expect(screen.getByText("c1a2b3c")).toBeDefined();
    expect(screen.getByText("import React from 'react';")).toBeDefined();
  });

  it("renders FileHistoryView with commit list", async () => {
    renderWithClient(
      <FileHistoryView repoPath="/mock/repo" filePath="src/index.ts" />
    );

    await waitFor(() => {
      expect(screen.getByText("PhucNDH")).toBeDefined();
    });

    expect(screen.getByText("♻️ refactor exports and formatting")).toBeDefined();
  });

  it("renders FileInspectorDrawer and allows tab switching and closing", async () => {
    useInspectorStore.getState().openInspector("src/index.ts", "blame");

    renderWithClient(<FileInspectorDrawer repoPath="/mock/repo" />);

    expect(screen.getByTestId("file-inspector-drawer")).toBeDefined();
    expect(screen.getByText("src/index.ts")).toBeDefined();

    // Tab buttons
    const historyTab = screen.getByRole("tab", { name: /Lịch sử|History/i });
    fireEvent.click(historyTab);
    expect(useInspectorStore.getState().activeTab).toBe("history");

    // Close button
    const closeBtn = screen.getByTestId("inspector-close-btn");
    fireEvent.click(closeBtn);
    expect(useInspectorStore.getState().isOpen).toBe(false);
  });
});
