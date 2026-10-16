import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import {
  generateToken,
  hashToken,
  normalizeRecoveryCode,
  checkRateLimit,
} from "@/lib/auth";

const joinSchema = z.object({
  code: z.string().min(1),
  // Optional display name for the joining device (max 40 chars).
  name: z.string().max(40).optional(),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(clientIp(request), 10, 10 * 60 * 1000)) {
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
    const providedName = parsed.data.name?.trim().slice(0, 40) || null;

    // 1. Try a pairing code (short 6-digit or long URL code).
    const pairingRows = await sql`
      UPDATE pairing_codes
      SET used_at = now()
      WHERE code_hash = ${hashToken(code)}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING household_id, role, label
    `;

    const pairing = pairingRows[0] as
      | { household_id: string; role: string; label: string | null }
      | undefined;

    let householdId: string;
    let role: string;
    let codeLabel: string | null;

    if (pairing) {
      householdId = pairing.household_id;
      role = pairing.role;
      codeLabel = pairing.label;
    } else {
      // 2. Try a caregiver recovery code (single use, no expiry).
      const recoveryRows = await sql`
        UPDATE recovery_codes
        SET used_at = now()
        WHERE code_hash = ${hashToken(normalizeRecoveryCode(code))}
          AND used_at IS NULL
        RETURNING household_id
      `;

      const recovery = recoveryRows[0] as
        | { household_id: string }
        | undefined;

      if (!recovery) {
        return NextResponse.json(
          { error: "Invalid or expired code." },
          { status: 400 }
        );
      }

      householdId = recovery.household_id;
      role = "caregiver";
      codeLabel = null;
    }

    // The typed name wins; otherwise fall back to the code's default label.
    const label = providedName ?? codeLabel ?? null;

    const token = generateToken();
    const tokenHash = hashToken(token);
    await sql`
      INSERT INTO devices (household_id, role, token_hash, label)
      VALUES (${householdId}, ${role}, ${tokenHash}, ${label})
    `;

    const householdRows = await sql`
      SELECT id, display_name, language, bp_target_systolic, bp_target_diastolic, is_demo, created_at
      FROM households
      WHERE id = ${householdId}
    `;

    return NextResponse.json({
      token,
      role,
      household: householdRows[0],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[join] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// Peek at a code's default label so the join form can pre-fill the name field.
// Always returns 200 with a null label when the code is unknown, so this does
// not reveal whether a code is valid. Rate-limited like the join endpoint.
export async function GET(request: NextRequest) {
  try {
    if (!checkRateLimit(clientIp(request), 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const code = new URL(request.url).searchParams.get("code");
    if (!code) {
      return NextResponse.json({ label: null, role: null });
    }

    const rows = await sql`
      SELECT label, role
      FROM pairing_codes
      WHERE code_hash = ${hashToken(code)}
        AND used_at IS NULL
        AND expires_at > now()
    `;

    const row = rows[0] as { label: string | null; role: string } | undefined;
    return NextResponse.json({
      label: row?.label ?? null,
      role: row?.role ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[join] GET error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
