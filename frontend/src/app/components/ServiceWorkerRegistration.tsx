"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/PWA-Test-daily-v1/sw.js", {
          scope: "/PWA-Test-daily-v1/",
        })
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return null;
}
