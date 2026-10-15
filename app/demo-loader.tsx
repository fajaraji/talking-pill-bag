"use client";

import { useEffect } from "react";
import { getMedicines, saveMedicine, markDoseTaken, saveMissedReason, saveBPReading, setBPTarget, saveRedirectedQuestion, setExplanationCache } from "@/lib/storage";
import { generateDemoData } from "@/lib/demo-data";
import { getToday } from "@/lib/clock";

const DEMO_FLAG_KEY = "tpb-demo";
const PROFILE_KEY = "tpb-profile";

export default function DemoLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;

    // Only load if no medicines exist yet
    if (getMedicines().length > 0) {
      // Still enable demo panel and clean URL
      localStorage.setItem(DEMO_FLAG_KEY, "1");
      cleanUrl();
      return;
    }

    const today = getToday();
    const data = generateDemoData(today);

    // Save profile
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));

    // Enable demo panel
    localStorage.setItem(DEMO_FLAG_KEY, "1");

    // Save medicines
    for (const med of data.medicines) {
      saveMedicine(med);
    }

    // Save dose log (use the direct localStorage key for batch insert)
    const doseLogKey = "tpb-dose-log";
    localStorage.setItem(doseLogKey, JSON.stringify(data.doseLog));

    // Save missed reasons
    const reasonsKey = "tpb-missed-reasons";
    localStorage.setItem(reasonsKey, JSON.stringify(data.missedReasons));

    // Save BP readings
    for (const r of data.bpReadings) {
      saveBPReading(r);
    }

    // Save BP target
    setBPTarget(data.bpTarget);

    // Save redirected questions
    const questionsKey = "tpb-questions-redirected";
    localStorage.setItem(questionsKey, JSON.stringify(data.redirectedQuestions));

    // Pre-fill explanation cache for English in background
    for (const [key, value] of Object.entries(data.explanations)) {
      setExplanationCache(key, value);
    }

    // Also fetch real explanations from API for English
    for (const med of data.medicines) {
      fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugName: med.drug_name, language: "en" }),
      })
        .then((res) => {
          if (!res.ok) return null;
          return res.json() as Promise<{
            known: boolean;
            text: string;
            source_url?: string;
            source_title?: string;
            fallback?: boolean;
          }>;
        })
        .then((data) => {
          if (!data) return;
          const drugId = med.drug_name.toLowerCase();
          setExplanationCache(`${drugId}:en`, {
            text: data.text,
            sourceUrl: data.source_url ?? "",
            sourceTitle: data.source_title ?? "",
            known: data.known,
            fallback: data.fallback,
          });
        })
        .catch(() => {
          // Silently ignore
        });
    }

    cleanUrl();
    // Reload so pages pick up the new data
    window.location.reload();
  }, []);

  return null;
}

function cleanUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  window.history.replaceState({}, "", url.toString());
}
