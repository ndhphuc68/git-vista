import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "../App";
import { useSettingsStore } from "../store/useSettingsStore";
import { vi } from "../i18n/vi";
import { en } from "../i18n/en";

describe("Visual Git Client - M0 Frontend Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useSettingsStore.getState();
    store.setTheme("light");
    store.setColorblind(false);
    store.setLocale("vi");
    store.setMode("simple");
  });

  it("render thành công tiêu đề và các badge của M0", () => {
    render(<App />);

    expect(screen.getByText("Visual Git")).toBeInTheDocument();
    expect(screen.getByText("Mốc M0: Khung nền tảng")).toBeInTheDocument();
    expect(screen.getByText("Chế độ: Đơn giản")).toBeInTheDocument();
  });

  it("cho phép chuyển đổi theme Light -> Dark và cập nhật data-theme vào HTML", () => {
    render(<App />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    const darkBtn = screen.getByTitle("Theme: dark");
    fireEvent.click(darkBtn);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");
  });

  it("cho phép chuyển đổi chế độ Colorblind và cập nhật data-colorblind vào HTML", () => {
    render(<App />);

    expect(document.documentElement.getAttribute("data-colorblind")).toBe("false");

    const colorblindBtn = screen.getByTitle(vi.settings.colorblind);
    fireEvent.click(colorblindBtn);

    expect(document.documentElement.getAttribute("data-colorblind")).toBe("true");
    expect(useSettingsStore.getState().colorblind).toBe(true);
  });

  it("cho phép chuyển đổi ngôn ngữ Vi -> En", () => {
    render(<App />);

    expect(screen.getByText("Mốc M0: Khung nền tảng")).toBeInTheDocument();

    const enBtn = screen.getByText("EN");
    fireEvent.click(enBtn);

    expect(screen.getByText(en.m0Badge)).toBeInTheDocument();
    expect(useSettingsStore.getState().locale).toBe("en");
  });

  it("phản ánh đúng thuật ngữ Git giữa Simple mode và Advanced mode", () => {
    render(<App />);

    // Ở Simple mode (mặc định tiếng Việt):
    expect(screen.getByText("↓ Lấy thay đổi mới")).toBeInTheDocument();
    expect(screen.getByText("↑ Gửi lên máy chủ")).toBeInTheDocument();

    // Chuyển sang Advanced mode
    const modeBtn = screen.getByText("Đơn giản (Dễ hiểu)");
    fireEvent.click(modeBtn);

    expect(screen.getByText("↓ Pull")).toBeInTheDocument();
    expect(screen.getByText("↑ Push")).toBeInTheDocument();
  });

  it("render bố cục 3 cột (Sidebar, Graph/Diff, Detail)", () => {
    render(<App />);

    expect(screen.getByText("Dự án & Nhánh")).toBeInTheDocument();
    expect(screen.getByText("Đồ thị Lịch sử & Thay đổi")).toBeInTheDocument();
    expect(screen.getByText("Chi tiết & Commit")).toBeInTheDocument();
    expect(screen.getByText("Diff Thêm (Design Token: --diff-add-*)")).toBeInTheDocument();
    expect(screen.getByText("Diff Xoá (Design Token: --diff-remove-*)")).toBeInTheDocument();
  });
});

