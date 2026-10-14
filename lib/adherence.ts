import type { Medicine, DoseLogEntry, MissedReasonEntry } from "@/lib/storage";

export interface MissedDose {
  medicineId: string;
  date: string;
  slot: string;
}

/**
 * Generate all scheduled doses for a medicine from addedOn up to (but not including) today.
 * Returns an array of { medicineId, date, slot }.
 */
export function getScheduledDoses(
  medicine: Medicine,
  today: string
): MissedDose[] {
  const addedOn = medicine.addedOn;
  if (!addedOn) return [];
  if (medicine.time_slots.length === 0) return [];
  if (addedOn >= today) return [];

  const doses: MissedDose[] = [];
  const start = new Date(addedOn + "T00:00:00");
  const end = new Date(today + "T00:00:00");

  for (
    let d = new Date(start);
    d < end;
    d.setDate(d.getDate() + 1)
  ) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    for (const slot of medicine.time_slots) {
      doses.push({ medicineId: medicine.id, date: dateStr, slot });
    }
  }
  return doses;
}

/**
 * Find missed doses: scheduled doses with no matching dose-log entry.
 */
export function findMissedDoses(
  medicine: Medicine,
  doseLog: DoseLogEntry[],
  today: string
): MissedDose[] {
  const scheduled = getScheduledDoses(medicine, today);
  return scheduled.filter(
    (s) =>
      !doseLog.some(
        (e) =>
          e.medicineId === s.medicineId &&
          e.date === s.date &&
          e.slot === s.slot
      )
  );
}

/**
 * Count missed doses in the last N days (from today, exclusive).
 */
export function countMissedDosesInLastNDays(
  medicine: Medicine,
  doseLog: DoseLogEntry[],
  today: string,
  n: number
): number {
  const missed = findMissedDoses(medicine, doseLog, today);
  const cutoff = new Date(today + "T00:00:00");
  cutoff.setDate(cutoff.getDate() - n);
  const cutoffStr = `${cutoff.getFullYear()}-${String(
    cutoff.getMonth() + 1
  ).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
  return missed.filter((m) => m.date >= cutoffStr).length;
}

/**
 * Check whether a reason was recorded for a medicine in the last N days.
 */
export function hasRecentReason(
  medicineId: string,
  reasons: MissedReasonEntry[],
  today: string,
  n: number
): boolean {
  const cutoff = new Date(today + "T00:00:00");
  cutoff.setDate(cutoff.getDate() - n);
  const cutoffStr = `${cutoff.getFullYear()}-${String(
    cutoff.getMonth() + 1
  ).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
  return reasons.some(
    (r) => r.medicineId === medicineId && r.recordedOn >= cutoffStr
  );
}

/**
 * Return medicines that need an adherence prompt:
 * >= 2 missed doses in last 7 days and no reason recorded in last 7 days.
 */
export function getAdherencePrompts(
  medicines: Medicine[],
  doseLog: DoseLogEntry[],
  reasons: MissedReasonEntry[],
  today: string
): Array<{ medicine: Medicine; missedCount: number }> {
  const prompts: Array<{ medicine: Medicine; missedCount: number }> = [];
  for (const med of medicines) {
    const missedCount = countMissedDosesInLastNDays(med, doseLog, today, 7);
    if (missedCount >= 2 && !hasRecentReason(med.id, reasons, today, 7)) {
      prompts.push({ medicine: med, missedCount });
    }
  }
  return prompts;
}
