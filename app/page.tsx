"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { getToday } from "@/lib/clock";
import { LoadingShell } from "./loading-shell";

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

function countTodayProgress(
  medicines: Array<{ id: string; time_slots: string[] }>,
  doseLog: Array<{ medicineId: string; date: string; slot: string }>,
  today: string
) {
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

function nextPendingSlot(
  medicines: Array<{ id: string; time_slots: string[] }>,
  doseLog: Array<{ medicineId: string; date: string; slot: string }>,
  today: string
): Slot | null {
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

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function AddMedicineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function BPIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

function QuestionsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function SummaryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 12h8M8 16h5M8 8h2" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function FamilyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the inner component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <HomePageInner />;
}

function HomePageInner() {
  const router = useRouter();
  const { state, isAuthenticated, setupHousehold, joinHousehold } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [onboardingStep, setOnboardingStep] = useState<"choice" | "caregiver" | "join">("choice");
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = getToday();

  // Load persisted language
  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
    }
  }, []);

  // All hooks must run before any conditional return.
  const { total: totalDoses, taken: takenDoses } = useMemo(
    () => countTodayProgress(state.medicines, state.doseLogs, today),
    [state.medicines, state.doseLogs, today]
  );

  const pendingSlot = useMemo(
    () => nextPendingSlot(state.medicines, state.doseLogs, today),
    [state.medicines, state.doseLogs, today]
  );

  // Senior redirect — navigation must happen in an effect, never during
  // render, otherwise React logs "Cannot update a component while rendering
  // a different component".
  const isSeniorDevice = isAuthenticated && state.role === "senior";
  useEffect(() => {
    if (isSeniorDevice) {
      router.replace("/today");
    }
  }, [isSeniorDevice, router]);

  if (isSeniorDevice) {
    return <LoadingShell />;
  }

  // ---------------------------------------------------------------------------
  // Onboarding (not authenticated)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">{t(lang, "appTitle")}</h1>
          <p className="mt-2 text-lg text-slate-600">{t(lang, "tagline")}</p>
        </header>

        {onboardingStep === "choice" && (
          <>
            <p className="text-center text-lg font-semibold text-slate-800">
              {t(lang, "setupTitle")}
            </p>
            <div className="flex w-full max-w-sm flex-col gap-4">
              <button
                onClick={() => setOnboardingStep("caregiver")}
                className="w-full rounded-xl bg-blue-600 px-5 py-5 text-left text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
                style={{ minHeight: 72 }}
              >
                {t(lang, "caregiverChoice")}
              </button>
              <button
                onClick={() => setOnboardingStep("join")}
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-5 text-left text-lg font-semibold text-slate-700 hover:bg-slate-50"
                style={{ minHeight: 72 }}
              >
                {t(lang, "seniorChoice")}
              </button>
            </div>

            <section className="w-full max-w-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-700">{t(lang, "chooseLanguage")}</h3>
              <div className="flex flex-col gap-3">
                {languages.map((l) => {
                  const selected = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        localStorage.setItem("tpb-lang", l.code);
                        document.documentElement.lang = l.code;
                      }}
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
          </>
        )}

        {onboardingStep === "caregiver" && (
          <div className="flex w-full max-w-sm flex-col gap-4">
            <h2 className="text-xl font-semibold text-slate-800">{t(lang, "whoIsThisFor")}</h2>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t(lang, "namePlaceholder")}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400"
            />
            <button
              onClick={async () => {
                if (!nameInput.trim()) return;
                setLoading(true);
                setError("");
                try {
                  await setupHousehold(nameInput.trim(), lang);
                  localStorage.setItem("tpb-lang", lang);
                  window.location.reload();
                } catch (err) {
                  setError(err instanceof Error ? err.message : t(lang, "genericError"));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !nameInput.trim()}
              className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300"
              style={{ minHeight: 56 }}
            >
              {loading ? t(lang, "loading") : t(lang, "save")}
            </button>
            {error && <p className="text-base text-red-600">{error}</p>}
            <button
              onClick={() => setOnboardingStep("choice")}
              className="rounded-lg px-3 py-2 text-base text-slate-500 hover:text-slate-700"
            >
              {t(lang, "back")}
            </button>
          </div>
        )}

        {onboardingStep === "join" && (
          <div className="flex w-full max-w-sm flex-col gap-4">
            <h2 className="text-xl font-semibold text-slate-800">{t(lang, "joinWithCode")}</h2>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
              placeholder={t(lang, "codePlaceholder")}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-center text-2xl font-bold text-slate-900 placeholder:text-slate-400 tracking-widest"
            />
            <button
              onClick={async () => {
                if (codeInput.length !== 6) return;
                setLoading(true);
                setError("");
                try {
                  await joinHousehold(codeInput);
                  localStorage.setItem("tpb-lang", lang);
                  window.location.reload();
                } catch (err) {
                  setError(err instanceof Error ? err.message : t(lang, "invalidCode"));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || codeInput.length !== 6}
              className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300"
              style={{ minHeight: 56 }}
            >
              {loading ? t(lang, "loading") : t(lang, "save")}
            </button>
            {error && <p className="text-base text-red-600">{error}</p>}
            <button
              onClick={() => setOnboardingStep("choice")}
              className="rounded-lg px-3 py-2 text-base text-slate-500 hover:text-slate-700"
            >
              {t(lang, "back")}
            </button>
          </div>
        )}
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Caregiver home page
  // ---------------------------------------------------------------------------
  const displayName = state.household?.displayName ?? "";
  const todayTitle = displayName
    ? t(lang, "todaysMedicinesNamed").replace("{name}", displayName)
    : t(lang, "todaysMedicinesNeutral");

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-50 px-4 py-6">
      <div className="flex w-full max-w-sm flex-col gap-6 self-center">
        {/* App header */}
        <header className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">{t(lang, "appTitle")}</h1>
        </header>

        {state.medicines.length === 0 ? (
          <>
            <p className="text-center text-lg leading-relaxed text-slate-700">
              {t(lang, "homeValueStatement")}
            </p>
            <button
              onClick={() => router.push("/add")}
              className="w-full rounded-xl bg-blue-600 px-5 py-4 text-xl font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
              style={{ minHeight: 64 }}
            >
              {t(lang, "addFirstMedicine")}
            </button>
          </>
        ) : (
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

                <button
                  onClick={() => router.push("/family")}
                  className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                  style={{ minHeight: 96 }}
                  aria-label={t(lang, "familyPhones")}
                >
                  <FamilyIcon className="h-8 w-8 text-teal-600" />
                  <span className="text-base font-semibold text-slate-900">
                    {t(lang, "familyPhones")}
                  </span>
                  <span className="text-sm text-slate-500">
                    {t(lang, "familyPhonesDesc")}
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
                    onClick={() => {
                      setLang(l.code);
                      localStorage.setItem("tpb-lang", l.code);
                      document.documentElement.lang = l.code;
                    }}
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
      </div>
    </main>
  );
}
