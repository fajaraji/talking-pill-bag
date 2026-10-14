import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for LLM output validation (SPEC section 7)
// The prompt forces these enums; zod rejects anything else.
// ---------------------------------------------------------------------------
const foodEnum = z.enum(["after_food", "before_food", "with_food", "any"]);
const timeSlotEnum = z.enum(["morning", "afternoon", "evening", "bedtime"]);

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
// Forces food enum and time_slots enum per SPEC.
// Includes Singapore DD/MM/YYYY date format guidance.
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

DATE FORMAT:
- Singapore labels use DD/MM/YYYY (e.g. "01/10/2026" means 2026-10-01).
- Convert to YYYY-MM-DD in the output.
- If the date is not clearly visible, leave dispensed_date empty and add "dispensed_date" to unclear_fields.`;
}

// ---------------------------------------------------------------------------
// POST /api/read-label
// Body: { image: string } where image is a base64 data URL or raw base64.
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
      return NextResponse.json(
        { error: "Server error." },
        { status: 500 }
      );
    }

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
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[read-label] LLM request failed: ${response.status} ${text}`);
      return NextResponse.json(
        { error: "Something went wrong, please try again." },
        { status: 502 }
      );
    }

    const completion = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string | null };
      }>;
    };

    const rawContent = completion.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("[read-label] LLM returned empty content");
      return NextResponse.json(
        { error: "Something went wrong, please try again." },
        { status: 502 }
      );
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error("[read-label] LLM output is not valid JSON");
      return NextResponse.json(
        { error: "Something went wrong, please try again.", rejected: true },
        { status: 422 }
      );
    }

    // Validate with zod
    const validation = labelResultSchema.safeParse(parsed);

    if (!validation.success) {
      console.error(
        "[read-label] Zod validation failed:",
        validation.error.format()
      );
      return NextResponse.json(
        {
          error:
            "I'm not able to identify that medication, please check with your pharmacist.",
          rejected: true,
        },
        { status: 422 }
      );
    }

    let result = applyPostChecks(validation.data);

    if (isRejected(result)) {
      return NextResponse.json(
        {
          error:
            "I'm not able to identify that medication, please check with your pharmacist.",
          result,
          rejected: true,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[read-label] Unhandled error:", message);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 }
    );
  }
}
