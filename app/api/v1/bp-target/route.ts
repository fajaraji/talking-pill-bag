import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const bpTargetSchema = z.object({
  systolic: z.number().int().min(60).max(260).nullable(),
  diastolic: z.number().int().min(30).max(160).nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as unknown;
    const parsed = bpTargetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { systolic, diastolic } = parsed.data;

    const rows = await sql`
      UPDATE households
      SET bp_target_systolic = ${systolic}, bp_target_diastolic = ${diastolic}
      WHERE id = ${auth.householdId}
      RETURNING id, display_name, language, bp_target_systolic, bp_target_diastolic, is_demo, created_at
    `;

    return NextResponse.json({ household: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[bp-target] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
