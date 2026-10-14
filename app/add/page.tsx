"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import type { LabelResult } from "@/app/api/read-label/route";

type Step = "capture" | "confirm" | "error";

export default function AddMedicinePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [step, setStep] = useState<Step>("capture");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LabelResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [editedResult, setEditedResult] = useState<LabelResult | null>(null);

  // Load language
  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
    }
  }, []);

  // Handle file selection (camera or gallery)
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      sendToApi(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function sendToApi(dataUrl: string) {
    setLoading(true);
    setStep("capture");
    setErrorMsg("");
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
        setErrorMsg(data.error || t(lang, "pharmacistMessage"));
        setStep("error");
        setLoading(false);
        return;
      }

      if (data.result) {
        setResult(data.result);
        setEditedResult(data.result);
        setStep("confirm");
      } else {
        setErrorMsg(t(lang, "pharmacistMessage"));
        setStep("error");
      }
    } catch {
      setErrorMsg(t(lang, "pharmacistMessage"));
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  function isUnclear(field: string): boolean {
    return editedResult?.unclear_fields.includes(field) ?? false;
  }

  function updateField<K extends keyof LabelResult>(
    key: K,
    value: LabelResult[K]
  ) {
    if (!editedResult) return;
    setEditedResult({ ...editedResult, [key]: value });
  }

  function handleConfirm() {
    if (!editedResult) return;
    const existing = JSON.parse(
      localStorage.getItem("tpb-medicines") || "[]"
    ) as Array<LabelResult & { id: string; photo: string }>;
    const newEntry = {
      ...editedResult,
      id: crypto.randomUUID(),
      photo: image || "",
    };
    localStorage.setItem(
      "tpb-medicines",
      JSON.stringify([...existing, newEntry])
    );
    router.push("/");
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function renderField<K extends keyof LabelResult>(
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

  // -------------------------------------------------------------------------
  // Capture step
  // -------------------------------------------------------------------------
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

        {/* Photo preview if selected */}
        {image && (
          <div className="w-full max-w-sm overflow-hidden rounded-xl border-2 border-slate-200">
            <img
              src={image}
              alt="Medication label"
              className="w-full object-contain"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="text-lg text-slate-600">{t(lang, "analyzing")}</p>
          </div>
        )}

        {/* Error */}
        {step === "error" && !loading && (
          <div className="w-full max-w-sm rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
            <p className="text-lg font-semibold text-red-700">{errorMsg}</p>
            <button
              onClick={() => {
                setStep("capture");
                setImage(null);
                setErrorMsg("");
              }}
              className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
            >
              {t(lang, "retry")}
            </button>
          </div>
        )}

        {/* Capture buttons */}
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
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
            >
              📷 {t(lang, "takePhoto")}
            </button>
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50"
            >
              🖼️ {t(lang, "uploadPhoto")}
            </button>
          </div>
        )}
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // Confirm step
  // -------------------------------------------------------------------------
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
        {/* Photo + extracted data side by side on larger screens, stacked on mobile */}
        <div className="flex flex-col gap-6">
          {/* Photo */}
          {image && (
            <div className="overflow-hidden rounded-xl border-2 border-slate-200">
              <img
                src={image}
                alt="Medication label"
                className="w-full object-contain"
              />
            </div>
          )}

          {/* Extracted fields */}
          {editedResult && (
            <div className="flex flex-col gap-4">
              {renderField(t(lang, "drugName"), "drug_name", editedResult.drug_name)}
              {renderField(t(lang, "strength"), "strength", editedResult.strength)}
              {renderField(t(lang, "dose"), "dose_per_time", editedResult.dose_per_time)}
              {renderField(
                t(lang, "timesPerDay"),
                "times_per_day",
                editedResult.times_per_day,
                "number"
              )}
              {renderField(
                t(lang, "timeSlots"),
                "time_slots",
                editedResult.time_slots.join(", ")
              )}
              {renderField(t(lang, "food"), "food", editedResult.food)}
              {renderField(
                t(lang, "specialInstructions"),
                "special_instructions",
                editedResult.special_instructions.join("; ")
              )}
              {renderField(
                t(lang, "quantityDispensed"),
                "quantity_dispensed",
                editedResult.quantity_dispensed,
                "number"
              )}
              {renderField(
                t(lang, "dispensedDate"),
                "dispensed_date",
                editedResult.dispensed_date
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleConfirm}
            className="rounded-xl bg-green-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800"
          >
            ✓ {t(lang, "confirm")}
          </button>
          <button
            onClick={() => {
              setStep("capture");
              setImage(null);
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
