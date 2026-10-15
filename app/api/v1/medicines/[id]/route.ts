import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const medicineUpdateSchema = z.object({
  drugName: z.string().min(1).optional(),
  strength: z.string().min(1).optional(),
  dosePerTime: z.string().min(1).optional(),
  timesPerDay: z.number().int().min(0).optional(),
  timeSlots: z.array(z.enum(["morning", "afternoon", "evening", "bedtime"])).optional(),
  food: z.enum(["after_food", "before_food", "with_food", "any"]).optional(),
  specialInstructions: z.array(z.string()).optional(),
  quantityDispensed: z.number().int().min(0).optional(),
  dispensedDate: z.string().optional(),
  thumbnail: z.string().optional(),
  unclearFields: z.array(z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as unknown;
    const parsed = medicineUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updates: string[] = [];
    const values: (string | number | string[] | null)[] = [];
    let paramIndex = 1;

    // Build dynamic update using sql template literals is safer; we'll do it manually
    // Actually, neon tagged template handles parameters safely. Let's use a simpler approach:
    // Fetch existing, merge, update all columns.

    const existingRows = await sql`
      SELECT * FROM medicines
      WHERE id = ${id} AND household_id = ${auth.householdId} AND deleted_at IS NULL
    `;
    if (!existingRows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = existingRows[0] as Record<string, unknown>;

    const merged = {
      drug_name: data.drugName ?? existing.drug_name,
      strength: data.strength ?? existing.strength,
      dose_per_time: data.dosePerTime ?? existing.dose_per_time,
      times_per_day: data.timesPerDay ?? existing.times_per_day,
      time_slots: data.timeSlots ?? existing.time_slots,
      food: data.food ?? existing.food,
      special_instructions: data.specialInstructions ?? existing.special_instructions,
      quantity_dispensed: data.quantityDispensed ?? existing.quantity_dispensed,
      dispensed_date: data.dispensedDate ?? existing.dispensed_date,
      thumbnail: data.thumbnail ?? existing.thumbnail,
      unclear_fields: data.unclearFields ?? existing.unclear_fields,
      updated_at: new Date().toISOString(),
    };

    const rows = await sql`
      UPDATE medicines SET
        drug_name = ${merged.drug_name as string},
        strength = ${merged.strength as string},
        dose_per_time = ${merged.dose_per_time as string},
        times_per_day = ${merged.times_per_day as number},
        time_slots = ${merged.time_slots as string[]},
        food = ${merged.food as string},
        special_instructions = ${merged.special_instructions as string[]},
        quantity_dispensed = ${merged.quantity_dispensed as number | null},
        dispensed_date = ${merged.dispensed_date as string | null},
        thumbnail = ${merged.thumbnail as string | null},
        unclear_fields = ${merged.unclear_fields as string[]},
        updated_at = ${merged.updated_at as string}
      WHERE id = ${id} AND household_id = ${auth.householdId} AND deleted_at IS NULL
      RETURNING *
    `;

    return NextResponse.json({ medicine: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[medicines/id] PUT error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const rows = await sql`
      UPDATE medicines
      SET deleted_at = ${new Date().toISOString()}
      WHERE id = ${id} AND household_id = ${auth.householdId} AND deleted_at IS NULL
      RETURNING id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[medicines/id] DELETE error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
