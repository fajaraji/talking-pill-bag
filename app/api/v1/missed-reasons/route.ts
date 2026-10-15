import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const missedReasonSchema = z.object({
  medicineId: z.string().uuid(),
  reason: z.string().min(1),
  missedCount: z.number().int().min(1),
  recordedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as unknown;
    const parsed = missedReasonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { medicineId, reason, missedCount, recordedOn } = parsed.data;

    // Verify medicine belongs to household
    const medRows = await sql`
      SELECT id FROM medicines
      WHERE id = ${medicineId} AND household_id = ${auth.householdId} AND deleted_at IS NULL
    `;
    if (!medRows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await sql`
      INSERT INTO missed_reasons (household_id, medicine_id, reason, missed_count, recorded_on)
      VALUES (${auth.householdId}, ${medicineId}, ${reason}, ${missedCount}, ${recordedOn})
      RETURNING id, medicine_id, reason, missed_count, to_char(recorded_on, 'YYYY-MM-DD') AS recorded_on
    `;

    return NextResponse.json({ missedReason: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[missed-reasons] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
