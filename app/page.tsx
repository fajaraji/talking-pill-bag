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
  setExplanationCache,
} from "@/lib/storage";
import { getDrugId } from "@/lib/drug-info";
import type { Medicine } from "@/lib/storage";

const PROFILE_KEY = "tpb-profile";
const SLOT_ORDER = ["morning", "afternoon", "evening", "bedtime"] as const;
type Slot = (typeof SLOT_ORDER)[number];

function loadProfile(): { name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: string };
    if (typeof parsed.name !== "string") return null;
    return { name: parsed.name };
  } catch {
    return null;
  }
}

function saveProfile(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name.trim() }));
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M8 6l1.5-2h5L16 6" />
    </svg>
  );
}

function CheckReadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function TapDoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2 2 4-4" />
    </svg>
  );
}

function AddMedicineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function BPIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

function QuestionsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function SummaryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 12h8M8 16h5M8 8h2" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

function countTodayProgress(medicines: Medicine[], doseLog: ReturnType<typeof getDoseLog>, today: string) {
  let total = 0;
  let taken = 0;
  for (const med of medicines) {
    for (const slot of med.time_slots) {
      if (SLOT_ORDER.includes(slot as Slot)) {
        total++;
        if (doseLog.some((e) => e.medicineId === med.id && e.date === today && e.slot === slot)) {
          taken++;
        }
      }
    }
  }
  return { total, taken };
}

