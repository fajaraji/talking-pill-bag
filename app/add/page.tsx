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
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CameraIcon, UploadIcon, AlertIcon } from "@/components/icons";

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
        fallback?: boolean;
      };
      setExplanationCache(cacheKey, {
        text: data.text,
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
            unclear ? "text-danger-text" : "text-ink"
          }`}
        >
          {label}
          {unclear && (
            <span className="ml-2 text-sm font-normal text-danger-text">
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
          className={`rounded-xl border px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            unclear
              ? "border-danger-border bg-danger-bg text-danger-text"
              : "border-line bg-white text-ink"
          }`}
        />
      </div>
    );
  }

  if (step === "capture" || step === "error") {
    return (
      <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
        <div className="flex w-full max-w-sm flex-col gap-2 self-center">
          <AppHeader
            title={t(lang, "addMedicine")}
            back={{ label: t(lang, "back"), onClick: () => router.push("/") }}
          />
        </div>

        {image && (
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line self-center">
            <img src={image} alt="Medication label" className="w-full object-contain" />
          </div>
        )}

        {loading && (
          <div className="flex w-full max-w-sm flex-col items-center gap-3 self-center py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-primary" />
            <p className="text-lg text-muted">{t(lang, "analyzing")}</p>
          </div>
        )}

        {step === "error" && !loading && (
          <Card className="w-full max-w-sm self-center text-center">
            <p className="flex items-start justify-center gap-2 text-lg font-semibold text-danger-text">
              <AlertIcon className="h-6 w-6 shrink-0" />
              {isRejected ? t(lang, "pharmacistMessage") : t(lang, "genericError")}
            </p>
            <Button
              variant="primary"
              className="mt-4 w-full"
              onClick={() => {
                setStep("capture");
                setImage(null);
                setThumbnail(null);
                setIsRejected(false);
              }}
            >
              {t(lang, "retry")}
            </Button>
          </Card>
        )}

        {!loading && step !== "error" && (
          <div className="flex w-full max-w-sm flex-col gap-4 self-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="primary" className="w-full" onClick={openCamera}>
              <CameraIcon className="h-5 w-5" />
              {t(lang, "takePhoto")}
            </Button>
            <Button variant="secondary" className="w-full" onClick={openGallery}>
              <UploadIcon className="h-5 w-5" />
              {t(lang, "uploadPhoto")}
            </Button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
      <div className="flex w-full max-w-sm flex-col gap-2 self-center">
        <AppHeader
          title={t(lang, "addMedicine")}
          back={{ label: t(lang, "back"), onClick: () => router.push("/") }}
        />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6 self-center">
        {image && (
          <div className="overflow-hidden rounded-xl border border-line">
            <img src={image} alt="Medication label" className="w-full object-contain" />
          </div>
        )}

        {editedResult && (
          <Card className="flex flex-col gap-4">
            {renderTextField(t(lang, "drugName"), "drug_name", editedResult.drug_name)}
            {renderTextField(t(lang, "strength"), "strength", editedResult.strength)}
            {renderTextField(t(lang, "dose"), "dose_per_time", editedResult.dose_per_time)}
            {renderTextField(t(lang, "timesPerDay"), "times_per_day", editedResult.times_per_day, "number")}

            <div className="flex flex-col gap-2">
              <label className={`text-base font-semibold ${isUnclear("time_slots") ? "text-danger-text" : "text-ink"}`}>
                {t(lang, "timeSlots")}
                {isUnclear("time_slots") && (
                  <span className="ml-2 text-sm font-normal text-danger-text">({t(lang, "unclearFields")})</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOT_OPTIONS.map((opt) => {
                  const checked = editedResult.time_slots.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-lg ${
                        checked ? "border-primary bg-primary/5" : "border-line bg-white"
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
              <label className={`text-base font-semibold ${isUnclear("food") ? "text-danger-text" : "text-ink"}`}>
                {t(lang, "food")}
                {isUnclear("food") && (
                  <span className="ml-2 text-sm font-normal text-danger-text">({t(lang, "unclearFields")})</span>
                )}
              </label>
              <select
                value={editedResult.food}
                onChange={(e) => updateField("food", e.target.value as LabelResult["food"])}
                className={`rounded-xl border px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isUnclear("food")
                    ? "border-danger-border bg-danger-bg text-danger-text"
                    : "border-line bg-white text-ink"
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
              <label className={`text-base font-semibold ${isUnclear("special_instructions") ? "text-danger-text" : "text-ink"}`}>
                {t(lang, "specialInstructions")}
                {isUnclear("special_instructions") && (
                  <span className="ml-2 text-sm font-normal text-danger-text">({t(lang, "unclearFields")})</span>
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
                className={`rounded-xl border px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isUnclear("special_instructions")
                    ? "border-danger-border bg-danger-bg text-danger-text"
                    : "border-line bg-white text-ink"
                }`}
              />
            </div>

            {renderTextField(t(lang, "quantityDispensed"), "quantity_dispensed", editedResult.quantity_dispensed, "number")}
            {renderTextField(t(lang, "dispensedDate"), "dispensed_date", editedResult.dispensed_date)}
          </Card>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button variant="success" className="w-full" onClick={handleConfirm}>
            {t(lang, "confirm")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setStep("capture");
              setImage(null);
              setThumbnail(null);
              setResult(null);
              setEditedResult(null);
            }}
          >
            {t(lang, "retry")}
          </Button>
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
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-primary" />
          <p className="text-lg text-muted">Loading…</p>
        </main>
      }
    >
      <AddMedicinePageInner />
    </Suspense>
  );
}
