import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const householdId = auth.householdId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().slice(0, 10);

    const [
      householdRows,
      medicineRows,
      doseLogRows,
      missedReasonRows,
      bpReadingRows,
      questionRows,
      deviceRows,
    ] = await Promise.all([
      sql`
        SELECT id, display_name, language, bp_target_systolic, bp_target_diastolic, is_demo, created_at
        FROM households
        WHERE id = ${householdId}
      `,
      sql`
        SELECT id, drug_name, strength, dose_per_time, times_per_day, time_slots, food,
               special_instructions, quantity_dispensed, dispensed_date, added_on, thumbnail,
               unclear_fields, updated_at
        FROM medicines
        WHERE household_id = ${householdId} AND deleted_at IS NULL
      `,
      sql`
        SELECT id, medicine_id, date, slot, taken_at
        FROM dose_logs
        WHERE household_id = ${householdId} AND date >= ${cutoffDate}
      `,
      sql`
        SELECT id, medicine_id, reason, missed_count, recorded_on
        FROM missed_reasons
        WHERE household_id = ${householdId} AND recorded_on >= ${cutoffDate}
      `,
      sql`
        SELECT id, date, time, systolic, diastolic, pulse, created_at
        FROM bp_readings
        WHERE household_id = ${householdId} AND date >= ${cutoffDate}
      `,
      sql`
        SELECT id, kind, medicine_id, drug_name, text, asked_on, done
        FROM questions
        WHERE household_id = ${householdId}
      `,
      sql`
        SELECT id, role, label, last_seen_at
        FROM devices
        WHERE household_id = ${householdId}
      `,
    ]);

    return NextResponse.json({
      household: (householdRows[0] as Record<string, unknown> | undefined) ?? null,
      medicines: medicineRows as Record<string, unknown>[],
      doseLogs: doseLogRows as Record<string, unknown>[],
      missedReasons: missedReasonRows as Record<string, unknown>[],
      bpReadings: bpReadingRows as Record<string, unknown>[],
      questions: questionRows as Record<string, unknown>[],
      devices: deviceRows as Record<string, unknown>[],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[state] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
