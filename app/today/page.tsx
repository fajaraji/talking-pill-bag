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
function FoodIcon({ food }: { food: "after_food" | "before_food" | "with_food" | "any" }) {
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
      <button
        onClick={onListen}
        className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-50"
        aria-label={`${t(lang, "listen")} — ${medicine.drug_name}`}
      >
        {t(lang, "listen")}
      </button>
    </div>
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
    sourceUrl?: string;
    sourceTitle?: string;
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
            source_url?: string;
            source_title?: string;
            fallback?: boolean;
          }>;
        })
        .then((data) => {
          if (!data) return;
          setExplanationCache(key, {
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
              source_url?: string;
              source_title?: string;
              fallback?: boolean;
            };
            explanation = {
              text: data.text,
              sourceUrl: data.source_url ?? "",
              sourceTitle: data.source_title ?? "",
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
        sourceUrl: "",
        sourceTitle: "",
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
      sourceUrl: result.sourceUrl,
      sourceTitle: result.sourceTitle,
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
    <main className="flex min-h-screen flex-col gap-6 bg-slate-50 px-4 py-6">
      {/* Header */}
      <header className="flex w-full max-w-sm flex-col gap-2 self-center">
        <div className="flex items-center justify-between">
          {!isSenior && (
            <button
              onClick={() => router.push("/")}
              className="rounded-lg px-3 py-2 text-lg text-slate-600 hover:bg-slate-100"
              aria-label={t(lang, "back")}
            >
              ← {t(lang, "back")}
            </button>
          )}
          <h1 className="text-xl font-bold text-slate-900">
            {t(lang, "todayTitle")}
          </h1>
          {isSenior ? <div className="w-16" /> : <div className="w-16" />}
        </div>
        {today && (
          <p className="text-center text-lg text-slate-700">
            {formatDate(lang, today)}
          </p>
        )}
        {totalDoses > 0 && (
          <p className="text-center text-base font-medium text-slate-600">
            {takenDoses} / {totalDoses} {t(lang, "dosesTaken")}
          </p>
        )}
      </header>

      {/* Refill reminders */}
      {today && state.medicines.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          {state.medicines
            .map((med) => ({ med, days: getDaysLeft(med, state.doseLogs, today) }))
            .filter(({ days }) => days !== null && days <= 7)
            .map(({ med, days }) => (
              <div
                key={`refill-${med.id}`}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4"
              >
                <p className="text-lg font-semibold text-amber-900">
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
                className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4"
              >
                <p className="text-lg text-blue-900">
                  {t(lang, "acknowledgement")}
                </p>
                {justReasoned[medicine.id + "-sideEffects"] && (
                  <p className="mt-2 text-lg font-semibold text-blue-900">
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
              className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4"
            >
              <p className="mb-3 text-lg font-semibold text-amber-900">
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
                    className="rounded-xl bg-white px-4 py-3 text-lg font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
                    style={{ minHeight: 48 }}
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
                  {!isSenior && (
                    <button
                      onClick={() => router.push(`/add?edit=${med.id}`)}
                      className="w-full rounded-xl border-2 border-amber-300 bg-white px-5 py-3 text-lg font-semibold text-amber-700 hover:bg-amber-100"
                      aria-label={`${t(lang, "editTime")} — ${med.drug_name}`}
                    >
                      {t(lang, "editTime")}
                    </button>
                  )}
                  <button
                    onClick={() => openExplanationPanel(med)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-50"
                    aria-label={`${t(lang, "listen")} — ${med.drug_name}`}
                  >
                    {t(lang, "listen")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && state.medicines.length === 0 && (
          <p className="py-12 text-center text-lg text-slate-500">
            {t(lang, "noMedicines")}
          </p>
        )}
      </div>

      {/* Senior help line */}
      {isSenior && (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center">
          <p className="text-center text-base text-slate-500">
            {t(lang, "seniorHelpLine")}
          </p>
        </div>
      )}

      {/* Navigation links (hidden for senior) */}
      {!isSenior && (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center">
          <button
            onClick={() => router.push("/bp")}
            className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t(lang, "bpLink")} →
          </button>
          <button
            onClick={() => router.push("/questions")}
            className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t(lang, "questionsTitle")} →
          </button>
          <button
            onClick={() => router.push("/summary")}
            className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t(lang, "weeklySummary")} →
          </button>
        </div>
      )}

      {/* Demo controls */}
      {demoActive && (
        <div className="flex w-full max-w-sm flex-col gap-2 self-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t(lang, "demoMode")}
          </p>
          {today && today !== realToday && (
            <p className="text-base text-slate-700">
              {t(lang, "simulatedDate")}: {formatDate(lang, today)}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                advanceDemoDays(1);
                window.location.reload();
              }}
              className="rounded-lg bg-slate-800 px-4 py-2 text-base font-semibold text-white hover:bg-slate-900"
            >
              {t(lang, "advanceDay")}
            </button>
            <button
              onClick={() => {
                resetDemoClock();
                window.location.reload();
              }}
              className="rounded-lg border-2 border-slate-400 bg-white px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t(lang, "resetClock")}
            </button>
          </div>
        </div>
      )}

      {/* Explanation panel */}
      {panelOpen && panelData && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {panelData.medicine.drug_name} {panelData.medicine.strength}
              </h2>
              <button
                onClick={closePanel}
                className="rounded-lg px-3 py-1 text-lg text-slate-600 hover:bg-slate-100"
                aria-label={t(lang, "close")}
              >
                {t(lang, "close")}
              </button>
            </div>

            {panelData.fetching ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <p className="text-lg text-slate-600">{t(lang, "loading")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="max-h-80 overflow-y-auto rounded-xl bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-xl leading-relaxed text-slate-900">
                    {panelData.explanation?.text}
                  </p>
                  {panelData.explanation?.sourceUrl && (
                    <a
                      href={panelData.explanation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-base font-semibold text-blue-700 underline"
                    >
                      {t(lang, "source")}: {panelData.explanation.sourceTitle || "HealthHub"}
                    </a>
                  )}
                  {!panelData.explanation?.sourceUrl && panelData.explanation?.known && (
                    <p className="mt-3 text-base text-slate-600">
                      {t(lang, "source")}: HealthHub
                    </p>
                  )}
                  {panelData.explanation?.fallback && (
                    <p className="mt-2 text-sm text-amber-700">
                      {t(lang, "genericError")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {isSpeaking ? (
                    <button
                      onClick={stopSpeech}
                      className="w-full rounded-xl bg-red-600 px-5 py-4 text-xl font-bold text-white shadow-sm hover:bg-red-700 active:bg-red-800"
                    >
                      {t(lang, "stop")}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (panelData.explanation) {
                          startSpeech(panelData.explanation.text);
                        }
                      }}
                      className="w-full rounded-xl bg-blue-600 px-5 py-4 text-xl font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
                    >
                      {t(lang, "listen")}
                    </button>
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
                        <p className="text-center text-sm text-slate-500">
                          {t(lang, "voiceNotAvailable")}
                        </p>
                      );
                    }
                    return null;
                  })()}

                {/* Ask a question */}
                <div className="mt-2 flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                  <label className="text-base font-semibold text-slate-700">
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
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-900"
                  />
                  <button
                    onClick={handleSendQuestion}
                    disabled={!questionInput.trim()}
                    className="w-full rounded-xl bg-green-600 px-5 py-4 text-xl font-bold text-white shadow-sm hover:bg-green-700 active:bg-green-800 disabled:bg-slate-300"
                    style={{ minHeight: 56 }}
                  >
                    {t(lang, "send")}
                  </button>

                  {questionResult && (
                    <div className="flex flex-col gap-3 rounded-xl bg-white p-4">
                      <p className="text-lg font-semibold text-blue-900">
                        {questionResult.reply}
                      </p>
                      {questionResult.ifMissedQuote && (
                        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
                          <p className="text-base font-semibold text-slate-700">
                            {t(lang, "whatHealthHubSaysAboutMissedDose")}
                          </p>
                          <p className="text-base leading-relaxed text-slate-900">
                            {questionResult.ifMissedQuote}
                          </p>
                          {questionResult.sourceUrl && (
                            <a
                              href={questionResult.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-base font-semibold text-blue-700 underline"
                            >
                              {t(lang, "source")}: {questionResult.sourceTitle || "HealthHub"}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
