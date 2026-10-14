import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for LLM output validation
// ---------------------------------------------------------------------------
const bpResultSchema = z.object({
  readable: z.boolean(),
  confidence: z.number().min(0).max(1),
  systolic: z.number().int(),
  diastolic: z.number().int(),
  pulse: z.number().int().nullable().optional(),
});

export type BPResult = z.infer<typeof bpResultSchema>;

// ---------------------------------------------------------------------------
// Rejection rules:
// - readable === false
// - confidence < 0.7
// - validation fails
// - values are implausible
// ---------------------------------------------------------------------------
function isRejected(result: BPResult): { rejected: boolean; reason?: string } {
  if (!result.readable) {
    return { rejected: true, reason: "unreadable" };
  }
  if (result.confidence < 0.7) {
    return { rejected: true, reason: "low confidence" };
  }
  if (result.systolic < 60 || result.systolic > 260) {
    return { rejected: true, reason: "implausible systolic" };
  }
  if (result.diastolic < 30 || result.diastolic > 160) {
    return { rejected: true, reason: "implausible diastolic" };
  }
  if (result.systolic <= result.diastolic) {
    return { rejected: true, reason: "systolic must be greater than diastolic" };
  }
  if (result.pulse !== null && result.pulse !== undefined) {
    if (result.pulse < 30 || result.pulse > 220) {
      return { rejected: true, reason: "implausible pulse" };
    }
  }
  return { rejected: false };
}

// ---------------------------------------------------------------------------
// Prompt sent to the vision model.
// ---------------------------------------------------------------------------
function buildSystemPrompt(): string {
  return `You are a blood pressure monitor screen reader. Analyze the image of a digital blood pressure monitor screen and return ONLY a JSON object with this exact shape:

{
  "readable": boolean,
  "confidence": number (0.0 to 1.0),
  "systolic": integer,
  "diastolic": integer,
  "pulse": integer | null
}

RULES:
1. If the image is blurry, unreadable, or no blood pressure monitor screen is visible, set readable=false, confidence=0.0, and set systolic=0, diastolic=0, pulse=null.
2. confidence must reflect your certainty that ALL extracted numbers are correct.
3. systolic is the higher number (typically 90-180).
4. diastolic is the lower number (typically 60-120).
5. pulse is the heart rate in beats per minute. If not visible on the screen, set pulse=null. If visible, it must be an integer.
6. Do NOT add any keys outside the schema. Do NOT include markdown formatting.`;
}

// ---------------------------------------------------------------------------
// POST /api/read-bp
// Body: { image: string } where image is a base64 data URL or raw base64.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { image?: string };
    const imageBase64 = body.image;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'image' field.", rejected: true },
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
      console.error("[read-bp] Server misconfiguration: LLM env vars missing");
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
      console.error(`[read-bp] LLM request failed: ${response.status} ${text}`);
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
      console.error("[read-bp] LLM returned empty content");
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
      console.error("[read-bp] LLM output is not valid JSON");
      return NextResponse.json(
        { error: "Could not read the monitor. Please enter the numbers manually.", rejected: true },
        { status: 422 }
      );
    }

    // Validate with zod
    const validation = bpResultSchema.safeParse(parsed);

    if (!validation.success) {
      console.error("[read-bp] Zod validation failed:", validation.error.format());
      return NextResponse.json(
        { error: "Could not read the monitor. Please enter the numbers manually.", rejected: true },
        { status: 422 }
      );
    }

    const result = validation.data;
    const check = isRejected(result);

    if (check.rejected) {
      return NextResponse.json(
        {
          error: "Could not read the monitor. Please enter the numbers manually.",
          result,
          rejected: true,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[read-bp] Unhandled error:", message);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 }
    );
  }
}
