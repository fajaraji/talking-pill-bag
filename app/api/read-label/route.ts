import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  FOOD_VALUES,
  TIME_SLOTS,
  applyDateGuard,
  normaliseLabelOutput,
  parseModelJson,
} from "@/lib/label-normalise";

// ---------------------------------------------------------------------------
// Zod schema for LLM output validation (SPEC section 7)
// The prompt forces these enums; zod rejects anything else.
// ---------------------------------------------------------------------------
const foodEnum = z.enum(FOOD_VALUES);
const timeSlotEnum = z.enum(TIME_SLOTS);

const labelResultSchema = z.object({
  readable: z.boolean(),
  confidence: z.number().min(0).max(1),
  drug_name: z.string(),
  strength: z.string(),
  dose_per_time: z.string(),
  times_per_day: z.number().int().min(0),
  time_slots: z.array(timeSlotEnum),
  food: foodEnum,
  special_instructions: z.array(z.string()),
  quantity_dispensed: z.number().int().min(0),
  dispensed_date: z.string(),
  unclear_fields: z.array(z.string()),
});

export type LabelResult = z.infer<typeof labelResultSchema>;

// ---------------------------------------------------------------------------
// Rejection rules (SPEC section 7):
// - readable === false
// - confidence < 0.7
// - drug_name is empty (after trimming)
// Anything else is a readable label and must not be rejected.
// ---------------------------------------------------------------------------
function isRejected(result: LabelResult): boolean {
  if (!result.readable) return true;
  if (result.confidence < 0.7) return true;
  if (result.drug_name.trim().length === 0) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Server-side post-checks:
// - If times_per_day > 0 but time_slots is empty or length mismatch,
//   add "time_slots" to unclear_fields.
// ---------------------------------------------------------------------------
function applyPostChecks(result: LabelResult): LabelResult {
  const unclear = new Set(result.unclear_fields);
  if (
    result.times_per_day > 0 &&
    (result.time_slots.length === 0 ||
      result.time_slots.length !== result.times_per_day)
  ) {
    unclear.add("time_slots");
  }
  return {
    ...result,
    unclear_fields: Array.from(unclear),
  };
}

// ---------------------------------------------------------------------------
// Prompt sent to the vision model.
// Forces the food and time_slots enums, forbids guessing dates/quantities, and
// tells the model that labels may be in English, Chinese, Malay or Indonesian.
// ---------------------------------------------------------------------------
function buildSystemPrompt(): string {
  return `You are a medication label reader. Analyze the image of a medication label and return ONLY a JSON object with this exact shape:

{
  "readable": boolean,
  "confidence": number (0.0 to 1.0),
  "drug_name": string,
  "strength": string,
  "dose_per_time": string,
  "times_per_day": integer,
  "time_slots": ["morning" | "afternoon" | "evening" | "bedtime"],
  "food": "after_food" | "before_food" | "with_food" | "any",
  "special_instructions": [string],
  "quantity_dispensed": integer,
  "dispensed_date": "YYYY-MM-DD",
  "unclear_fields": [string]
}

RULES:
1. If the label is blurry, unreadable, or no medication label is visible, set readable=false, confidence=0.0, and leave other fields empty strings / zero / empty arrays.
2. confidence must reflect your certainty that ALL extracted fields are correct.
3. drug_name must be the generic name when visible; do not guess if unclear.
4. time_slots must ONLY use the four values: "morning", "afternoon", "evening", "bedtime".
5. food must ONLY be one of: "after_food", "before_food", "with_food", "any".
6. Put any field you are uncertain about into unclear_fields (use the exact JSON key name, e.g. "strength").
7. Do NOT add any keys outside the schema. Do NOT include markdown formatting.

NEVER GUESS (very important):
- Never guess, infer or complete any part of a date. If the day, month or year is cut off, covered, blurred or missing, return "" for dispensed_date and add "dispensed_date" to unclear_fields. Do not fill in a plausible year.
- Never guess quantity_dispensed. If the number is not clearly printed, return 0 and add "quantity_dispensed" to unclear_fields.
- Never guess strength. If the strength (e.g. "30 mg") is not clearly printed, return "" and add "strength" to unclear_fields.
- It is always better to return an empty value and mark the field unclear than to invent a value.

DATE FORMAT:
- Singapore labels use DD/MM/YYYY (e.g. "01/10/2026" means 2026-10-01).
- Convert a FULLY visible date to YYYY-MM-DD in the output.
- If any part of the date is not clearly visible (for example the year is covered by another object), return "" and add "dispensed_date" to unclear_fields.

LANGUAGE:
- The label may be printed in English, Chinese, Malay or Indonesian. Read it in whichever language it uses.
- Examples: "TAKE 1 TABLET ONCE EVERY MORNING", "Minum 1 tablet setiap pagi sesudah makan", "每日早上服一片".
- Always output the enum values (time_slots and food) in ENGLISH, regardless of the label language.
- Output drug_name exactly as printed. If a Latin-script generic name is printed, use that (e.g. "NIFEDIPINE LA 30MG" -> drug_name "Nifedipine", strength "30 mg").`;
}

// ---------------------------------------------------------------------------
// One vision-model call. Returns the raw message content, or null on any
// service-level failure (network error, non-OK response, empty content).
// ---------------------------------------------------------------------------
async function requestModel(
  base64Data: string,
  baseUrl: string,
  apiKey: string,
  visionModel: string
): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[read-label] LLM request failed: ${response.status} ${text}`);
      return null;
    }

    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[read-label] LLM returned empty content");
      return null;
    }
    return content;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[read-label] LLM request threw: ${message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/read-label
// Body: { image: string } where image is a base64 data URL or raw base64.
//
// Status codes:
// - 200 with { result }            → label read
// - 422 with { rejected: true }    → unreadable label (ask pharmacist)
// - 503 with { retryable: true }   → model/service problem (please try again)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { image?: string };
    const imageBase64 = body.image;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'image' field." },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const baseUrl = process.env.LLM_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;
    const visionModel = process.env.LLM_VISION_MODEL;

    if (!baseUrl || !apiKey || !visionModel) {
      // Log server-side only, never leak to client
      console.error("[read-label] Server misconfiguration: LLM env vars missing");
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Try up to twice: a second attempt recovers from intermittent model
    // output (messy types, wrapped JSON) and from transient service errors.
    let result: LabelResult | null = null;
    for (let attempt = 1; attempt <= 2 && result === null; attempt++) {
      const rawContent = await requestModel(
        base64Data,
        baseUrl,
        apiKey,
        visionModel
      );
      if (rawContent === null) continue;

      const parsed = parseModelJson(rawContent);
      if (parsed === null) {
        console.error(`[read-label] Attempt ${attempt}: output is not valid JSON`);
        continue;
      }

      const normalised = normaliseLabelOutput(parsed);
      const validation = labelResultSchema.safeParse(normalised);
      if (!validation.success) {
        console.error(
          `[read-label] Attempt ${attempt}: zod validation failed:`,
          validation.error.format()
        );
        continue;
      }

      result = applyDateGuard(applyPostChecks(validation.data), today);
    }

    // Both attempts produced invalid or unusable output → service problem.
    if (result === null) {
      return NextResponse.json({ retryable: true }, { status: 503 });
    }

    // A readable label that we simply cannot identify → ask pharmacist.
    if (isRejected(result)) {
      return NextResponse.json({ rejected: true }, { status: 422 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[read-label] Unhandled error:", message);
    return NextResponse.json({ retryable: true }, { status: 503 });
  }
}
