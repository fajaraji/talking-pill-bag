import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findDrugInfo, buildSourceText } from "@/lib/drug-info";

// ---------------------------------------------------------------------------
// Request / response schemas
// ---------------------------------------------------------------------------
const requestSchema = z.object({
  drugName: z.string().min(1),
  language: z.enum(["en", "zh", "ms", "id"]),
});

const responseSchema = z.object({
  known: z.boolean(),
  text: z.string(),
  fallback: z.boolean().optional(),
});

export type ExplainResponse = z.infer<typeof responseSchema>;

// ---------------------------------------------------------------------------
// LLM call with 30-second timeout
// ---------------------------------------------------------------------------
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

async function translateWithLlm(
  sourceText: string,
  language: string
): Promise<string | null> {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const textModel = process.env.LLM_TEXT_MODEL;

  if (!baseUrl || !apiKey || !textModel) {
    console.error("[explain] Server misconfiguration: LLM env vars missing");
    return null;
  }

  const languageLabels: Record<string, string> = {
    en: "English",
    zh: "Chinese (Mandarin)",
    ms: "Malay",
    id: "Indonesian",
  };

  const systemPrompt = `You are a medical information assistant. Your job is to translate and simplify the following openly licensed public-sector patient information into ${languageLabels[language] || language}.

RULES:
1. Use short, simple sentences suitable for an older adult.
2. Do NOT add, remove, or change any medical fact.
3. Do NOT give advice beyond what is in the source text.
4. Keep the structure: what it is used for, how to take it, what to do if a dose is missed, common side effects, and when to seek help.
5. Return PLAIN TEXT ONLY. Do NOT use markdown formatting (no asterisks, underscores, backticks, or hash symbols).

SOURCE TEXT:
${sourceText}`;

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: textModel,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content:
                "Please translate and simplify the medication information above.",
            },
          ],
          reasoning: { enabled: false },
          max_tokens: 1000,
          temperature: 0,
        }),
      },
      30000
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[explain] LLM request failed: ${res.status} ${text}`);
      return null;
    }

    const completion = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = completion.choices?.[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      console.error("[explain] LLM returned empty content");
      return null;
    }

    return content.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[explain] LLM call error:", message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/explain
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { drugName, language } = parsed.data;
    const entry = findDrugInfo(drugName);

    if (!entry) {
      // Unknown medicine — return pharmacist sentence without calling LLM
      const pharmacistSentences: Record<string, string> = {
        en: "I'm not able to identify that medication, please check with your pharmacist.",
        zh: "无法识别该药物，请咨询药剂师。",
        ms: "Saya tidak dapat mengenal pasti ubat tersebut, sila semak dengan ahli farmasi anda.",
        id: "Saya tidak bisa mengenali obat ini, silakan periksa ke apoteker.",
      };
      const response: ExplainResponse = {
        known: false,
        text: pharmacistSentences[language] || pharmacistSentences.en,
      };
      return NextResponse.json(response);
    }

    const sourceText = buildSourceText(entry);

    const cleanSourceText = stripMarkdown(sourceText);

    if (language === "en") {
      const response: ExplainResponse = {
        known: true,
        text: cleanSourceText,
      };
      return NextResponse.json(response);
    }

    const translated = await translateWithLlm(sourceText, language);

    if (translated) {
      const response: ExplainResponse = {
        known: true,
        text: stripMarkdown(translated),
      };
      return NextResponse.json(response);
    }

    // Fallback to English source text
    const response: ExplainResponse = {
      known: true,
      text: cleanSourceText,
      fallback: true,
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[explain] Unhandled error:", message);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 }
    );
  }
}
