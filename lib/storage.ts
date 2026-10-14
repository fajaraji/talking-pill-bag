import type { LabelResult } from "@/app/api/read-label/route";
import { getToday, getNow } from "@/lib/clock";

const MEDICINES_KEY = "tpb-medicines";
const DOSE_LOG_KEY = "tpb-dose-log";
const EXPLANATIONS_KEY = "tpb-explanations";
const MISSED_REASONS_KEY = "tpb-missed-reasons";

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
  sourceUrl: string;
  sourceTitle: string;
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
