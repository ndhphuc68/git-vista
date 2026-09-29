import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ControlsBar } from "./ControlsBar";
import { useSettingsStore } from "../store/useSettingsStore";
import { useLayoutStore } from "../store/useLayoutStore";
import { invokeCommand } from "../ipc/client";

describe("ControlsBar", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("vi");
    useLayoutStore.setState({ devToolsOpen: false });
    vi.restoreAllMocks();
  });

  it("pings the Rust backend and fetches system info with today's arguments", async () => {
    const pingSpy = vi.spyOn(invokeCommand, "ping").mockResolvedValue("[Browser mock] Pong: ok");
    const sysInfoSpy = vi.spyOn(invokeCommand, "getSystemInfo").mockResolvedValue({
      os: "browser-dev",
      arch: "x86_64",
      git_version: "git version mock-2.50",
      app_version: "0.1.0",
    });

    render(<ControlsBar lastEvent={null} />);

    fireEvent.click(screen.getByTestId("toggle-devtools"));

    const testIpcBtn = await screen.findByText("Kiểm tra IPC Rust");
    await act(async () => {
      fireEvent.click(testIpcBtn);
    });

    await waitFor(() => {
      expect(pingSpy).toHaveBeenCalledWith("Chào Rust backend từ React!");
    });
    expect(sysInfoSpy).toHaveBeenCalledWith();

    await waitFor(() => {
      expect(screen.getByText("[Browser mock] Pong: ok")).toBeInTheDocument();
      expect(screen.getByText(/OS: browser-dev/)).toBeInTheDocument();
    });
  });

  it("simulates a repo-changed event for the hardcoded dev path", async () => {
    const simulateSpy = vi.spyOn(invokeCommand, "simulateRepoChange").mockResolvedValue(undefined);

    render(<ControlsBar lastEvent={null} />);

    fireEvent.click(screen.getByTestId("toggle-devtools"));

    const triggerBtn = await screen.findByText("Mô phỏng sự kiện Repo Changed");
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    await waitFor(() => {
      expect(simulateSpy).toHaveBeenCalledWith("d:/project-v3");
    });
  });
});
