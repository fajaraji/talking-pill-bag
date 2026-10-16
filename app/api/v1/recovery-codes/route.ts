import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  requireDevice,
  generateRecoveryCode,
  normalizeRecoveryCode,
  hashToken,
} from "@/lib/auth";

// POST /api/v1/recovery-codes
// Caregiver-only. Generates a fresh recovery code and invalidates any previous
// unused code for the household. The plaintext is returned exactly once.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recoveryCode = generateRecoveryCode();
    const recoveryHash = hashToken(normalizeRecoveryCode(recoveryCode));

    // Invalidate every existing code, then store the new one.
    await sql`
      DELETE FROM recovery_codes WHERE household_id = ${auth.householdId}
    `;
    await sql`
      INSERT INTO recovery_codes (code_hash, household_id, created_by_device)
      VALUES (${recoveryHash}, ${auth.householdId}, ${auth.deviceId})
    `;

    return NextResponse.json({ recoveryCode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[recovery-codes] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
