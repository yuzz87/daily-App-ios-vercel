"use client";

import { useEffect } from "react";
import { publicUrl } from "@/lib/publicPath";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(publicUrl("/sw.js"), {
        scope: `${publicUrl("/")}`,
      })
      .catch((err) => console.error("SW registration failed:", err));
  }, []);

  return null;
}
