import "server-only";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// Device authentication
// ---------------------------------------------------------------------------

export interface AuthenticatedDevice {
  deviceId: string;
  householdId: string;
  role: "caregiver" | "senior";
}

export async function requireDevice(
  request: NextRequest
): Promise<AuthenticatedDevice | NextResponse> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenHash = hashToken(token);

  const rows = await sql`
    SELECT id, household_id, role, last_seen_at
    FROM devices
    WHERE token_hash = ${tokenHash}
  `;

  const row = rows[0] as
    | { id: string; household_id: string; role: string; last_seen_at: string | null }
    | undefined;

  if (!row) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Update last_seen_at at most once per hour
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const lastSeen = row.last_seen_at ? new Date(row.last_seen_at) : null;

  if (!lastSeen || lastSeen < oneHourAgo) {
    await sql`
      UPDATE devices
      SET last_seen_at = ${now.toISOString()}
      WHERE id = ${row.id}
    `;
  }

  return {
    deviceId: row.id,
    householdId: row.household_id,
    role: row.role as "caregiver" | "senior",
  };
}

// ---------------------------------------------------------------------------
// Pairing codes
// ---------------------------------------------------------------------------

export function generateShortCode(): string {
  // 6-digit numeric code, zero-padded
  const num = crypto.randomInt(0, 1_000_000);
  return String(num).padStart(6, "0");
}

export function generateLongCode(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per-IP)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

// ---------------------------------------------------------------------------
// Constant-time string comparison
// ---------------------------------------------------------------------------

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid leaking length via timing,
    // but we must return false for different lengths.
    // In practice we can pad to same length or just use timingSafeEqual
    // with a buffer of max length. For hex strings of same known length
    // (SHA-256 = 64 hex chars) this is fine.
    return false;
  }
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  return crypto.timingSafeEqual(bufA, bufB);
}
