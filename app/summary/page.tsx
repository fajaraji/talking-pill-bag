"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import { getToday } from "@/lib/clock";
import { getDaysLeft } from "@/lib/supply";
import { countMissedDosesInLastNDays } from "@/lib/adherence";
import { useStore } from "@/lib/store";

function getScheduledDosesInRange(
  medicine: { time_slots: string[]; addedOn?: string },
  fromDate: string,
  toDate: string
): number {
  const addedOn = medicine.addedOn;
  if (!addedOn || medicine.time_slots.length === 0) return 0;
  const start = fromDate > addedOn ? fromDate : addedOn;
  if (start > toDate) return 0;

  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(toDate + "T00:00:00");
  let days = 0;
  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {
    days++;
  }
  return days * medicine.time_slots.length;
}

function getTakenDosesInRange(
  medicine: { id: string; time_slots: string[] },
  doseLog: Array<{ medicineId: string; date: string; slot: string }>,
  fromDate: string,
  toDate: string
): number {
  return doseLog.filter(
    (e) =>
      e.medicineId === medicine.id &&
      e.date >= fromDate &&
      e.date <= toDate
  ).length;
}

export default function SummaryPage() {
  const router = useRouter();
  const { state } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [today, setToday] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }
    setToday(getToday());
    setIsLoading(false);
  }, []);

  const fromDate = useMemo(() => {
    if (!today) return "";
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() - 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [today]);

  const bpStats = useMemo(() => {
    if (!today || !fromDate) return null;
    const readings = state.bpReadings.filter(
      (r) => r.date >= fromDate && r.date <= today
    );
    if (readings.length === 0) return null;
    const avgSys = Math.round(
      readings.reduce((s, r) => s + r.systolic, 0) / readings.length
    );
    const avgDia = Math.round(
      readings.reduce((s, r) => s + r.diastolic, 0) / readings.length
    );
    return { avgSys, avgDia, count: readings.length };
  }, [state.bpReadings, today, fromDate]);

  const reasons = useMemo(() => {
    if (!today || !fromDate) return [];
    return state.missedReasons.filter((r) => r.recordedOn >= fromDate && r.recordedOn <= today);
  }, [state.missedReasons, today, fromDate]);

  const refills = useMemo(() => {
    if (!today) return [];
    return state.medicines
      .map((med) => ({ med, days: getDaysLeft(med, state.doseLogs, today) }))
      .filter(({ days }) => days !== null && days <= 7);
  }, [state.medicines, state.doseLogs, today]);

  function buildShareText(): string {
    const lines: string[] = [];
    lines.push(`${t(lang, "appTitle")} — ${t(lang, "weeklySummary")}`);
    if (state.household?.displayName) {
      lines.push(`${t(lang, "summaryForFamily")} — ${state.household.displayName}`);
    }
    if (fromDate && today) {
      lines.push(`${fromDate} – ${today}`);
    }
    lines.push("");

    if (state.medicines.length > 0) {
      lines.push(`${t(lang, "dosesTakenVsScheduled")}:`);
      for (const med of state.medicines) {
        const scheduled = getScheduledDosesInRange(med, fromDate, today);
        const taken = getTakenDosesInRange(med, state.doseLogs, fromDate, today);
        const missed = countMissedDosesInLastNDays(med, state.doseLogs, today, 7);
        let line = `- ${med.drug_name}: ${taken}/${scheduled} ${t(lang, "doses")}`;
        if (missed > 0) {
          line += ` (${t(lang, "missedThisWeek").replace("{n}", String(missed))})`;
        }
        lines.push(line);
      }
    }

    if (reasons.length > 0) {
      lines.push("");
      lines.push(`${t(lang, "reasonsRecorded")}:`);
      for (const r of reasons) {
        const med = state.medicines.find((m) => m.id === r.medicineId);
        const reasonLabel = t(lang, r.reason as Parameters<typeof t>[1]) ?? r.reason;
        lines.push(`- ${med ? med.drug_name : r.medicineId}: ${reasonLabel}`);
      }
    }

    if (bpStats) {
      lines.push("");
      lines.push(`${t(lang, "bpAverage")}: ${bpStats.avgSys}/${bpStats.avgDia}`);
      lines.push(`${t(lang, "readingsCount").replace("{n}", String(bpStats.count))}`);
    }

    if (refills.length > 0) {
      lines.push("");
      lines.push(`${t(lang, "refillsDue")}:`);
      for (const { med, days } of refills) {
        lines.push(`- ${t(lang, "refillQuestion").replace("{drug}", med.drug_name).replace("{n}", String(days))}`);
      }
    }

    return lines.join("\n");
  }

  async function handleShare() {
    const text = buildShareText();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Fall through
      }
    }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    const text = buildShareText();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-50 px-4 py-6">
      {/* Header */}
      <header className="flex w-full max-w-sm flex-col gap-2 self-center">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg px-3 py-2 text-lg text-slate-600 hover:bg-slate-100"
            aria-label={t(lang, "back")}
          >
            ← {t(lang, "back")}
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            {t(lang, "weeklySummary")}
          </h1>
          <div className="w-16" />
        </div>
        <p className="text-center text-base text-slate-600">
          {t(lang, "summaryForFamily")}
        </p>
        {today && (
          <p className="text-center text-sm text-slate-500">
            {fromDate} – {today}
          </p>
        )}
      </header>

      {/* Share buttons */}
      {state.medicines.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl bg-green-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800"
              style={{ minHeight: 56 }}
            >
              {t(lang, "share")}
            </button>
            <button
              onClick={handleCopy}
              className="rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50"
              style={{ minHeight: 56 }}
            >
              {copied ? t(lang, "copied") : t(lang, "copyText")}
            </button>
          </div>
        </div>
      )}

      {/* Medicines adherence */}
      <div className="flex w-full max-w-sm flex-col gap-4 self-center">
        <h2 className="text-lg font-bold text-slate-900">
          {t(lang, "dosesTakenVsScheduled")}
        </h2>
        {state.medicines.length === 0 && !isLoading && (
          <p className="py-4 text-center text-lg text-slate-500">
            {t(lang, "noMedicines")}
          </p>
        )}
        {state.medicines.map((med) => {
          const scheduled = getScheduledDosesInRange(med, fromDate, today);
          const taken = getTakenDosesInRange(med, state.doseLogs, fromDate, today);
          const missed = countMissedDosesInLastNDays(med, state.doseLogs, today, 7);
          const pct = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;
          return (
            <div
              key={med.id}
              className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">
                  {med.drug_name}
                </span>
                <span className="text-base text-slate-600">
                  {taken} / {scheduled} {t(lang, "doses")}
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
              </div>
              {missed > 0 && (
                <p className="text-base text-amber-700">
                  {t(lang, "missedThisWeek").replace("{n}", String(missed))}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Reasons recorded */}
      {reasons.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          <h2 className="text-lg font-bold text-slate-900">
            {t(lang, "reasonsRecorded")}
          </h2>
          <div className="flex flex-col gap-2">
            {reasons.map((r, idx) => {
              const med = state.medicines.find((m) => m.id === r.medicineId);
              const reasonLabel = t(lang, r.reason as Parameters<typeof t>[1]) ?? r.reason;
              return (
                <div
                  key={idx}
                  className="rounded-xl border-2 border-slate-200 bg-white p-3"
                >
                  <p className="text-base text-slate-800">
                    {med ? med.drug_name : r.medicineId}: {reasonLabel} ({r.recordedOn})
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BP average */}
      {bpStats ? (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center rounded-xl border-2 border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">
            {t(lang, "bpAverage")}
          </h2>
          <p className="text-2xl font-bold text-slate-900">
            {bpStats.avgSys}/{bpStats.avgDia}
          </p>
          <p className="text-base text-slate-600">
            {t(lang, "readingsCount").replace("{n}", String(bpStats.count))}
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center rounded-xl border-2 border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">
            {t(lang, "bpAverage")}
          </h2>
          <p className="text-lg text-slate-500">{t(lang, "noReadingsYet")}</p>
        </div>
      )}

      {/* Refills due */}
      {refills.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          <h2 className="text-lg font-bold text-slate-900">
            {t(lang, "refillsDue")}
          </h2>
          <div className="flex flex-col gap-2">
            {refills.map(({ med, days }) => (
              <div
                key={med.id}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3"
              >
                <p className="text-base font-semibold text-amber-900">
                  {t(lang, "refillQuestion").replace("{drug}", med.drug_name).replace("{n}", String(days))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
