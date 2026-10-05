import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileHistoryCommitRow } from "./FileHistoryCommitRow";
import type { FileHistoryItem } from "../../ipc/bindings.generated";

function commit(change_type: string): FileHistoryItem {
  return {
    commit_id: "d4e5f6a1b2c37890123456789abcdef012345678",
    short_id: "d4e5f6a",
    summary: "refactor exports",
    author_name: "Dev",
    author_email: "dev@example.com",
    timestamp_sec: 0,
    change_type,
  };
}

describe("FileHistoryCommitRow", () => {
  it.each([
    ["added", "Thêm mới"],
    ["deleted", "Đã xoá"],
    ["modified", "Đã sửa"],
  ])("titles a %s change as %s", (changeType, title) => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <FileHistoryCommitRow commit={commit(changeType)} isSelected={false} onSelect={vi.fn()} />
      </QueryClientProvider>
    );
    expect(screen.getByTitle(title)).toBeInTheDocument();
  });
});
