import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import {
  generateToken,
  hashToken,
  generateRecoveryCode,
  normalizeRecoveryCode,
} from "@/lib/auth";

const createHouseholdSchema = z.object({
  displayName: z.string().min(1).max(100),
  language: z.enum(["en", "zh", "ms", "id"]).default("en"),
  isDemo: z.boolean().optional(),
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
    const isTestRun = request.headers.get("x-test-run") === "1";
    const isDemo =
      isTestRun && process.env.NODE_ENV !== "production"
        ? (parsed.data.isDemo ?? false)
        : false;

    const token = generateToken();
    const tokenHash = hashToken(token);

    const householdRows = await sql`
      INSERT INTO households (display_name, language, is_demo)
      VALUES (${displayName}, ${language}, ${isDemo})
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

    const deviceRows = await sql`
      INSERT INTO devices (household_id, role, token_hash, label)
      VALUES (${household.id}, 'caregiver', ${tokenHash}, 'Primary caregiver')
      RETURNING id
    `;
    const deviceId = (deviceRows[0] as { id: string }).id;

    // Recovery code: shown once to the caregiver, only its hash is stored.
    const recoveryCode = generateRecoveryCode();
    const recoveryHash = hashToken(normalizeRecoveryCode(recoveryCode));
    await sql`
      INSERT INTO recovery_codes (code_hash, household_id, created_by_device)
      VALUES (${recoveryHash}, ${household.id}, ${deviceId})
    `;

    return NextResponse.json({ token, household, recoveryCode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[households] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
