import {
  getScheduledDoses,
  findMissedDoses,
  countMissedDosesInLastNDays,
  hasRecentReason,
  getAdherencePrompts,
} from "../lib/adherence.ts";
import type { Medicine } from "../lib/storage.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
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
const medA: Medicine = {
  id: "med-a",
  readable: true,
  confidence: 1,
  drug_name: "Amlodipine",
  strength: "5 mg",
  dose_per_time: "1 tablet",
  times_per_day: 1,
  time_slots: ["morning"],
  food: "after_food",
  special_instructions: [],
  quantity_dispensed: 30,
  dispensed_date: "2026-10-01",
  unclear_fields: [],
  photo: "",
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
assertEqual(findMissedDoses(medA, [], today).length, 3, "all 3 doses missed");

// One taken
const logOne = [{ medicineId: "med-a", date: "2026-10-12", slot: "morning", takenAt: "2026-10-12T08:00:00Z" }];
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
const medB: Medicine = {
  id: "med-b",
  readable: true,
  confidence: 1,
  drug_name: "Panadol",
  strength: "500 mg",
  dose_per_time: "1 tablet",
  times_per_day: 1,
  time_slots: ["morning"],
  food: "any",
  special_instructions: [],
  quantity_dispensed: 20,
  dispensed_date: "2026-10-15",
  unclear_fields: [],
  photo: "",
  addedOn: today,
};
assertEqual(
  getScheduledDoses(medB, today).length,
  0,
  "no scheduled doses when added today"
);

console.log("\nDone.");
