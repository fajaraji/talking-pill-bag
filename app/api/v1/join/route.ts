import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import {
  generateToken,
  hashToken,
  checkRateLimit,
} from "@/lib/auth";

const joinSchema = z.object({
  code: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip, 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { code } = parsed.data;
    const codeHash = hashToken(code);

    const rows = await sql`
      UPDATE pairing_codes
      SET used_at = now()
      WHERE code_hash = ${codeHash}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING household_id, role, label
    `;

    const row = rows[0] as
      | {
          household_id: string;
          role: string;
          label: string | null;
        }
      | undefined;

    if (!row) {
      return NextResponse.json(
        { error: "Invalid or expired code." },
        { status: 400 }
      );
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    await sql`
      INSERT INTO devices (household_id, role, token_hash, label)
      VALUES (${row.household_id}, ${row.role}, ${tokenHash}, ${row.label ?? null})
    `;

    const householdRows = await sql`
      SELECT id, display_name, language, bp_target_systolic, bp_target_diastolic, is_demo, created_at
      FROM households
      WHERE id = ${row.household_id}
    `;

    return NextResponse.json({
      token,
      role: row.role,
      household: householdRows[0],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[join] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
