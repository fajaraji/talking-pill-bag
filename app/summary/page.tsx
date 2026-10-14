"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import {
  getMedicines,
  getDoseLog,
  getMissedReasons,
  getBPReadings,
  type Medicine,
} from "@/lib/storage";
import { getToday } from "@/lib/clock";
import { getDaysLeft } from "@/lib/supply";
import { countMissedDosesInLastNDays } from "@/lib/adherence";

function getScheduledDosesInRange(
  medicine: Medicine,
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
  medicine: Medicine,
  doseLog: ReturnType<typeof getDoseLog>,
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
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseLog, setDoseLog] = useState<ReturnType<typeof getDoseLog>>([]);
  const [today, setToday] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }
    setMedicines(getMedicines());
    setDoseLog(getDoseLog());
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
    const readings = getBPReadings().filter(
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
  }, [today, fromDate]);

  const reasons = useMemo(() => {
    if (!today || !fromDate) return [];
    return getMissedReasons().filter((r) => r.recordedOn >= fromDate && r.recordedOn <= today);
  }, [today, fromDate]);

  const refills = useMemo(() => {
    if (!today) return [];
    return medicines
      .map((med) => ({ med, days: getDaysLeft(med, doseLog, today) }))
      .filter(({ days }) => days !== null && days <= 7);
  }, [medicines, doseLog, today]);

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

      {/* Medicines adherence */}
      <div className="flex w-full max-w-sm flex-col gap-4 self-center">
        <h2 className="text-lg font-bold text-slate-900">
          {t(lang, "dosesTakenVsScheduled")}
        </h2>
        {medicines.length === 0 && !isLoading && (
          <p className="py-4 text-center text-lg text-slate-500">
            {t(lang, "noMedicines")}
          </p>
        )}
        {medicines.map((med) => {
          const scheduled = getScheduledDosesInRange(med, fromDate, today);
          const taken = getTakenDosesInRange(med, doseLog, fromDate, today);
          const missed = countMissedDosesInLastNDays(med, doseLog, today, 7);
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
              {/* Simple bar */}
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${pct}%` }}
                />
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
              const med = medicines.find((m) => m.id === r.medicineId);
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
