"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function DemoLoader() {
  const { loadDemo, isAuthenticated } = useStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;

    // If already authenticated, just enable demo panel and clean URL
    if (isAuthenticated) {
      localStorage.setItem("tpb-demo", "1");
      cleanUrl();
      return;
    }

    // Load demo from server
    loadDemo()
      .then(() => {
        localStorage.setItem("tpb-demo", "1");
        cleanUrl();
        // Reload so the app picks up the new token and state
        window.location.reload();
      })
      .catch((err) => {
        console.error("Demo load failed:", err);
      });
  }, [loadDemo, isAuthenticated]);

  return null;
}

function cleanUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  window.history.replaceState({}, "", url.toString());
}
