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

type QuestionItem = {
  id: string;
  text: string;
  auto: boolean;
};

function formatDateShort(lang: Language, dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  switch (lang) {
    case "zh":
      return `${m}/${d}`;
    case "ms":
    case "id":
      return `${d}/${m}`;
    default:
      return `${d}/${m}`;
  }
}

export default function QuestionsPage() {
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the inner component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <QuestionsPageInner />;
}

function QuestionsPageInner() {
  const router = useRouter();
  const { state, actions } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [today, setToday] = useState("");
  const [customInput, setCustomInput] = useState("");
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

  const autoQuestions = useMemo<QuestionItem[]>(() => {
    if (!today) return [];
    const items: QuestionItem[] = [];

    const reasons = state.missedReasons;
    const cutoff7 = new Date(today + "T00:00:00");
    cutoff7.setDate(cutoff7.getDate() - 7);
    const cutoff7Str = `${cutoff7.getFullYear()}-${String(cutoff7.getMonth() + 1).padStart(2, "0")}-${String(cutoff7.getDate()).padStart(2, "0")}`;

    for (const med of state.medicines) {
      const missedCount = countMissedDosesInLastNDays(med, state.doseLogs, today, 7);
      if (missedCount > 0) {
        const recentReasons = reasons.filter(
          (r) => r.medicineId === med.id && r.recordedOn >= cutoff7Str
        );
        for (const r of recentReasons) {
          const reasonLabel = t(lang, r.reason as Parameters<typeof t>[1]) ?? r.reason;
          items.push({
            id: `missed-${med.id}-${r.recordedOn}-${r.reason}`,
            text: t(lang, "missedDosesQuestion")
              .replace("{drug}", med.drug_name)
              .replace("{n}", String(missedCount))
              .replace("{reason}", reasonLabel),
            auto: true,
          });
        }
      }
    }

    for (const med of state.medicines) {
      const days = getDaysLeft(med, state.doseLogs, today);
      if (days !== null && days <= 7) {
        items.push({
          id: `refill-${med.id}`,
          text: t(lang, "refillQuestion")
            .replace("{drug}", med.drug_name)
            .replace("{n}", String(days)),
          auto: true,
        });
      }
    }

    const cutoff14 = new Date(today + "T00:00:00");
    cutoff14.setDate(cutoff14.getDate() - 14);
    const cutoff14Str = `${cutoff14.getFullYear()}-${String(cutoff14.getMonth() + 1).padStart(2, "0")}-${String(cutoff14.getDate()).padStart(2, "0")}`;

    for (const r of state.bpReadings) {
      if (r.date < cutoff14Str) continue;
      const isVeryHigh = r.systolic >= 180 || r.diastolic >= 120;
      const aboveTarget = state.household?.bpTarget && (r.systolic > state.household.bpTarget.systolic || r.diastolic > state.household.bpTarget.diastolic);
      if (isVeryHigh || aboveTarget) {
        const dateShort = formatDateShort(lang, r.date);
        if (isVeryHigh) {
          items.push({
            id: `bp-${r.id}`,
            text: t(lang, "bpVeryHighQuestion")
              .replace("{sys}", String(r.systolic))
              .replace("{dia}", String(r.diastolic))
              .replace("{date}", dateShort),
            auto: true,
          });
        } else if (aboveTarget) {
          items.push({
            id: `bp-${r.id}`,
            text: t(lang, "bpHighQuestion")
              .replace("{sys}", String(r.systolic))
              .replace("{dia}", String(r.diastolic))
              .replace("{date}", dateShort),
            auto: true,
          });
        }
      }
    }

    for (const q of state.redirectedQuestions) {
      items.push({
        id: `redirected-${q.askedOn}-${q.question}`,
        text: t(lang, "redirectedQuestion").replace("{question}", q.question),
        auto: true,
      });
    }

    return items;
  }, [state.medicines, state.doseLogs, state.missedReasons, state.bpReadings, state.redirectedQuestions, state.household, today, lang]);

  const allQuestions = useMemo<QuestionItem[]>(() => {
    const custom: QuestionItem[] = state.customQuestions.map((q) => ({
      id: `custom-${q.id}`,
      text: q.text,
      auto: false,
    }));
    return [...autoQuestions, ...custom];
  }, [autoQuestions, state.customQuestions]);

  async function handleToggle(id: string) {
    await actions.toggleDoneQuestion(id);
  }

  async function handleAddCustom() {
    const text = customInput.trim();
    if (!text) return;
    await actions.addCustomQuestion(text);
    setCustomInput("");
  }

  async function handleDeleteCustom(id: string) {
    await actions.deleteCustomQuestion(id);
  }

  function handlePrint() {
    window.print();
  }

  function buildShareText(): string {
    const lines: string[] = [];
    lines.push(`${t(lang, "appTitle")} — ${t(lang, "questionsForDoctor")}`);
    if (state.household?.displayName) {
      lines.push(state.household.displayName);
    }
    if (today) {
      lines.push(today);
    }
    lines.push("");

    if (state.medicines.length > 0) {
      lines.push(`${t(lang, "currentMedicines")}:`);
      for (const med of state.medicines) {
        lines.push(`- ${med.drug_name} ${med.strength} — ${med.dose_per_time} (${med.time_slots.join(", ")})`);
      }
      lines.push("");
    }

    if (allQuestions.length > 0) {
      lines.push(`${t(lang, "questionsForDoctor")}:`);
      allQuestions.forEach((q, idx) => {
        lines.push(`${idx + 1}. ${q.text}`);
      });
    } else {
      lines.push(t(lang, "noQuestions"));
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
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg px-3 py-2 text-lg text-slate-600 hover:bg-slate-100"
            aria-label={t(lang, "back")}
          >
            ← {t(lang, "back")}
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            {t(lang, "questionsTitle")}
          </h1>
          <div className="w-16" />
        </div>
        <div className="print-only hidden">
          <h1 className="text-2xl font-bold text-slate-900">
            {t(lang, "questionsForDoctor")}
          </h1>
          <p className="text-base text-slate-600">
            {t(lang, "printDate")}: {today}
          </p>
        </div>
      </header>

      {/* Action buttons */}
      <div className="flex w-full max-w-sm flex-col gap-3 self-center no-print">
        <button
          onClick={handlePrint}
          className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
          style={{ minHeight: 56 }}
        >
          {t(lang, "printSavePDF")}
        </button>
        {allQuestions.length > 0 && (
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
        )}
      </div>

      {/* Current medicines (visible on print) */}
      <div className="print-medicines w-full max-w-sm self-center">
        <h2 className="text-lg font-bold text-slate-900">
          {t(lang, "currentMedicines")}
        </h2>
        {state.medicines.length === 0 ? (
          <p className="text-base text-slate-600">{t(lang, "noMedicines")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {state.medicines.map((med) => (
              <li key={med.id} className="text-base text-slate-800">
                <span className="font-semibold">{med.drug_name}</span>{" "}
                {med.strength} — {med.dose_per_time} ({med.time_slots.join(", ")})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Questions list */}
      <div className="print-questions flex w-full max-w-sm flex-col gap-4 self-center">
        <h2 className="text-lg font-bold text-slate-900">
          {t(lang, "questionsForDoctor")}
        </h2>

        {allQuestions.length === 0 && !isLoading && (
          <p className="py-6 text-center text-lg text-slate-500">
            {t(lang, "noQuestions")}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {allQuestions.map((q) => {
            const done = state.doneQuestionIds.includes(q.id);
            return (
              <li
                key={q.id}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 ${
                  done
                    ? "border-slate-200 bg-slate-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => handleToggle(q.id)}
                  className="mt-1 h-6 w-6 shrink-0 cursor-pointer accent-blue-600 no-print"
                  aria-label={t(lang, "asked")}
                />
                <span
                  className={`text-lg leading-snug ${
                    done ? "text-slate-500 line-through" : "text-slate-900"
                  }`}
                >
                  {q.text}
                </span>
                {!q.auto && (
                  <button
                    onClick={() => handleDeleteCustom(q.id.replace("custom-", ""))}
                    className="ml-auto shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-red-600 hover:bg-red-100 no-print"
                  >
                    {t(lang, "delete")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Add custom question */}
      <div className="flex w-full max-w-sm flex-col gap-3 self-center no-print">
        <label className="text-base font-semibold text-slate-700">
          {t(lang, "addQuestion")}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCustom();
            }}
            placeholder={t(lang, "addQuestion")}
            className="flex-1 rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-lg text-slate-900"
          />
          <button
            onClick={handleAddCustom}
            className="rounded-xl bg-green-600 px-5 py-3 text-lg font-semibold text-white hover:bg-green-700 active:bg-green-800"
            style={{ minHeight: 48 }}
          >
            {t(lang, "save")}
          </button>
        </div>
      </div>
    </main>
  );
}
