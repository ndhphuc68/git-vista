import { useState } from "react";
import { type SystemInfo } from "../ipc/client";
import { ping, getSystemInfo, simulateRepoChange } from "../features/repo";

/**
 * State and handlers for the ControlsBar devtools drawer: the manual IPC
 * ping/system-info test and the repo-changed event simulator.
 */
export function useControlsBarIpc() {
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestIpc = async () => {
    setLoading(true);
    try {
      const pingRes = await ping("Chào Rust backend từ React!");
      setPingResult(pingRes);

      const info = await getSystemInfo();
      setSysInfo(info);
    } catch (err) {
      console.warn("IPC Error or Browser Fallback:", err);
      setPingResult(`Browser mock: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRepoChange = async () => {
    try {
      await simulateRepoChange("d:/project-v3");
    } catch (err) {
      console.warn("Event simulate error:", err);
    }
  };

  return { pingResult, sysInfo, loading, handleTestIpc, handleSimulateRepoChange };
}
