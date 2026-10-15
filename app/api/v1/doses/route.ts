import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const doseSchema = z.object({
  medicineId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(["morning", "afternoon", "evening", "bedtime"]),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as unknown;
    const parsed = doseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { medicineId, date, slot } = parsed.data;

    // Verify medicine belongs to household
    const medRows = await sql`
      SELECT id FROM medicines
      WHERE id = ${medicineId} AND household_id = ${auth.householdId} AND deleted_at IS NULL
    `;
    if (!medRows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await sql`
      INSERT INTO dose_logs (household_id, medicine_id, date, slot, taken_at)
      VALUES (${auth.householdId}, ${medicineId}, ${date}, ${slot}, ${new Date().toISOString()})
      ON CONFLICT (medicine_id, date, slot)
      DO UPDATE SET taken_at = EXCLUDED.taken_at
      RETURNING *
    `;

    return NextResponse.json({ dose: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[doses] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as unknown;
    const parsed = doseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { medicineId, date, slot } = parsed.data;

    const rows = await sql`
      DELETE FROM dose_logs
      WHERE household_id = ${auth.householdId}
        AND medicine_id = ${medicineId}
        AND date = ${date}
        AND slot = ${slot}
      RETURNING id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[doses] DELETE error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
