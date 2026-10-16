"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import {
  getExplanationCache,
  setExplanationCache,
  type CachedExplanation,
} from "@/lib/storage";
import { getToday, getNow, isDemoMode, advanceDemoDays, resetDemoClock } from "@/lib/clock";
import { getDrugId } from "@/lib/drug-info";
import { useVoices } from "@/lib/use-voices";
import { getAdherencePrompts } from "@/lib/adherence";
import { getDaysLeft } from "@/lib/supply";
import { routeQuestion } from "@/lib/question-router";
import { useStore } from "@/lib/store";
import { LoadingShell } from "@/app/loading-shell";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  AlertIcon,
  BedIcon,
  CheckIcon,
  ChevronRightIcon,
  CloudSunIcon,
  MoonIcon,
  SpeakerIcon,
  StopIcon,
  SunIcon,
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

function SlotIcon({ slot, className }: { slot: Slot; className?: string }) {
  switch (slot) {
    case "morning":
      return <SunIcon className={className} />;
    case "afternoon":
      return <CloudSunIcon className={className} />;
    case "evening":
      return <MoonIcon className={className} />;
    case "bedtime":
      return <BedIcon className={className} />;
  }
}

function foodLabel(lang: Language, food: "after_food" | "before_food" | "with_food" | "any"): string {
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
// Food icon
// ---------------------------------------------------------------------------
function FoodIcon({
  food,
  className = "h-6 w-6 shrink-0",
}: {
  food: "after_food" | "before_food" | "with_food" | "any";
  className?: string;
}) {
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
  onListen,
  isSenior,
}: {
  medicine: {
    id: string;
    drug_name: string;
    strength: string;
    dose_per_time: string;
    food: "after_food" | "before_food" | "with_food" | "any";
    special_instructions: string[];
    photo: string;
  };
  slot: Slot;
  lang: Language;
  taken: boolean;
  takenAt: string | null;
  onTake: () => void;
  onUndo: () => void;
  undoAvailable: boolean;
  onListen: () => void;
  isSenior: boolean;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-4">
        {medicine.photo && (
          <img
            src={medicine.photo}
            alt={medicine.drug_name}
            className="h-14 w-14 shrink-0 rounded-xl border border-line object-cover"
          />
        )}
        <div className="flex flex-col gap-1.5">
          <p className="text-[22px] font-bold leading-tight text-ink">
            {medicine.drug_name} {medicine.strength}
          </p>
          <p className="text-lg text-muted">{medicine.dose_per_time}</p>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-line px-3 py-1 text-sm font-semibold text-ink">
            <FoodIcon food={medicine.food} className="h-4 w-4 shrink-0" />
            {foodLabel(lang, medicine.food)}
          </span>
          {medicine.special_instructions.length > 0 && (
            <p className="flex items-start gap-1.5 text-base font-medium text-attention-text">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{medicine.special_instructions.join("; ")}</span>
            </p>
          )}
        </div>
      </div>

      {taken && takenAt ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-success-bg px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-semibold text-success-text">
            <CheckIcon className="h-6 w-6 shrink-0" />
            {t(lang, "takenAt")} {formatTime(takenAt)}
          </span>
          {undoAvailable && (
            <button
              onClick={onUndo}
              className="min-h-12 rounded-lg border border-success-border bg-white px-4 py-2 text-base font-semibold text-success-text hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={t(lang, "undo")}
            >
              {t(lang, "undo")}
            </button>
          )}
        </div>
      ) : (
        <Button
          variant="success"
          className="w-full min-h-16 text-[20px] font-bold"
          onClick={onTake}
          aria-label={`${t(lang, "done")} — ${medicine.drug_name}`}
        >
          {t(lang, "done")}
        </Button>
      )}
      <Button
        variant="secondary"
        className="w-full"
        onClick={onListen}
        aria-label={`${t(lang, "listen")} — ${medicine.drug_name}`}
      >
        <SpeakerIcon className="h-5 w-5" />
        {t(lang, "listen")}
      </Button>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Today page
// ---------------------------------------------------------------------------
export default function TodayPage() {
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the inner component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <TodayPageInner />;
}

function TodayPageInner() {
  const router = useRouter();
  const { state, actions } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [undoMap, setUndoMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelData, setPanelData] = useState<{
    medicine: { id: string; drug_name: string; strength: string };
    explanation: CachedExplanation | null;
    fetching: boolean;
  } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { voices, loading: voicesLoading } = useVoices();
  const [today, setToday] = useState("");
  const [realToday, setRealToday] = useState("");
  const [demoActive, setDemoActive] = useState(false);
  const [justReasoned, setJustReasoned] = useState<Record<string, boolean>>({});
  const [questionInput, setQuestionInput] = useState("");
  const [questionResult, setQuestionResult] = useState<{
    reply: string;
    ifMissedQuote?: string;
  } | null>(null);

  const isSenior = state.role === "senior";

  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }
    setDemoActive(isDemoMode());
    setToday(getToday());
    const real = new Date();
    const y = real.getFullYear();
    const m = String(real.getMonth() + 1).padStart(2, "0");
    const d = String(real.getDate()).padStart(2, "0");
    setRealToday(`${y}-${m}-${d}`);
    setIsLoading(false);
  }, []);

  // Prefetch missing explanations
  useEffect(() => {
    if (isLoading) return;
    const cache = getExplanationCache();
    for (const med of state.medicines) {
      const drugId = getDrugId(med.drug_name);
      if (!drugId) continue;
      const key = `${drugId}:${lang}`;
      if (cache[key]) continue;
      fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugName: med.drug_name, language: lang }),
      })
        .then((res) => {
          if (!res.ok) return null;
          return res.json() as Promise<{
            known: boolean;
            text: string;
            fallback?: boolean;
          }>;
        })
        .then((data) => {
          if (!data) return;
          setExplanationCache(key, {
            text: data.text,
            known: data.known,
            fallback: data.fallback,
          });
        })
        .catch(() => {
          // Silently ignore
        });
    }
  }, [isLoading, state.medicines, lang]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isTaken = useCallback(
    (medicineId: string, slot: Slot) => {
      return state.doseLogs.some(
        (e) => e.medicineId === medicineId && e.date === today && e.slot === slot
      );
    },
    [state.doseLogs, today]
  );

  const getTakenTime = useCallback(
    (medicineId: string, slot: Slot): string | null => {
      const entry = state.doseLogs.find(
        (e) => e.medicineId === medicineId && e.date === today && e.slot === slot
      );
      return entry?.takenAt ?? null;
    },
    [state.doseLogs, today]
  );

  function handleTake(medicineId: string, slot: Slot) {
    actions.markDose(medicineId, today, slot);
    const key = `${medicineId}-${slot}`;
    setUndoMap((prev) => ({ ...prev, [key]: Date.now() + 10000 }));
    setTimeout(() => {
      setUndoMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 10000);
  }

  function handleUndo(medicineId: string, slot: Slot) {
    actions.unmarkDose(medicineId, today, slot);
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

  // ---------------------------------------------------------------------------
  // Explanation panel + speech synthesis
  // ---------------------------------------------------------------------------
  async function openExplanationPanel(medicine: { id: string; drug_name: string; strength: string }) {
    setPanelOpen(true);
    setPanelData({ medicine, explanation: null, fetching: true });

    const drugId = getDrugId(medicine.drug_name);
    let explanation: CachedExplanation | null = null;

    if (drugId) {
      const cacheKey = `${drugId}:${lang}`;
      const cached = getExplanationCache()[cacheKey];
      if (cached) {
        explanation = cached;
      } else {
        try {
          const res = await fetch("/api/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ drugName: medicine.drug_name, language: lang }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              known: boolean;
              text: string;
              fallback?: boolean;
            };
            explanation = {
              text: data.text,
              known: data.known,
              fallback: data.fallback,
            };
            setExplanationCache(cacheKey, explanation);
          }
        } catch {
          // Ignore
        }
      }
    }

    if (!explanation) {
      explanation = {
        text: t(lang, "pharmacistMessage"),
        known: false,
      };
    }

    setPanelData({ medicine, explanation, fetching: false });
    startSpeech(explanation.text);
  }

  function startSpeech(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langPrefix = lang === "zh" ? "zh" : lang === "ms" ? "ms" : lang === "id" ? "id" : "en";
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (voice) utterance.voice = voice;
    utterance.lang = lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : lang === "id" ? "id-ID" : "en-SG";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  function closePanel() {
    stopSpeech();
    setPanelOpen(false);
    setPanelData(null);
    setQuestionInput("");
    setQuestionResult(null);
  }

  function handleSendQuestion() {
    if (!panelData || !questionInput.trim() || !today) return;
    const med = state.medicines.find((m) => m.id === panelData.medicine.id);
    if (!med) return;
    const result = routeQuestion({
      question: questionInput.trim(),
      medicineId: med.id,
      drugName: med.drug_name,
      language: lang,
      today,
      cachedExplanation: panelData.explanation,
    });
    actions.saveRedirectedQuestion(result.saveToQuestions);
    setQuestionResult({
      reply: result.reply,
      ifMissedQuote: result.ifMissedQuote,
    });
    setQuestionInput("");
  }

  // ---------------------------------------------------------------------------
  // Adherence prompts
  // ---------------------------------------------------------------------------
  const adherencePrompts = today
    ? getAdherencePrompts(state.medicines, state.doseLogs, state.missedReasons, today)
    : [];

  function handleReason(medicineId: string, reason: string, missedCount: number) {
    actions.recordMissedReason({
      medicineId,
      reason,
      missedCount,
      recordedOn: today,
    });
    setJustReasoned((prev) => ({
      ...prev,
      [medicineId]: true,
      ...(reason === "sideEffects" ? { [medicineId + "-sideEffects"]: true } : {}),
    }));
  }

  // ---------------------------------------------------------------------------
  // Group medicines by slot
  // ---------------------------------------------------------------------------
  const slotMedicines: Record<Slot, typeof state.medicines> = {
    morning: [],
    afternoon: [],
    evening: [],
    bedtime: [],
  };
  const noSlotMedicines: typeof state.medicines = [];

  for (const med of state.medicines) {
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

  let totalDoses = 0;
  let takenDoses = 0;
  for (const med of state.medicines) {
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
    <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
      {/* Header */}
      <div className="flex w-full max-w-sm flex-col gap-2 self-center">
        <AppHeader
          title={t(lang, "todayTitle")}
          subtitle={today ? formatDate(lang, today) : undefined}
          back={
            !isSenior
              ? { label: t(lang, "back"), onClick: () => router.push("/") }
              : undefined
          }
        />
        {totalDoses > 0 && (
          <p className="text-base font-medium text-muted">
            {takenDoses} / {totalDoses} {t(lang, "dosesTaken")}
          </p>
        )}
      </div>

      {/* Refill reminders */}
      {today && state.medicines.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          {state.medicines
            .map((med) => ({ med, days: getDaysLeft(med, state.doseLogs, today) }))
            .filter(({ days }) => days !== null && days <= 7)
            .map(({ med, days }) => (
              <div
                key={`refill-${med.id}`}
                className="flex items-start gap-3 rounded-2xl border border-attention-border bg-attention-bg p-4"
              >
                <AlertIcon className="h-6 w-6 shrink-0 text-attention-text" />
                <p className="text-lg font-semibold text-attention-text">
                  {t(lang, "refillReminder")
                    .replace("{drug}", med.drug_name)
                    .replace("{n}", String(days))}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Adherence acknowledgements */}
      {Object.keys(justReasoned).length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-4 self-center">
          {state.medicines
            .filter((m) => justReasoned[m.id])
            .map((medicine) => (
              <div
                key={`ack-${medicine.id}`}
                className="rounded-2xl border border-success-border bg-success-bg p-4"
              >
                <p className="flex items-center gap-2 text-lg font-semibold text-success-text">
                  <CheckIcon className="h-6 w-6 shrink-0" />
                  {t(lang, "acknowledgement")}
                </p>
                {justReasoned[medicine.id + "-sideEffects"] && (
                  <p className="mt-2 text-lg font-semibold text-success-text">
                    {t(lang, "sideEffectsAck")}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Adherence prompts */}
      {adherencePrompts.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-4 self-center">
          {adherencePrompts.map(({ medicine, missedCount }) => (
            <div
              key={medicine.id}
              className="rounded-2xl border border-attention-border bg-attention-bg p-4"
            >
              <p className="mb-3 flex items-start gap-2 text-lg font-semibold text-attention-text">
                <AlertIcon className="mt-0.5 h-6 w-6 shrink-0" />
                {t(lang, "missedPrompt")
                  .replace("{drug}", medicine.drug_name)
                  .replace("{n}", String(missedCount))}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "forgot", label: t(lang, "forgot") },
                  { key: "sideEffects", label: t(lang, "sideEffects") },
                  { key: "feltWell", label: t(lang, "feltWell") },
                  { key: "ranOut", label: t(lang, "ranOut") },
                  { key: "other", label: t(lang, "other") },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() =>
                      handleReason(medicine.id, btn.key, missedCount)
                    }
                    className="min-h-12 rounded-xl border border-attention-border bg-white px-4 py-3 text-lg font-semibold text-attention-text hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dose sections */}
      <div className="flex w-full max-w-sm flex-col gap-6 self-center">
        {SLOT_ORDER.map((slot) => {
          const meds = slotMedicines[slot];
          if (meds.length === 0) return null;
          return (
            <section key={slot}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
                <SlotIcon slot={slot} className="h-6 w-6 shrink-0 text-primary" />
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
                      onListen={() => openExplanationPanel(med)}
                      isSenior={isSenior}
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
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-attention-text">
              <AlertIcon className="h-6 w-6 shrink-0" />
              {t(lang, "timeNotSet")}
            </h2>
            <div className="flex flex-col gap-4">
              {noSlotMedicines.map((med) => (
                <div
                  key={med.id}
                  className="flex flex-col gap-3 rounded-2xl border border-attention-border bg-attention-bg p-4"
                >
                  <div className="flex items-start gap-4">
                    {med.photo && (
                      <img
                        src={med.photo}
                        alt={med.drug_name}
                        className="h-14 w-14 shrink-0 rounded-xl border border-attention-border object-cover"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="text-[22px] font-bold leading-tight text-ink">
                        {med.drug_name} {med.strength}
                      </p>
                      <p className="text-lg text-muted">
                        {med.dose_per_time}
                      </p>
                    </div>
                  </div>
                  {!isSenior && (
                    <button
                      onClick={() => router.push(`/add?edit=${med.id}`)}
                      className="min-h-12 w-full rounded-xl border border-attention-border bg-white px-5 py-3 text-lg font-semibold text-attention-text hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label={`${t(lang, "editTime")} — ${med.drug_name}`}
                    >
                      {t(lang, "editTime")}
                    </button>
                  )}
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => openExplanationPanel(med)}
                    aria-label={`${t(lang, "listen")} — ${med.drug_name}`}
                  >
                    <SpeakerIcon className="h-5 w-5" />
                    {t(lang, "listen")}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && state.medicines.length === 0 && (
          <p className="py-12 text-center text-lg text-muted">
            {t(lang, "noMedicines")}
          </p>
        )}
      </div>

      {/* Senior help line */}
      {isSenior && (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center">
          <p className="text-center text-base text-muted">
            {t(lang, "seniorHelpLine")}
          </p>
        </div>
      )}

      {/* Navigation links (hidden for senior) */}
      {!isSenior && (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/bp")}
          >
            {t(lang, "bpLink")}
            <ChevronRightIcon className="h-5 w-5 text-muted" />
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/questions")}
          >
            {t(lang, "questionsTitle")}
            <ChevronRightIcon className="h-5 w-5 text-muted" />
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/summary")}
          >
            {t(lang, "weeklySummary")}
            <ChevronRightIcon className="h-5 w-5 text-muted" />
          </Button>
        </div>
      )}

      {/* Demo controls */}
      {demoActive && (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center rounded-2xl border border-dashed border-line bg-page p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t(lang, "demoMode")}
          </p>
          {today && today !== realToday && (
            <p className="text-base text-ink">
              {t(lang, "simulatedDate")}: {formatDate(lang, today)}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                advanceDemoDays(1);
                window.location.reload();
              }}
            >
              {t(lang, "advanceDay")}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                resetDemoClock();
                window.location.reload();
              }}
            >
              {t(lang, "resetClock")}
            </Button>
          </div>
        </div>
      )}

      {/* Explanation panel — bottom sheet with sticky listen row */}
      {panelOpen && panelData && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-t-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-xl font-bold text-ink">
                {panelData.medicine.drug_name} {panelData.medicine.strength}
              </h2>
              <button
                onClick={closePanel}
                className="min-h-12 min-w-12 rounded-xl px-3 text-base font-semibold text-muted hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={t(lang, "close")}
              >
                {t(lang, "close")}
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {panelData.fetching ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-primary" />
                  <p className="text-lg text-muted">{t(lang, "loading")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl bg-page p-4">
                    <p className="whitespace-pre-wrap text-xl leading-relaxed text-ink">
                      {panelData.explanation?.text}
                    </p>
                    {panelData.explanation?.known && (
                      <p className="mt-3 text-sm text-muted">
                        {t(lang, "oglAttribution")}{" "}
                        <a
                          href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Open Government Licence v3.0
                        </a>
                      </p>
                    )}
                    {panelData.explanation?.fallback && (
                      <p className="mt-2 text-sm text-attention-text">
                        {t(lang, "genericError")}
                      </p>
                    )}
                  </div>

                  {/* Voice availability note */}
                  {typeof window !== "undefined" &&
                    window.speechSynthesis &&
                    panelData.explanation &&
                    !voicesLoading &&
                    (() => {
                      const langPrefix =
                        lang === "zh" ? "zh" : lang === "ms" ? "ms" : lang === "id" ? "id" : "en";
                      const hasVoice = voices.some((v) =>
                        v.lang.toLowerCase().startsWith(langPrefix)
                      );
                      if (!hasVoice) {
                        return (
                          <p className="text-center text-sm text-muted">
                            {t(lang, "voiceNotAvailable")}
                          </p>
                        );
                      }
                      return null;
                    })()}

                  {/* Ask a question */}
                  <div className="flex flex-col gap-3 rounded-xl border border-line p-4">
                    <label className="text-base font-semibold text-ink">
                      {t(lang, "askQuestion")}
                    </label>
                    <input
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendQuestion();
                      }}
                      placeholder={t(lang, "askQuestionPlaceholder")}
                      className="w-full rounded-xl border border-line bg-white px-4 py-3 text-lg text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleSendQuestion}
                      disabled={!questionInput.trim()}
                    >
                      {t(lang, "send")}
                    </Button>

                    {questionResult && (
                      <div className="flex flex-col gap-3 rounded-xl bg-page p-4">
                        <p className="text-lg font-semibold text-ink">
                          {questionResult.reply}
                        </p>
                        {questionResult.ifMissedQuote && (
                          <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3">
                            <p className="text-base font-semibold text-muted">
                              {t(lang, "whatSourceSaysAboutMissedDose")}
                            </p>
                            <p className="text-base leading-relaxed text-ink">
                              {questionResult.ifMissedQuote}
                            </p>
                            <p className="text-sm text-muted">
                              {t(lang, "oglAttribution")}{" "}
                              <a
                                href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                Open Government Licence v3.0
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky listen/stop row */}
            <div className="sticky bottom-0 flex border-t border-line bg-white px-5 py-4">
              {isSpeaking ? (
                <Button
                  variant="danger"
                  className="w-full text-[20px] font-bold"
                  onClick={stopSpeech}
                >
                  <StopIcon className="h-5 w-5" />
                  {t(lang, "stop")}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full text-[20px] font-bold"
                  onClick={() => {
                    if (panelData.explanation) {
                      startSpeech(panelData.explanation.text);
                    }
                  }}
                >
                  <SpeakerIcon className="h-5 w-5" />
                  {t(lang, "listen")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
