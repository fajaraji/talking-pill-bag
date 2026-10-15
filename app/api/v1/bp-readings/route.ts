import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const bpReadingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  systolic: z.number().int().min(60).max(260),
  diastolic: z.number().int().min(30).max(160),
  pulse: z.number().int().min(30).max(220).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as unknown;
    const parsed = bpReadingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const rows = await sql`
      INSERT INTO bp_readings (household_id, date, time, systolic, diastolic, pulse)
      VALUES (
        ${auth.householdId}, ${data.date}, ${data.time},
        ${data.systolic}, ${data.diastolic}, ${data.pulse ?? null}
      )
      RETURNING *
    `;

    return NextResponse.json({ bpReading: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[bp-readings] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
