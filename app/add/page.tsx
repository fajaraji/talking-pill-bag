"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import type { LabelResult } from "@/app/api/read-label/route";
import { setExplanationCache } from "@/lib/storage";
import { getDrugId } from "@/lib/drug-info";
import { getToday } from "@/lib/clock";
import { resizeImage, createThumbnail } from "@/lib/image";
import { useStore } from "@/lib/store";
import { LoadingShell } from "@/app/loading-shell";

type Step = "capture" | "confirm" | "error";

const TIME_SLOT_OPTIONS: Array<{ value: LabelResult["time_slots"][number]; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "bedtime", label: "Bedtime" },
];

const FOOD_OPTIONS: Array<{ value: LabelResult["food"]; label: string }> = [
  { value: "after_food", label: "After food" },
  { value: "before_food", label: "Before food" },
  { value: "with_food", label: "With food" },
  { value: "any", label: "Any (with or without food)" },
];

function AddMedicinePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, actions } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [step, setStep] = useState<Step>("capture");
  const [image, setImage] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LabelResult | null>(null);
  const [editedResult, setEditedResult] = useState<LabelResult | null>(null);
  const [isRejected, setIsRejected] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
    }

    const editId = searchParams.get("edit");
    if (editId) {
      const med = state.medicines.find((m) => m.id === editId);
      if (med) {
        setIsEditMode(true);
        setImage(med.photo);
        setThumbnail(med.photo);
        const labelData: LabelResult = {
          readable: true,
          confidence: 1,
          drug_name: med.drug_name,
          strength: med.strength,
          dose_per_time: med.dose_per_time,
          times_per_day: med.times_per_day,
          time_slots: med.time_slots,
          food: med.food,
          special_instructions: med.special_instructions,
          quantity_dispensed: med.quantity_dispensed,
          dispensed_date: med.dispensed_date,
          unclear_fields: med.unclear_fields,
        };
        setResult(labelData);
        setEditedResult(labelData);
        setStep("confirm");
      }
    }
  }, [searchParams, state.medicines]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const resized = await resizeImage(file, 1280, 0.8);
      setImage(resized.dataUrl);
      const thumb = await createThumbnail(resized.dataUrl);
      setThumbnail(thumb);
      sendToApi(resized.dataUrl);
    } catch {
      setIsRejected(false);
      setStep("error");
    }
  }

  async function sendToApi(dataUrl: string) {
    setLoading(true);
    setStep("capture");
    setIsRejected(false);
    try {
      const res = await fetch("/api/read-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = (await res.json()) as {
        result?: LabelResult;
        error?: string;
        rejected?: boolean;
      };

      if (!res.ok) {
        if (res.status === 422 && data.rejected) {
          setIsRejected(true);
        } else {
          setIsRejected(false);
        }
        setStep("error");
        setLoading(false);
        return;
      }

      if (data.result) {
        setResult(data.result);
        setEditedResult(data.result);
        setStep("confirm");
      } else {
        setIsRejected(true);
        setStep("error");
      }
    } catch {
      setIsRejected(false);
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  function isUnclear(field: string): boolean {
    return editedResult?.unclear_fields.includes(field) ?? false;
  }

  function toggleUnclear(field: string, unclear: boolean) {
    if (!editedResult) return;
    const set = new Set(editedResult.unclear_fields);
    if (unclear) set.add(field);
    else set.delete(field);
    setEditedResult({ ...editedResult, unclear_fields: Array.from(set) });
  }

  function updateField<K extends keyof LabelResult>(
    key: K,
    value: LabelResult[K]
  ) {
    if (!editedResult) return;
    setEditedResult({ ...editedResult, [key]: value });
  }

  async function prefetchExplanations(drugName: string, language: Language) {
    const drugId = getDrugId(drugName);
    if (!drugId) return;
    const cacheKey = `${drugId}:${language}`;
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugName, language }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        known: boolean;
        text: string;
        source_url?: string;
        source_title?: string;
        fallback?: boolean;
      };
      setExplanationCache(cacheKey, {
        text: data.text,
        sourceUrl: data.source_url ?? "",
        sourceTitle: data.source_title ?? "",
        known: data.known,
        fallback: data.fallback,
      });
    } catch {
      // Silently ignore
    }
  }

  async function handleConfirm() {
    if (!editedResult || !thumbnail) return;
    if (isEditMode) {
      const editId = searchParams.get("edit");
      if (!editId) return;
      await actions.updateMedicine({
        ...editedResult,
        id: editId,
        photo: thumbnail,
        addedOn: getToday(),
      });
      prefetchExplanations(editedResult.drug_name, lang);
      router.push("/today");
    } else {
      await actions.addMedicine({
        ...editedResult,
        thumbnail,
        addedOn: getToday(),
      });
      prefetchExplanations(editedResult.drug_name, lang);
      router.push("/today");
    }
  }

  const restoreCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
    }
  }, []);

  function openGallery() {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  }

  function openCamera() {
    restoreCapture();
    fileInputRef.current?.click();
  }

  function renderTextField<K extends keyof LabelResult>(
    label: string,
    key: K,
    value: string | number,
    type: "text" | "number" = "text"
  ) {
    const unclear = isUnclear(String(key));
    return (
      <div className="flex flex-col gap-1">
        <label
          className={`text-base font-semibold ${
            unclear ? "text-red-600" : "text-slate-700"
          }`}
        >
          {label}
          {unclear && (
            <span className="ml-2 text-sm font-normal text-red-500">
              ({t(lang, "unclearFields")})
            </span>
          )}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) =>
            updateField(
              key,
              (type === "number"
                ? Number(e.target.value)
                : e.target.value) as LabelResult[K]
            )
          }
          className={`rounded-lg border-2 px-4 py-3 text-lg ${
            unclear
              ? "border-red-400 bg-red-50 text-red-900"
              : "border-slate-200 bg-white text-slate-900"
          }`}
        />
      </div>
    );
  }

  if (step === "capture" || step === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-6 py-8">
        <header className="flex w-full max-w-sm items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg px-3 py-2 text-lg text-slate-600 hover:bg-slate-100"
          >
            ← {t(lang, "back")}
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            {t(lang, "addMedicine")}
          </h1>
          <div className="w-16" />
        </header>

        {image && (
          <div className="w-full max-w-sm overflow-hidden rounded-xl border-2 border-slate-200">
            <img src={image} alt="Medication label" className="w-full object-contain" />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="text-lg text-slate-600">{t(lang, "analyzing")}</p>
          </div>
        )}

        {step === "error" && !loading && (
          <div className="w-full max-w-sm rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
            <p className="text-lg font-semibold text-red-700">
              {isRejected ? t(lang, "pharmacistMessage") : t(lang, "genericError")}
            </p>
            <button
              onClick={() => {
                setStep("capture");
                setImage(null);
                setThumbnail(null);
                setIsRejected(false);
              }}
              className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
            >
              {t(lang, "retry")}
            </button>
          </div>
        )}

        {!loading && step !== "error" && (
          <div className="flex w-full max-w-sm flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={openCamera}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
            >
              {t(lang, "takePhoto")}
            </button>
            <button
              onClick={openGallery}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t(lang, "uploadPhoto")}
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 px-6 py-8">
      <header className="flex w-full max-w-sm items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="rounded-lg px-3 py-2 text-lg text-slate-600 hover:bg-slate-100"
        >
          ← {t(lang, "back")}
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {t(lang, "addMedicine")}
        </h1>
        <div className="w-16" />
      </header>

      <div className="flex w-full max-w-sm flex-col gap-6">
        {image && (
          <div className="overflow-hidden rounded-xl border-2 border-slate-200">
            <img src={image} alt="Medication label" className="w-full object-contain" />
          </div>
        )}

        {editedResult && (
          <div className="flex flex-col gap-4">
            {renderTextField(t(lang, "drugName"), "drug_name", editedResult.drug_name)}
            {renderTextField(t(lang, "strength"), "strength", editedResult.strength)}
            {renderTextField(t(lang, "dose"), "dose_per_time", editedResult.dose_per_time)}
            {renderTextField(t(lang, "timesPerDay"), "times_per_day", editedResult.times_per_day, "number")}

            <div className="flex flex-col gap-2">
              <label className={`text-base font-semibold ${isUnclear("time_slots") ? "text-red-600" : "text-slate-700"}`}>
                {t(lang, "timeSlots")}
                {isUnclear("time_slots") && (
                  <span className="ml-2 text-sm font-normal text-red-500">({t(lang, "unclearFields")})</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOT_OPTIONS.map((opt) => {
                  const checked = editedResult.time_slots.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-3 text-lg ${
                        checked ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const slots = new Set(editedResult.time_slots);
                          if (e.target.checked) slots.add(opt.value);
                          else slots.delete(opt.value);
                          const newSlots = Array.from(slots) as LabelResult["time_slots"];
                          const next = { ...editedResult, time_slots: newSlots };
                          if (newSlots.length > 0 && next.unclear_fields.includes("time_slots")) {
                            next.unclear_fields = next.unclear_fields.filter((f) => f !== "time_slots");
                          }
                          setEditedResult(next);
                        }}
                        className="h-5 w-5"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-base font-semibold ${isUnclear("food") ? "text-red-600" : "text-slate-700"}`}>
                {t(lang, "food")}
                {isUnclear("food") && (
                  <span className="ml-2 text-sm font-normal text-red-500">({t(lang, "unclearFields")})</span>
                )}
              </label>
              <select
                value={editedResult.food}
                onChange={(e) => updateField("food", e.target.value as LabelResult["food"])}
                className={`rounded-lg border-2 px-4 py-3 text-lg ${
                  isUnclear("food")
                    ? "border-red-400 bg-red-50 text-red-900"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                {FOOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-base font-semibold ${isUnclear("special_instructions") ? "text-red-600" : "text-slate-700"}`}>
                {t(lang, "specialInstructions")}
                {isUnclear("special_instructions") && (
                  <span className="ml-2 text-sm font-normal text-red-500">({t(lang, "unclearFields")})</span>
                )}
              </label>
              <textarea
                value={editedResult.special_instructions.join("\n")}
                onChange={(e) =>
                  updateField(
                    "special_instructions",
                    e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0)
                  )
                }
                rows={3}
                className={`rounded-lg border-2 px-4 py-3 text-lg ${
                  isUnclear("special_instructions")
                    ? "border-red-400 bg-red-50 text-red-900"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              />
            </div>

            {renderTextField(t(lang, "quantityDispensed"), "quantity_dispensed", editedResult.quantity_dispensed, "number")}
            {renderTextField(t(lang, "dispensedDate"), "dispensed_date", editedResult.dispensed_date)}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleConfirm}
            className="rounded-xl bg-green-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800"
          >
            {t(lang, "confirm")}
          </button>
          <button
            onClick={() => {
              setStep("capture");
              setImage(null);
              setThumbnail(null);
              setResult(null);
              setEditedResult(null);
            }}
            className="rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t(lang, "retry")}
          </button>
        </div>
      </div>
    </main>
  );
}

function AddMedicinePageInner() {
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the content component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <AddMedicinePageContent />;
}

export default function AddMedicinePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-lg text-slate-600">Loading…</p>
        </main>
      }
    >
      <AddMedicinePageInner />
    </Suspense>
  );
}
