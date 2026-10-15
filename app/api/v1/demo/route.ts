import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth";
import { generateDemoData } from "@/lib/demo-data";

export async function POST(request: NextRequest) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const demo = generateDemoData(today);

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
