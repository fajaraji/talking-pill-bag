import {
  applyDateGuard,
  isPlausibleDispensedDate,
  isValidYmd,
  normaliseLabelOutput,
  parseModelJson,
} from "../lib/label-normalise.ts";

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

// ---------------------------------------------------------------------------
// parseModelJson
// ---------------------------------------------------------------------------
assertEqual(parseModelJson('{"a":1}'), { a: 1 }, "parse plain JSON");
assertEqual(
  parseModelJson('```json\n{"a":1}\n```'),
  { a: 1 },
  "parse JSON inside markdown fence"
);
assertEqual(
  parseModelJson('Here is the result:\n{"a":1}\nThanks'),
  { a: 1 },
  "parse JSON surrounded by prose"
);
assertEqual(parseModelJson("not json at all"), null, "reject non-JSON text");
assertEqual(parseModelJson(""), null, "reject empty string");

// ---------------------------------------------------------------------------
// normaliseLabelOutput
// ---------------------------------------------------------------------------
const messy = normaliseLabelOutput({
  readable: true,
  confidence: "0.9",
  drug_name: "  Nifedipine  ",
  strength: null,
  dose_per_time: "1 tablet",
  times_per_day: "1 time daily",
  time_slots: ["MORNING", " bedtime "],
  food: "AFTER_FOOD",
  special_instructions: null,
  quantity_dispensed: "30 TAB",
  dispensed_date: "2026-08-10",
  unclear_fields: null,
});

assertEqual(messy.readable, true, "readable kept as boolean");
assertEqual(messy.confidence, 0.9, "confidence parsed from string");
assertEqual(messy.drug_name, "Nifedipine", "drug_name trimmed");
assertEqual(messy.strength, "", "null string becomes empty string");
assertEqual(messy.times_per_day, 1, "times_per_day parsed from '1 time daily'");
assertEqual(messy.time_slots, ["morning", "bedtime"], "time_slots lower-cased and trimmed");
assertEqual(messy.food, "after_food", "food lower-cased");
assertEqual(messy.special_instructions, [], "null array becomes empty array");
assertEqual(messy.quantity_dispensed, 30, "quantity '30 TAB' becomes 30");
assertEqual(messy.unclear_fields, [], "null unclear_fields becomes empty array");

// Missing keys must stay missing so zod fails and the route can retry.
const missing = normaliseLabelOutput({ readable: true, confidence: 0.9 });
assertEqual("drug_name" in missing, false, "missing keys are not invented");
assertEqual("time_slots" in missing, false, "missing arrays are not invented");

// Uninterpretable readability/confidence discards the whole object.
assertEqual(normaliseLabelOutput({ readable: "maybe", confidence: 0.9 }), {}, "bad readable discards object");
assertEqual(normaliseLabelOutput({ readable: true, confidence: "high" }), {}, "bad confidence discards object");
assertEqual(normaliseLabelOutput("not an object"), {}, "non-object discards object");
assertEqual(normaliseLabelOutput(null), {}, "null discards object");

// Confidence is clamped into 0..1.
assertEqual(
  normaliseLabelOutput({ readable: true, confidence: 5 }).confidence,
  1,
  "confidence above 1 is clamped"
);

// ---------------------------------------------------------------------------
// Date validation helpers
// ---------------------------------------------------------------------------
assertEqual(isValidYmd("2026-08-10"), true, "valid calendar date");
assertEqual(isValidYmd("2026-02-30"), false, "impossible calendar date rejected");
assertEqual(isValidYmd("10/08/2026"), false, "DD/MM/YYYY rejected");
assertEqual(isValidYmd("10/08"), false, "date with no year rejected");

const today = "2026-10-16";
assertEqual(isPlausibleDispensedDate("2026-08-10", today), true, "recent date is plausible");
assertEqual(isPlausibleDispensedDate("2021-08-10", today), false, "year 2021 rejected (too old)");
assertEqual(isPlausibleDispensedDate("2027-01-01", today), false, "future date rejected");
assertEqual(isPlausibleDispensedDate("10/08", today), false, "cut-off date rejected");
assertEqual(isPlausibleDispensedDate("2024-10-16", today), true, "exactly two years ago is plausible");
assertEqual(isPlausibleDispensedDate("2024-10-15", today), false, "just over two years ago rejected");

// ---------------------------------------------------------------------------
// applyDateGuard
// ---------------------------------------------------------------------------
function guard(dispensed_date: string, unclear_fields: string[] = []) {
  return applyDateGuard({ dispensed_date, unclear_fields }, today);
}

assertEqual(
  guard("2026-08-10"),
  { dispensed_date: "2026-08-10", unclear_fields: [] },
  "valid date kept unchanged"
);
assertEqual(
  guard("2021-08-10"),
  { dispensed_date: "", unclear_fields: ["dispensed_date"] },
  "hallucinated old year cleared and flagged"
);
assertEqual(
  guard("2027-01-01"),
  { dispensed_date: "", unclear_fields: ["dispensed_date"] },
  "future date cleared and flagged"
);
assertEqual(
  guard("10/08"),
  { dispensed_date: "", unclear_fields: ["dispensed_date"] },
  "date with cut-off year cleared and flagged"
);
assertEqual(
  guard("2026-02-30"),
  { dispensed_date: "", unclear_fields: ["dispensed_date"] },
  "impossible date cleared and flagged"
);
assertEqual(
  guard("", ["strength"]),
  { dispensed_date: "", unclear_fields: ["strength", "dispensed_date"] },
  "empty date flagged without losing other unclear fields"
);
assertEqual(
  guard("2021-08-10", ["dispensed_date"]),
  { dispensed_date: "", unclear_fields: ["dispensed_date"] },
  "unclear field not duplicated"
);

console.log("\nDone.");
