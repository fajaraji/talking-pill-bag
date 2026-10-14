"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import type { LabelResult } from "@/app/api/read-label/route";
import { saveMedicine } from "@/lib/storage";

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

// ---------------------------------------------------------------------------
// Browser-side image resize: max 1280px longest side, JPEG quality 0.8
// Returns { full: dataUrl, mime: string }
// ---------------------------------------------------------------------------
async function resizeImage(
  file: File,
  maxDimension: number,
  quality: number
): Promise<{ dataUrl: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ dataUrl, mime: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Create a thumbnail (max 320px) for localStorage
// ---------------------------------------------------------------------------
async function createThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxDim = 320;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => reject(new Error("Failed to load image for thumbnail"));
    img.src = dataUrl;
  });
}

export default function AddMedicinePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [step, setStep] = useState<Step>("capture");
  const [image, setImage] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LabelResult | null>(null);
  const [editedResult, setEditedResult] = useState<LabelResult | null>(null);
  const [isRejected, setIsRejected] = useState(false);

  // Load language
  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
    }
  }, []);

  // Handle file selection (camera or gallery)
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    e.target.value = "";

    try {
      // Resize to max 1280px, JPEG quality 0.8
      const resized = await resizeImage(file, 1280, 0.8);
      setImage(resized.dataUrl);

      // Create thumbnail for localStorage
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
        // 422 with rejected=true -> pharmacist message
        // anything else -> generic error
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

  function handleConfirm() {
    if (!editedResult || !thumbnail) return;
    const newEntry = {
      ...editedResult,
      id: crypto.randomUUID(),
      photo: thumbnail,
    };
    saveMedicine(newEntry);
    router.push("/today");
  }

  // Restore capture attribute so "Take photo" always opens camera
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

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Capture / Error step
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
            <p className="text-lg font-semibold text-red-700">
              {isRejected
                ? t(lang, "pharmacistMessage")
                : t(lang, "genericError")}
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
            {renderTextField(t(lang, "drugName"), "drug_name", editedResult.drug_name)}
            {renderTextField(t(lang, "strength"), "strength", editedResult.strength)}
            {renderTextField(t(lang, "dose"), "dose_per_time", editedResult.dose_per_time)}
            {renderTextField(
              t(lang, "timesPerDay"),
              "times_per_day",
              editedResult.times_per_day,
              "number"
            )}

            {/* Time slots: four checkboxes */}
            <div className="flex flex-col gap-2">
              <label
                className={`text-base font-semibold ${
                  isUnclear("time_slots") ? "text-red-600" : "text-slate-700"
                }`}
              >
                {t(lang, "timeSlots")}
                {isUnclear("time_slots") && (
                  <span className="ml-2 text-sm font-normal text-red-500">
                    ({t(lang, "unclearFields")})
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOT_OPTIONS.map((opt) => {
                  const checked = editedResult.time_slots.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-3 text-lg ${
                        checked
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const slots = new Set(editedResult.time_slots);
                          if (e.target.checked) slots.add(opt.value);
                          else slots.delete(opt.value);
                          updateField(
                            "time_slots",
                            Array.from(slots) as LabelResult["time_slots"]
                          );
                        }}
                        className="h-5 w-5"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Food: select dropdown */}
            <div className="flex flex-col gap-1">
              <label
                className={`text-base font-semibold ${
                  isUnclear("food") ? "text-red-600" : "text-slate-700"
                }`}
              >
                {t(lang, "food")}
                {isUnclear("food") && (
                  <span className="ml-2 text-sm font-normal text-red-500">
                    ({t(lang, "unclearFields")})
                  </span>
                )}
              </label>
              <select
                value={editedResult.food}
                onChange={(e) =>
                  updateField("food", e.target.value as LabelResult["food"])
                }
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

            {/* Special instructions: textarea, one per line -> array */}
            <div className="flex flex-col gap-1">
              <label
                className={`text-base font-semibold ${
                  isUnclear("special_instructions")
                    ? "text-red-600"
                    : "text-slate-700"
                }`}
              >
                {t(lang, "specialInstructions")}
                {isUnclear("special_instructions") && (
                  <span className="ml-2 text-sm font-normal text-red-500">
                    ({t(lang, "unclearFields")})
                  </span>
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

            {renderTextField(
              t(lang, "quantityDispensed"),
              "quantity_dispensed",
              editedResult.quantity_dispensed,
              "number"
            )}
            {renderTextField(
              t(lang, "dispensedDate"),
              "dispensed_date",
              editedResult.dispensed_date
            )}
          </div>
        )}

        {/* Action buttons */}
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
