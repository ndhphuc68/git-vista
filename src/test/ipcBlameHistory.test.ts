import { describe, it, expect } from "vitest";
import { invokeCommand } from "../ipc/client";

describe("IPC Client - Git Blame & File History", () => {
  it("fetches file blame with valid line attributions in mock mode", async () => {
    const result = await invokeCommand.getFileBlame("/path/to/repo", "src/index.ts");
    expect(result).toBeDefined();
    expect(result.file_path).toBe("src/index.ts");
    expect(result.total_lines).toBeGreaterThan(0);
    expect(result.lines.length).toBe(result.total_lines);

    const firstLine = result.lines[0];
    expect(firstLine).toBeDefined();
    expect(firstLine.line_no).toBe(1);
    expect(firstLine.commit_id).toBeDefined();
    expect(firstLine.author_name).toBeDefined();
    expect(firstLine.content).toBeDefined();
    expect(firstLine.is_hunk_start).toBe(true);
  });

  it("fetches file history with commit list in mock mode", async () => {
    const result = await invokeCommand.getFileHistory("/path/to/repo", "src/index.ts", 0, 10);
    expect(result).toBeDefined();
    expect(result.file_path).toBe("src/index.ts");
    expect(result.total_count).toBeGreaterThan(0);
    expect(result.commits.length).toBeGreaterThan(0);

    const firstCommit = result.commits[0];
    expect(firstCommit).toBeDefined();
    expect(firstCommit.commit_id).toBeDefined();
    expect(firstCommit.short_id).toBeDefined();
    expect(firstCommit.summary).toBeDefined();
    expect(firstCommit.author_name).toBeDefined();
    expect(["added", "modified", "deleted"]).toContain(firstCommit.change_type);
  });
});
