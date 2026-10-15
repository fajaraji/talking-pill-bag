import type {
  Medicine,
  DoseLogEntry,
  BPReading,
  BPTarget,
  MissedReasonEntry,
  RedirectedQuestion,
  CachedExplanation,
} from "@/lib/storage";

// ---------------------------------------------------------------------------
// Inline SVG thumbnails as data URLs (pill / box in different colours)
// ---------------------------------------------------------------------------
function svgDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

const pillBlue = svgDataUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect x='12' y='22' width='40' height='20' rx='10' fill='%233b82f6'/></svg>`
);

const pillYellow = svgDataUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect x='12' y='22' width='40' height='20' rx='10' fill='%23f59e0b'/></svg>`
);

const pillOrange = svgDataUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect x='12' y='22' width='40' height='20' rx='10' fill='%23f97316'/></svg>`
);

const capsuleGreen = svgDataUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect x='18' y='14' width='28' height='36' rx='14' fill='%2310b981'/></svg>`
);

// ---------------------------------------------------------------------------
// Demo data generator (pure function taking today's date)
// ---------------------------------------------------------------------------
export interface DemoData {
  profile: { name: string };
  medicines: Medicine[];
  doseLog: DoseLogEntry[];
  missedReasons: MissedReasonEntry[];
  bpReadings: BPReading[];
  bpTarget: BPTarget;
  redirectedQuestions: RedirectedQuestion[];
  explanations: Record<string, CachedExplanation>;
}

