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
import { LoadingShell } from "@/app/loading-shell";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

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
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the inner component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <SummaryPageInner />;
}

function SummaryPageInner() {
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
    <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
      {/* Header */}
      <div className="flex w-full max-w-sm flex-col gap-2 self-center">
        <AppHeader
          title={t(lang, "weeklySummary")}
          back={{ label: t(lang, "back"), onClick: () => router.push("/") }}
        />
        <p className="text-center text-base text-muted">
          {t(lang, "summaryForFamily")}
        </p>
        {today && (
          <p className="text-center text-sm text-muted">
            {fromDate} – {today}
          </p>
        )}
      </div>

      {/* Share buttons */}
      {state.medicines.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          <div className="flex gap-3">
            <Button variant="success" className="flex-1" onClick={handleShare}>
              {t(lang, "share")}
            </Button>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? t(lang, "copied") : t(lang, "copyText")}
            </Button>
          </div>
        </div>
      )}

      {/* Medicines adherence */}
      <div className="flex w-full max-w-sm flex-col gap-4 self-center">
        <h2 className="text-lg font-bold text-ink">
          {t(lang, "dosesTakenVsScheduled")}
        </h2>
        {state.medicines.length === 0 && !isLoading && (
          <p className="py-4 text-center text-lg text-muted">
            {t(lang, "noMedicines")}
          </p>
        )}
        {state.medicines.map((med) => {
          const scheduled = getScheduledDosesInRange(med, fromDate, today);
          const taken = getTakenDosesInRange(med, state.doseLogs, fromDate, today);
          const missed = countMissedDosesInLastNDays(med, state.doseLogs, today, 7);
          const pct = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;
          return (
            <Card key={med.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-ink">
                  {med.drug_name}
                </span>
                <span className="text-base text-muted">
                  {taken} / {scheduled} {t(lang, "doses")}
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              {missed > 0 && (
                <p className="text-base text-attention-text">
                  {t(lang, "missedThisWeek").replace("{n}", String(missed))}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Reasons recorded */}
      {reasons.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          <h2 className="text-lg font-bold text-ink">
            {t(lang, "reasonsRecorded")}
          </h2>
          <div className="flex flex-col gap-2">
            {reasons.map((r, idx) => {
              const med = state.medicines.find((m) => m.id === r.medicineId);
              const reasonLabel = t(lang, r.reason as Parameters<typeof t>[1]) ?? r.reason;
              return (
                <Card key={idx}>
                  <p className="text-base text-ink">
                    {med ? med.drug_name : r.medicineId}: {reasonLabel} ({r.recordedOn})
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* BP average */}
      {bpStats ? (
        <Card className="w-full max-w-sm self-center">
          <h2 className="text-lg font-bold text-ink">
            {t(lang, "bpAverage")}
          </h2>
          <p className="text-2xl font-bold text-ink">
            {bpStats.avgSys}/{bpStats.avgDia}
          </p>
          <p className="text-base text-muted">
            {t(lang, "readingsCount").replace("{n}", String(bpStats.count))}
          </p>
        </Card>
      ) : (
        <Card className="w-full max-w-sm self-center">
          <h2 className="text-lg font-bold text-ink">
            {t(lang, "bpAverage")}
          </h2>
          <p className="text-lg text-muted">{t(lang, "noReadingsYet")}</p>
        </Card>
      )}

      {/* Refills due */}
      {refills.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          <h2 className="text-lg font-bold text-ink">
            {t(lang, "refillsDue")}
          </h2>
          <div className="flex flex-col gap-2">
            {refills.map(({ med, days }) => (
              <Card key={med.id} className="border-attention-border bg-attention-bg">
                <p className="text-base font-semibold text-attention-text">
                  {t(lang, "refillQuestion").replace("{drug}", med.drug_name).replace("{n}", String(days))}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
