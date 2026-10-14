"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import { getMedicines, getDoseLog, markDoseTaken, removeDoseLogEntry } from "@/lib/storage";
import { getToday } from "@/lib/clock";
import type { Medicine } from "@/lib/storage";

const SLOT_ORDER = ["morning", "afternoon", "evening", "bedtime"] as const;

type Slot = (typeof SLOT_ORDER)[number];

function slotLabel(lang: Language, slot: Slot): string {
  switch (slot) {
    case "morning":
      return t(lang, "morning");
    case "afternoon":
      return t(lang, "afternoon");
    case "evening":
      return t(lang, "evening");
    case "bedtime":
      return t(lang, "bedtime");
  }
}

function foodLabel(lang: Language, food: Medicine["food"]): string {
  switch (food) {
    case "before_food":
      return t(lang, "foodBefore");
    case "after_food":
      return t(lang, "foodAfter");
    case "with_food":
      return t(lang, "foodWith");
    case "any":
      return t(lang, "foodAny");
  }
}

function localeForLang(lang: Language): string {
  switch (lang) {
    case "zh":
      return "zh-CN";
    case "ms":
      return "ms-MY";
    case "id":
      return "id-ID";
    default:
      return "en-SG";
  }
}

function formatDate(lang: Language, dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(localeForLang(lang), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

// ---------------------------------------------------------------------------
// Food icon (inline SVG, no emojis)
// ---------------------------------------------------------------------------
function FoodIcon({ food }: { food: Medicine["food"] }) {
  const className = "h-6 w-6 shrink-0";
  switch (food) {
    case "before_food":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 2C8 2 6 5 6 8v4H4v2h16v-2h-2V8c0-3-2-6-6-6z" />
          <path d="M6 16h12v2H6z" />
        </svg>
      );
    case "after_food":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "with_food":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 12h18" />
          <path d="M6 8h2v8H6z" />
          <path d="M16 8h2v8h-2z" />
          <path d="M11 6h2v12h-2z" />
        </svg>
      );
    case "any":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10M7 12h10" />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Dose card
// ---------------------------------------------------------------------------
function DoseCard({
  medicine,
  slot,
  lang,
  taken,
  takenAt,
  onTake,
  onUndo,
  undoAvailable,
}: {
  medicine: Medicine;
  slot: Slot;
  lang: Language;
  taken: boolean;
  takenAt: string | null;
  onTake: () => void;
  onUndo: () => void;
  undoAvailable: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-white p-4">
      <div className="flex items-start gap-4">
        {medicine.photo && (
          <img
            src={medicine.photo}
            alt={medicine.drug_name}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="flex flex-col gap-1">
          <p className="text-[22px] font-bold leading-tight text-slate-900">
            {medicine.drug_name} {medicine.strength}
          </p>
          <p className="text-lg text-slate-600">{medicine.dose_per_time}</p>
          <div className="flex items-center gap-2 text-base text-slate-700">
            <FoodIcon food={medicine.food} />
            <span>{foodLabel(lang, medicine.food)}</span>
          </div>
          {medicine.special_instructions.length > 0 && (
            <p className="text-base text-amber-700">
              {medicine.special_instructions.join("; ")}
            </p>
          )}
        </div>
      </div>

      {taken && takenAt ? (
        <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
          <span className="text-lg font-semibold text-green-700">
            {t(lang, "takenAt")} {formatTime(takenAt)}
          </span>
          {undoAvailable && (
            <button
              onClick={onUndo}
              className="rounded-lg bg-white px-4 py-2 text-base font-semibold text-green-700 shadow-sm hover:bg-green-100"
              aria-label={t(lang, "undo")}
            >
              {t(lang, "undo")}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onTake}
          className="w-full rounded-xl bg-blue-600 px-5 py-4 text-xl font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
          style={{ minHeight: 64 }}
          aria-label={`${t(lang, "done")} — ${medicine.drug_name}`}
        >
          {t(lang, "done")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Today page
// ---------------------------------------------------------------------------
export default function TodayPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseLog, setDoseLog] = useState<ReturnType<typeof getDoseLog>>([]);
  const [undoMap, setUndoMap] = useState<Record<string, number>>({});
  const today = getToday();

  // Load language and medicines
  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }
    setMedicines(getMedicines());
    setDoseLog(getDoseLog());
  }, []);

  const isTaken = useCallback(
    (medicineId: string, slot: Slot) => {
      return doseLog.some(
        (e) => e.medicineId === medicineId && e.date === today && e.slot === slot
      );
    },
    [doseLog, today]
  );

  const getTakenTime = useCallback(
    (medicineId: string, slot: Slot): string | null => {
      const entry = doseLog.find(
        (e) => e.medicineId === medicineId && e.date === today && e.slot === slot
      );
      return entry?.takenAt ?? null;
    },
    [doseLog, today]
  );

  function handleTake(medicineId: string, slot: Slot) {
    const entry = markDoseTaken(medicineId, today, slot);
    setDoseLog(getDoseLog());
    const key = `${medicineId}-${slot}`;
    setUndoMap((prev) => ({ ...prev, [key]: Date.now() + 10000 }));
    // Clear undo after 10 seconds
    setTimeout(() => {
      setUndoMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 10000);
    return entry;
  }

  function handleUndo(medicineId: string, slot: Slot) {
    removeDoseLogEntry(medicineId, today, slot);
    setDoseLog(getDoseLog());
    const key = `${medicineId}-${slot}`;
    setUndoMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function undoAvailable(medicineId: string, slot: Slot): boolean {
    const key = `${medicineId}-${slot}`;
    return (undoMap[key] ?? 0) > Date.now();
  }

  // Group medicines by slot
  const slotMedicines: Record<Slot, Medicine[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    bedtime: [],
  };
  const noSlotMedicines: Medicine[] = [];

  for (const med of medicines) {
    if (med.time_slots.length === 0) {
      noSlotMedicines.push(med);
    } else {
      for (const slot of med.time_slots) {
        if (SLOT_ORDER.includes(slot as Slot)) {
          slotMedicines[slot as Slot].push(med);
        }
      }
    }
  }

  // Count doses
  let totalDoses = 0;
  let takenDoses = 0;
  for (const med of medicines) {
    if (med.time_slots.length === 0) continue;
    for (const slot of med.time_slots) {
      if (SLOT_ORDER.includes(slot as Slot)) {
        totalDoses++;
        if (isTaken(med.id, slot as Slot)) {
          takenDoses++;
        }
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
            {t(lang, "todayTitle")}
          </h1>
          <div className="w-16" />
        </div>
        <p className="text-center text-lg text-slate-700">
          {formatDate(lang, today)}
        </p>
        {totalDoses > 0 && (
          <p className="text-center text-base font-medium text-slate-600">
            {takenDoses} / {totalDoses} {t(lang, "dosesTaken")}
          </p>
        )}
      </header>

      {/* Dose sections */}
      <div className="flex w-full max-w-sm flex-col gap-6 self-center">
        {SLOT_ORDER.map((slot) => {
          const meds = slotMedicines[slot];
          if (meds.length === 0) return null;
          return (
            <section key={slot}>
              <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-slate-500">
                {slotLabel(lang, slot)}
              </h2>
              <div className="flex flex-col gap-4">
                {meds.map((med) => {
                  const taken = isTaken(med.id, slot);
                  const takenTime = getTakenTime(med.id, slot);
                  return (
                    <DoseCard
                      key={`${med.id}-${slot}`}
                      medicine={med}
                      slot={slot}
                      lang={lang}
                      taken={taken}
                      takenAt={takenTime}
                      onTake={() => handleTake(med.id, slot)}
                      onUndo={() => handleUndo(med.id, slot)}
                      undoAvailable={undoAvailable(med.id, slot)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Time not set section */}
        {noSlotMedicines.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-amber-600">
              {t(lang, "timeNotSet")}
            </h2>
            <div className="flex flex-col gap-4">
              {noSlotMedicines.map((med) => (
                <div
                  key={med.id}
                  className="flex flex-col gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex items-start gap-4">
                    {med.photo && (
                      <img
                        src={med.photo}
                        alt={med.drug_name}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="text-[22px] font-bold leading-tight text-slate-900">
                        {med.drug_name} {med.strength}
                      </p>
                      <p className="text-lg text-slate-600">
                        {med.dose_per_time}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/add?edit=${med.id}`)}
                    className="w-full rounded-xl border-2 border-amber-300 bg-white px-5 py-3 text-lg font-semibold text-amber-700 hover:bg-amber-100"
                    aria-label={`${t(lang, "editTime")} — ${med.drug_name}`}
                  >
                    {t(lang, "editTime")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {medicines.length === 0 && (
          <p className="py-12 text-center text-lg text-slate-500">
            {t(lang, "noMedicines")}
          </p>
        )}
      </div>
    </main>
  );
}
