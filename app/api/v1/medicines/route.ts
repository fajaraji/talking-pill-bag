import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const medicineSchema = z.object({
  drugName: z.string().min(1),
  strength: z.string().min(1),
  dosePerTime: z.string().min(1),
  timesPerDay: z.number().int().min(0),
  timeSlots: z.array(z.enum(["morning", "afternoon", "evening", "bedtime"])),
  food: z.enum(["after_food", "before_food", "with_food", "any"]),
  specialInstructions: z.array(z.string()).default([]),
  quantityDispensed: z.number().int().min(0).optional(),
  dispensedDate: z.string().optional(),
  thumbnail: z.string().optional(),
  unclearFields: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as unknown;
    const parsed = medicineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const addedOn = new Date().toISOString().slice(0, 10);

    const rows = await sql`
      INSERT INTO medicines (
        household_id, drug_name, strength, dose_per_time, times_per_day,
        time_slots, food, special_instructions, quantity_dispensed,
        dispensed_date, added_on, thumbnail, unclear_fields, updated_at
      ) VALUES (
        ${auth.householdId}, ${data.drugName}, ${data.strength}, ${data.dosePerTime}, ${data.timesPerDay},
        ${data.timeSlots}, ${data.food}, ${data.specialInstructions}, ${data.quantityDispensed ?? null},
        ${data.dispensedDate ?? null}, ${addedOn}, ${data.thumbnail ?? null}, ${data.unclearFields}, ${new Date().toISOString()}
      )
      RETURNING id, drug_name, strength, dose_per_time, times_per_day, time_slots, food, special_instructions, quantity_dispensed, to_char(dispensed_date, 'YYYY-MM-DD') AS dispensed_date, to_char(added_on, 'YYYY-MM-DD') AS added_on, thumbnail, unclear_fields, updated_at
    `;

    return NextResponse.json({ medicine: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[medicines] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
