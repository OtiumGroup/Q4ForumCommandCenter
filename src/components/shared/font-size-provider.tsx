"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Six accessibility steps, skewed larger for easy reading on phones. The
// smallest step is the app's original baseline; every step above enlarges the
// whole (rem-based) UI. Default sits one notch up so text is comfortable
// out of the box for the whole forum.
const SIZES = ["100%", "112.5%", "125%", "137.5%", "150%", "175%"];
const STORAGE_KEY = "q4-font-scale";

type FontSizeContextValue = { scale: number; setScale: (n: number) => void; steps: number };

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScaleState] = useState(1);

  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (!Number.isNaN(saved) && saved >= 0 && saved < SIZES.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted preference after mount
      setScaleState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[scale];
  }, [scale]);

  function setScale(n: number) {
    const clamped = Math.max(0, Math.min(SIZES.length - 1, n));
    setScaleState(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }

  return (
    <FontSizeContext.Provider value={{ scale, setScale, steps: SIZES.length }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize(): FontSizeContextValue {
  return useContext(FontSizeContext) ?? { scale: 1, setScale: () => {}, steps: SIZES.length };
}
