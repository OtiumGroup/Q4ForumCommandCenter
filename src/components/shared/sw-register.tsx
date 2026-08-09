"use client";

import { useEffect } from "react";

/**
 * Registers the minimal static-asset service worker (see public/sw.js).
 * Enables "Add to Home Screen" on Android/desktop; iOS Safari ignores
 * the SW for install purposes but the manifest + apple meta tags in
 * layout.tsx cover that path.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal — app works fine without the SW, it's purely an
      // install/perf enhancement.
    });
  }, []);

  return null;
}
