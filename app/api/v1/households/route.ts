import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth";

const createHouseholdSchema = z.object({
  displayName: z.string().min(1).max(100),
  language: z.enum(["en", "zh", "ms", "id"]).default("en"),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = createHouseholdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { displayName, language } = parsed.data;
    const token = generateToken();
    const tokenHash = hashToken(token);

    const householdRows = await sql`
      INSERT INTO households (display_name, language)
      VALUES (${displayName}, ${language})
      RETURNING id, display_name, language, bp_target_systolic, bp_target_diastolic, is_demo, created_at
    `;
    const household = householdRows[0] as {
      id: string;
      display_name: string;
      language: string;
      bp_target_systolic: number | null;
      bp_target_diastolic: number | null;
      is_demo: boolean;
      created_at: string;
    };

    await sql`
      INSERT INTO devices (household_id, role, token_hash, label)
      VALUES (${household.id}, 'caregiver', ${tokenHash}, 'Primary caregiver')
    `;

    return NextResponse.json({ token, household });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[households] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
