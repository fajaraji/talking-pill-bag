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
  label: z.string().max(40).optional(),
});

function getOrigin(request: NextRequest): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.slice(0, -1);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  return `${proto}://${host}`;
}

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

    const { role, label } = parsed.data;
    const shortCode = generateShortCode();
    const longCode = generateLongCode();
    const shortHash = hashToken(shortCode);
    const longHash = hashToken(longCode);

    // Default the label by role when none is given, so the joining device
    // never shows up as "Unnamed device".
    let resolvedLabel = label;
    if (!resolvedLabel) {
      const householdRows = await sql`
        SELECT display_name FROM households WHERE id = ${auth.householdId}
      `;
      const displayName =
        (householdRows[0] as { display_name?: string } | undefined)?.display_name ?? "";
      resolvedLabel =
        role === "senior" ? `${displayName}'s phone` : "Family member";
    }

    const shortExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const longExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO pairing_codes (code_hash, household_id, role, expires_at, created_by_device, label)
      VALUES (${shortHash}, ${auth.householdId}, ${role}, ${shortExpiresAt.toISOString()}, ${auth.deviceId}, ${resolvedLabel})
    `;
    await sql`
      INSERT INTO pairing_codes (code_hash, household_id, role, expires_at, created_by_device, label)
      VALUES (${longHash}, ${auth.householdId}, ${role}, ${longExpiresAt.toISOString()}, ${auth.deviceId}, ${resolvedLabel})
    `;

    const origin = getOrigin(request);
    const joinUrl = `${origin}/join?c=${longCode}`;

    return NextResponse.json({
      shortCode,
      joinUrl,
      shortExpiresAt: shortExpiresAt.toISOString(),
      longExpiresAt: longExpiresAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[pairing-codes] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