function dateMinus(today: string, days: number): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeOnDate(dateStr: string, hour: number, minute: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function generateDemoData(today: string): DemoData {
  const addedOn = dateMinus(today, 14);

  const medicines: Medicine[] = [
    {
      id: "demo-amlodipine",
      readable: true,
      confidence: 0.95,
      drug_name: "Amlodipine",
      strength: "5 mg",
      dose_per_time: "1 tablet",
      times_per_day: 1,
      time_slots: ["morning"],
      food: "after_food",
      special_instructions: [],
      quantity_dispensed: 30,
      dispensed_date: addedOn,
      unclear_fields: [],
      photo: pillBlue,
      addedOn,
    },
    {
      id: "demo-metformin",
      readable: true,
      confidence: 0.95,
      drug_name: "Metformin",
      strength: "500 mg",
      dose_per_time: "1 tablet",
      times_per_day: 2,
      time_slots: ["morning", "evening"],
      food: "with_food",
      special_instructions: [],
      quantity_dispensed: 60,
      dispensed_date: addedOn,
      unclear_fields: [],
      photo: pillYellow,
      addedOn,
    },
    {
      id: "demo-atorvastatin",
      readable: true,
      confidence: 0.95,
      drug_name: "Atorvastatin",
      strength: "20 mg",
      dose_per_time: "1 tablet",
      times_per_day: 1,
      time_slots: ["bedtime"],
      food: "any",
      special_instructions: ["AVOID LARGE AMOUNTS OF GRAPEFRUIT JUICE"],
      quantity_dispensed: 30,
      dispensed_date: addedOn,
      unclear_fields: [],
      photo: pillOrange,
      addedOn,
    },
    {
      id: "demo-omeprazole",
      readable: true,
      confidence: 0.95,
      drug_name: "Omeprazole",
      strength: "20 mg",
      dose_per_time: "1 capsule",
      times_per_day: 1,
      time_slots: ["morning"],
      food: "before_food",
      special_instructions: ["SWALLOW WHOLE. DO NOT CRUSH OR CHEW"],
      quantity_dispensed: 16,
      dispensed_date: addedOn,
      unclear_fields: [],
      photo: capsuleGreen,
      addedOn,
    },
  ];

  const doseLog: DoseLogEntry[] = [];

  // Generate dose log for the last 13 days (exclusive of today) plus today
  for (let i = 13; i >= 0; i--) {
    const date = dateMinus(today, i);

    // Amlodipine morning — always taken (except we keep it realistic)
    if (i > 0 || date === today) {
      doseLog.push({
        medicineId: "demo-amlodipine",
        date,
        slot: "morning",
        takenAt: timeOnDate(date, 8, 5),
      });
    }

    // Metformin morning — always taken
    if (i > 0 || date === today) {
      doseLog.push({
        medicineId: "demo-metformin",
        date,
        slot: "morning",
        takenAt: timeOnDate(date, 8, 10),
      });
    }

    // Metformin evening — missed 3 times in last 7 days (today-6, today-4, today-2)
    const isMetforminEveningMissed =
      i === 6 || i === 4 || i === 2; // missed today-6, today-4, today-2
    if (!isMetforminEveningMissed) {
      if (i > 0 || date === today) {
        // Today evening is pending, so don't add for today
        if (date !== today) {
          doseLog.push({
            medicineId: "demo-metformin",
            date,
            slot: "evening",
            takenAt: timeOnDate(date, 19, 15),
          });
        }
      }
    }

    // Atorvastatin bedtime — always taken (except today is pending)
    if (date !== today) {
      doseLog.push({
        medicineId: "demo-atorvastatin",
        date,
        slot: "bedtime",
        takenAt: timeOnDate(date, 22, 0),
      });
    }

    // Omeprazole morning — missed twice (today-7 and today-3)
    const isOmeprazoleMissed = i === 7 || i === 3;
    if (!isOmeprazoleMissed) {
      if (i > 0 || date === today) {
        doseLog.push({
          medicineId: "demo-omeprazole",
          date,
          slot: "morning",
          takenAt: timeOnDate(date, 7, 45),
        });
      }
    }
  }

  // Missed-dose reasons
  const missedReasons: MissedReasonEntry[] = [
    {
      medicineId: "demo-metformin",
      reason: "sideEffects",
      missedCount: 3,
      recordedOn: dateMinus(today, 2),
    },
  ];

  // BP readings for 14 days
  const bpReadings: BPReading[] = [];
  const bpValues: { sys: number; dia: number; pulse: number }[] = [
    { sys: 142, dia: 88, pulse: 72 },
    { sys: 138, dia: 86, pulse: 70 },
    { sys: 145, dia: 90, pulse: 74 },
    { sys: 136, dia: 84, pulse: 68 },
    { sys: 148, dia: 92, pulse: 76 },
    { sys: 140, dia: 87, pulse: 71 },
    { sys: 135, dia: 85, pulse: 69 },
    { sys: 150, dia: 94, pulse: 78 },
    { sys: 139, dia: 89, pulse: 73 },
    { sys: 144, dia: 91, pulse: 75 },
    { sys: 137, dia: 86, pulse: 70 },
    { sys: 141, dia: 88, pulse: 72 },
    { sys: 182, dia: 116, pulse: 88 }, // 3 days ago
    { sys: 146, dia: 93, pulse: 77 },
  ];

  for (let i = 0; i < 14; i++) {
    const date = dateMinus(today, 13 - i);
    const v = bpValues[i];
    bpReadings.push({
      id: `demo-bp-${i}`,
      date,
      time: "08:30",
      systolic: v.sys,
      diastolic: v.dia,
      pulse: v.pulse,
    });
  }

  const bpTarget: BPTarget = { systolic: 140, diastolic: 90 };

  // Redirected question
  const redirectedQuestions: RedirectedQuestion[] = [
    {
      medicineId: "demo-metformin",
      drugName: "Metformin",
      question: "Can I take METFORMIN at night instead?",
      askedOn: dateMinus(today, 1),
    },
  ];

  // Pre-fill English explanations cache (placeholders — the UI will fetch in background)
  const explanations: Record<string, CachedExplanation> = {};

  return {
    profile: { name: "Mdm Tan" },
    medicines,
    doseLog,
    missedReasons,
    bpReadings,
    bpTarget,
    redirectedQuestions,
    explanations,
  };
}
