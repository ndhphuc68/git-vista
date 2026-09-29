import { useEffect, useRef, useState } from "react";
import type { ActiveSidebarMenu } from "../components/BranchSidebarSections";

/**
 * The sidebar's single context-menu slot (strictly one active menu at a
 * time), plus the outside-click and Escape handling that closes it. Ref and
 * effect are kept together here — the effect only ever reads the ref this
 * same hook owns.
 */
export function useActiveSidebarMenu() {
  const [activeMenu, setActiveMenu] = useState<ActiveSidebarMenu>(null);
  const activeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (activeMenuRef.current && !activeMenuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
      }
    };
    window.addEventListener("mousedown", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  return { activeMenu, setActiveMenu, activeMenuRef };
}
