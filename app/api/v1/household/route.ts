import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const updateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  language: z.enum(["en", "zh", "ms", "id"]).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as unknown;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingRows = await sql`
      SELECT * FROM households WHERE id = ${auth.householdId}
    `;
    const existing = existingRows[0] as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await sql`
      UPDATE households
      SET
        display_name = ${data.displayName ?? (existing.display_name as string)},
        language = ${data.language ?? (existing.language as string)}
      WHERE id = ${auth.householdId}
      RETURNING id, display_name, language, bp_target_systolic, bp_target_diastolic, is_demo, created_at
    `;

    return NextResponse.json({ household: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[household] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
