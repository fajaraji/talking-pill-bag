import type { LabelResult } from "@/app/api/read-label/route";
import { getToday, getNow } from "@/lib/clock";

const MEDICINES_KEY = "tpb-medicines";
const DOSE_LOG_KEY = "tpb-dose-log";
const EXPLANATIONS_KEY = "tpb-explanations";
const MISSED_REASONS_KEY = "tpb-missed-reasons";
const BP_LOG_KEY = "tpb-bp-log";
const BP_TARGET_KEY = "tpb-bp-target";
const QUESTIONS_REDIRECTED_KEY = "tpb-questions-redirected";
const QUESTIONS_CUSTOM_KEY = "tpb-questions-custom";
const QUESTIONS_DONE_KEY = "tpb-questions-done";

export interface Medicine extends LabelResult {
  id: string;
  photo: string;
  addedOn?: string; // YYYY-MM-DD
}

export interface DoseLogEntry {
  medicineId: string;
  date: string; // YYYY-MM-DD
  slot: string; // morning | afternoon | evening | bedtime
  takenAt: string; // ISO string
}

// ---------------------------------------------------------------------------
// Medicines
// ---------------------------------------------------------------------------

export function getMedicines(): Medicine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MEDICINES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Medicine[];
    if (!Array.isArray(parsed)) return [];
    let changed = false;
    const migrated = parsed.map((med) => {
      if (!med.addedOn) {
        changed = true;
        return { ...med, addedOn: getToday() };
      }
      return med;
    });
    if (changed) {
      localStorage.setItem(MEDICINES_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveMedicine(medicine: Medicine): void {
  if (typeof window === "undefined") return;
  const existing = getMedicines();
  localStorage.setItem(MEDICINES_KEY, JSON.stringify([...existing, medicine]));
}

export function updateMedicine(medicine: Medicine): void {
  if (typeof window === "undefined") return;
  const existing = getMedicines();
  const idx = existing.findIndex((m) => m.id === medicine.id);
  if (idx === -1) return;
  const updated = [...existing];
  updated[idx] = medicine;
  localStorage.setItem(MEDICINES_KEY, JSON.stringify(updated));
}

export function deleteMedicine(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getMedicines();
  localStorage.setItem(
    MEDICINES_KEY,
    JSON.stringify(existing.filter((m) => m.id !== id))
  );
}

// ---------------------------------------------------------------------------
// Dose log
// ---------------------------------------------------------------------------

export function getDoseLog(): DoseLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DOSE_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DoseLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markDoseTaken(
  medicineId: string,
  date: string,
  slot: string
): DoseLogEntry {
  if (typeof window === "undefined") {
    throw new Error("Cannot mark dose taken on server");
  }
  const entry: DoseLogEntry = {
    medicineId,
    date,
    slot,
    takenAt: getNow().toISOString(),
  };
  const existing = getDoseLog();
  localStorage.setItem(DOSE_LOG_KEY, JSON.stringify([...existing, entry]));
  return entry;
}

export function removeDoseLogEntry(
  medicineId: string,
  date: string,
  slot: string
): void {
  if (typeof window === "undefined") return;
  const existing = getDoseLog();
  localStorage.setItem(
    DOSE_LOG_KEY,
    JSON.stringify(
      existing.filter(
        (e) =>
          !(e.medicineId === medicineId && e.date === date && e.slot === slot)
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Explanation cache (pre-generated per drug + language)
// ---------------------------------------------------------------------------

export interface CachedExplanation {
  text: string;
  known: boolean;
  fallback?: boolean;
}

export function getExplanationCache(): Record<string, CachedExplanation> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EXPLANATIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedExplanation>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function setExplanationCache(
  key: string,
  value: CachedExplanation
): void {
  if (typeof window === "undefined") return;
  const existing = getExplanationCache();
  existing[key] = value;
  localStorage.setItem(EXPLANATIONS_KEY, JSON.stringify(existing));
}

// ---------------------------------------------------------------------------
// Missed-dose reasons
// ---------------------------------------------------------------------------

export interface MissedReasonEntry {
  medicineId: string;
  reason: string;
  missedCount: number;
  recordedOn: string; // YYYY-MM-DD
}

export function getMissedReasons(): MissedReasonEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MISSED_REASONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MissedReasonEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMissedReason(entry: MissedReasonEntry): void {
  if (typeof window === "undefined") return;
  const existing = getMissedReasons();
  localStorage.setItem(MISSED_REASONS_KEY, JSON.stringify([...existing, entry]));
}

// ---------------------------------------------------------------------------
// Blood pressure readings
// ---------------------------------------------------------------------------

export interface BPReading {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  systolic: number;
  diastolic: number;
  pulse: number | null;
}

export interface BPTarget {
  systolic: number;
  diastolic: number;
}

export function getBPReadings(): BPReading[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BP_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BPReading[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBPReading(reading: BPReading): void {
  if (typeof window === "undefined") return;
  const existing = getBPReadings();
  localStorage.setItem(BP_LOG_KEY, JSON.stringify([...existing, reading]));
}

export function deleteBPReading(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getBPReadings();
  localStorage.setItem(
    BP_LOG_KEY,
    JSON.stringify(existing.filter((r) => r.id !== id))
  );
}

export function getBPTarget(): BPTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BP_TARGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BPTarget;
    if (
      typeof parsed.systolic === "number" &&
      typeof parsed.diastolic === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setBPTarget(target: BPTarget): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BP_TARGET_KEY, JSON.stringify(target));
}

export function clearBPTarget(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BP_TARGET_KEY);
}

// ---------------------------------------------------------------------------
// Redirected questions (for doctor/pharmacist)
// ---------------------------------------------------------------------------

export interface RedirectedQuestion {
  medicineId: string;
  drugName: string;
  question: string;
  askedOn: string; // YYYY-MM-DD
  // Legacy fields kept for backward compatibility
  date?: string;
}

export function getRedirectedQuestions(): RedirectedQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUESTIONS_REDIRECTED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RedirectedQuestion[];
    if (!Array.isArray(parsed)) return [];
    // Migrate legacy entries (question + date) to new format
    return parsed.map((q) => ({
      medicineId: q.medicineId ?? "unknown",
      drugName: q.drugName ?? q.question.split(" ")[0] ?? "Unknown",
      question: q.question,
      askedOn: q.askedOn ?? q.date ?? getToday(),
    }));
  } catch {
    return [];
  }
}

export function saveRedirectedQuestion(entry: RedirectedQuestion): void {
  if (typeof window === "undefined") return;
  const existing = getRedirectedQuestions();
  localStorage.setItem(QUESTIONS_REDIRECTED_KEY, JSON.stringify([...existing, entry]));
}

// ---------------------------------------------------------------------------
// Custom questions (user-added)
// ---------------------------------------------------------------------------

export interface CustomQuestion {
  id: string;
  text: string;
  addedOn: string; // YYYY-MM-DD
}

export function getCustomQuestions(): CustomQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUESTIONS_CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomQuestion(entry: CustomQuestion): void {
  if (typeof window === "undefined") return;
  const existing = getCustomQuestions();
  localStorage.setItem(QUESTIONS_CUSTOM_KEY, JSON.stringify([...existing, entry]));
}

export function deleteCustomQuestion(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getCustomQuestions();
  localStorage.setItem(QUESTIONS_CUSTOM_KEY, JSON.stringify(existing.filter((q) => q.id !== id)));
}

// ---------------------------------------------------------------------------
// Done questions (checked off by user)
// ---------------------------------------------------------------------------

export function getDoneQuestionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUESTIONS_DONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleDoneQuestion(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getDoneQuestionIds();
  const idx = existing.indexOf(id);
  if (idx >= 0) {
    existing.splice(idx, 1);
  } else {
    existing.push(id);
  }
  localStorage.setItem(QUESTIONS_DONE_KEY, JSON.stringify(existing));
}
