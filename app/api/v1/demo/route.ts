import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth";
import { generateDemoData, DEFAULT_UTC_OFFSET_MINUTES } from "@/lib/demo-data";

const demoSchema = z.object({
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Device offset from UTC in minutes, as returned by getTimezoneOffset().
  timezoneOffset: z.number().int().min(-840).max(840).optional(),
  // Alternative to timezoneOffset: an IANA zone such as "Asia/Singapore".
  timezone: z.string().min(1).max(64).optional(),
});

/**
 * Offset in minutes to add to UTC to get local wall-clock time in `timeZone`
 * on `dateStr` (YYYY-MM-DD). Samples the date at noon UTC so daylight-saving
 * transitions (which happen in the early morning) do not skew the result.
 */
function zoneOffsetMinutes(timeZone: string, dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const sample = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(sample);
  const values: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  const localAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour % 24,
    values.minute,
    values.second
  );
  return Math.round((localAsUtc - sample.getTime()) / 60_000);
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body: fall back to the Asia/Singapore date.
    }
    const parsed = demoSchema.safeParse(body);
    const input = parsed.success ? parsed.data : {};
    const today =
      input.today ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });

    const offsetMinutesFor = (dateStr: string): number => {
      if (input.timezone) {
        try {
          return zoneOffsetMinutes(input.timezone, dateStr);
        } catch {
          // Unknown IANA zone: fall back to the numeric offset or default.
        }
      }
      // getTimezoneOffset() returns UTC - local, so negate to get local - UTC.
      if (typeof input.timezoneOffset === "number") return -input.timezoneOffset;
      return DEFAULT_UTC_OFFSET_MINUTES;
    };

    // The client's current local time with wall-clock values in the UTC fields,
    // so today's doses are never seeded ahead of the client's clock.
    const nowLocal = new Date(Date.now() + offsetMinutesFor(today) * 60_000);

    const demo = generateDemoData(today, { offsetMinutesFor, nowLocal });

    // Clean up old demo households (> 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await sql`
      DELETE FROM households
      WHERE is_demo = true AND created_at < ${sevenDaysAgo.toISOString()}
    `;

    // Create household
    const householdRows = await sql`
      INSERT INTO households (display_name, language, is_demo)
      VALUES (${demo.profile.name}, 'en', true)
      RETURNING id
    `;
    const householdId = (householdRows[0] as { id: string }).id;

    // Create caregiver device
    const token = generateToken();
    const tokenHash = hashToken(token);
    await sql`
      INSERT INTO devices (household_id, role, token_hash, label)
      VALUES (${householdId}, 'caregiver', ${tokenHash}, 'Demo caregiver')
    `;

    // Insert medicines
    const medicineIdMap = new Map<string, string>();
    for (const med of demo.medicines) {
      const medRows = await sql`
        INSERT INTO medicines (
          household_id, drug_name, strength, dose_per_time, times_per_day,
          time_slots, food, special_instructions, quantity_dispensed,
          dispensed_date, added_on, thumbnail, unclear_fields, updated_at
        ) VALUES (
          ${householdId}, ${med.drug_name}, ${med.strength}, ${med.dose_per_time}, ${med.times_per_day},
          ${med.time_slots}, ${med.food}, ${med.special_instructions}, ${med.quantity_dispensed},
          ${med.dispensed_date}, ${med.addedOn}, ${med.photo}, ${med.unclear_fields}, ${new Date().toISOString()}
        )
        RETURNING id
      `;
      medicineIdMap.set(med.id, (medRows[0] as { id: string }).id);
    }

    // Insert dose logs
    for (const entry of demo.doseLog) {
      const dbMedId = medicineIdMap.get(entry.medicineId);
      if (!dbMedId) continue;
      await sql`
        INSERT INTO dose_logs (household_id, medicine_id, date, slot, taken_at)
        VALUES (${householdId}, ${dbMedId}, ${entry.date}, ${entry.slot}, ${entry.takenAt})
        ON CONFLICT (medicine_id, date, slot) DO NOTHING
      `;
    }

    // Insert missed reasons
    for (const entry of demo.missedReasons) {
      const dbMedId = medicineIdMap.get(entry.medicineId);
      if (!dbMedId) continue;
      await sql`
        INSERT INTO missed_reasons (household_id, medicine_id, reason, missed_count, recorded_on)
        VALUES (${householdId}, ${dbMedId}, ${entry.reason}, ${entry.missedCount}, ${entry.recordedOn})
      `;
    }

    // Insert BP readings
    for (const reading of demo.bpReadings) {
      await sql`
        INSERT INTO bp_readings (household_id, date, time, systolic, diastolic, pulse)
        VALUES (${householdId}, ${reading.date}, ${reading.time}, ${reading.systolic}, ${reading.diastolic}, ${reading.pulse})
      `;
    }

    // Insert BP target
    if (demo.bpTarget) {
      await sql`
        UPDATE households
        SET bp_target_systolic = ${demo.bpTarget.systolic}, bp_target_diastolic = ${demo.bpTarget.diastolic}
        WHERE id = ${householdId}
      `;
    }

    // Insert questions
    for (const q of demo.redirectedQuestions) {
      const dbMedId = medicineIdMap.get(q.medicineId);
      await sql`
        INSERT INTO questions (household_id, kind, medicine_id, drug_name, text, asked_on)
        VALUES (${householdId}, 'redirected', ${dbMedId ?? null}, ${q.drugName}, ${q.question}, ${q.askedOn})
      `;
    }

    const householdResult = await sql`
      SELECT id, display_name, language, bp_target_systolic, bp_target_diastolic, is_demo, created_at
      FROM households
      WHERE id = ${householdId}
    `;

    return NextResponse.json({ token, household: householdResult[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[demo] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
