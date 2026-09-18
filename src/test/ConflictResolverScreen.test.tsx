import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConflictResolverScreen } from "../components/conflict/ConflictResolverScreen";
import { type ConflictFileData } from "../ipc/bindings";

describe("ConflictResolverScreen Component", () => {
  const mockData: ConflictFileData = {
    file_path: "src/main.rs",
    total_conflicts: 1,
    hunks: [
      {
        id: "hunk_0",
        is_conflict: false,
        content: "fn main() {\n",
        ours: null,
        theirs: null,
        base: null,
        ours_label: null,
        theirs_label: null,
      },
      {
        id: "hunk_1",
        is_conflict: true,
        content: null,
        ours: '    println!("Hello Ours");\n',
        theirs: '    println!("Hello Theirs");\n',
        base: null,
        ours_label: "HEAD",
        theirs_label: "feature",
      },
      {
        id: "hunk_2",
        is_conflict: false,
        content: "}\n",
        ours: null,
        theirs: null,
        base: null,
        ours_label: null,
        theirs_label: null,
      },
    ],
  };

  it("renders 3 columns (Ours, Merged, Theirs) and handles Accept Ours", async () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    const handleBack = vi.fn();

    render(
      <ConflictResolverScreen
        filePath="src/main.rs"
        repoPath="/test/repo"
        conflictData={mockData}
        onBack={handleBack}
        onSaveAndStage={handleResolve}
      />
    );

    expect(screen.getByText("src/main.rs")).toBeInTheDocument();
    expect(screen.getByText(/CỦA BẠN/i)).toBeInTheDocument();
    expect(screen.getByText(/KẾT QUẢ/i)).toBeInTheDocument();
    expect(screen.getByText(/CỦA HỌ/i)).toBeInTheDocument();

    const acceptOursBtn = screen.getByRole("button", { name: /Lấy bên này \(Ours\)/i });
    fireEvent.click(acceptOursBtn);

    const saveBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleResolve).toHaveBeenCalledWith(
        expect.stringContaining('println!("Hello Ours");')
      );
    });
  });

  it("handles Accept Theirs", async () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    const handleBack = vi.fn();

    render(
      <ConflictResolverScreen
        filePath="src/main.rs"
        repoPath="/test/repo"
        conflictData={mockData}
        onBack={handleBack}
        onSaveAndStage={handleResolve}
      />
    );

    const acceptTheirsBtn = screen.getByRole("button", { name: /Lấy bên này \(Theirs\)/i });
    fireEvent.click(acceptTheirsBtn);

    const saveBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleResolve).toHaveBeenCalledWith(
        expect.stringContaining('println!("Hello Theirs");')
      );
    });
  });

  it("handles Accept Both", async () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    const handleBack = vi.fn();

    render(
      <ConflictResolverScreen
        filePath="src/main.rs"
        repoPath="/test/repo"
        conflictData={mockData}
        onBack={handleBack}
        onSaveAndStage={handleResolve}
      />
    );

    const acceptBothBtn = screen.getByRole("button", { name: /Lấy cả hai \(Both\)/i });
    fireEvent.click(acceptBothBtn);

    const saveBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleResolve).toHaveBeenCalledWith(
        expect.stringContaining('println!("Hello Ours");\n    println!("Hello Theirs");')
      );
    });
  });

  it("allows manual editing in textarea", async () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    const handleBack = vi.fn();

    render(
      <ConflictResolverScreen
        filePath="src/main.rs"
        repoPath="/test/repo"
        conflictData={mockData}
        onBack={handleBack}
        onSaveAndStage={handleResolve}
      />
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: '    println!("Custom merged code");\n' } });

    const saveBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleResolve).toHaveBeenCalledWith(
        expect.stringContaining('println!("Custom merged code");')
      );
    });
  });

  it("handles batch actions (Lấy tất cả Của bạn)", async () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    const handleBack = vi.fn();

    render(
      <ConflictResolverScreen
        filePath="src/main.rs"
        repoPath="/test/repo"
        conflictData={mockData}
        onBack={handleBack}
        onSaveAndStage={handleResolve}
      />
    );

    const takeAllOursBtn = screen.getByRole("button", { name: /Lấy tất cả Của bạn/i });
    fireEvent.click(takeAllOursBtn);

    const saveBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleResolve).toHaveBeenCalledWith(
        expect.stringContaining('println!("Hello Ours");')
      );
    });
  });

  it("calls onBack when back button is clicked", () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    const handleBack = vi.fn();

    render(
      <ConflictResolverScreen
        filePath="src/main.rs"
        repoPath="/test/repo"
        conflictData={mockData}
        onBack={handleBack}
        onSaveAndStage={handleResolve}
      />
    );

    const backBtn = screen.getByRole("button", { name: /Quay lại/i });
    fireEvent.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
