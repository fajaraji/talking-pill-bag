import type { Medicine, DoseLogEntry } from "@/lib/storage";

/**
 * Parse units per dose from dose_per_time string.
 * "ONE"/"1" -> 1, "TWO"/"2" -> 2, "HALF"/"1/2" -> 0.5; unknown -> 1.
 */
export function parseUnitsPerDose(dosePerTime: string): number {
  const normalized = dosePerTime.trim().toUpperCase();
  // Check for fraction first
  if (normalized.startsWith("1/2") || normalized.startsWith("HALF")) {
    return 0.5;
  }
  // Check for word numbers
  if (normalized.startsWith("ONE") || /^1\D/.test(normalized) || normalized === "1") {
    return 1;
  }
  if (normalized.startsWith("TWO") || /^2\D/.test(normalized) || normalized === "2") {
    return 2;
  }
  if (normalized.startsWith("THREE") || /^3\D/.test(normalized) || normalized === "3") {
    return 3;
  }
  // Try extracting a leading decimal/integer
  const match = normalized.match(/^(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    if (Number.isFinite(val) && val > 0) return val;
  }
  return 1;
}

/**
 * Count how many doses of this medicine were taken from addedOn up to and including upToDate.
 */
export function countTakenDoses(
  medicine: Medicine,
  doseLog: DoseLogEntry[],
  upToDate: string
): number {
  const addedOn = medicine.addedOn;
  if (!addedOn) return 0;
  return doseLog.filter(
    (e) =>
      e.medicineId === medicine.id &&
      e.date >= addedOn &&
      e.date <= upToDate
  ).length;
}

/**
 * Units used = taken doses x units per dose since addedOn.
 */
export function getUnitsUsed(
  medicine: Medicine,
  doseLog: DoseLogEntry[],
  upToDate: string
): number {
  const unitsPerDose = parseUnitsPerDose(medicine.dose_per_time);
  const taken = countTakenDoses(medicine, doseLog, upToDate);
  return taken * unitsPerDose;
}

/**
 * Remaining = quantity_dispensed - units used (never below 0).
 */
export function getRemaining(
  medicine: Medicine,
  doseLog: DoseLogEntry[],
  upToDate: string
): number {
  const used = getUnitsUsed(medicine, doseLog, upToDate);
  return Math.max(0, medicine.quantity_dispensed - used);
}

/**
 * Days left = floor(remaining / (units per dose x number of time_slots)).
 * If quantity_dispensed is 0 or time_slots is empty, returns null (unknown).
 */
export function getDaysLeft(
  medicine: Medicine,
  doseLog: DoseLogEntry[],
  upToDate: string
): number | null {
  if (medicine.quantity_dispensed === 0 || medicine.time_slots.length === 0) {
    return null;
  }
  const unitsPerDose = parseUnitsPerDose(medicine.dose_per_time);
  const dailyUse = unitsPerDose * medicine.time_slots.length;
  if (dailyUse <= 0) return null;
  const remaining = getRemaining(medicine, doseLog, upToDate);
  return Math.floor(remaining / dailyUse);
}
