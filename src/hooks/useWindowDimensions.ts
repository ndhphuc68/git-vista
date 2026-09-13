import { useState, useEffect } from "react";

export interface WindowDimensions {
  width: number;
  height: number;
  isMobile: boolean; // < 768px
  isTablet: boolean; // 768px - 899px
  isLaptop: boolean; // 900px - 1199px
  isDesktop: boolean; // >= 1200px
}

function getDimensions(): WindowDimensions {
  const width = typeof window !== "undefined" ? window.innerWidth : 1280;
  const height = typeof window !== "undefined" ? window.innerHeight : 800;

  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 900,
    isLaptop: width >= 900 && width < 1200,
    isDesktop: width >= 1200,
  };
}

export function useWindowDimensions(): WindowDimensions {
  const [dimensions, setDimensions] = useState<WindowDimensions>(getDimensions);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions(getDimensions());
      }, 50);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return dimensions;
}