function nextPendingSlot(medicines: Medicine[], doseLog: ReturnType<typeof getDoseLog>, today: string): Slot | null {
  for (const slot of SLOT_ORDER) {
    const meds = medicines.filter((m) => m.time_slots.includes(slot));
    if (meds.length === 0) continue;
    const allTaken = meds.every((m) =>
      doseLog.some((e) => e.medicineId === m.id && e.date === today && e.slot === slot)
    );
    if (!allTaken) return slot;
  }
  return null;
}

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [profile, setProfile] = useState<{ name: string } | null | undefined>(undefined);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseLog, setDoseLog] = useState<ReturnType<typeof getDoseLog>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const today = getTodayStr();

  // Load persisted state
  useEffect(() => {
    const storedLang = localStorage.getItem("tpb-lang") as Language | null;
    if (storedLang && languages.some((l) => l.code === storedLang)) {
      setLang(storedLang);
      document.documentElement.lang = storedLang;
    }
    const storedProfile = loadProfile();
    setProfile(storedProfile);
    if (storedProfile) {
      setNameInput(storedProfile.name);
    }
    setMedicines(getMedicines());
    setDoseLog(getDoseLog());
  }, []);

  function selectLanguage(code: Language) {
    setLang(code);
    localStorage.setItem("tpb-lang", code);
    document.documentElement.lang = code;

    // Prefetch explanations for all medicines in the new language
    const meds = getMedicines();
    for (const med of meds) {
      const drugId = getDrugId(med.drug_name);
      if (!drugId) continue;
      const cacheKey = `${drugId}:${code}`;
      fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugName: med.drug_name, language: code }),
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
          setExplanationCache(cacheKey, {
            text: data.text,
            sourceUrl: data.source_url ?? "",
            sourceTitle: data.source_title ?? "",
            known: data.known,
            fallback: data.fallback,
          });
        })
        .catch(() => {
          // Silently ignore background prefetch errors
        });
    }
  }

  function handleSaveProfile() {
    saveProfile(nameInput);
    setProfile({ name: nameInput.trim() });
    setShowSettings(false);
  }

  const { total: totalDoses, taken: takenDoses } = useMemo(
    () => countTodayProgress(medicines, doseLog, today),
    [medicines, doseLog, today]
  );

  const pendingSlot = useMemo(
    () => nextPendingSlot(medicines, doseLog, today),
    [medicines, doseLog, today]
  );

  const displayName = profile?.name?.trim();
  const todayTitle = displayName
    ? t(lang, "todaysMedicinesNamed").replace("{name}", displayName)
    : t(lang, "todaysMedicinesNeutral");

  // ---------------------------------------------------------------------------
  // First-use onboarding
  // ---------------------------------------------------------------------------
  if (profile === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {t(lang, "appTitle")}
          </h1>
        </header>

        <section className="w-full max-w-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            {t(lang, "whoIsThisFor")}
          </h2>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t(lang, "namePlaceholder")}
            className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400"
            aria-label={t(lang, "yourName")}
          />
          <p className="mt-2 text-base text-slate-500">
            {t(lang, "changeNameLanguage")}
          </p>
        </section>

        <section className="w-full max-w-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-700">
            {t(lang, "chooseLanguage")}
          </h3>
          <div className="flex flex-col gap-3">
            {languages.map((l) => {
              const selected = lang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => selectLanguage(l.code)}
                  className={`flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left text-lg transition-colors ${
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                  aria-pressed={selected}
                  style={{ minHeight: 48 }}
                >
                  <span className="font-medium">{l.nativeLabel}</span>
                  <span className="text-sm text-slate-500">{l.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <button
          onClick={handleSaveProfile}
          className="w-full max-w-sm rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
          style={{ minHeight: 56 }}
        >
          {t(lang, "save")}
        </button>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Main home page
  // ---------------------------------------------------------------------------
  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-50 px-4 py-6">
      <div className="flex w-full max-w-sm flex-col gap-6 self-center">
        {/* App header */}
        <header className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {t(lang, "appTitle")}
          </h1>
        </header>

        {medicines.length === 0 ? (
          // -----------------------------------------------------------------
          // Empty state
          // -----------------------------------------------------------------
          <>
            <p className="text-center text-lg leading-relaxed text-slate-700">
              {t(lang, "homeValueStatement")}
            </p>

            <ol className="flex flex-col gap-4">
              <li className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <span className="text-xl font-bold">1</span>
                </div>
                <div className="flex items-center gap-3">
                  <CameraIcon className="h-6 w-6 text-slate-600" />
                  <span className="text-lg font-medium text-slate-800">
                    {t(lang, "step1Title")}
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <span className="text-xl font-bold">2</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckReadIcon className="h-6 w-6 text-slate-600" />
                  <span className="text-lg font-medium text-slate-800">
                    {t(lang, "step2Title")}
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <span className="text-xl font-bold">3</span>
                </div>
                <div className="flex items-center gap-3">
                  <TapDoneIcon className="h-6 w-6 text-slate-600" />
                  <span className="text-lg font-medium text-slate-800">
                    {t(lang, "step3Title")}
                  </span>
                </div>
              </li>
            </ol>

            <button
              onClick={() => router.push("/add")}
              className="w-full rounded-xl bg-blue-600 px-5 py-4 text-xl font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
              style={{ minHeight: 64 }}
            >
              {t(lang, "addFirstMedicine")}
            </button>

            {/* Small language switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {languages.map((l) => {
                const selected = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => selectLanguage(l.code)}
                    className={`rounded-lg px-3 py-2 text-base ${
                      selected
                        ? "font-semibold text-blue-700"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    aria-pressed={selected}
                  >
                    {l.nativeLabel}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          // -----------------------------------------------------------------
          // With medicines
          // -----------------------------------------------------------------
          <>
            {/* Primary card */}
            <button
              onClick={() => router.push("/today")}
              className="flex w-full flex-col gap-3 rounded-2xl bg-blue-600 p-6 text-left text-white shadow-md hover:bg-blue-700 active:bg-blue-800"
              style={{ minHeight: 120 }}
              aria-label={todayTitle}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{todayTitle}</h2>
                <ChevronRightIcon className="h-6 w-6" />
              </div>
              <p className="text-lg opacity-90">
                {t(lang, "takenOf")
                  .replace("{taken}", String(takenDoses))
                  .replace("{total}", String(totalDoses))}
              </p>
              {pendingSlot && (
                <p className="text-base opacity-80">
                  {t(lang, "nextDose").replace("{slot}", slotLabel(lang, pendingSlot))}
                </p>
              )}
            </button>

            {/* Family and helpers section */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-700">
                {t(lang, "forFamilyAndHelpers")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/add")}
                  className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                  style={{ minHeight: 96 }}
                  aria-label={t(lang, "addMedicineTile")}
                >
                  <AddMedicineIcon className="h-8 w-8 text-blue-600" />
                  <span className="text-base font-semibold text-slate-900">
                    {t(lang, "addMedicineTile")}
                  </span>
                  <span className="text-sm text-slate-500">
                    {t(lang, "addMedicineTileDesc")}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/bp")}
                  className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                  style={{ minHeight: 96 }}
                  aria-label={t(lang, "bpTile")}
                >
                  <BPIcon className="h-8 w-8 text-red-500" />
                  <span className="text-base font-semibold text-slate-900">
                    {t(lang, "bpTile")}
                  </span>
                  <span className="text-sm text-slate-500">
                    {t(lang, "bpTileDesc")}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/questions")}
                  className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                  style={{ minHeight: 96 }}
                  aria-label={t(lang, "questionsTile")}
                >
                  <QuestionsIcon className="h-8 w-8 text-green-600" />
                  <span className="text-base font-semibold text-slate-900">
                    {t(lang, "questionsTile")}
                  </span>
                  <span className="text-sm text-slate-500">
                    {t(lang, "questionsTileDesc")}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/summary")}
                  className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                  style={{ minHeight: 96 }}
                  aria-label={t(lang, "weeklySummaryTile")}
                >
                  <SummaryIcon className="h-8 w-8 text-amber-500" />
                  <span className="text-base font-semibold text-slate-900">
                    {t(lang, "weeklySummaryTile")}
                  </span>
                  <span className="text-sm text-slate-500">
                    {t(lang, "weeklySummaryTileDesc")}
                  </span>
                </button>
              </div>
            </section>

            {/* Small language switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {languages.map((l) => {
                const selected = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => selectLanguage(l.code)}
                    className={`rounded-lg px-3 py-2 text-base ${
                      selected
                        ? "font-semibold text-blue-700"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    aria-pressed={selected}
                  >
                    {l.nativeLabel}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Settings link */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-base text-slate-500 hover:text-slate-700"
          aria-label={t(lang, "settings")}
        >
          <SettingsIcon className="h-5 w-5" />
          {t(lang, "settings")}
        </button>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {t(lang, "changeNameLanguage")}
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg px-3 py-1 text-lg text-slate-600 hover:bg-slate-100"
                aria-label={t(lang, "close")}
              >
                {t(lang, "close")}
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-base font-semibold text-slate-700">
                  {t(lang, "yourName")}
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t(lang, "namePlaceholder")}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-base font-semibold text-slate-700">
                  {t(lang, "chooseLanguage")}
                </label>
                <div className="flex flex-col gap-3">
                  {languages.map((l) => {
                    const selected = lang === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => selectLanguage(l.code)}
                        className={`flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left text-lg transition-colors ${
                          selected
                            ? "border-blue-600 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="font-medium">{l.nativeLabel}</span>
                        <span className="text-sm text-slate-500">{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
                style={{ minHeight: 56 }}
              >
                {t(lang, "save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
