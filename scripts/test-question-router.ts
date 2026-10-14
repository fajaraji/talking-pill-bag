import { routeQuestion } from "../lib/question-router.ts";

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

function assertIncludes(haystack: string, needle: string, label: string) {
  if (!haystack.toLowerCase().includes(needle.toLowerCase())) {
    console.error(`FAIL: ${label}`);
    console.error(`  expected to include: ${needle}`);
    console.error(`  actual: ${haystack}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

function assertNotIncludes(haystack: string, needle: string, label: string) {
  if (haystack.toLowerCase().includes(needle.toLowerCase())) {
    console.error(`FAIL: ${label}`);
    console.error(`  expected NOT to include: ${needle}`);
    console.error(`  actual: ${haystack}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

const today = "2026-10-15";

// ---------------------------------------------------------------------------
// Trap question 1 (EN): stopping medicine
// ---------------------------------------------------------------------------
const q1 = routeQuestion({
  question: "Can I stop this medicine when my blood pressure is normal?",
  medicineId: "med-1",
  drugName: "Amlodipine",
  language: "en",
  today,
});
assertIncludes(q1.reply, "doctor or pharmacist", "q1 EN redirected to doctor");
assertNotIncludes(q1.reply, "yes", "q1 EN no yes answer");
assertNotIncludes(q1.reply, "no", "q1 EN no no answer");
assertEqual(q1.ifMissedQuote, undefined, "q1 EN no if_missed quote");
assertEqual(q1.saveToQuestions.medicineId, "med-1", "q1 EN saved medicineId");

// ---------------------------------------------------------------------------
// Trap question 2 (EN): missed dose + taking extra
// ---------------------------------------------------------------------------
const q2 = routeQuestion({
  question: "Can I take 2 tablets at once if I forgot yesterday?",
  medicineId: "med-1",
  drugName: "Amlodipine",
  language: "en",
  today,
});
assertIncludes(q2.reply, "doctor or pharmacist", "q2 EN redirected to doctor");
assertNotIncludes(q2.reply, "yes", "q2 EN no yes answer");
assertNotIncludes(q2.reply, "no", "q2 EN no no answer");
assertIncludes(
  q2.ifMissedQuote ?? "",
  "missed dose",
  "q2 EN includes if_missed quote"
);
assertEqual(q2.saveToQuestions.question, "Can I take 2 tablets at once if I forgot yesterday?", "q2 EN saved question");

// ---------------------------------------------------------------------------
// Trap question 2 (ID question, EN UI): missed dose in Indonesian with English UI
// must still detect the missed-dose keyword and show the HealthHub quote.
// ---------------------------------------------------------------------------
const q2idEnUI = routeQuestion({
  question: "Boleh minum 2 tablet sekaligus kalau kemarin lupa?",
  medicineId: "med-1",
  drugName: "Amlodipine",
  language: "en",
  today,
});
assertIncludes(q2idEnUI.reply, "doctor or pharmacist", "q2 ID+EN UI redirected to doctor");
assertNotIncludes(q2idEnUI.reply, "yes", "q2 ID+EN UI no yes answer");
assertNotIncludes(q2idEnUI.reply, "no", "q2 ID+EN UI no no answer");
assertIncludes(
  q2idEnUI.ifMissedQuote ?? "",
  "missed dose",
  "q2 ID+EN UI includes if_missed quote"
);

// ---------------------------------------------------------------------------
// Trap question 3 (EN): replacing medicine
// ---------------------------------------------------------------------------
const q3 = routeQuestion({
  question: "Can this medicine be replaced with a cheaper one?",
  medicineId: "med-1",
  drugName: "Amlodipine",
  language: "en",
  today,
});
assertIncludes(q3.reply, "doctor or pharmacist", "q3 EN redirected to doctor");
assertNotIncludes(q3.reply, "yes", "q3 EN no yes answer");
assertNotIncludes(q3.reply, "no", "q3 EN no no answer");
assertEqual(q3.ifMissedQuote, undefined, "q3 EN no if_missed quote");

// ---------------------------------------------------------------------------
// Trap question 1 (ID): stopping medicine
// ---------------------------------------------------------------------------
const q1id = routeQuestion({
  question: "Boleh saya stop obat ini kalau tensi sudah normal?",
  medicineId: "med-1",
  drugName: "Amlodipine",
  language: "id",
  today,
});
assertIncludes(q1id.reply, "dokter atau apoteker", "q1 ID redirected to doctor");
assertNotIncludes(q1id.reply, "boleh", "q1 ID no boleh answer");
assertNotIncludes(q1id.reply, "tidak", "q1 ID no tidak answer");
assertEqual(q1id.ifMissedQuote, undefined, "q1 ID no if_missed quote");

// ---------------------------------------------------------------------------
// Trap question 2 (ID): missed dose
// ---------------------------------------------------------------------------
const q2id = routeQuestion({
  question: "Boleh minum 2 tablet sekaligus kalau kemarin lupa?",
  medicineId: "med-1",
  drugName: "Amlodipine",
  language: "id",
  today,
});
assertIncludes(q2id.reply, "dokter atau apoteker", "q2 ID redirected to doctor");
assertNotIncludes(q2id.reply, "boleh", "q2 ID no boleh answer");
assertNotIncludes(q2id.reply, "tidak", "q2 ID no tidak answer");
assertIncludes(
  q2id.ifMissedQuote ?? "",
  "missed dose",
  "q2 ID includes if_missed quote"
);

// ---------------------------------------------------------------------------
// Trap question 3 (ID): replacing medicine
// ---------------------------------------------------------------------------
const q3id = routeQuestion({
  question: "Obat ini bisa diganti yang lebih murah?",
  medicineId: "med-1",
  drugName: "Amlodipine",
  language: "id",
  today,
});
assertIncludes(q3id.reply, "dokter atau apoteker", "q3 ID redirected to doctor");
assertNotIncludes(q3id.reply, "boleh", "q3 ID no boleh answer");
assertNotIncludes(q3id.reply, "tidak", "q3 ID no tidak answer");
assertEqual(q3id.ifMissedQuote, undefined, "q3 ID no if_missed quote");

// ---------------------------------------------------------------------------
// Unknown medicine → pharmacist sentence
// ---------------------------------------------------------------------------
const qUnknown = routeQuestion({
  question: "Can I stop this medicine?",
  medicineId: "med-x",
  drugName: "UnknownDrug",
  language: "en",
  today,
});
assertIncludes(
  qUnknown.reply,
  "pharmacist",
  "unknown medicine replies with pharmacist sentence"
);
assertEqual(qUnknown.ifMissedQuote, undefined, "unknown medicine no if_missed");
assertEqual(qUnknown.saveToQuestions.drugName, "UnknownDrug", "unknown medicine still saved");

console.log("\nDone.");
