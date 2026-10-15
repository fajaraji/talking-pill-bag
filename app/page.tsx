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
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  CameraIcon,
  ChartBarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardQuestionIcon,
  HeartPulseIcon,
  PillIcon,
  UsersIcon,
} from "@/components/icons";

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
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-page px-4 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          {onboardingStep === "choice" && (
            <>
              <header className="flex flex-col items-center gap-3 text-center">
                <PillIcon className="h-12 w-12 text-primary" />
                <h1 className="text-2xl font-bold text-ink">{t(lang, "appTitle")}</h1>
                <p className="text-lg text-muted">{t(lang, "tagline")}</p>
              </header>

              <p className="text-center text-lg font-semibold text-ink">
                {t(lang, "setupTitle")}
              </p>
              <div className="flex w-full flex-col gap-4">
                <Button
                  variant="primary"
                  className="w-full min-h-16"
                  onClick={() => setOnboardingStep("caregiver")}
                >
                  {t(lang, "caregiverChoice")}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full min-h-16"
                  onClick={() => setOnboardingStep("join")}
                >
                  {t(lang, "seniorChoice")}
                </Button>
              </div>

              <section aria-label={t(lang, "chooseLanguage")}>
                <h2 className="mb-3 text-lg font-semibold text-ink">
                  {t(lang, "chooseLanguage")}
                </h2>
                <Card className="flex flex-col gap-2">
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
                        className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          selected
                            ? "border-primary bg-primary/5 text-ink"
                            : "border-line bg-white text-ink hover:border-muted"
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="font-medium">{l.nativeLabel}</span>
                        {selected ? (
                          <CheckIcon className="h-5 w-5 text-primary" />
                        ) : (
                          <span className="text-sm text-muted">{l.label}</span>
                        )}
                      </button>
                    );
                  })}
                </Card>
              </section>
            </>
          )}

          {onboardingStep === "caregiver" && (
            <div className="flex w-full flex-col gap-6">
              <AppHeader
                title={t(lang, "whoIsThisFor")}
                back={{ label: t(lang, "back"), onClick: () => setOnboardingStep("choice") }}
              />
              <Card className="flex flex-col gap-4">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t(lang, "namePlaceholder")}
                  className="w-full rounded-xl border border-line bg-white px-5 py-4 text-lg text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={loading || !nameInput.trim()}
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
                >
                  {loading ? t(lang, "loading") : t(lang, "save")}
                </Button>
                {error && <p className="text-base text-danger-text">{error}</p>}
              </Card>
            </div>
          )}

          {onboardingStep === "join" && (
            <div className="flex w-full flex-col gap-6">
              <AppHeader
                title={t(lang, "joinWithCode")}
                back={{ label: t(lang, "back"), onClick: () => setOnboardingStep("choice") }}
              />
              <Card className="flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder={t(lang, "codePlaceholder")}
                  className="w-full rounded-xl border border-line bg-white px-5 py-4 text-center text-2xl font-bold tracking-widest text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={loading || codeInput.length !== 6}
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
                >
                  {loading ? t(lang, "loading") : t(lang, "save")}
                </Button>
                {error && <p className="text-base text-danger-text">{error}</p>}
              </Card>
            </div>
          )}
        </div>
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

  const tiles = [
    {
      href: "/add",
      icon: CameraIcon,
      label: t(lang, "addMedicineTile"),
      desc: t(lang, "addMedicineTileDesc"),
    },
    {
      href: "/bp",
      icon: HeartPulseIcon,
      label: t(lang, "bpTile"),
      desc: t(lang, "bpTileDesc"),
    },
    {
      href: "/questions",
      icon: ClipboardQuestionIcon,
      label: t(lang, "questionsTile"),
      desc: t(lang, "questionsTileDesc"),
    },
    {
      href: "/summary",
      icon: ChartBarIcon,
      label: t(lang, "weeklySummaryTile"),
      desc: t(lang, "weeklySummaryTileDesc"),
    },
    {
      href: "/family",
      icon: UsersIcon,
      label: t(lang, "familyPhones"),
      desc: t(lang, "familyPhonesDesc"),
    },
  ];

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
      <div className="flex w-full max-w-sm flex-col gap-6 self-center">
        {/* App header */}
        <AppHeader title={t(lang, "appTitle")} />

        {state.medicines.length === 0 ? (
          <>
            <p className="text-center text-lg leading-relaxed text-muted">
              {t(lang, "homeValueStatement")}
            </p>
            <Button
              variant="primary"
              className="w-full min-h-16 text-[20px] font-bold"
              onClick={() => router.push("/add")}
            >
              {t(lang, "addFirstMedicine")}
            </Button>
          </>
        ) : (
          <>
            {/* Primary card */}
            <button
              onClick={() => router.push("/today")}
              className="flex w-full flex-col gap-3 rounded-2xl bg-primary p-5 text-left text-white shadow-sm hover:bg-primary-hover active:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={todayTitle}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-bold">{todayTitle}</h2>
                <ChevronRightIcon className="h-6 w-6 shrink-0" />
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
              <h2 className="mb-3 text-lg font-semibold text-ink">
                {t(lang, "forFamilyAndHelpers")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {tiles.map((tile) => (
                  <button
                    key={tile.href}
                    onClick={() => router.push(tile.href)}
                    className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={tile.label}
                  >
                    <Card className="flex h-full min-h-24 flex-col gap-2">
                      <tile.icon className="h-8 w-8 text-primary" />
                      <span className="text-base font-semibold text-ink">
                        {tile.label}
                      </span>
                      <span className="text-sm text-muted">{tile.desc}</span>
                    </Card>
                  </button>
                ))}
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
                    className={`rounded-lg px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      selected
                        ? "font-semibold text-primary"
                        : "text-muted hover:text-ink"
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
