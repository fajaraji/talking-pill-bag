import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import {
  requireDevice,
  generateShortCode,
  generateLongCode,
  hashToken,
} from "@/lib/auth";

const createPairingSchema = z.object({
  role: z.enum(["caregiver", "senior"]),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as unknown;
    const parsed = createPairingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { role } = parsed.data;
    const shortCode = generateShortCode();
    const longCode = generateLongCode();
    const shortHash = hashToken(shortCode);
    const longHash = hashToken(longCode);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO pairing_codes (code_hash, household_id, role, expires_at, created_by_device)
      VALUES (${shortHash}, ${auth.householdId}, ${role}, ${expiresAt.toISOString()}, ${auth.deviceId})
    `;
    await sql`
      INSERT INTO pairing_codes (code_hash, household_id, role, expires_at, created_by_device)
      VALUES (${longHash}, ${auth.householdId}, ${role}, ${expiresAt.toISOString()}, ${auth.deviceId})
    `;

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const joinUrl = `${baseUrl}/join?c=${longCode}`;

    return NextResponse.json({
      shortCode,
      joinUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[pairing-codes] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
