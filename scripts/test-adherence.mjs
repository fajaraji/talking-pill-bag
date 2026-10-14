// Minimal test for adherence logic (pure functions, no Next.js imports).
// Copy of lib/adherence.ts logic in plain JS.

function getScheduledDoses(medicine, today) {
  const addedOn = medicine.addedOn;
  if (!addedOn) return [];
  if (medicine.time_slots.length === 0) return [];
  if (addedOn >= today) return [];

  const doses = [];
  const start = new Date(addedOn + "T00:00:00");
  const end = new Date(today + "T00:00:00");

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
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

function findMissedDoses(medicine, doseLog, today) {
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

function countMissedDosesInLastNDays(medicine, doseLog, today, n) {
  const missed = findMissedDoses(medicine, doseLog, today);
  const cutoff = new Date(today + "T00:00:00");
  cutoff.setDate(cutoff.getDate() - n);
  const cutoffStr = `${cutoff.getFullYear()}-${String(
    cutoff.getMonth() + 1
  ).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
  return missed.filter((m) => m.date >= cutoffStr).length;
}

function hasRecentReason(medicineId, reasons, today, n) {
  const cutoff = new Date(today + "T00:00:00");
  cutoff.setDate(cutoff.getDate() - n);
  const cutoffStr = `${cutoff.getFullYear()}-${String(
    cutoff.getMonth() + 1
  ).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
  return reasons.some(
    (r) => r.medicineId === medicineId && r.recordedOn >= cutoffStr
  );
}

function getAdherencePrompts(medicines, doseLog, reasons, today) {
  const prompts = [];
  for (const med of medicines) {
    const missedCount = countMissedDosesInLastNDays(med, doseLog, today, 7);
    if (missedCount >= 2 && !hasRecentReason(med.id, reasons, today, 7)) {
      prompts.push({ medicine: med, missedCount });
    }
  }
  return prompts;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function assertEqual(actual, expected, label) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    console.error(`FAIL: ${label}`);
    console.error(`  expected: ${expectedStr}`);
    console.error(`  actual:   ${actualStr}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// Medicine added 3 days ago, morning slot, no doses taken
const medA = {
  id: "med-a",
  drug_name: "Amlodipine",
  time_slots: ["morning"],
  addedOn: "2026-10-12",
};
const today = "2026-10-15";

// Scheduled doses: 12, 13, 14 = 3 doses
assertEqual(
  getScheduledDoses(medA, today).length,
  3,
  "scheduled doses for 3 days"
);

// All missed
assertEqual(
  findMissedDoses(medA, [], today).length,
  3,
  "all 3 doses missed"
);

// One taken
const logOne = [{ medicineId: "med-a", date: "2026-10-12", slot: "morning" }];
assertEqual(
  findMissedDoses(medA, logOne, today).length,
  2,
  "2 doses missed after taking one"
);

// Count in last 7 days
assertEqual(
  countMissedDosesInLastNDays(medA, [], today, 7),
  3,
  "3 missed in last 7 days"
);

// Adherence prompt: >=2 missed and no reason
const prompts = getAdherencePrompts([medA], [], [], today);
assertEqual(prompts.length, 1, "one adherence prompt");
assertEqual(prompts[0].missedCount, 3, "prompt shows 3 missed");

// With reason recorded recently -> no prompt
const reasons = [
  { medicineId: "med-a", reason: "forgot", missedCount: 3, recordedOn: "2026-10-14" },
];
const promptsAfterReason = getAdherencePrompts([medA], [], reasons, today);
assertEqual(promptsAfterReason.length, 0, "no prompt after reason recorded");

// Medicine added today -> no scheduled doses before today
const medB = { id: "med-b", drug_name: "Panadol", time_slots: ["morning"], addedOn: today };
assertEqual(
  getScheduledDoses(medB, today).length,
  0,
  "no scheduled doses when added today"
);

console.log("\nDone.");
